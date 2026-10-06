import { Request, Response, NextFunction } from 'express';
import { CryptoUtil } from '../../shared/utils/crypto.util.js';
import { config } from '../../shared/config/env.config.js';

export const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const adminKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!adminKey || typeof adminKey !== 'string' || !adminKey.trim()) {
    res.status(401).json({
      success: false,
      error: 'Credencial administrativa requerida (x-admin-key)',
    });
    return;
  }

  const isValid = CryptoUtil.safeTimingCompare(adminKey.trim(), config.adminMasterKey.trim());

  if (!isValid) {
    res.status(403).json({
      success: false,
      error: 'Credencial administrativa inválida',
    });
    return;
  }

  next();
};
