import { Router } from 'express';
import * as reportController from './controller.js';
import { createReportSchema, updateReportSchema, reportFiltersSchema, reportIdSchema } from './schemas.js';
import { validateBody, validateQuery } from '../../middleware/index.js';

const router = Router();

router.post('/', validateBody(createReportSchema), reportController.createReport);

router.get('/', validateQuery(reportFiltersSchema), reportController.getReports);

router.get('/nearby', reportController.getNearbyReports);

router.get('/:id', reportController.getReportById);

router.put('/:id', validateBody(updateReportSchema), reportController.updateReport);

router.delete('/:id', reportController.deleteReport);

export default router;