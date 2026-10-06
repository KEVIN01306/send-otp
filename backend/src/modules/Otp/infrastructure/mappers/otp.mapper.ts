import { OtpToken as PrismaOtpToken } from '@prisma/client';
import { OtpTokenEntity } from '../../domain/otp-token.entity.js';

export class OtpMapper {
  public static toEntity(raw: PrismaOtpToken): OtpTokenEntity {
    return {
      id: raw.id,
      projectId: raw.projectId,
      recipientEmail: raw.recipientEmail,
      codeHash: raw.codeHash,
      type: raw.type,
      attempts: raw.attempts,
      maxAttempts: raw.maxAttempts,
      isUsed: raw.isUsed,
      expiresAt: raw.expiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
