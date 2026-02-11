import * as db from "./db";
import { TRPCError } from "@trpc/server";

export async function mergeAccounts(
  sourceAccountId: string,
  targetAccountId: string,
  mergedFields: Record<string, any>,
  tenantId: string
) {
  // Verify both accounts exist and belong to the tenant
  const sourceAccount = await db.getAccountById(sourceAccountId);
  const targetAccount = await db.getAccountById(targetAccountId);

  if (!sourceAccount || !targetAccount) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "One or both accounts not found",
    });
  }

  if (sourceAccount.tenantId !== tenantId || targetAccount.tenantId !== tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cannot merge accounts from different tenants",
    });
  }

  // Update target account with merged fields
  await db.updateAccount(targetAccountId, mergedFields);

  // Transfer all contacts from source to target
  const contacts = await db.getContactsByAccount(sourceAccountId);
  for (const contact of contacts) {
    await db.updateContact(contact.id, { accountId: targetAccountId });
  }

  // Transfer all deals from source to target
  const deals = await db.getDealsByAccount(sourceAccountId);
  for (const deal of deals) {
    await db.updateDeal(deal.id, { accountId: targetAccountId });
  }

  // Delete the source account
  await db.deleteAccount(sourceAccountId);

  return {
    success: true,
    mergedAccountId: targetAccountId,
    transferredContacts: contacts.length,
    transferredDeals: deals.length,
  };
}
