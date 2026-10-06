import { IProjectsRepository } from '../domain/projects.repository.js';
import { IAuditRepository } from '../../Audit/domain/audit.repository.js';
import { ProjectEntity } from '../domain/project.entity.js';
import AppError from '../../../shared/errors/AppError.js';
import { AuditAction } from '@prisma/client';

export class SetProjectStatusUseCase {
  constructor(
    private projectsRepository: IProjectsRepository,
    private auditRepository: IAuditRepository
  ) {}

  public async execute(projectId: string, isActive: boolean): Promise<ProjectEntity> {
    const project = await this.projectsRepository.findById(projectId);
    if (!project) {
      throw new AppError('Proyecto no encontrado', 'PROJECT_NOT_FOUND', 404);
    }

    const updated = await this.projectsRepository.setProjectStatus(projectId, isActive);

    await this.auditRepository.createLog({
      projectId: updated.id,
      action: AuditAction.PROJECT_UPDATE,
      resource: 'project',
      details: {
        isActive,
        name: updated.name,
        slug: updated.slug,
      },
    });

    return updated;
  }
}

export class ListProjectsUseCase {
  constructor(private projectsRepository: IProjectsRepository) {}

  public async execute(): Promise<ProjectEntity[]> {
    return this.projectsRepository.listProjects();
  }
}
