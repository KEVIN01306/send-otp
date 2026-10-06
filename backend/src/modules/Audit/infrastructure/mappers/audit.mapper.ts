import { AuditLog as PrismaAuditLog } from '@prisma/client';
import { AuditLogEntity } from '../../domain/audit-log.entity.js';

export class AuditMapper {
  public static toEntity(raw: PrismaAuditLog): AuditLogEntity {
    return {
      id: raw.id,
      projectId: raw.projectId,
      action: raw.action,
      resource: raw.resource,
      details: raw.details as Record<string, any> | null,
      createdAt: raw.createdAt,
    };
  }
}
