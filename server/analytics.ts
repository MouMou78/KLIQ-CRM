import { getDb } from "./db";
import { deals, dealStages, marketingCampaigns, campaignRecipients, emailSequenceEnrollments } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * Get deal pipeline value by stage
 */
export async function getDealPipelineByStage(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const stages = await db
    .select()
    .from(dealStages)
    .where(eq(dealStages.tenantId, tenantId))
    .orderBy(dealStages.order);

  const allDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.tenantId, tenantId));

  const pipelineData = stages.map(stage => {
    const stageDeals = allDeals.filter(deal => deal.stageId === stage.id);
    const totalValue = stageDeals.reduce((sum, deal) => {
      return sum + (parseFloat(deal.value || "0"));
    }, 0);

    return {
      stageName: stage.name,
      stageColor: stage.color,
      dealCount: stageDeals.length,
      totalValue: Math.round(totalValue * 100) / 100,
    };
  });

  return pipelineData;
}

/**
 * Calculate conversion rates between stages
 */
export async function getStageConversionRates(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const stages = await db
    .select()
    .from(dealStages)
    .where(eq(dealStages.tenantId, tenantId))
    .orderBy(dealStages.order);

  const allDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.tenantId, tenantId));

  const conversions = [];
  for (let i = 0; i < stages.length - 1; i++) {
    const currentStage = stages[i];
    const nextStage = stages[i + 1];

    const currentCount = allDeals.filter(d => d.stageId === currentStage.id).length;
    const nextCount = allDeals.filter(d => d.stageId === nextStage.id).length;

    const conversionRate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;

    conversions.push({
      from: currentStage.name,
      to: nextStage.name,
      conversionRate: Math.round(conversionRate * 100) / 100,
      currentCount,
      nextCount,
    });
  }

  return conversions;
}

/**
 * Calculate average deal cycle time
 */
export async function getAverageDealCycleTime(tenantId: string) {
  const db = await getDb();
  if (!db) return { averageDays: 0, totalDeals: 0 };

  const allDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.tenantId, tenantId));

  // Calculate time from creation to last update for closed deals
  const closedDeals = allDeals.filter(deal => {
    // Assuming last two stages are "Closed Won" and "Closed Lost"
    return deal.updatedAt && deal.createdAt;
  });

  if (closedDeals.length === 0) {
    return { averageDays: 0, totalDeals: 0 };
  }

  const totalDays = closedDeals.reduce((sum, deal) => {
    const created = new Date(deal.createdAt).getTime();
    const updated = new Date(deal.updatedAt).getTime();
    const days = (updated - created) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0);

  const averageDays = Math.round((totalDays / closedDeals.length) * 10) / 10;

  return {
    averageDays,
    totalDeals: closedDeals.length,
  };
}

/**
 * Get campaign performance trends over time
 */
export async function getCampaignPerformanceTrends(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(marketingCampaigns.tenantId, tenantId)];

  if (startDate) {
    conditions.push(gte(marketingCampaigns.createdAt, startDate));
  }

  if (endDate) {
    conditions.push(lte(marketingCampaigns.createdAt, endDate));
  }

  const campaigns = await db
    .select()
    .from(marketingCampaigns)
    .where(and(...conditions));

  const trends = await Promise.all(
    campaigns.map(async campaign => {
      const recipients = await db
        .select()
        .from(campaignRecipients)
        .where(eq(campaignRecipients.campaignId, campaign.id));

      const sent = recipients.filter(r => r.status === "sent").length;
      const opened = recipients.filter(r => r.openedAt !== null).length;
      const clicked = recipients.filter(r => r.clickedAt !== null).length;

      return {
        campaignName: campaign.name,
        date: campaign.createdAt,
        sent,
        opened,
        clicked,
        openRate: sent > 0 ? Math.round((opened / sent) * 100 * 10) / 10 : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 100 * 10) / 10 : 0,
      };
    })
  );

  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Get overall CRM metrics
 */
export async function getOverallMetrics(tenantId: string) {
  const db = await getDb();
  if (!db) return null;

  // Total deals and value
  const allDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.tenantId, tenantId));

  const totalDeals = allDeals.length;
  const totalDealValue = allDeals.reduce((sum, deal) => {
    return sum + parseFloat(deal.value || "0");
  }, 0);

  // Active sequences
  const activeSequences = await db
    .select()
    .from(emailSequenceEnrollments)
    .where(
      and(
        eq(emailSequenceEnrollments.tenantId, tenantId),
        eq(emailSequenceEnrollments.status, "active")
      )
    );

  // Recent campaigns
  const recentCampaigns = await db
    .select()
    .from(marketingCampaigns)
    .where(eq(marketingCampaigns.tenantId, tenantId))
    .orderBy(sql`${marketingCampaigns.createdAt} DESC`)
    .limit(5);

  return {
    totalDeals,
    totalDealValue: Math.round(totalDealValue * 100) / 100,
    activeSequenceEnrollments: activeSequences.length,
    recentCampaignsCount: recentCampaigns.length,
  };
}
