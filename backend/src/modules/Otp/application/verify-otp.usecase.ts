import { TokenType, AuditAction } from '@prisma/client';
import { IOtpRepository } from '../domain/otp.repository.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import { CryptoUtil } from '../../../shared/utils/crypto.util.js';
import AppError from '../../../shared/errors/AppError.js';

export interface VerifyOtpInput {
  projectId: string;
  email: string;
  code: string;
  type?: TokenType;
}

export interface VerifyOtpOutput {
  success: boolean;
  verified: boolean;
  message: string;
}

export class VerifyOtpUseCase {
  constructor(
    private otpRepository: IOtpRepository,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(input: VerifyOtpInput): Promise<VerifyOtpOutput> {
    const email = input.email.trim().toLowerCase();
    const cleanCode = input.code.trim();
    const type = input.type || TokenType.OTP;

    // 1. Find latest active/unused OTP for this project and email
    const otp = await this.otpRepository.findLatestOtp(input.projectId, email, type);

    if (!otp) {
      throw new AppError('Código no encontrado o ya utilizado', 'OTP_NOT_FOUND', 400);
    }

    // 2. Validate expiration
    const now = new Date();
    if (otp.expiresAt.getTime() < now.getTime()) {
      throw new AppError('El código ha expirado', 'OTP_EXPIRED', 400);
    }

    // 3. Validate attempts limit
    if (otp.attempts >= otp.maxAttempts) {
      throw new AppError('Has superado el número máximo de intentos', 'OTP_MAX_ATTEMPTS_EXCEEDED', 400);
    }

    // 4. Secure timing comparison of SHA-256 hash
    const inputHash = CryptoUtil.hashSha256(cleanCode);
    const isMatch = CryptoUtil.safeTimingCompare(inputHash, otp.codeHash);

    if (!isMatch) {
      // Increment attempt count
      await this.otpRepository.incrementAttempts(otp.id);

      throw new AppError('Código incorrecto', 'OTP_INVALID_CODE', 400);
    }

    // 5. Code is correct -> mark as used to prevent replay attacks
    await this.otpRepository.markAsUsed(otp.id);

    // 6. Record audit log
    await this.auditRepository.createLog({
      projectId: input.projectId,
      action: AuditAction.OTP_VERIFY,
      resource: 'otp',
      details: {
        email,
        type,
        otpId: otp.id,
      },
    });

    return {
      success: true,
      verified: true,
      message: 'Código verificado con éxito',
    };
  }
}
