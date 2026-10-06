import { IProjectsRepository } from '../domain/projects.repository.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import AppError from '../../../shared/errors/AppError.js';
import { AuditAction } from '@prisma/client';

export interface RevokeApiKeyInput {
  apiKeyId: string;
}

export class RevokeApiKeyUseCase {
  constructor(
    private projectsRepository: IProjectsRepository,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(input: RevokeApiKeyInput): Promise<void> {
    const existing = await this.projectsRepository.findApiKeyById(input.apiKeyId);
    if (!existing) {
      throw new AppError('API Key no encontrada', 'API_KEY_NOT_FOUND', 404);
    }

    if (!existing.isActive) {
      throw new AppError('La API Key ya se encuentra revocada', 'API_KEY_ALREADY_REVOKED', 400);
    }

    await this.projectsRepository.revokeApiKey(input.apiKeyId);

    await this.auditRepository.createLog({
      projectId: existing.projectId,
      action: AuditAction.API_KEY_REVOKED,
      resource: 'api_key',
      details: {
        apiKeyId: existing.id,
        prefix: existing.prefix,
        name: existing.name,
      },
    });
  }
}
