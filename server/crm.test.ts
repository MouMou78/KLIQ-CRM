import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

// Mock authenticated user context
function createAuthContext(tenantId: string = "test-tenant-1"): { ctx: TrpcContext } {
  const user: User = {
    id: "test-user-1",
    tenantId,
    email: "test@example.com",
    passwordHash: "hashed",
    name: "Test User",
    role: "owner",
    createdAt: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("CRM Core Functionality", () => {
  describe("Home Dashboard", () => {
    it("should return dashboard data for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.home.dashboard();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("todayActions");
      expect(result).toHaveProperty("waitingOn");
      expect(result).toHaveProperty("recentlyTouched");
      expect(Array.isArray(result.todayActions)).toBe(true);
      expect(Array.isArray(result.waitingOn)).toBe(true);
      expect(Array.isArray(result.recentlyTouched)).toBe(true);
    });
  });

  describe("People Management", () => {
    it("should return empty list for new tenant", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.people.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a new person", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const personData = {
        fullName: "John Doe",
        primaryEmail: "john@example.com",
        companyName: "Acme Corp",
        roleTitle: "CEO",
      };

      const result = await caller.people.create(personData);

      expect(result).toBeDefined();
      expect(result.fullName).toBe(personData.fullName);
      expect(result.primaryEmail).toBe(personData.primaryEmail);
      expect(result.tenantId).toBe(ctx.user!.tenantId);
    });
  });

  describe("Events", () => {
    it("should return empty events list for new tenant", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.events.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should create a new event", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const eventData = {
        name: "Tech Conference 2026",
        slug: "tech-conf-2026",
        defaultIntent: "conference_lead",
        defaultTags: ["conference", "tech"],
      };

      const result = await caller.events.create(eventData);

      expect(result).toBeDefined();
      expect(result.name).toBe(eventData.name);
      expect(result.slug).toBe(eventData.slug);
      expect(result.tenantId).toBe(ctx.user!.tenantId);
    });
  });

  describe("Integrations", () => {
    it("should return empty integrations list for new tenant", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.integrations.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should connect Amplemarket integration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.integrations.connectAmplemarket({
        apiKey: "test-api-key-12345",
      });

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe("Multi-tenant Isolation", () => {
    it("should not allow access to other tenant's data", async () => {
      const { ctx: ctx1 } = createAuthContext("tenant-1");
      const { ctx: ctx2 } = createAuthContext("tenant-2");
      
      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      // Create person in tenant 1
      const person = await caller1.people.create({
        fullName: "Tenant 1 Person",
        primaryEmail: "person1@tenant1.com",
      });

      // Tenant 2 should not see tenant 1's people
      const tenant2People = await caller2.people.list();
      const foundPerson = tenant2People.find(p => p.id === person.id);
      
      expect(foundPerson).toBeUndefined();
    });
  });
});
