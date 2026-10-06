import { PrismaProjectsRepository } from './infrastructure/prisma-projects.repository.js';
import { auditRepository } from '../Audit/audit.module.js';
import { CreateProjectUseCase } from './application/create-project.usecase.js';
import { RevokeApiKeyUseCase } from './application/revoke-api-key.usecase.js';
import { SetProjectStatusUseCase, ListProjectsUseCase } from './application/set-project-status.usecase.js';
import { AdminController } from './presentation/admin.controller.js';

// Repositories
export const projectsRepository = new PrismaProjectsRepository();

// Use Cases
export const createProjectUseCase = new CreateProjectUseCase(projectsRepository, auditRepository);
export const revokeApiKeyUseCase = new RevokeApiKeyUseCase(projectsRepository, auditRepository);
export const setProjectStatusUseCase = new SetProjectStatusUseCase(projectsRepository, auditRepository);
export const listProjectsUseCase = new ListProjectsUseCase(projectsRepository);

// Controllers
export const adminController = new AdminController(
  createProjectUseCase,
  revokeApiKeyUseCase,
  setProjectStatusUseCase,
  listProjectsUseCase,
  auditRepository
);
