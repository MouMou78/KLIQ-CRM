// db is passed as parameter
import { accounts, people, integrations, amplemarketSyncLogs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";

/**
 * Sync Amplemarket leads directly from /lead-lists without /contacts hydration.
 * 
 * CRITICAL: Amplemarket does NOT expose a contact API for all leads.
 * /contacts endpoint requires specific contact IDs that are not available in /lead-lists payloads.
 * Therefore, we sync contacts directly from lead data as the canonical source.
 */
export async function syncAmplemarketFromLeads(
  db: any,
  tenantId: string,
  integrationId: string,
  apiKey: string,
  amplemarketUserEmail: string,
  selectedListIds: string[] = [],
  syncScope: string = 'all_user_contacts'
) {
  const correlationId = nanoid(10);
  console.log(`[Amplemarket Sync] Correlation ID: ${correlationId}`);
  console.log(`[Amplemarket Sync] Mode: ${syncScope}`);
  console.log(`[Amplemarket Sync] Selected owner: ${amplemarketUserEmail}`);
  console.log("[Amplemarket Sync] NOTE: Syncing directly from lead payloads (Amplemarket does not expose contact API for all leads)");
  
  // Validation
  if (syncScope === 'lists' && selectedListIds.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: "No lists selected for sync. Please select at least one list or switch to 'All leads for selected user' mode."
    });
  }
  
  // Helper functions
  const extractOwnerEmail = (record: any): string | null => {
    if (!record.owner) return null;
    if (typeof record.owner === 'string') return record.owner;
    if (typeof record.owner === 'object' && record.owner.email) return record.owner.email;
    return null;
  };
  
  const normalizeEmail = (email: string | null): string | null => {
    if (!email) return null;
    return email.toLowerCase().trim();
  };
  
  const normalizedSelectedEmail = normalizeEmail(amplemarketUserEmail);
  
  // Counters
  let listsScanned = 0;
  let leadsProcessedTotal = 0;
  let leadsWithOwnerField = 0;
  let leadsMatchingOwner = 0;
  let leadsWrongOwner = 0;
  let leadsSkipped = 0;
  let contactsCreated = 0;
  let contactsUpdated = 0;
  
  const { createAmplemarketClient } = await import('./amplemarketClient');
  const client = createAmplemarketClient(apiKey);
  
  // Get lists to process
  let listsToProcess: any[] = [];
  
  if (syncScope === 'all_user_contacts') {
    console.log("[Amplemarket Sync] Fetching all lead lists...");
    const listsResponse = await client.getLists();
    listsToProcess = listsResponse.lead_lists || [];
    console.log(`[Amplemarket Sync] Found ${listsToProcess.length} lead lists`);
  } else if (syncScope === 'lists') {
    console.log(`[Amplemarket Sync] Using ${selectedListIds.length} selected lists`);
    // Fetch each selected list
    for (const listId of selectedListIds) {
      try {
        const listsResponse = await client.getLists();
        const allLists = listsResponse.lead_lists || [];
        const selectedList = allLists.find((l: any) => l.id === listId);
        if (selectedList) {
          listsToProcess.push(selectedList);
        }
      } catch (error: any) {
        console.error(`[Amplemarket Sync] Error fetching list ${listId}:`, error.message);
      }
    }
  }
  
  // Process each list
  for (const list of listsToProcess) {
    listsScanned++;
    console.log(`[Amplemarket Sync] Processing list: ${list.name} (${list.id})`);
    
    try {
      const listDetailResponse = await client.getListById(list.id);
      const leads = listDetailResponse.leads || [];
      console.log(`[Amplemarket Sync] Fetched ${leads.length} leads from list`);
      
      // Process each lead directly
      for (const lead of leads) {
        leadsProcessedTotal++;
        
        try {
          // Skip if no email
          if (!lead.email) {
            leadsSkipped++;
            continue;
          }
          
          // Extract and normalize owner
          const leadOwnerEmail = extractOwnerEmail(lead);
          const normalizedLeadOwner = normalizeEmail(leadOwnerEmail);
          
          if (!leadOwnerEmail) {
            leadsSkipped++;
            continue;
          }
          
          leadsWithOwnerField++;
          
          // Filter by owner
          if (normalizedLeadOwner !== normalizedSelectedEmail) {
            leadsWrongOwner++;
            continue;
          }
          
          leadsMatchingOwner++;
          
          // Check if person already exists by email
          const [existingPerson] = await db
            .select()
            .from(people)
            .where(and(
              eq(people.tenantId, tenantId),
              eq(people.primaryEmail, lead.email)
            ))
            .limit(1);
          
          // Create or update account from lead company data
          let accountId = null;
          if (lead.company_name) {
            const [existingAccount] = await db
              .select()
              .from(accounts)
              .where(and(
                eq(accounts.tenantId, tenantId),
                eq(accounts.name, lead.company_name)
              ))
              .limit(1);
            
            if (existingAccount) {
              accountId = existingAccount.id;
            } else {
              const [newAccount] = await db
                .insert(accounts)
                .values({
                  id: nanoid(),
                  tenantId,
                  name: lead.company_name,
                  domain: lead.company_domain || null,
                  industry: lead.industry || null,
                })
                .returning();
              accountId = newAccount.id;
            }
          }
          
          const personData = {
            accountId,
            fullName: `${lead.first_name || ""} ${lead.last_name || ""}`.trim() || lead.email,
            firstName: lead.first_name,
            lastName: lead.last_name,
            primaryEmail: lead.email,
            companyName: lead.company_name,
            companyDomain: lead.company_domain,
            roleTitle: lead.title,
            phone: lead.phone_numbers?.[0]?.number || null,
            linkedinUrl: lead.linkedin_url,
            industry: lead.industry,
            // Source attribution
            tags: JSON.stringify({
              source: 'amplemarket',
              source_type: 'lead',
              amplemarket_lead_id: lead.id,
              amplemarket_owner: leadOwnerEmail,
              synced_at: new Date().toISOString(),
            }),
          };
          
          if (existingPerson) {
            // Update existing person
            await db
              .update(people)
              .set({
                ...personData,
                updatedAt: new Date(),
              })
              .where(eq(people.id, existingPerson.id));
            contactsUpdated++;
          } else {
            // Create new person
            await db
              .insert(people)
              .values({
                id: nanoid(),
                tenantId,
                ...personData,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            contactsCreated++;
          }
        } catch (error: any) {
          console.error(`[Amplemarket Sync] Error processing lead ${lead.id}:`, error.message);
          leadsSkipped++;
        }
      }
    } catch (error: any) {
      console.error(`[Amplemarket Sync] Error fetching list ${list.id}:`, error.message);
    }
  }
  
  // Summary
  console.log("[Amplemarket Sync] ===== SYNC COMPLETE =====");
  console.log(`Lists scanned: ${listsScanned}`);
  console.log(`Leads processed: ${leadsProcessedTotal}`);
  console.log(`Leads with owner field: ${leadsWithOwnerField}`);
  console.log(`Leads matching owner: ${leadsMatchingOwner}`);
  console.log(`Leads wrong owner: ${leadsWrongOwner}`);
  console.log(`Leads skipped: ${leadsSkipped}`);
  console.log(`Contacts created: ${contactsCreated}`);
  console.log(`Contacts updated: ${contactsUpdated}`);
  console.log("[Amplemarket Sync] ===== END SYNC =====");
  
  // Guardrail: Fail if zero contacts synced
  if (leadsMatchingOwner > 0 && contactsCreated === 0 && contactsUpdated === 0) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Sync failed: ${leadsMatchingOwner} leads matched owner but 0 contacts created/updated. This indicates a database or mapping issue.`
    });
  }
  
  return {
    correlationId,
    mode: syncScope,
    selected_owner: amplemarketUserEmail,
    lists_scanned: listsScanned,
    leads_processed_total: leadsProcessedTotal,
    leads_with_owner_field: leadsWithOwnerField,
    leads_matching_owner: leadsMatchingOwner,
    leads_wrong_owner: leadsWrongOwner,
    leads_skipped: leadsSkipped,
    contacts_created: contactsCreated,
    contacts_updated: contactsUpdated,
    // Legacy fields
    createdCount: contactsCreated,
    updatedCount: contactsUpdated,
    skippedCount: leadsSkipped,
  };
}
