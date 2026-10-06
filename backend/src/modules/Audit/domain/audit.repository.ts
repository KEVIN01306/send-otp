import { AuditAction } from '@prisma/client';
import { AuditLogEntity } from './audit-log.entity.js';

export interface CreateAuditLogDTO {
  projectId?: string | null;
  action: AuditAction;
  resource: string;
  details?: Record<string, any> | null;
}

export interface ListAuditLogsFilters {
  projectId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}

export interface IAuditRepository {
  createLog(dto: CreateAuditLogDTO): Promise<AuditLogEntity>;
  listLogs(filters?: ListAuditLogsFilters): Promise<AuditLogEntity[]>;
}
