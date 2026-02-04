/**
 * Cron job to process scheduled campaigns
 * 
 * This script should be run periodically (e.g., every minute) to check for
 * campaigns that are scheduled to be sent and process them.
 * 
 * Usage:
 * - Via cron: * * * * * cd /path/to/project && node server/cron-campaign-scheduler.js
 * - Via node-cron in the main server process
 * - Via external scheduler (e.g., Manus scheduler, AWS EventBridge, etc.)
 */

import { processScheduledCampaigns } from "./campaign-scheduler";

async function main() {
  console.log(`[Cron] Starting scheduled campaign processor at ${new Date().toISOString()}`);
  
  try {
    const result = await processScheduledCampaigns();
    console.log(`[Cron] Processed ${result?.processed || 0} campaigns`);
  } catch (error: any) {
    console.error("[Cron] Error processing scheduled campaigns:", error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("[Cron] Campaign scheduler completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("[Cron] Fatal error:", error);
      process.exit(1);
    });
}

export { main as runCampaignScheduler };
