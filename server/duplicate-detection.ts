import { getDb } from "./db";
import { people, accounts, deals, marketingCampaigns } from "../drizzle/schema";
import { and, eq, or, sql } from "drizzle-orm";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingRecordId?: string;
  existingRecordName?: string;
  reason?: string;
}

/**
 * Check for duplicate person/contact
 * Matches on: email (exact) OR (firstName + lastName + accountId)
 */
export async function checkDuplicatePerson(
  tenantId: string,
  email: string | null,
  firstName: string | null,
  lastName: string | null,
  accountId: string | null,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const db = await getDb();
  if (!db) return { isDuplicate: false };

  const conditions: any[] = [eq(people.tenantId, tenantId)];
  
  if (excludeId) {
    conditions.push(sql`${people.id} != ${excludeId}`);
  }

  // Check email match
  if (email) {
    const emailMatch = await db
      .select()
      .from(people)
      .where(and(...conditions, eq(people.primaryEmail, email)))
      .limit(1);

    if (emailMatch.length > 0) {
      return {
        isDuplicate: true,
        existingRecordId: emailMatch[0].id,
        existingRecordName: emailMatch[0].fullName || emailMatch[0].primaryEmail || "Unknown",
        reason: `A contact with email "${email}" already exists.`
      };
    }
  }

  // Check name + account match
  if (firstName && lastName && accountId) {
    const nameMatch = await db
      .select()
      .from(people)
      .where(
        and(
          ...conditions,
          eq(people.firstName, firstName),
          eq(people.lastName, lastName),
          eq(people.accountId, accountId)
        )
      )
      .limit(1);

    if (nameMatch.length > 0) {
      return {
        isDuplicate: true,
        existingRecordId: nameMatch[0].id,
        existingRecordName: nameMatch[0].fullName || `${firstName} ${lastName}`,
        reason: `A contact named "${firstName} ${lastName}" already exists at this account.`
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate account
 * Matches on: domain (exact) OR name (case-insensitive)
 */
export async function checkDuplicateAccount(
  tenantId: string,
  name: string,
  domain: string | null,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const db = await getDb();
  if (!db) return { isDuplicate: false };

  const conditions: any[] = [eq(accounts.tenantId, tenantId)];
  
  if (excludeId) {
    conditions.push(sql`${accounts.id} != ${excludeId}`);
  }

  // Check domain match
  if (domain) {
    const domainMatch = await db
      .select()
      .from(accounts)
      .where(and(...conditions, eq(accounts.domain, domain)))
      .limit(1);

    if (domainMatch.length > 0) {
      return {
        isDuplicate: true,
        existingRecordId: domainMatch[0].id,
        existingRecordName: domainMatch[0].name,
        reason: `An account with domain "${domain}" already exists.`
      };
    }
  }

  // Check name match (case-insensitive)
  const nameMatch = await db
    .select()
    .from(accounts)
    .where(and(...conditions, sql`LOWER(${accounts.name}) = LOWER(${name})`))
    .limit(1);

  if (nameMatch.length > 0) {
    return {
      isDuplicate: true,
      existingRecordId: nameMatch[0].id,
      existingRecordName: nameMatch[0].name,
      reason: `An account named "${name}" already exists.`
    };
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate deal
 * Matches on: name + accountId (to prevent duplicate deals for same account)
 */
export async function checkDuplicateDeal(
  tenantId: string,
  name: string,
  accountId: string | null,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const db = await getDb();
  if (!db) return { isDuplicate: false };

  const conditions: any[] = [eq(deals.tenantId, tenantId)];
  
  if (excludeId) {
    conditions.push(sql`${deals.id} != ${excludeId}`);
  }

  if (accountId) {
    const match = await db
      .select()
      .from(deals)
      .where(
        and(
          ...conditions,
          sql`LOWER(${deals.name}) = LOWER(${name})`,
          eq(deals.accountId, accountId)
        )
      )
      .limit(1);

    if (match.length > 0) {
      return {
        isDuplicate: true,
        existingRecordId: match[0].id,
        existingRecordName: match[0].name,
        reason: `A deal named "${name}" already exists for this account.`
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Check for duplicate campaign
 * Matches on: name (case-insensitive within tenant)
 */
export async function checkDuplicateCampaign(
  tenantId: string,
  name: string,
  excludeId?: string
): Promise<DuplicateCheckResult> {
  const db = await getDb();
  if (!db) return { isDuplicate: false };

  const conditions: any[] = [eq(marketingCampaigns.tenantId, tenantId)];
  
  if (excludeId) {
    conditions.push(sql`${marketingCampaigns.id} != ${excludeId}`);
  }

  const match = await db
    .select()
    .from(marketingCampaigns)
    .where(and(...conditions, sql`LOWER(${marketingCampaigns.name}) = LOWER(${name})`))
    .limit(1);

  if (match.length > 0) {
    return {
      isDuplicate: true,
      existingRecordId: match[0].id,
      existingRecordName: match[0].name,
      reason: `A campaign named "${name}" already exists.`
    };
  }

  return { isDuplicate: false };
}
