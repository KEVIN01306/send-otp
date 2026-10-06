import { TokenType, AuditAction } from '@prisma/client';
import { IOtpRepository } from '../../Otp/domain/otp.repository.js';
import { IEmailProvider } from '../domain/email.provider.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import { CryptoUtil } from '../../../shared/utils/crypto.util.js';
import { config } from '../../../shared/config/env.config.js';
import AppError from '../../../shared/errors/AppError.js';
import { Logger } from '../../../shared/logger/logger.js';

export interface SendVerificationEmailInput {
  projectId: string;
  projectName?: string;
  email: string;
  redirectUrl: string;
}

export interface SendVerificationEmailOutput {
  success: boolean;
  message: string;
}

export class SendVerificationEmailUseCase {
  constructor(
    private otpRepository: IOtpRepository,
    private emailProvider: IEmailProvider,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(input: SendVerificationEmailInput): Promise<SendVerificationEmailOutput> {
    const email = input.email.trim().toLowerCase();
    const redirectUrl = input.redirectUrl.trim();

    // 1. Generate secure verification token
    const rawToken = CryptoUtil.generateToken(32);
    const tokenHash = CryptoUtil.hashSha256(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours for email verification

    // 2. Persist hashed token as EMAIL_VERIFICATION type
    await this.otpRepository.createOtp({
      projectId: input.projectId,
      recipientEmail: email,
      codeHash: tokenHash,
      type: TokenType.EMAIL_VERIFICATION,
      maxAttempts: 5,
      expiresAt,
    });

    // 3. Construct verification link with URL handling
    const urlObj = new URL(redirectUrl);
    urlObj.searchParams.set('token', rawToken);
    urlObj.searchParams.set('email', email);
    const verificationUrl = urlObj.toString();

    // 4. Send email via provider (Resend)
    const emailResult = await this.emailProvider.sendVerificationEmail(
      email,
      verificationUrl,
      input.projectName || 'Auth Service'
    );

    if (!emailResult.success) {
      Logger.error('Failed to send verification email', emailResult.error, { email, projectId: input.projectId });
      throw new AppError(`Error al enviar el correo de verificación: ${emailResult.error}`, 'EMAIL_SEND_FAILED', 500);
    }

    // 5. Create audit log
    await this.auditRepository.createLog({
      projectId: input.projectId,
      action: AuditAction.EMAIL_SENT,
      resource: 'email_verification',
      details: {
        email,
        messageId: emailResult.messageId,
      },
    });

    return {
      success: true,
      message: 'Correo de verificación enviado correctamente',
    };
  }
}
