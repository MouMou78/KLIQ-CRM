# ⚠️ CRITICAL: Amplemarket /contacts Hydration Guardrail

## DO NOT IMPLEMENT /contacts HYDRATION

**Amplemarket API Limitation:** The `/contacts` endpoint requires specific contact IDs that are **NOT available** in `/lead-lists` responses.

## What We Tried

1. **Attempted two-step fetch:**
   - Step 1: Fetch lead IDs from `/lead-lists/{id}`
   - Step 2: Hydrate via `/contacts?ids[]=...`

2. **Result:** `/contacts` returned 0 contacts despite correct:
   - Batch size (20 max)
   - ids[] serialization (`ids[]=1&ids[]=2&ids[]=3`)
   - Request format

3. **Root cause:** `/lead-lists/{id}` returns **lead IDs**, not **contact IDs**. The `/contacts` endpoint rejects lead IDs silently (returns empty array, no error).

## Correct Implementation

**Sync contacts directly from lead payloads** without hydration:

```typescript
// ✅ CORRECT: Process leads directly
for (const lead of leads) {
  // Extract owner, filter, upsert to CRM
  const contact = {
    email: lead.email,
    name: `${lead.first_name} ${lead.last_name}`,
    company: lead.company_name,
    title: lead.title,
    owner: lead.owner,
    source: 'amplemarket',
    source_type: 'lead',
    amplemarket_lead_id: lead.id
  };
  // Upsert to database
}
```

```typescript
// ❌ WRONG: Do NOT attempt hydration
const contactIds = leads.map(l => l.id); // These are LEAD IDs, not CONTACT IDs
const contacts = await client.getContacts(contactIds); // Returns empty array
```

## If Someone Tries to Re-implement Hydration

**STOP.** Read this file first, then:

1. Verify Amplemarket API documentation confirms a workspace-wide contact listing endpoint exists
2. Prove that endpoint returns contact IDs that `/contacts` accepts
3. Test with ONE ID first: `GET /contacts/{id}` must return valid contact
4. Only then implement batching

## Reference

- Implementation: `server/amplemarketSyncFromLeads.ts`
- Guardrail added: 2026-02-06
- Context: After extensive debugging proving `/contacts` hydration is impossible with current Amplemarket API
