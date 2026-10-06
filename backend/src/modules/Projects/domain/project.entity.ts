export interface ProjectEntity {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyEntity {
  id: string;
  projectId: string;
  name: string;
  prefix: string;
  keyHash: string;
  isActive: boolean;
  lastUsedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyWithProject {
  apiKey: ApiKeyEntity;
  project: ProjectEntity;
}
