import { Router } from 'express';
import { otpRouter } from '../modules/Otp/presentation/otp.routes.js';
import { emailRouter } from '../modules/Email/presentation/email.routes.js';
import { adminRouter } from '../modules/Projects/presentation/admin.routes.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'auth-otp-email-microservice',
    timestamp: new Date().toISOString(),
  });
});

// API v1 Routes
router.use('/api/v1/otp', otpRouter);
router.use('/api/v1/email', emailRouter);
router.use('/api/v1/admin', adminRouter);

export default router;
