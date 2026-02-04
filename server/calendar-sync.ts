import { getDb } from "./db";
import { calendarIntegrations, calendarEvents } from "../drizzle/schema";
import { eq, and, gte } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Calendar sync module for Google Calendar and Outlook
 * 
 * SETUP REQUIRED:
 * 1. Create OAuth apps in Google Cloud Console and Azure AD
 * 2. Add redirect URIs for OAuth callback
 * 3. Store client IDs and secrets in environment variables:
 *    - GOOGLE_CALENDAR_CLIENT_ID
 *    - GOOGLE_CALENDAR_CLIENT_SECRET
 *    - OUTLOOK_CALENDAR_CLIENT_ID
 *    - OUTLOOK_CALENDAR_CLIENT_SECRET
 */

interface CalendarEventData {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  status?: "confirmed" | "tentative" | "cancelled";
}

/**
 * Sync events from Google Calendar
 */
export async function syncGoogleCalendar(integrationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.id, integrationId))
    .limit(1)
    .then(rows => rows[0]);

  if (!integration || integration.provider !== "google") {
    throw new Error("Invalid Google Calendar integration");
  }

  // Check if token needs refresh
  if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
    await refreshGoogleToken(integrationId, integration.refreshToken!);
  }

  // Fetch events from Google Calendar API
  // In production, use googleapis package:
  // const { google } = require('googleapis');
  // const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  // const response = await calendar.events.list({ calendarId: 'primary', ... });

  console.log(`[Calendar] Would sync Google Calendar for integration ${integrationId}`);
  
  // Update last sync time
  await db
    .update(calendarIntegrations)
    .set({ lastSyncAt: new Date() })
    .where(eq(calendarIntegrations.id, integrationId));

  return { synced: 0, message: "Google Calendar sync ready (OAuth setup required)" };
}

/**
 * Sync events from Outlook Calendar
 */
export async function syncOutlookCalendar(integrationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const integration = await db
    .select()
    .from(calendarIntegrations)
    .where(eq(calendarIntegrations.id, integrationId))
    .limit(1)
    .then(rows => rows[0]);

  if (!integration || integration.provider !== "outlook") {
    throw new Error("Invalid Outlook Calendar integration");
  }

  // Check if token needs refresh
  if (integration.expiresAt && new Date(integration.expiresAt) < new Date()) {
    await refreshOutlookToken(integrationId, integration.refreshToken!);
  }

  // Fetch events from Microsoft Graph API
  // In production, use @microsoft/microsoft-graph-client:
  // const client = Client.init({ authProvider: ... });
  // const events = await client.api('/me/calendar/events').get();

  console.log(`[Calendar] Would sync Outlook Calendar for integration ${integrationId}`);
  
  // Update last sync time
  await db
    .update(calendarIntegrations)
    .set({ lastSyncAt: new Date() })
    .where(eq(calendarIntegrations.id, integrationId));

  return { synced: 0, message: "Outlook Calendar sync ready (OAuth setup required)" };
}

/**
 * Refresh Google OAuth token
 */
async function refreshGoogleToken(integrationId: string, refreshToken: string) {
  // In production, use OAuth2 client to refresh token
  console.log(`[Calendar] Would refresh Google token for ${integrationId}`);
}

/**
 * Refresh Outlook OAuth token
 */
async function refreshOutlookToken(integrationId: string, refreshToken: string) {
  // In production, use MSAL to refresh token
  console.log(`[Calendar] Would refresh Outlook token for ${integrationId}`);
}

/**
 * Save calendar event to database
 */
export async function saveCalendarEvent(
  tenantId: string,
  integrationId: string,
  eventData: CalendarEventData
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const eventId = randomUUID();

  await db.insert(calendarEvents).values({
    id: eventId,
    tenantId,
    integrationId,
    externalEventId: eventData.id,
    title: eventData.title,
    description: eventData.description || null,
    startTime: eventData.startTime,
    endTime: eventData.endTime,
    location: eventData.location || null,
    attendees: eventData.attendees || [],
    isAllDay: eventData.isAllDay || false,
    status: eventData.status || "confirmed",
    linkedContactId: null,
    linkedAccountId: null,
    linkedDealId: null,
  });

  return eventId;
}

/**
 * Get calendar events for a tenant
 */
export async function getCalendarEvents(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(calendarEvents.tenantId, tenantId)];

  if (startDate) {
    conditions.push(gte(calendarEvents.startTime, startDate));
  }

  return db
    .select()
    .from(calendarEvents)
    .where(and(...conditions))
    .orderBy(calendarEvents.startTime);
}

/**
 * Link calendar event to CRM entity
 */
export async function linkEventToEntity(
  eventId: string,
  entityType: "contact" | "account" | "deal",
  entityId: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (entityType === "contact") updateData.linkedContactId = entityId;
  if (entityType === "account") updateData.linkedAccountId = entityId;
  if (entityType === "deal") updateData.linkedDealId = entityId;

  await db
    .update(calendarEvents)
    .set(updateData)
    .where(eq(calendarEvents.id, eventId));
}

/**
 * Get user's calendar integrations
 */
export async function getUserIntegrations(tenantId: string, userId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(calendarIntegrations)
    .where(
      and(
        eq(calendarIntegrations.tenantId, tenantId),
        eq(calendarIntegrations.userId, userId)
      )
    );
}

/**
 * Create calendar integration
 */
export async function createCalendarIntegration(data: {
  tenantId: string;
  userId: string;
  provider: "google" | "outlook";
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  calendarId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const integrationId = randomUUID();

  await db.insert(calendarIntegrations).values({
    id: integrationId,
    tenantId: data.tenantId,
    userId: data.userId,
    provider: data.provider,
    accessToken: data.accessToken, // Should be encrypted in production
    refreshToken: data.refreshToken || null,
    expiresAt: data.expiresAt || null,
    calendarId: data.calendarId || null,
    isActive: true,
    lastSyncAt: null,
  });

  return integrationId;
}

/**
 * Delete calendar integration
 */
export async function deleteCalendarIntegration(integrationId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete associated events
  await db
    .delete(calendarEvents)
    .where(eq(calendarEvents.integrationId, integrationId));

  // Delete integration
  await db
    .delete(calendarIntegrations)
    .where(eq(calendarIntegrations.id, integrationId));
}

/**
 * Trigger sync for all active integrations
 */
export async function syncAllCalendars(tenantId: string) {
  const db = await getDb();
  if (!db) return { synced: 0 };

  const integrations = await db
    .select()
    .from(calendarIntegrations)
    .where(
      and(
        eq(calendarIntegrations.tenantId, tenantId),
        eq(calendarIntegrations.isActive, true)
      )
    );

  let syncedCount = 0;

  for (const integration of integrations) {
    try {
      if (integration.provider === "google") {
        await syncGoogleCalendar(integration.id);
      } else if (integration.provider === "outlook") {
        await syncOutlookCalendar(integration.id);
      }
      syncedCount++;
    } catch (error) {
      console.error(`[Calendar] Failed to sync ${integration.provider}:`, error);
    }
  }

  return { synced: syncedCount };
}
