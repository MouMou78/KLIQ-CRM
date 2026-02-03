import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("automation", () => {
  let tenantId: string;
  let testContext: any;

  beforeAll(async () => {
    // Create a test tenant
    const tenant = await db.createTenant({ name: "Test Tenant for Automation" });
    tenantId = tenant.id;

    // Create test context
    testContext = {
      user: {
        id: "test-user-automation",
        tenantId,
        email: "automation@example.com",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it("should list automation rules", async () => {
    const caller = appRouter.createCaller(testContext);

    const rules = await caller.automation.list();

    expect(Array.isArray(rules)).toBe(true);
    // Rules are currently hardcoded in the UI, so backend returns empty array
    expect(rules).toEqual([]);
  });

  it("should toggle automation rule status", async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.automation.toggle({
      ruleId: "test-rule-1",
      status: "paused",
    });

    expect(result.success).toBe(true);
  });

  it("should toggle rule from paused to active", async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.automation.toggle({
      ruleId: "test-rule-2",
      status: "active",
    });

    expect(result.success).toBe(true);
  });
});
