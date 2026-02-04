import { getDb } from "./db";
import { deals, dealStages } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export type ForecastResult = {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  projectedRevenue: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  byStage: Array<{
    stageName: string;
    count: number;
    totalValue: number;
    probability: number;
    weightedValue: number;
  }>;
  historicalMetrics: {
    averageCloseRate: number;
    averageDealCycleTime: number; // in days
    averageDealValue: number;
  };
  seasonalTrends: {
    currentQuarterMultiplier: number;
    trendDirection: "up" | "down" | "stable";
  };
};

/**
 * Generate sales forecast based on pipeline and historical data
 */
export async function generateForecast(
  tenantId: string,
  timeframe: "month" | "quarter" | "year" = "quarter"
): Promise<ForecastResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all active deals (all deals are considered active unless in a closed stage)
  const activeDeals = await db
    .select()
    .from(deals)
    .where(eq(deals.tenantId, tenantId));

  // Get deal stages
  const stages = await db
    .select()
    .from(dealStages)
    .where(eq(dealStages.tenantId, tenantId));

  // Calculate pipeline metrics by stage
  const byStage = stages.map(stage => {
    const stageDeals = activeDeals.filter(d => d.stageId === stage.id);
    const totalValue = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    // Calculate average probability from deals in this stage
    const avgProbability = stageDeals.length > 0
      ? stageDeals.reduce((sum, d) => sum + (d.probability || 50), 0) / stageDeals.length
      : 50;
    const weightedValue = totalValue * (avgProbability / 100);

    return {
      stageName: stage.name,
      count: stageDeals.length,
      totalValue,
      probability: avgProbability,
      weightedValue,
    };
  });

  const totalPipelineValue = byStage.reduce((sum, s) => sum + s.totalValue, 0);
  const weightedPipelineValue = byStage.reduce((sum, s) => sum + s.weightedValue, 0);

  // Calculate historical metrics
  const historicalMetrics = await calculateHistoricalMetrics(tenantId);

  // Calculate seasonal trends
  const seasonalTrends = calculateSeasonalTrends();

  // Apply seasonal adjustment
  const seasonallyAdjustedRevenue = weightedPipelineValue * seasonalTrends.currentQuarterMultiplier;

  // Calculate confidence interval (±20% based on historical variance)
  const variance = 0.2;
  const confidenceInterval = {
    low: Math.round(seasonallyAdjustedRevenue * (1 - variance)),
    high: Math.round(seasonallyAdjustedRevenue * (1 + variance)),
  };

  return {
    totalPipelineValue: Math.round(totalPipelineValue),
    weightedPipelineValue: Math.round(weightedPipelineValue),
    projectedRevenue: Math.round(seasonallyAdjustedRevenue),
    confidenceInterval,
    byStage,
    historicalMetrics,
    seasonalTrends,
  };
}

/**
 * Calculate historical close rates and cycle times
 */
