import prismaClient from '../../infrastructure/config/prisma/prisma.config.js';
import { PrismaAuditRepository } from './infrastructure/prisma-audit.repository.js';
import { CreateAuditLogUseCase } from './application/create-audit-log.usecase.js';
import { ListAuditLogsUseCase } from './application/list-audit-logs.usecase.js';

// Repositories
export const auditRepository = new PrismaAuditRepository(prismaClient);

// Use Cases
export const createAuditLogUseCase = new CreateAuditLogUseCase(auditRepository);
export const listAuditLogsUseCase = new ListAuditLogsUseCase(auditRepository);
