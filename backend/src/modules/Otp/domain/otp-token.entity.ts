import { TokenType } from '@prisma/client';

export interface OtpTokenEntity {
  id: string;
  projectId: string;
  recipientEmail: string;
  codeHash: string;
  type: TokenType;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
