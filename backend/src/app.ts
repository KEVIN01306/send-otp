import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';
import { errorMiddleware } from './app/middleware/Error.middleware.js';
import { Logger } from './shared/logger/logger.js';

const app = express();

// Trust proxy for IP rate limiting and accurate headers behind proxies
app.set('trust proxy', true);

// CORS configuration (server-to-server priority with client support)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'x-admin-key'],
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Structured Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    Logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      ip: req.ip,
      durationMs: duration,
    });
  });
  next();
});

// API Routes
app.use(routes);

// Global Error Handler
app.use(errorMiddleware);

export default app;
