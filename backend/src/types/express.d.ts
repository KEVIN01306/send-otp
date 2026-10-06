import { ProjectEntity, ApiKeyEntity } from '../modules/Projects/domain/project.entity.js';

declare global {
  namespace Express {
    interface Request {
      project?: ProjectEntity;
      projectId?: string;
      apiKey?: ApiKeyEntity;
    }
  }
}