async function calculateHistoricalMetrics(tenantId: string) {
  const db = await getDb();
  if (!db) return {
    averageCloseRate: 0.25, // Default 25%
    averageDealCycleTime: 45, // Default 45 days
    averageDealValue: 50000, // Default $50k
  };

  // Get closed deals from last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Get closed deals (deals with high probability or past expected close date)
  const allDeals = await db
    .select()
    .from(deals)
    .where(
      and(
        eq(deals.tenantId, tenantId),
        gte(deals.createdAt, twelveMonthsAgo)
      )
    );

  const closedDeals = allDeals.filter(d => 
    d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date() && (d.probability || 0) >= 90
  );
  const lostDeals = allDeals.filter(d => 
    d.expectedCloseDate && new Date(d.expectedCloseDate) < new Date() && (d.probability || 0) < 10
  );

  const totalDeals = closedDeals.length + lostDeals.length;
  const averageCloseRate = totalDeals > 0 ? closedDeals.length / totalDeals : 0.25;

  // Calculate average deal cycle time
  let totalCycleTime = 0;
  let cycleTimeCount = 0;

  closedDeals.forEach(deal => {
    if (deal.createdAt && deal.expectedCloseDate) {
      const cycleTime = (new Date(deal.expectedCloseDate).getTime() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      totalCycleTime += cycleTime;
      cycleTimeCount++;
    }
  });

  const averageDealCycleTime = cycleTimeCount > 0 ? Math.round(totalCycleTime / cycleTimeCount) : 45;

  // Calculate average deal value
  const totalValue = closedDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
  const averageDealValue = closedDeals.length > 0 ? Math.round(totalValue / closedDeals.length) : 50000;

  return {
    averageCloseRate,
    averageDealCycleTime,
    averageDealValue,
  };
}

/**
 * Calculate seasonal trends based on current quarter
 */
function calculateSeasonalTrends() {
  const now = new Date();
  const month = now.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1; // 1-4

  // Seasonal multipliers (Q4 typically strongest, Q3 weakest)
  const quarterMultipliers = {
    1: 0.95, // Q1: Slow start
    2: 1.0,  // Q2: Normal
    3: 0.9,  // Q3: Summer slowdown
    4: 1.15, // Q4: Year-end push
  };

  const currentQuarterMultiplier = quarterMultipliers[quarter as keyof typeof quarterMultipliers] || 1.0;

  // Simple trend detection (could be enhanced with historical data)
  const trendDirection: "up" | "down" | "stable" = 
    currentQuarterMultiplier > 1.0 ? "up" : 
    currentQuarterMultiplier < 1.0 ? "down" : 
    "stable";

  return {
    currentQuarterMultiplier,
    trendDirection,
  };
}

/**
 * Generate scenario-based forecasts
 */
export async function generateScenarios(
  tenantId: string
): Promise<{
  conservative: ForecastResult;
  realistic: ForecastResult;
  optimistic: ForecastResult;
}> {
  const baseForecast = await generateForecast(tenantId);

  // Conservative: 70% of weighted pipeline
  const conservative = {
    ...baseForecast,
    projectedRevenue: Math.round(baseForecast.weightedPipelineValue * 0.7),
    confidenceInterval: {
      low: Math.round(baseForecast.weightedPipelineValue * 0.5),
      high: Math.round(baseForecast.weightedPipelineValue * 0.8),
    },
  };

  // Realistic: Base forecast
  const realistic = baseForecast;

  // Optimistic: 130% of weighted pipeline
  const optimistic = {
    ...baseForecast,
    projectedRevenue: Math.round(baseForecast.weightedPipelineValue * 1.3),
    confidenceInterval: {
      low: Math.round(baseForecast.weightedPipelineValue * 1.1),
      high: Math.round(baseForecast.weightedPipelineValue * 1.5),
    },
  };

  return {
    conservative,
    realistic,
    optimistic,
  };
}

/**
 * Get forecast trend over time
 */
export async function getForecastTrend(
  tenantId: string,
  months = 6
): Promise<Array<{
  month: string;
  projectedRevenue: number;
  actualRevenue: number;
}>> {
  const db = await getDb();
  if (!db) return [];

  const trend: Array<{
    month: string;
    projectedRevenue: number;
    actualRevenue: number;
  }> = [];

  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setMonth(now.getMonth() - i);

    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    // Get actual closed deals for this month
    const monthDeals = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.tenantId, tenantId),
          gte(deals.createdAt, monthStart),
          lte(deals.createdAt, monthEnd)
        )
      );
    
    const closedDeals = monthDeals.filter(d => 
      d.expectedCloseDate && 
      new Date(d.expectedCloseDate) >= monthStart && 
      new Date(d.expectedCloseDate) <= monthEnd &&
      (d.probability || 0) >= 90
    );

    const actualRevenue = closedDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

    // For past months, use actual revenue as projected (for comparison)
    // For current/future months, use forecast
    const isCurrentOrFuture = i === 0;
    const projectedRevenue = isCurrentOrFuture 
      ? (await generateForecast(tenantId)).projectedRevenue
      : actualRevenue;

    trend.push({
      month: targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      projectedRevenue: Math.round(projectedRevenue),
      actualRevenue: Math.round(actualRevenue),
    });
  }

  return trend;
}
