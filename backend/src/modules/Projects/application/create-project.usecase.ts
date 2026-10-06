import { IProjectsRepository } from '../domain/projects.repository.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import { CryptoUtil } from '../../../shared/utils/crypto.util.js';
import AppError from '../../../shared/errors/AppError.js';
import { AuditAction } from '@prisma/client';

export interface CreateProjectInput {
  name: string;
  slug: string;
  keyName: string;
  description?: string;
}

export interface CreateProjectOutput {
  project: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  };
  apiKey: {
    id: string;
    name: string;
    prefix: string;
    rawApiKey: string;
  };
}

export class CreateProjectUseCase {
  constructor(
    private projectsRepository: IProjectsRepository,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(input: CreateProjectInput): Promise<CreateProjectOutput> {
    const normalizedSlug = input.slug.trim().toLowerCase();

    // Check if slug already exists
    const existing = await this.projectsRepository.findBySlug(normalizedSlug);
    if (existing) {
      throw new AppError(`El proyecto con slug '${normalizedSlug}' ya existe`, 'PROJECT_SLUG_EXISTS', 400);
    }

    // Create project
    const project = await this.projectsRepository.createProject({
      name: input.name.trim(),
      slug: normalizedSlug,
      description: input.description?.trim(),
    });

    // Generate secure API key
    const rawApiKey = CryptoUtil.generateApiKey();
    const prefix = CryptoUtil.extractPrefix(rawApiKey);
    const keyHash = CryptoUtil.hashSha256(rawApiKey);

    // Save hashed key
    const apiKey = await this.projectsRepository.createApiKey({
      projectId: project.id,
      name: input.keyName.trim(),
      prefix,
      keyHash,
    });

    // Record audit log
    await this.auditRepository.createLog({
      projectId: project.id,
      action: AuditAction.API_KEY_CREATED,
      resource: 'api_key',
      details: {
        apiKeyId: apiKey.id,
        prefix: apiKey.prefix,
        name: apiKey.name,
      },
    });

    return {
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
      },
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        prefix: apiKey.prefix,
        rawApiKey,
      },
    };
  }
}
