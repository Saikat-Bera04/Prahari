import { Router } from 'express';
import * as authController from './controller.js';
import { registerSchema, loginSchema, refreshSchema } from './schemas.js';
import { validateBody } from '../../middleware/index.js';

const router = Router();

router.post('/register', validateBody(registerSchema), authController.register);

router.post('/login', validateBody(loginSchema), authController.login);

router.post('/refresh', validateBody(refreshSchema), authController.refresh);

router.post('/logout', validateBody(refreshSchema), authController.logout);

export default router;