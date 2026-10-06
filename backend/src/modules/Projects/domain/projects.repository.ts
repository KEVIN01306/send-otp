import { ProjectEntity, ApiKeyEntity, ApiKeyWithProject } from './project.entity.js';

export interface CreateProjectDTO {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateApiKeyDTO {
  projectId: string;
  name: string;
  prefix: string;
  keyHash: string;
}

export interface IProjectsRepository {
  createProject(dto: CreateProjectDTO): Promise<ProjectEntity>;
  findBySlug(slug: string): Promise<ProjectEntity | null>;
  findById(id: string): Promise<ProjectEntity | null>;
  setProjectStatus(id: string, isActive: boolean): Promise<ProjectEntity>;
  listProjects(): Promise<ProjectEntity[]>;

  createApiKey(dto: CreateApiKeyDTO): Promise<ApiKeyEntity>;
  findApiKeyByHash(keyHash: string): Promise<ApiKeyWithProject | null>;
  findApiKeyById(id: string): Promise<ApiKeyEntity | null>;
  revokeApiKey(id: string): Promise<ApiKeyEntity>;
  updateApiKeyLastUsed(id: string): Promise<void>;
  listApiKeysByProjectId(projectId: string): Promise<ApiKeyEntity[]>;
}
