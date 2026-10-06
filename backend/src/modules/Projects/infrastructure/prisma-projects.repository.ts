import { PrismaClient } from '@prisma/client';
import { IProjectsRepository, CreateProjectDTO, CreateApiKeyDTO } from '../domain/projects.repository.js';
import { ProjectEntity, ApiKeyEntity, ApiKeyWithProject } from '../domain/project.entity.js';
import { ProjectMapper } from './mappers/project.mapper.js';
import prismaClient from '../../../infrastructure/config/prisma/prisma.config.js';

export class PrismaProjectsRepository implements IProjectsRepository {
  constructor(private prisma: PrismaClient = prismaClient) {}

  public async createProject(dto: CreateProjectDTO): Promise<ProjectEntity> {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        isActive: true,
      },
    });
    return ProjectMapper.toProjectEntity(project);
  }

  public async findBySlug(slug: string): Promise<ProjectEntity | null> {
    const project = await this.prisma.project.findUnique({
      where: { slug },
    });
    return project ? ProjectMapper.toProjectEntity(project) : null;
  }

  public async findById(id: string): Promise<ProjectEntity | null> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });
    return project ? ProjectMapper.toProjectEntity(project) : null;
  }

  public async setProjectStatus(id: string, isActive: boolean): Promise<ProjectEntity> {
    const project = await this.prisma.project.update({
      where: { id },
      data: { isActive },
    });
    return ProjectMapper.toProjectEntity(project);
  }

  public async listProjects(): Promise<ProjectEntity[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return projects.map(ProjectMapper.toProjectEntity);
  }

  public async createApiKey(dto: CreateApiKeyDTO): Promise<ApiKeyEntity> {
    const apiKey = await this.prisma.apiKey.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        prefix: dto.prefix,
        keyHash: dto.keyHash,
        isActive: true,
      },
    });
    return ProjectMapper.toApiKeyEntity(apiKey);
  }

  public async findApiKeyByHash(keyHash: string): Promise<ApiKeyWithProject | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { project: true },
    });
    return apiKey ? ProjectMapper.toApiKeyWithProject(apiKey) : null;
  }

  public async findApiKeyById(id: string): Promise<ApiKeyEntity | null> {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id },
    });
    return apiKey ? ProjectMapper.toApiKeyEntity(apiKey) : null;
  }

  public async revokeApiKey(id: string): Promise<ApiKeyEntity> {
    const apiKey = await this.prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });
    return ProjectMapper.toApiKeyEntity(apiKey);
  }

  public async updateApiKeyLastUsed(id: string): Promise<void> {
    try {
      await this.prisma.apiKey.update({
        where: { id },
        data: { lastUsedAt: new Date() },
      });
    } catch {
      // Ignored non-critical background operation
    }
  }

  public async listApiKeysByProjectId(projectId: string): Promise<ApiKeyEntity[]> {
    const keys = await this.prisma.apiKey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
    return keys.map(ProjectMapper.toApiKeyEntity);
  }
}
