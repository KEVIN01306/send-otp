import { Router } from 'express';
import { emailController } from '../email.module.js';
import { apiKeyAuthMiddleware } from '../../../app/middleware/ApiKeyAuth.middleware.js';
import { validateRequest } from '../../../app/middleware/Validated.middleware.js';
import { SendVerificationEmailSchema, SendCustomEmailSchema } from './validators/email.schemas.js';

const router = Router();

// Requires x-api-key
router.use(apiKeyAuthMiddleware);

// Send account verification email
router.post(
  '/send-verification',
  validateRequest({ body: SendVerificationEmailSchema }),
  emailController.sendVerification
);

// Send custom HTML email with centralized logo layout
router.post(
  '/send',
  validateRequest({ body: SendCustomEmailSchema }),
  emailController.sendCustomEmail
);

export const emailRouter = router;
export default router;
