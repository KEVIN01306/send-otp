import { Project as PrismaProject, ApiKey as PrismaApiKey } from '@prisma/client';
import { ProjectEntity, ApiKeyEntity, ApiKeyWithProject } from '../../domain/project.entity.js';

export class ProjectMapper {
  public static toProjectEntity(raw: PrismaProject): ProjectEntity {
    return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      description: raw.description,
      isActive: raw.isActive,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  public static toApiKeyEntity(raw: PrismaApiKey): ApiKeyEntity {
    return {
      id: raw.id,
      projectId: raw.projectId,
      name: raw.name,
      prefix: raw.prefix,
      keyHash: raw.keyHash,
      isActive: raw.isActive,
      lastUsedAt: raw.lastUsedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  public static toApiKeyWithProject(rawApiKey: PrismaApiKey & { project: PrismaProject }): ApiKeyWithProject {
    return {
      apiKey: ProjectMapper.toApiKeyEntity(rawApiKey),
      project: ProjectMapper.toProjectEntity(rawApiKey.project),
    };
  }
}
