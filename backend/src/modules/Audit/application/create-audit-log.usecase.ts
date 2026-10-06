import { IAuditRepository, CreateAuditLogDTO } from '../domain/audit.repository.js';
import { AuditLogEntity } from '../domain/audit-log.entity.js';

export class CreateAuditLogUseCase {
  constructor(private auditRepository: IAuditRepository) {}

  public async execute(dto: CreateAuditLogDTO): Promise<AuditLogEntity> {
    return this.auditRepository.createLog(dto);
  }
}
