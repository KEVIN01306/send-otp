import { Request, Response, NextFunction } from 'express';
import { CreateProjectUseCase } from '../application/create-project.usecase.js';
import { RevokeApiKeyUseCase } from '../application/revoke-api-key.usecase.js';
import { SetProjectStatusUseCase, ListProjectsUseCase } from '../application/set-project-status.usecase.js';
import { PrismaAuditRepository } from '../../Audit/infrastructure/prisma-audit.repository.js';
import { AuditAction } from '@prisma/client';

export class AdminController {
  constructor(
    private createProjectUseCase: CreateProjectUseCase,
    private revokeApiKeyUseCase: RevokeApiKeyUseCase,
    private setProjectStatusUseCase: SetProjectStatusUseCase,
    private listProjectsUseCase: ListProjectsUseCase,
    private auditRepository: PrismaAuditRepository
  ) {}

  public createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, slug, keyName, description } = req.body;

      const result = await this.createProjectUseCase.execute({
        name,
        slug,
        keyName,
        description,
      });

      res.status(201).json({
        success: true,
        project: result.project,
        apiKey: {
          name: result.apiKey.name,
          prefix: result.apiKey.prefix,
          rawApiKey: result.apiKey.rawApiKey,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  public revokeApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apiKeyId } = req.body;

      await this.revokeApiKeyUseCase.execute({ apiKeyId });

      res.status(200).json({
        success: true,
        message: 'API Key revocada correctamente',
      });
    } catch (error) {
      next(error);
    }
  };

  public setProjectStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body;

      const updated = await this.setProjectStatusUseCase.execute(id, isActive);

      res.status(200).json({
        success: true,
        project: updated,
      });
    } catch (error) {
      next(error);
    }
  };

  public listProjects = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projects = await this.listProjectsUseCase.execute();
      res.status(200).json({
        success: true,
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  };

  public listAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, action, limit, offset } = req.query;

      const logs = await this.auditRepository.listLogs({
        projectId: projectId as string | undefined,
        action: action as AuditAction | undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      });

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  };
}
