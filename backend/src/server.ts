import app from './app.js';
import { config } from './shared/config/env.config.js';
import { Logger } from './shared/logger/logger.js';
import { OtpCleanupTask } from './shared/tasks/otp-cleanup.task.js';

const PORT = config.port;

const startServer = async () => {
  try {
    const server = app.listen(PORT, () => {
      Logger.info(`Auth, OTP & Email microservice started on port http://localhost:${PORT}`);
      Logger.info(`Environment: ${config.nodeEnv}`);
    });

    // Start background OTP cleanup task (runs hourly)
    OtpCleanupTask.start(60 * 60 * 1000);

    const shutdown = () => {
      Logger.info('Gracefully shutting down...');
      OtpCleanupTask.stop();
      server.close(() => {
        Logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    Logger.error('Error starting server', error);
    process.exit(1);
  }
};

startServer();