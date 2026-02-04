import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { scheduleCampaign, cancelScheduledCampaign, rescheduleCampaign, getScheduledCampaigns } from "./campaign-scheduler";

let TEST_TENANT_ID: string;
let TEST_USER_ID: string;
let TEST_CAMPAIGN_ID: string;

describe("Real-time Notifications & Campaign Scheduling Tests", () => {
  beforeAll(async () => {
    // Create test tenant
    const tenant = await db.createTenant({
      name: "Test Tenant Realtime",
    });
    TEST_TENANT_ID = tenant.id;

    // Create test user
    const user = await db.createUser({
      tenantId: TEST_TENANT_ID,
      email: "test-realtime@example.com",
      passwordHash: "test-hash",
      name: "Test User Realtime",
    });
    TEST_USER_ID = user.id;

    // Create test campaign
    const campaign = await db.createCampaign({
      tenantId: TEST_TENANT_ID,
      userId: TEST_USER_ID,
      name: "Test Campaign",
      subject: "Test Subject",
      body: "Test Body",
      recipientType: "all",
    });
    TEST_CAMPAIGN_ID = campaign.id;
  });

  afterAll(async () => {
    // Cleanup test data
    const dbInstance = await db.getDb();
    if (dbInstance) {
      const { tenants, users, marketingCampaigns } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      await dbInstance.delete(marketingCampaigns).where(eq(marketingCampaigns.tenantId, TEST_TENANT_ID));
      await dbInstance.delete(users).where(eq(users.tenantId, TEST_TENANT_ID));
      await dbInstance.delete(tenants).where(eq(tenants.id, TEST_TENANT_ID));
    }
  });

  describe("Real-time Notification Polling", () => {
    it("should support polling for notifications", async () => {
      // Test that notification query works (polling is handled by frontend)
      const notifications = await db.getNotificationsByUser(TEST_TENANT_ID, TEST_USER_ID);
      
      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  describe("Campaign Scheduling", () => {
    it("should schedule a campaign for future sending", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      
      const result = await scheduleCampaign(
        TEST_CAMPAIGN_ID,
        TEST_TENANT_ID,
        futureDate,
        "America/New_York"
      );

      expect(result.success).toBe(true);
      expect(result.scheduledAt).toBeDefined();
      expect(result.timezone).toBe("America/New_York");
    });

    it("should reject scheduling in the past", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      
      await expect(
        scheduleCampaign(TEST_CAMPAIGN_ID, TEST_TENANT_ID, pastDate)
      ).rejects.toThrow("Scheduled time must be in the future");
    });

    it("should get all scheduled campaigns", async () => {
      const campaigns = await getScheduledCampaigns(TEST_TENANT_ID);
      
      expect(campaigns).toBeDefined();
      expect(Array.isArray(campaigns)).toBe(true);
      
      if (campaigns.length > 0) {
        expect(campaigns[0]).toHaveProperty("timeUntilSend");
        expect(campaigns[0].timeUntilSend).toBeGreaterThanOrEqual(0);
      }
    });

    it("should reschedule a campaign", async () => {
      const newFutureDate = new Date(Date.now() + 7200000); // 2 hours from now
      
      const result = await rescheduleCampaign(
        TEST_CAMPAIGN_ID,
        TEST_TENANT_ID,
        newFutureDate,
        "Europe/London"
      );

      expect(result.success).toBe(true);
      expect(result.scheduledAt).toBeDefined();
      expect(result.timezone).toBe("Europe/London");
    });

    it("should cancel a scheduled campaign", async () => {
      const result = await cancelScheduledCampaign(TEST_CAMPAIGN_ID, TEST_TENANT_ID);
      
      expect(result.success).toBe(true);
    });

    it("should validate timezone parameter", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      
      const result = await scheduleCampaign(
        TEST_CAMPAIGN_ID,
        TEST_TENANT_ID,
        futureDate,
        "Asia/Tokyo"
      );

      expect(result.timezone).toBe("Asia/Tokyo");
    });
  });
});
