import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("people.bulkImport", () => {
  let tenantId: string;
  let testContext: any;

  beforeAll(async () => {
    // Create a test tenant
    const tenant = await db.createTenant({ name: "Test Tenant for Bulk Import" });
    tenantId = tenant.id;

    // Create test context
    testContext = {
      user: {
        id: "test-user-1",
        tenantId,
        email: "test@example.com",
        role: "owner",
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it("should import multiple contacts successfully", async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.people.bulkImport({
      contacts: [
        {
          fullName: "Alice Test",
          firstName: "Alice",
          lastName: "Test",
          primaryEmail: "alice@test.com",
          companyName: "Test Corp",
          roleTitle: "Engineer",
        },
        {
          fullName: "Bob Test",
          firstName: "Bob",
          lastName: "Test",
          primaryEmail: "bob@test.com",
          companyName: "Test Inc",
          roleTitle: "Manager",
        },
      ],
    });

    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.duplicates).toBe(0);
    expect(result.errors).toHaveLength(0);

    // Verify contacts were created
    const people = await db.getPeopleByTenant(tenantId);
    expect(people.length).toBeGreaterThanOrEqual(2);
    
    const alice = people.find((p) => p.primaryEmail === "alice@test.com");
    expect(alice).toBeDefined();
    expect(alice?.fullName).toBe("Alice Test");
    expect(alice?.companyName).toBe("Test Corp");
  });

  it("should detect and skip duplicate emails", async () => {
    const caller = appRouter.createCaller(testContext);

    // First import
    await caller.people.bulkImport({
      contacts: [
        {
          fullName: "Charlie Test",
          primaryEmail: "charlie@test.com",
        },
      ],
    });

    // Try to import the same email again
    const result = await caller.people.bulkImport({
      contacts: [
        {
          fullName: "Charlie Duplicate",
          primaryEmail: "charlie@test.com",
        },
      ],
    });

    expect(result.success).toBe(0);
    expect(result.duplicates).toBe(1);
    expect(result.failed).toBe(0);
  });

  it("should handle mixed success, duplicate, and failure cases", async () => {
    const caller = appRouter.createCaller(testContext);

    const result = await caller.people.bulkImport({
      contacts: [
        {
          fullName: "David Test",
          primaryEmail: "david@test.com",
        },
        {
          fullName: "Alice Test",
          primaryEmail: "alice@test.com", // Duplicate from earlier test
        },
        {
          fullName: "Eve Test",
          primaryEmail: "eve@test.com",
        },
      ],
    });

    expect(result.success).toBeGreaterThanOrEqual(1); // At least David or Eve
    expect(result.duplicates).toBeGreaterThanOrEqual(1); // Alice is duplicate
  });
});
