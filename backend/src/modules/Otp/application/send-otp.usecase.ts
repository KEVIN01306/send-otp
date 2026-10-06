import { TokenType, AuditAction } from '@prisma/client';
import { IOtpRepository } from '../domain/otp.repository.js';
import { IEmailProvider } from '../../Email/domain/email.provider.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import { CryptoUtil } from '../../../shared/utils/crypto.util.js';
import { config } from '../../../shared/config/env.config.js';
import AppError from '../../../shared/errors/AppError.js';
import { Logger } from '../../../shared/logger/logger.js';

export interface SendOtpInput {
  projectId: string;
  projectName?: string;
  email: string;
  type?: TokenType;
}

export interface SendOtpOutput {
  success: boolean;
  message: string;
  expiresAt: string;
}

export class SendOtpUseCase {
  constructor(
    private otpRepository: IOtpRepository,
    private emailProvider: IEmailProvider,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(input: SendOtpInput): Promise<SendOtpOutput> {
    const email = input.email.trim().toLowerCase();
    const type = input.type || TokenType.OTP;
    const cooldownSeconds = config.otp.cooldownSeconds;

    // 1. Rate limiting / Cooldown check (60s default)
    const cooldownDate = new Date(Date.now() - cooldownSeconds * 1000);
    const recentOtp = await this.otpRepository.findRecentOtp(input.projectId, email, cooldownDate);

    if (recentOtp) {
      await this.auditRepository.createLog({
        projectId: input.projectId,
        action: AuditAction.RATE_LIMITED,
        resource: 'otp',
        details: {
          email,
          reason: 'Cooldown period active',
        },
      });

      throw new AppError('Por favor espera 1 minuto antes de solicitar otro código', 'RATE_LIMITED', 429);
    }

    // 2. Generate cryptographically secure 6-digit OTP
    const rawOtpCode = CryptoUtil.generateOtpCode(6);
    const codeHash = CryptoUtil.hashSha256(rawOtpCode);
    const expirationMinutes = config.otp.expirationMinutes;
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    // 3. Invalidate previous active OTPs and create new one in DB (atomic)
    await this.otpRepository.createOtp({
      projectId: input.projectId,
      recipientEmail: email,
      codeHash,
      type,
      maxAttempts: config.otp.maxAttempts,
      expiresAt,
    });

    // 4. Send email via EmailProvider (Resend)
    const emailResult = await this.emailProvider.sendOtpEmail(
      email,
      rawOtpCode,
      expirationMinutes,
      input.projectName || 'Auth Service'
    );

    if (!emailResult.success) {
      Logger.error('Failed to send OTP email', emailResult.error, { email, projectId: input.projectId });
      // We still log error, but throw so client knows email failed
      throw new AppError(`Error al enviar el correo electrónico: ${emailResult.error}`, 'EMAIL_SEND_FAILED', 500);
    }

    // 5. Create audit log (WITHOUT the OTP code)
    await this.auditRepository.createLog({
      projectId: input.projectId,
      action: AuditAction.OTP_GENERATE,
      resource: 'otp',
      details: {
        email,
        type,
        messageId: emailResult.messageId,
      },
    });

    return {
      success: true,
      message: 'Código OTP enviado correctamente',
      expiresAt: expiresAt.toISOString(),
    };
  }
}
