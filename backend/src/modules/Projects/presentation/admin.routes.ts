import { Router } from 'express';
import { adminController } from '../projects.module.js';
import { adminAuthMiddleware } from '../../../app/middleware/AdminAuth.middleware.js';
import { validateRequest } from '../../../app/middleware/Validated.middleware.js';
import {
  CreateProjectSchema,
  RevokeApiKeySchema,
  SetProjectStatusSchema,
} from './validators/admin.schemas.js';

const router = Router();

// All Admin endpoints protected by x-admin-key (ADMIN_MASTER_KEY)
router.use(adminAuthMiddleware);

router.post('/projects', validateRequest({ body: CreateProjectSchema }), adminController.createProject);
router.get('/projects', adminController.listProjects);
router.patch('/projects/:id/status', validateRequest({ body: SetProjectStatusSchema }), adminController.setProjectStatus);
router.post('/keys/revoke', validateRequest({ body: RevokeApiKeySchema }), adminController.revokeApiKey);
router.get('/audit', adminController.listAuditLogs);

export const adminRouter = router;
export default router;
