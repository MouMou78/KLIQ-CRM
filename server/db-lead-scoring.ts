import { getDb } from "./db";
import { leadScores, leadScoringRules } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { scoreContact } from "./lead-scoring";

/**
 * Save or update lead score in database
 */
export async function saveLeadScore(data: {
  tenantId: string;
  personId: string;
  fitScore: number;
  intentScore: number;
  combinedScore: number;
  emailOpens?: number;
  emailClicks?: number;
  emailReplies?: number;
  websiteVisits?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if score exists
  const existing = await db
    .select()
    .from(leadScores)
    .where(
      and(
        eq(leadScores.tenantId, data.tenantId),
        eq(leadScores.personId, data.personId)
      )
    )
    .limit(1);

  const id = existing[0]?.id || `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (existing[0]) {
    // Update
    await db
      .update(leadScores)
      .set({
        engagementScore: data.intentScore,
        demographicScore: data.fitScore,
        totalScore: data.combinedScore,
        emailOpens: data.emailOpens || existing[0].emailOpens,
        emailClicks: data.emailClicks || existing[0].emailClicks,
        emailReplies: data.emailReplies || existing[0].emailReplies,
        websiteVisits: data.websiteVisits || existing[0].websiteVisits,
        lastActivityAt: new Date(),
      })
      .where(eq(leadScores.id, id));
  } else {
    // Insert
    await db.insert(leadScores).values({
      id,
      tenantId: data.tenantId,
      personId: data.personId,
      engagementScore: data.intentScore,
      demographicScore: data.fitScore,
      behaviorScore: 0,
      totalScore: data.combinedScore,
      emailOpens: data.emailOpens || 0,
      emailClicks: data.emailClicks || 0,
      emailReplies: data.emailReplies || 0,
      websiteVisits: data.websiteVisits || 0,
      formSubmissions: 0,
      lastActivityAt: new Date(),
    });
  }

  return id;
}

/**
 * Get top scored leads for a tenant
 */
export async function getTopLeads(tenantId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leadScores)
    .where(eq(leadScores.tenantId, tenantId))
    .orderBy(desc(leadScores.totalScore))
    .limit(limit);
}

/**
 * Get lead score for a person
 */
export async function getLeadScoreForPerson(tenantId: string, personId: string) {
  const db = await getDb();
  if (!db) return null;

  const scores = await db
    .select()
    .from(leadScores)
    .where(
      and(
        eq(leadScores.tenantId, tenantId),
        eq(leadScores.personId, personId)
      )
    )
    .limit(1);

  return scores[0] || null;
}

/**
 * Get scoring rules for tenant
 */
export async function getScoringRules(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(leadScoringRules)
    .where(eq(leadScoringRules.tenantId, tenantId))
    .orderBy(desc(leadScoringRules.createdAt));
}

/**
 * Create or update scoring rule
 */
export async function upsertScoringRule(data: {
  id?: string;
  tenantId: string;
  name: string;
  description?: string;
  category: "engagement" | "demographic" | "behavior";
  eventType: string;
  points: number;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = data.id || `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  if (data.id) {
    await db
      .update(leadScoringRules)
      .set(data)
      .where(eq(leadScoringRules.id, data.id));
  } else {
    await db.insert(leadScoringRules).values({
      id,
      ...data,
    });
  }

  return id;
}

/**
 * Delete scoring rule
 */
export async function deleteScoringRule(ruleId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(leadScoringRules)
    .where(eq(leadScoringRules.id, ruleId));

  return true;
}
