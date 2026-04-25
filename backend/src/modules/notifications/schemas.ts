import { z } from 'zod';

export const notificationFiltersSchema = z.object({
  type: z.enum(['assignment', 'status_update', 'verification', 'system']).optional(),
  readStatus: z.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export const markReadSchema = z.object({
  id: z.string().uuid(),
});

export type NotificationFilters = z.infer<typeof notificationFiltersSchema>;