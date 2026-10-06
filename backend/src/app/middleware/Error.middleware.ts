import { Request, Response, NextFunction } from 'express';
import AppError from '../../shared/errors/AppError.js';
import { Logger } from '../../shared/logger/logger.js';

export const errorMiddleware = (err: any, req: Request, res: Response, _next: NextFunction): void => {
  // Handle AppError
  if (err instanceof AppError) {
    Logger.warn(`AppError [${err.code}]: ${err.message}`, {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
    });
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Handle JSON Syntax Error in Body
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400) {
    res.status(400).json({
      success: false,
      error: 'Formato JSON inválido en el cuerpo de la solicitud',
    });
    return;
  }

  // Generic Unhandled Errors
  Logger.error('Unhandled Server Error', err, {
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
  });
};