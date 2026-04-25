import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { reports } from '../../db/schema/index.js';
import type { Report } from '../../db/schema/reports.js';
import type { CreateReportInput, UpdateReportInput, ReportFilters } from './schemas.js';

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function createReport(input: CreateReportInput, userId: string): Promise<Report> {
  const db = getDb();
  
  const [report] = await db.insert(reports)
    .values({
      title: input.title,
      description: input.description,
      category: input.category,
      urgency: input.urgency || 'medium',
      location: input.location,
      address: input.address || null,
      images: input.images || [],
      createdBy: userId,
      status: 'pending',
    })
    .returning();

  return report;
}

export async function getReportById(id: string): Promise<Report | null> {
  const db = getDb();
  
  const result = await db.select()
    .from(reports)
    .where(eq(reports.id, id))
    .limit(1);

  return result[0] || null;
}

export async function getReports(filters: ReportFilters): Promise<{ data: Report[]; total: number }> {
  const db = getDb();
  
  const conditions = [];
  
  if (filters.status) {
    conditions.push(eq(reports.status, filters.status));
  }
  
  if (filters.urgency) {
    conditions.push(eq(reports.urgency, filters.urgency));
  }
  
  if (filters.category) {
    const categoryValue = filters.category as 'infrastructure' | 'health' | 'environment' | 'safety' | 'education' | 'social' | 'other';
    conditions.push(eq(reports.category, categoryValue));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const offset = (filters.page - 1) * filters.limit;
  
  const data = await db.select()
    .from(reports)
    .where(whereClause)
    .orderBy(desc(reports.createdAt))
    .limit(filters.limit)
    .offset(offset);

  const countResult = await db.select({ count: sql`count(*)` })
    .from(reports)
    .where(whereClause);
  
  const total = Number(countResult[0]?.count || 0);

  return { data, total };
}

export async function updateReport(id: string, input: UpdateReportInput): Promise<Report | null> {
  const db = getDb();
  
  const [updated] = await db.update(reports)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(eq(reports.id, id))
    .returning();

  return updated || null;
}

export async function deleteReport(id: string): Promise<boolean> {
  const db = getDb();
  
  await db.delete(reports)
    .where(eq(reports.id, id));

  return true;
}

export async function getNearbyReports(lat: number, lng: number, radiusKm: number = 10): Promise<Report[]> {
  const db = getDb();
  
  const allReports = await db.select()
    .from(reports);

  return allReports.filter(report => {
    if (!report.location) return false;
    const [reportLat, reportLng] = report.location.split(',').map(Number);
    const distance = calculateDistance(
      { lat, lng },
      { lat: reportLat, lng: reportLng }
    );
    return distance <= radiusKm;
  });
}

export async function assignReportToVolunteer(reportId: string, volunteerId: string): Promise<Report | null> {
  const db = getDb();
  
  const [updated] = await db.update(reports)
    .set({
      assignedTo: volunteerId,
      status: 'assigned',
      updatedAt: new Date(),
    })
    .where(eq(reports.id, reportId))
    .returning();

  return updated || null;
}