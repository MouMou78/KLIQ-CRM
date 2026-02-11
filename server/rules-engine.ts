/**
 * Rules Engine for CRM
 * Handles automated workflow triggers based on moments
 */

import * as db from "./db";
import { Moment } from "../drizzle/schema";
import { parseTriggerDate } from "./utils";

export interface Rule {
  name: string;
  when: {
    "moment.type"?: string;
    "moment.source"?: string;
  };
  then: Array<{
    action: string;
    params?: Record<string, any>;
  }>;
}

const rules: Rule[] = [
  {
    name: "Outbound silence follow-up",
    when: {
      "moment.type": "email_sent",
      "moment.source": "amplemarket",
    },
    then: [
      {
        action: "create_next_action_if_no_reply",
        params: {
          days: 4,
          businessDays: true,
          actionType: "follow_up",
          triggerType: "date",
          triggerValue: "now+4bd",
        },
      },
    ],
  },
  {
    name: "Reply received -> respond",
    when: { "moment.type": "reply_received" },
    then: [
      { action: "close_open_next_action_for_thread" },
      {
        action: "create_next_action",
        params: {
          actionType: "reply",
          triggerType: "date",
          triggerValue: "now",
        },
      },
    ],
  },
  {
    name: "Meeting held requires next action",
    when: { "moment.type": "meeting_held" },
    then: [
      { action: "set_thread_status", params: { status: "active" } },
      {
        action: "create_next_action",
        params: {
          actionType: "follow_up",
          triggerType: "date",
          triggerValue: "now+12h",
        },
      },
    ],
  },
];

/**
 * Process a moment through the rules engine
 */
export async function processMoment(moment: Moment): Promise<void> {
  for (const rule of rules) {
    if (matchesRule(moment, rule.when)) {
      console.log(`[Rules] Applying rule: ${rule.name}`);
      await executeActions(moment, rule.then);
    }
  }
}

/**
 * Check if a moment matches rule conditions
 */
function matchesRule(moment: Moment, conditions: Record<string, any>): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (key === "moment.type" && moment.type !== value) return false;
    if (key === "moment.source" && moment.source !== value) return false;
  }
  return true;
}

/**
 * Execute rule actions
 */
async function executeActions(moment: Moment, actions: Array<{ action: string; params?: Record<string, any> }>): Promise<void> {
  for (const actionDef of actions) {
    try {
      await executeAction(moment, actionDef.action, actionDef.params);
    } catch (error) {
      console.error(`[Rules] Failed to execute action ${actionDef.action}:`, error);
    }
  }
}

/**
 * Execute a single action
 */
async function executeAction(moment: Moment, action: string, params?: Record<string, any>): Promise<void> {
  switch (action) {
    case "create_next_action_if_no_reply":
      await createNextActionIfNoReply(moment, params);
      break;
    
    case "close_open_next_action_for_thread":
      await db.closeOpenActionsForThread(moment.tenantId, moment.threadId);
      break;
    
    case "create_next_action":
      // Get thread to assign action to owner
      const thread = await db.getThreadById(moment.threadId);
      const dueAt = params?.triggerValue ? parseTriggerDate(params.triggerValue) : null;
      
      await db.createNextAction({
        tenantId: moment.tenantId,
        threadId: moment.threadId,
        actionType: params?.actionType || "follow_up",
        triggerType: params?.triggerType || "date",
        triggerValue: params?.triggerValue || "now",
        assignedUserId: thread?.ownerUserId || null,
        dueAt,
      });
      break;
    
    case "set_thread_status":
      // TODO: Implement thread status update
      console.log(`[Rules] Set thread ${moment.threadId} status to ${params?.status}`);
      break;
    
    default:
      console.warn(`[Rules] Unknown action: ${action}`);
  }
}

/**
 * Create next action only if no reply has been received
 */
async function createNextActionIfNoReply(moment: Moment, params?: Record<string, any>): Promise<void> {
  // Check if there's a reply after this moment
  const moments = await db.getMomentsByThread(moment.tenantId, moment.threadId);
  const laterMoments = moments.filter(m => m.timestamp > moment.timestamp);
  const hasReply = laterMoments.some(m => m.type === "reply_received");
  
  if (!hasReply) {
    // Get thread to assign action to owner
    const thread = await db.getThreadById(moment.threadId);
    const dueAt = params?.triggerValue ? parseTriggerDate(params.triggerValue) : null;
    
    await db.createNextAction({
      tenantId: moment.tenantId,
      threadId: moment.threadId,
      actionType: params?.actionType || "follow_up",
      triggerType: params?.triggerType || "date",
      triggerValue: params?.triggerValue || "now+4bd",
      assignedUserId: thread?.ownerUserId || null,
      dueAt,
    });
  }
}

/**
 * Scheduled job: Mark dormant threads
 * Should be called daily
 */
export async function markDormantThreads(tenantId: string, daysInactive: number = 30): Promise<void> {
  // TODO: Implement dormancy detection
  console.log(`[Rules] Checking for dormant threads (inactive for ${daysInactive} days)`);
}
