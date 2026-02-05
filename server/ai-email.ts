import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";
import { eq } from "drizzle-orm";

/**
 * Generate email content using AI with CRM context
 */
export async function generateEmail(params: {
  tenantId: string;
  contactId?: string;
  dealId?: string;
  accountId?: string;
  purpose: string; // e.g., "cold_outreach", "follow_up", "proposal"
  tone?: string; // e.g., "professional", "casual", "friendly"
  additionalContext?: string;
  bestPracticeExamples?: string[]; // IDs of example emails to learn from
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Gather CRM context
  let context = "";
  
  // Get contact information
  if (params.contactId) {
    const { people } = await import("../drizzle/schema");
    const contact = await db.select().from(people)
      .where(eq(people.id, params.contactId))
      .limit(1);
    
    if (contact[0]) {
      context += `Contact Information:\n`;
      context += `- Name: ${contact[0].firstName} ${contact[0].lastName}\n`;
      if (contact[0].primaryEmail) context += `- Email: ${contact[0].primaryEmail}\n`;
      if (contact[0].companyName) context += `- Company: ${contact[0].companyName}\n`;
      if (contact[0].roleTitle) context += `- Title: ${contact[0].roleTitle}\n`;
      if (contact[0].industry) context += `- Industry: ${contact[0].industry}\n`;
      context += `\n`;
    }
  }

  // Get deal information
  if (params.dealId) {
    const { deals, dealStages } = await import("../drizzle/schema");
    const deal = await db.select().from(deals)
      .where(eq(deals.id, params.dealId))
      .limit(1);
    
    if (deal[0]) {
      const stage = await db.select().from(dealStages)
        .where(eq(dealStages.id, deal[0].stageId))
        .limit(1);
      
      context += `Deal Information:\n`;
      context += `- Deal Name: ${deal[0].name}\n`;
      context += `- Value: $${deal[0].value}\n`;
      if (stage[0]) context += `- Stage: ${stage[0].name}\n`;
      context += `\n`;
    }
  }

  // Get account information
  if (params.accountId) {
    const { accounts } = await import("../drizzle/schema");
    const account = await db.select().from(accounts)
      .where(eq(accounts.id, params.accountId))
      .limit(1);
    
    if (account[0]) {
      context += `Account Information:\n`;
      context += `- Company: ${account[0].name}\n`;
      if (account[0].industry) context += `- Industry: ${account[0].industry}\n`;
      if (account[0].employees) context += `- Size: ${account[0].employees} employees\n`;
      if (account[0].headquarters) context += `- Location: ${account[0].headquarters}\n`;
      context += `\n`;
    }
  }

  // Get recent notes for context
  if (params.contactId || params.dealId || params.accountId) {
    const { notes } = await import("../drizzle/schema");
    
    let entityId = params.contactId || params.dealId || params.accountId || '';
    const recentNotes = await db.select().from(notes)
      .where(eq(notes.entityId, entityId))
      .limit(5);
    
    if (recentNotes.length > 0) {
      context += `Recent Notes:\n`;
      recentNotes.forEach(note => {
        context += `- ${note.content}\n`;
      });
      context += `\n`;
    }
  }

  // Get best practice examples if provided
  let bestPracticesContext = "";
  // TODO: Implement email examples table and learning system
  // if (params.bestPracticeExamples && params.bestPracticeExamples.length > 0) {
  //   Load and include best practice examples
  // }

  // Build AI prompt
  const systemPrompt = `You are an expert email copywriter for a CRM system. Your job is to write effective, professional emails that get responses.

Key principles:
- Keep emails concise (under 150 words for cold outreach)
- Personalize based on the contact's context
- Have a clear call-to-action
- Use a ${params.tone || "professional"} tone
- Avoid generic templates - make it feel personal
- Reference specific details about the contact/company when available

${bestPracticesContext}`;

  const userPrompt = `Write an email for the following purpose: ${params.purpose}

${context}

${params.additionalContext ? `Additional Context: ${params.additionalContext}\n` : ""}

Generate a subject line and email body. Format your response as:
SUBJECT: [subject line]
BODY: [email body]`;

  // Call LLM
  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const messageContent = response.choices[0]?.message?.content;
  const content = typeof messageContent === 'string' ? messageContent : '';
  
  // Parse response
  const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);
  
  return {
    subject: subjectMatch?.[1]?.trim() || "",
    body: bodyMatch?.[1]?.trim() || content,
  };
}

/**
 * Improve an existing email draft using AI
 */
export async function improveEmail(params: {
  subject: string;
  body: string;
  improvementType: "clarity" | "tone" | "length" | "cta" | "personalization";
  targetTone?: string;
}) {
  const improvementPrompts = {
    clarity: "Make this email clearer and easier to understand. Remove jargon and simplify complex sentences.",
    tone: `Adjust the tone of this email to be more ${params.targetTone || "professional"}.`,
    length: "Make this email more concise while keeping the key points.",
    cta: "Strengthen the call-to-action in this email to make it more compelling.",
    personalization: "Make this email feel more personal and less like a template.",
  };

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert email editor. Improve the given email based on the specific request.",
      },
      {
        role: "user",
        content: `${improvementPrompts[params.improvementType]}

CURRENT EMAIL:
Subject: ${params.subject}
Body: ${params.body}

Provide the improved version in the same format:
SUBJECT: [improved subject]
BODY: [improved body]`,
      },
    ],
  });

  const messageContent = response.choices[0]?.message?.content;
  const content = typeof messageContent === 'string' ? messageContent : '';
  
  const subjectMatch = content.match(/SUBJECT:\s*(.+)/i);
  const bodyMatch = content.match(/BODY:\s*([\s\S]+)/i);
  
  return {
    subject: subjectMatch?.[1]?.trim() || params.subject,
    body: bodyMatch?.[1]?.trim() || params.body,
  };
}
