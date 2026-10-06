import { AuditAction } from '@prisma/client';

export interface AuditLogEntity {
  id: string;
  projectId?: string | null;
  action: AuditAction;
  resource: string;
  details?: Record<string, any> | null;
  createdAt: Date;
}
