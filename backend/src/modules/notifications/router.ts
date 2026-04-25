import { Router } from 'express';
import * as notificationController from './controller.js';
import { notificationFiltersSchema, markReadSchema } from './schemas.js';
import { validateQuery } from '../../middleware/index.js';

const router = Router();

router.get('/', validateQuery(notificationFiltersSchema), notificationController.getNotifications);

router.get('/unread-count', notificationController.getUnreadCount);

router.patch('/:id/read', notificationController.markAsRead);

router.post('/mark-all-read', notificationController.markAllRead);

export default router;