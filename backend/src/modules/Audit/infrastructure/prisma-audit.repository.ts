import { PrismaClient, Prisma } from '@prisma/client';
import { IAuditRepository, CreateAuditLogDTO, ListAuditLogsFilters } from '../domain/audit.repository.js';
import { AuditLogEntity } from '../domain/audit-log.entity.js';
import { AuditMapper } from './mappers/audit.mapper.js';
import prismaClient from '../../../infrastructure/config/prisma/prisma.config.js';

export class PrismaAuditRepository implements IAuditRepository {
  constructor(private prisma: PrismaClient = prismaClient) {}

  public async createLog(dto: CreateAuditLogDTO): Promise<AuditLogEntity> {
    const log = await this.prisma.auditLog.create({
      data: {
        projectId: dto.projectId || null,
        action: dto.action,
        resource: dto.resource,
        details: dto.details ? (dto.details as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    });
    return AuditMapper.toEntity(log);
  }

  public async listLogs(filters?: ListAuditLogsFilters): Promise<AuditLogEntity[]> {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.action) where.action = filters.action;

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    });

    return logs.map(AuditMapper.toEntity);
  }
}
