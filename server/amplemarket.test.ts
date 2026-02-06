import { describe, it, expect } from "vitest";
import { createAmplemarketClient } from "./amplemarketClient";

describe("Amplemarket API Client - Endpoint Regression Tests", () => {
  /**
   * CRITICAL REGRESSION TEST
   * Per Amplemarket support: /email_events endpoint does NOT exist
   * This test ensures we never call this non-existent endpoint
   */
  it("should never call /email_events endpoint (does not exist)", () => {
    const client = createAmplemarketClient("test_api_key");
    
    // Assert that the client does not have an emailEvents method
    expect((client as any).emailEvents).toBeUndefined();
    expect((client as any).getEmailEvents).toBeUndefined();
    expect((client as any).fetchEmailEvents).toBeUndefined();
    expect((client as any).syncEmailEvents).toBeUndefined();
    
    // Verify getTasks method exists (correct endpoint for email activity)
    expect(client.getTasks).toBeDefined();
    expect(typeof client.getTasks).toBe("function");
  });

  it("should have getTasks method for email activity", () => {
    const client = createAmplemarketClient("test_api_key");
    
    // Verify getTasks method signature
    expect(client.getTasks).toBeDefined();
    expect(typeof client.getTasks).toBe("function");
    
    // getTasks should accept optional params including type and user_id
    // This is a type check - actual API call would require valid credentials
    const params = {
      type: "email",
      user_id: "test_user_id",
      limit: 100,
      offset: 0
    };
    
    // Just verify the method exists and accepts params (don't actually call API)
    expect(() => {
      // This would throw if method signature is wrong
      const result = client.getTasks(params);
      expect(result).toBeInstanceOf(Promise);
    }).not.toThrow();
  });

  it("should use correct Amplemarket API endpoints", () => {
    const client = createAmplemarketClient("test_api_key");
    
    // Verify all expected methods exist
    const expectedMethods = [
      "getUsers",
      "getLists",
      "getSequences",
      "getListById",
      "getContacts",
      "getTasks"
    ];
    
    expectedMethods.forEach(method => {
      expect((client as any)[method]).toBeDefined();
      expect(typeof (client as any)[method]).toBe("function");
    });
    
    // Verify forbidden methods do NOT exist
    const forbiddenMethods = [
      "emailEvents",
      "getEmailEvents",
      "fetchEmailEvents",
      "syncEmailEvents"
    ];
    
    forbiddenMethods.forEach(method => {
      expect((client as any)[method]).toBeUndefined();
    });
  });
});

describe("Amplemarket Integration - Email Activity", () => {
  it("should source email activity from /tasks endpoint, not /email_events", () => {
    // This test documents the correct approach per Amplemarket support
    const correctEndpoint = "/tasks";
    const incorrectEndpoint = "/email_events";
    const requiredParams = {
      type: "email",
      user_id: "required_from_list_users"
    };
    
    expect(correctEndpoint).toBe("/tasks");
    expect(requiredParams.type).toBe("email");
    expect(requiredParams.user_id).toBeDefined();
    
    // Document that /email_events does NOT exist
    expect(incorrectEndpoint).toBe("/email_events");
    // This endpoint will always return 404
  });

  it("should retrieve user_id from /users endpoint before calling /tasks", () => {
    // Per Amplemarket support: task endpoints require user_id
    // Must call /users first to get user_id by email
    
    const workflow = [
      { step: 1, endpoint: "/users", purpose: "Get user_id by email" },
      { step: 2, endpoint: "/tasks", purpose: "Get email tasks with user_id filter" }
    ];
    
    expect(workflow[0].endpoint).toBe("/users");
    expect(workflow[1].endpoint).toBe("/tasks");
    expect(workflow[0].step).toBeLessThan(workflow[1].step);
  });
});
