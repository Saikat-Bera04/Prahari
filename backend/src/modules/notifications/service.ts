import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { notifications } from '../../db/schema/index.js';
import type { Notification } from '../../db/schema/notifications.js';
import type { NotificationFilters } from './schemas.js';

export async function createNotification(
  userId: string,
  message: string,
  type: 'assignment' | 'status_update' | 'verification' | 'system'
): Promise<Notification> {
  const db = getDb();
  
  const [notification] = await db.insert(notifications)
    .values({
      userId,
      message,
      type,
    })
    .returning();

  return notification;
}

export async function getUserNotifications(userId: string, filters: NotificationFilters): Promise<{ data: Notification[]; total: number }> {
  const db = getDb();
  
  const conditions = [eq(notifications.userId, userId)];
  
  if (filters.type) {
    conditions.push(eq(notifications.type, filters.type));
  }
  
  if (filters.readStatus !== undefined) {
    conditions.push(eq(notifications.readStatus, filters.readStatus));
  }

  const whereClause = and(...conditions);
  
  const offset = (filters.page - 1) * filters.limit;
  
  const data = await db.select()
    .from(notifications)
    .where(whereClause)
    .orderBy(sql`${notifications.createdAt} DESC`)
    .limit(filters.limit)
    .offset(offset);

  const countResult = await db.select({ count: sql`count(*)` })
    .from(notifications)
    .where(whereClause);
  
  const total = Number(countResult[0]?.count || 0);

  return { data, total };
}

export async function markAsRead(id: string, userId: string): Promise<Notification | null> {
  const db = getDb();
  
  const [updated] = await db.update(notifications)
    .set({ readStatus: true })
    .where(and(
      eq(notifications.id, id),
      eq(notifications.userId, userId)
    ))
    .returning();

  return updated || null;
}

export async function markAllAsRead(userId: string): Promise<void> {
  const db = getDb();
  
  await db.update(notifications)
    .set({ readStatus: true })
    .where(eq(notifications.userId, userId));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const db = getDb();
  
  const result = await db.select({ count: sql`count(*)` })
    .from(notifications)
    .where(and(
      eq(notifications.userId, userId),
      eq(notifications.readStatus, false)
    ));
  
  return Number(result[0]?.count || 0);
}