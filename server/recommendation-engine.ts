import { getDb } from "./db";
import { automationRules } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { automationTemplates } from "./automation-templates";

interface Pattern {
  triggers: Map<string, number>;
  actions: Map<string, number>;
  categories: Map<string, number>;
  avgPriority: number;
}

interface TemplateScore {
  templateId: string;
  score: number;
  reasons: string[];
}

/**
 * Analyze user's automation rules to extract patterns
 */
export async function analyzeUserPatterns(userId: string, tenantId: string): Promise<Pattern> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const rules = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.tenantId, tenantId));

  const pattern: Pattern = {
    triggers: new Map(),
    actions: new Map(),
    categories: new Map(),
    avgPriority: 0,
  };

  if (rules.length === 0) return pattern;

  let totalPriority = 0;

  for (const rule of rules) {
    // Count trigger types
    const triggerCount = pattern.triggers.get(rule.triggerType) || 0;
    pattern.triggers.set(rule.triggerType, triggerCount + 1);

    // Count action types
    const actionCount = pattern.actions.get(rule.actionType) || 0;
    pattern.actions.set(rule.actionType, actionCount + 1);

    // Infer category from trigger/action combination
    const category = inferCategory(rule.triggerType, rule.actionType);
    const categoryCount = pattern.categories.get(category) || 0;
    pattern.categories.set(category, categoryCount + 1);

    totalPriority += rule.priority || 0;
  }

  pattern.avgPriority = totalPriority / rules.length;

  return pattern;
}

/**
 * Infer template category from trigger and action types
 */
function inferCategory(triggerType: string, actionType: string): string {
  if (triggerType.includes("email") || triggerType.includes("reply")) {
    return "lead_nurturing";
  }
  if (triggerType.includes("stage") || triggerType.includes("deal")) {
    return "deal_management";
  }
  if (actionType === "create_task" || triggerType.includes("meeting")) {
    return "task_automation";
  }
  return "notifications";
}

/**
 * Score templates based on user patterns
 */
export function scoreTemplates(pattern: Pattern, templates: typeof automationTemplates): TemplateScore[] {
  const scores: TemplateScore[] = [];

  for (const template of templates) {
    let score = 0;
    const reasons: string[] = [];

    // Score based on trigger match (40% weight)
    const triggerCount = pattern.triggers.get(template.triggerType) || 0;
    if (triggerCount > 0) {
      const triggerScore = Math.min(triggerCount * 10, 40);
      score += triggerScore;
      reasons.push(`You use ${template.triggerType} triggers`);
    }

    // Score based on action match (40% weight)
    const actionCount = pattern.actions.get(template.actionType) || 0;
    if (actionCount > 0) {
      const actionScore = Math.min(actionCount * 10, 40);
      score += actionScore;
      reasons.push(`You use ${template.actionType} actions`);
    }

    // Score based on category match (20% weight)
    const categoryCount = pattern.categories.get(template.category) || 0;
    if (categoryCount > 0) {
      const categoryScore = Math.min(categoryCount * 5, 20);
      score += categoryScore;
      reasons.push(`Matches your ${template.category.replace("_", " ")} workflows`);
    }

    // Bonus for templates that fill gaps (inverse scoring)
    if (triggerCount === 0 && pattern.triggers.size > 0) {
      score += 10;
      reasons.push("Expands your automation coverage");
    }

    if (actionCount === 0 && pattern.actions.size > 0) {
      score += 10;
      reasons.push("Adds new action type");
    }

    scores.push({
      templateId: template.id,
      score,
      reasons,
    });
  }

  // Sort by score descending
  return scores.sort((a, b) => b.score - a.score);
}

/**
 * Get top N recommended templates for a user
 */
export async function getRecommendations(
  userId: string,
  tenantId: string,
  limit: number = 5
): Promise<Array<{ template: typeof automationTemplates[0]; score: number; reasons: string[] }>> {
  const pattern = await analyzeUserPatterns(userId, tenantId);
  
  // If user has no rules, return popular templates
  if (pattern.triggers.size === 0 && pattern.actions.size === 0) {
    return automationTemplates.slice(0, limit).map((template: any) => ({
      template,
      score: 50,
      reasons: ["Popular template for getting started"],
    }));
  }

  const scores = scoreTemplates(pattern, automationTemplates);
  
  return scores.slice(0, limit).map(({ templateId, score, reasons }) => {
    const template = automationTemplates.find((t: any) => t.id === templateId)!;
    return { template, score, reasons };
  });
}
