import { getDb } from "./db";
import { templateReviews, templateAnalytics, userTemplates } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Template Reviews
export async function createTemplateReview(data: {
  templateId: string;
  userId: string;
  tenantId: string;
  rating: number;
  review?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(templateReviews).values({ id, ...data });
  return id;
}

export async function getTemplateReviews(templateId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId))
    .orderBy(desc(templateReviews.createdAt));
}

export async function getTemplateRating(templateId: string) {
  const db = await getDb();
  if (!db) return { avgRating: 0, reviewCount: 0 };
  const result = await db
    .select({
      avgRating: sql<number>`AVG(${templateReviews.rating})`,
      reviewCount: sql<number>`COUNT(*)`,
    })
    .from(templateReviews)
    .where(eq(templateReviews.templateId, templateId));
  
  return {
    avgRating: result[0]?.avgRating || 0,
    reviewCount: result[0]?.reviewCount || 0,
  };
}

// Template Analytics
export async function getTemplateAnalytics(templateId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(templateAnalytics)
    .where(eq(templateAnalytics.templateId, templateId));
  
  return result[0] || null;
}

export async function incrementTemplateInstall(templateId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getTemplateAnalytics(templateId);
  
  if (existing) {
    await db
      .update(templateAnalytics)
      .set({
        installCount: sql`${templateAnalytics.installCount} + 1`,
        lastInstalledAt: new Date(),
      })
      .where(eq(templateAnalytics.id, existing.id));
  } else {
    const id = randomUUID();
    await db.insert(templateAnalytics).values({
      id,
      templateId,
      installCount: 1,
      lastInstalledAt: new Date(),
    });
  }
}

export async function updateTemplateSuccess(templateId: string, success: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getTemplateAnalytics(templateId);
  if (!existing) return;
  
  if (success) {
    await db
      .update(templateAnalytics)
      .set({
        successCount: sql`${templateAnalytics.successCount} + 1`,
      })
      .where(eq(templateAnalytics.id, existing.id));
  } else {
    await db
      .update(templateAnalytics)
      .set({
        failureCount: sql`${templateAnalytics.failureCount} + 1`,
      })
      .where(eq(templateAnalytics.id, existing.id));
  }
}

export async function getTrendingTemplates(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(templateAnalytics)
    .orderBy(desc(templateAnalytics.lastInstalledAt))
    .limit(limit);
}

// User Templates
export async function createUserTemplate(data: {
  userId: string;
  tenantId: string;
  name: string;
  description?: string;
  category: string;
  triggerType: string;
  triggerConfig: Record<string, any>;
  actionType: string;
  actionConfig: Record<string, any>;
  conditions: any;
  priority: number;
  isPublic: boolean;
  baseTemplateId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const id = randomUUID();
  await db.insert(userTemplates).values({ id, ...data } as any);
  return id;
}

export async function getUserTemplates(userId: string, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userTemplates)
    .where(
      and(
        eq(userTemplates.userId, userId),
        eq(userTemplates.tenantId, tenantId)
      )
    )
    .orderBy(desc(userTemplates.createdAt));
}

export async function getPublicUserTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(userTemplates)
    .where(eq(userTemplates.isPublic, true))
    .orderBy(desc(userTemplates.createdAt));
}

export async function getUserTemplateById(id: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(userTemplates)
    .where(eq(userTemplates.id, id));
  
  return result[0] || null;
}

export async function updateUserTemplate(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    isPublic: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(userTemplates)
    .set(data)
    .where(eq(userTemplates.id, id));
}

export async function deleteUserTemplate(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(userTemplates).where(eq(userTemplates.id, id));
}
