import { TokenType } from '@prisma/client';
import { OtpTokenEntity } from './otp-token.entity.js';

export interface CreateOtpDTO {
  projectId: string;
  recipientEmail: string;
  codeHash: string;
  type: TokenType;
  maxAttempts: number;
  expiresAt: Date;
}

export interface IOtpRepository {
  /**
   * Finds any OTP created since a specific date for rate-limiting / cooldown.
   */
  findRecentOtp(projectId: string, recipientEmail: string, sinceDate: Date): Promise<OtpTokenEntity | null>;

  /**
   * Invalidates existing unused OTPs for the project + email + type.
   */
  invalidatePreviousOtps(projectId: string, recipientEmail: string, type: TokenType): Promise<number>;

  /**
   * Creates a new OTP token record with hashed code.
   */
  createOtp(dto: CreateOtpDTO): Promise<OtpTokenEntity>;

  /**
   * Finds the most recent unused OTP for validation.
   */
  findLatestOtp(projectId: string, recipientEmail: string, type: TokenType): Promise<OtpTokenEntity | null>;

  /**
   * Atomically increments the attempts counter.
   */
  incrementAttempts(id: string): Promise<OtpTokenEntity>;

  /**
   * Atomically marks the OTP as used to prevent replay attacks.
   */
  markAsUsed(id: string): Promise<OtpTokenEntity>;

  /**
   * Cleans up expired and already used tokens older than a retention threshold.
   */
  cleanOldOtps(retentionDate: Date): Promise<number>;
}
