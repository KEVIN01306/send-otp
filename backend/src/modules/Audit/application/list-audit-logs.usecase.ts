import { IAuditRepository, ListAuditLogsFilters } from '../domain/audit.repository.js';
import { AuditLogEntity } from '../domain/audit-log.entity.js';

export class ListAuditLogsUseCase {
  constructor(private auditRepository: IAuditRepository) {}

  public async execute(filters?: ListAuditLogsFilters): Promise<AuditLogEntity[]> {
    return this.auditRepository.listLogs(filters);
  }
}
