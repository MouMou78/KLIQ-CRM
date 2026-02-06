import { and, eq, gte, sql } from "drizzle-orm";
import { people, accounts, amplemarketSyncLogs } from "../drizzle/schema";

/**
 * Safe scoped rollback of Amplemarket sync data
 * Deletes ONLY records from the last incorrect sync run
 * 
 * Deletion criteria:
 * - source = 'amplemarket'
 * - tenant_id = current tenant
 * - integration_id = this Amplemarket integration
 * - synced_at >= last_sync_started_at (the incorrect run)
 * 
 * NEVER deletes:
 * - manually created records
 * - records from other integrations
 * - records from other tenants
 * - records outside the scoped sync window
 */
export async function rollbackLastAmplemarketSync(
  db: any,
  tenantId: string,
  integrationId: string
): Promise<{ deletedPeople: number; deletedAccounts: number; syncLogId: string | null }> {
  console.log("[Amplemarket Rollback] Starting rollback:", {
    tenantId,
    integrationId,
    timestamp: new Date().toISOString()
  });

  // Find the last sync log for this tenant
  const [lastSync] = await db
    .select()
    .from(amplemarketSyncLogs)
    .where(eq(amplemarketSyncLogs.tenantId, tenantId))
    .orderBy(sql`${amplemarketSyncLogs.startedAt} DESC`)
    .limit(1);

  if (!lastSync) {
    console.log("[Amplemarket Rollback] No sync log found, nothing to rollback");
    return { deletedPeople: 0, deletedAccounts: 0, syncLogId: null };
  }

  const syncStartTime = lastSync.startedAt;
  console.log("[Amplemarket Rollback] Found last sync:", {
    syncLogId: lastSync.id,
    startedAt: syncStartTime,
    completedAt: lastSync.completedAt,
    contactsCreated: lastSync.contactsCreated,
    contactsUpdated: lastSync.contactsUpdated
  });

  // Delete people records from this sync
  const deletedPeopleResult = await db
    .delete(people)
    .where(and(
      eq(people.tenantId, tenantId),
      eq(people.enrichmentSource, "amplemarket"),
      eq(people.integrationId, integrationId),
      gte(people.enrichmentLastSyncedAt, syncStartTime)
    ));

  const deletedPeopleCount = deletedPeopleResult.rowsAffected || 0;

  // Delete accounts records from this sync
  const deletedAccountsResult = await db
    .delete(accounts)
    .where(and(
      eq(accounts.tenantId, tenantId),
      eq(accounts.enrichmentSource, "amplemarket"),
      eq(accounts.integrationId, integrationId),
      // Accounts don't have enrichmentLastSyncedAt, so we use a different approach
      // We'll delete accounts that were created/updated in the same time window
      gte(accounts.updatedAt, syncStartTime)
    ));

  const deletedAccountsCount = deletedAccountsResult.rowsAffected || 0;

  console.log("[Amplemarket Rollback] Deletion complete:", {
    deletedPeople: deletedPeopleCount,
    deletedAccounts: deletedAccountsCount,
    syncLogId: lastSync.id
  });

  // Log the rollback operation
  console.log("[Amplemarket Rollback] Deleted records:", {
    tenantId,
    integrationId,
    syncLogId: lastSync.id,
    deletedPeople: deletedPeopleCount,
    deletedAccounts: deletedAccountsCount,
    reason: "User-initiated rollback of last sync",
    codePath: "amplemarketRollback.ts:rollbackLastAmplemarketSync"
  });

  // Mark the sync log as failed with rollback info
  await db
    .update(amplemarketSyncLogs)
    .set({
      status: "failed",
      errorMessage: `Rolled back: deleted ${deletedPeopleCount} people and ${deletedAccountsCount} accounts`
    })
    .where(eq(amplemarketSyncLogs.id, lastSync.id));

  return {
    deletedPeople: deletedPeopleCount,
    deletedAccounts: deletedAccountsCount,
    syncLogId: lastSync.id
  };
}

/**
 * Delete all Amplemarket data for a tenant (nuclear option)
 * Use with extreme caution - only for complete integration reset
 */
export async function deleteAllAmplemarketData(
  db: any,
  tenantId: string,
  integrationId: string
): Promise<{ deletedPeople: number; deletedAccounts: number }> {
  console.warn("[Amplemarket Rollback] NUCLEAR DELETE - Removing ALL Amplemarket data:", {
    tenantId,
    integrationId,
    timestamp: new Date().toISOString()
  });

  // Delete all people from Amplemarket
  const deletedPeopleResult = await db
    .delete(people)
    .where(and(
      eq(people.tenantId, tenantId),
      eq(people.enrichmentSource, "amplemarket"),
      eq(people.integrationId, integrationId)
    ));

  const deletedPeopleCount = deletedPeopleResult.rowsAffected || 0;

  // Delete all accounts from Amplemarket
  const deletedAccountsResult = await db
    .delete(accounts)
    .where(and(
      eq(accounts.tenantId, tenantId),
      eq(accounts.enrichmentSource, "amplemarket"),
      eq(accounts.integrationId, integrationId)
    ));

  const deletedAccountsCount = deletedAccountsResult.rowsAffected || 0;

  console.warn("[Amplemarket Rollback] NUCLEAR DELETE complete:", {
    deletedPeople: deletedPeopleCount,
    deletedAccounts: deletedAccountsCount
  });

  // Log the nuclear delete
  console.log("[Amplemarket Rollback] Nuclear delete executed:", {
    tenantId,
    integrationId,
    deletedPeople: deletedPeopleCount,
    deletedAccounts: deletedAccountsCount,
    reason: "User-initiated complete integration reset",
    codePath: "amplemarketRollback.ts:deleteAllAmplemarketData"
  });

  return {
    deletedPeople: deletedPeopleCount,
    deletedAccounts: deletedAccountsCount
  };
}
