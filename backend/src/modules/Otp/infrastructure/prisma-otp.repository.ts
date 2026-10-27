import { PrismaClient, TokenType } from '@prisma/client';
import { IOtpRepository, CreateOtpDTO } from '../domain/otp.repository.js';
import { OtpTokenEntity } from '../domain/otp-token.entity.js';
import { OtpMapper } from './mappers/otp.mapper.js';
import prismaClient from '../../../infrastructure/config/prisma/prisma.config.js';

export class PrismaOtpRepository implements IOtpRepository {
  constructor(private prisma: PrismaClient = prismaClient) { }

  public async findRecentOtp(projectId: string, recipientEmail: string, sinceDate: Date): Promise<OtpTokenEntity | null> {
    const recent = await this.prisma.otpToken.findFirst({
      where: {
        projectId,
        recipientEmail,
        createdAt: {
          gte: sinceDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return recent ? OtpMapper.toEntity(recent) : null;
  }

  public async invalidatePreviousOtps(projectId: string, recipientEmail: string, type: TokenType): Promise<number> {
    const result = await this.prisma.otpToken.updateMany({
      where: {
        projectId,
        recipientEmail,
        type,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    return result.count;
  }

  public async createOtp(dto: CreateOtpDTO): Promise<OtpTokenEntity> {
    // Transactional invalidate + create
    const created = await this.prisma.$transaction(async (tx) => {
      await tx.otpToken.updateMany({
        where: {
          projectId: dto.projectId,
          recipientEmail: dto.recipientEmail,
          type: dto.type,
          isUsed: false,
        },
        data: {
          isUsed: true,
        },
      });

      return tx.otpToken.create({
        data: {
          projectId: dto.projectId,
          recipientEmail: dto.recipientEmail,
          codeHash: dto.codeHash,
          type: dto.type,
          attempts: 0,
          maxAttempts: dto.maxAttempts,
          isUsed: false,
          expiresAt: dto.expiresAt,
        },
      });
    });

    return OtpMapper.toEntity(created);
  }

  public async findLatestOtp(projectId: string, recipientEmail: string, type: TokenType): Promise<OtpTokenEntity | null> {
    const latest = await this.prisma.otpToken.findFirst({
      where: {
        projectId,
        recipientEmail,
        type,
        isUsed: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return latest ? OtpMapper.toEntity(latest) : null;
  }

  public async incrementAttempts(id: string): Promise<OtpTokenEntity> {
    const updated = await this.prisma.otpToken.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    return OtpMapper.toEntity(updated);
  }

  public async markAsUsed(id: string): Promise<OtpTokenEntity> {
    const updated = await this.prisma.otpToken.update({
      where: { id },
      data: {
        isUsed: true,
      },
    });

    return OtpMapper.toEntity(updated);
  }

  public async cleanOldOtps(retentionDate: Date): Promise<number> {
    const result = await this.prisma.otpToken.deleteMany({
      where: {
        OR: [
          { isUsed: true, createdAt: { lt: retentionDate } },
          { expiresAt: { lt: retentionDate } },
        ],
      },
    });

    return result.count;
  }
}
