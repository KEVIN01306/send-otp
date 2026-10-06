import { Router } from 'express';
import { otpController } from '../otp.module.js';
import { apiKeyAuthMiddleware } from '../../../app/middleware/ApiKeyAuth.middleware.js';
import { validateRequest } from '../../../app/middleware/Validated.middleware.js';
import { SendOtpSchema, VerifyOtpSchema } from './validators/otp.schemas.js';

const router = Router();

// All OTP endpoints require valid x-api-key
router.use(apiKeyAuthMiddleware);

router.post('/send', validateRequest({ body: SendOtpSchema }), otpController.sendOtp);
router.post('/verify', validateRequest({ body: VerifyOtpSchema }), otpController.verifyOtp);

export const otpRouter = router;
export default router;
