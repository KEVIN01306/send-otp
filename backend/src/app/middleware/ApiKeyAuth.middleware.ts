import { Request, Response, NextFunction } from 'express';
import { projectsRepository } from '../../modules/Projects/projects.module.js';
import { auditRepository } from '../../modules/Audit/audit.module.js';
import { CryptoUtil } from '../../shared/utils/crypto.util.js';
import { AuditAction } from '@prisma/client';

export const apiKeyAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const rawApiKey = req.headers['x-api-key'];

  // 1. Missing header -> 401 Unauthorized
  if (!rawApiKey || typeof rawApiKey !== 'string' || !rawApiKey.trim()) {
    res.status(401).json({
      success: false,
      error: 'API key requerida',
    });
    return;
  }

  // 2. Normalize and compute SHA-256 hash
  const cleanedApiKey = rawApiKey.trim();
  const calculatedHash = CryptoUtil.hashSha256(cleanedApiKey);

  try {
    // 3. Look up key in DB including project
    const result = await projectsRepository.findApiKeyByHash(calculatedHash);

    // 4. Inactive or non-existent key -> 403 Forbidden
    if (!result || !result.apiKey.isActive) {
      // Async failure audit log
      auditRepository.createLog({
        action: AuditAction.AUTH_FAILED,
        resource: 'api_key',
        details: {
          ip: req.ip,
          path: req.originalUrl,
          reason: 'Invalid or inactive API key',
        },
      }).catch(() => {});

      res.status(403).json({
        success: false,
        error: 'API key inválida',
      });
      return;
    }

    // 5. Inactive project -> 403 Forbidden
    if (!result.project.isActive) {
      res.status(403).json({
        success: false,
        error: 'El proyecto se encuentra inactivo',
      });
      return;
    }

    // 6. Inject context
    req.project = result.project;
    req.projectId = result.project.id;
    req.apiKey = result.apiKey;

    // 7. Update lastUsedAt asynchronously
    projectsRepository.updateApiKeyLastUsed(result.apiKey.id);

    next();
  } catch (error) {
    next(error);
  }
};
