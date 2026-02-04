import { getDb } from "./db";
import { marketingCampaigns } from "../drizzle/schema";
import { eq, and, lte } from "drizzle-orm";
import { sendCampaign } from "./campaign-sender";

/**
 * Process scheduled campaigns that are due to be sent
 * This should be called periodically (e.g., every minute via cron job)
 */
export async function processScheduledCampaigns() {
  const db = await getDb();
  if (!db) {
    console.error("[Campaign Scheduler] Database not available");
    return;
  }

  try {
    // Find all campaigns that are scheduled and due to be sent
    const now = new Date();
    const dueCampaigns = await db
      .select()
      .from(marketingCampaigns)
      .where(
        and(
          eq(marketingCampaigns.status, "scheduled"),
          lte(marketingCampaigns.scheduledAt, now)
        )
      );

    console.log(`[Campaign Scheduler] Found ${dueCampaigns.length} campaigns due for sending`);

    // Process each campaign
    for (const campaign of dueCampaigns) {
      try {
        console.log(`[Campaign Scheduler] Sending campaign: ${campaign.name} (${campaign.id})`);
        
        // Update status to sending
        await db
          .update(marketingCampaigns)
          .set({ status: "sending" })
          .where(eq(marketingCampaigns.id, campaign.id));

        // Send the campaign
        await sendCampaign(campaign.id, campaign.tenantId, campaign.userId);

        console.log(`[Campaign Scheduler] Successfully sent campaign: ${campaign.name}`);
      } catch (error: any) {
        console.error(`[Campaign Scheduler] Failed to send campaign ${campaign.id}:`, error.message);
        
        // Update status back to scheduled with error
        await db
          .update(marketingCampaigns)
          .set({ 
            status: "scheduled",
            // Store error in metadata if needed
          })
          .where(eq(marketingCampaigns.id, campaign.id));
      }
    }

    return {
      processed: dueCampaigns.length,
      timestamp: now.toISOString(),
    };
  } catch (error: any) {
    console.error("[Campaign Scheduler] Error processing scheduled campaigns:", error.message);
    throw error;
  }
}

/**
 * Schedule a campaign for future sending
 */
export async function scheduleCampaign(
  campaignId: string,
  tenantId: string,
  scheduledAt: Date,
  timezone: string = "UTC"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate that scheduled time is in the future
  const now = new Date();
  if (scheduledAt <= now) {
    throw new Error("Scheduled time must be in the future");
  }

  // Update campaign with scheduled time and status
  await db
    .update(marketingCampaigns)
    .set({
      scheduledAt,
      status: "scheduled",
      updatedAt: now,
    })
    .where(
      and(
        eq(marketingCampaigns.id, campaignId),
        eq(marketingCampaigns.tenantId, tenantId)
      )
    );

  return {
    success: true,
    scheduledAt: scheduledAt.toISOString(),
    timezone,
  };
}

/**
 * Cancel a scheduled campaign
 */
export async function cancelScheduledCampaign(campaignId: string, tenantId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(marketingCampaigns)
    .set({
      status: "draft",
      scheduledAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(marketingCampaigns.id, campaignId),
        eq(marketingCampaigns.tenantId, tenantId),
        eq(marketingCampaigns.status, "scheduled")
      )
    );

  return { success: true };
}

/**
 * Reschedule a campaign
 */
export async function rescheduleCampaign(
  campaignId: string,
  tenantId: string,
  newScheduledAt: Date,
  timezone: string = "UTC"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Validate that new scheduled time is in the future
  const now = new Date();
  if (newScheduledAt <= now) {
    throw new Error("New scheduled time must be in the future");
  }

  await db
    .update(marketingCampaigns)
    .set({
      scheduledAt: newScheduledAt,
      updatedAt: now,
    })
    .where(
      and(
        eq(marketingCampaigns.id, campaignId),
        eq(marketingCampaigns.tenantId, tenantId),
        eq(marketingCampaigns.status, "scheduled")
      )
    );

  return {
    success: true,
    scheduledAt: newScheduledAt.toISOString(),
    timezone,
  };
}

/**
 * Get all scheduled campaigns for a tenant
 */
export async function getScheduledCampaigns(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const campaigns = await db
    .select()
    .from(marketingCampaigns)
    .where(
      and(
        eq(marketingCampaigns.tenantId, tenantId),
        eq(marketingCampaigns.status, "scheduled")
      )
    );

  return campaigns.map(campaign => ({
    ...campaign,
    timeUntilSend: campaign.scheduledAt 
      ? Math.max(0, campaign.scheduledAt.getTime() - Date.now())
      : 0,
  }));
}
