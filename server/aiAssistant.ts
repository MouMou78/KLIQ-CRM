import { invokeLLM } from "./_core/llm";
import * as db from "./db";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function queryAIAssistant(params: {
  tenantId: number;
  userId: number;
  messages: Message[];
}): Promise<string> {
  const { tenantId, userId, messages } = params;

  // Gather CRM context
  const context = await gatherCRMContext(tenantId);

  // Build system prompt with CRM context
  const systemPrompt = buildSystemPrompt(context);

  // Prepare messages for LLM
  const llmMessages: Message[] = [
    { role: "system", content: systemPrompt },
    ...messages
  ];

  // Call LLM
  const response = await invokeLLM({
    messages: llmMessages as any,
  });

  const content = response.choices[0].message.content;
  return typeof content === 'string' ? content : "I apologize, but I couldn't generate a response. Please try again.";
}

async function gatherCRMContext(tenantId: number) {
  // Fetch key CRM metrics
  const [people, threads, moments, integrations] = await Promise.all([
    db.getPeopleByTenant(String(tenantId)),
    db.getThreadsByTenant(String(tenantId)),
    db.getMomentsByTenant(String(tenantId)),
    db.getIntegrationsByTenant(String(tenantId)),
  ]);

  // Calculate funnel distribution
  const funnelStages = {
    prospected: 0,
    engaged: 0,
    active: 0,
    waiting: 0,
    dormant: 0,
    closedWon: 0,
    closedLost: 0,
  };

  threads.forEach((thread: any) => {
    const stage = thread.funnelStage || "prospected";
    if (stage in funnelStages) {
      funnelStages[stage as keyof typeof funnelStages]++;
    }
  });

  // Calculate engagement metrics
  const totalMoments = moments.length;
  const emailMoments = moments.filter((m: any) => m.type === "email").length;
  const callMoments = moments.filter((m: any) => m.type === "call").length;
  const meetingMoments = moments.filter((m: any) => m.type === "meeting").length;

  // Get recent activity
  const recentMoments = moments
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return {
    totalContacts: people.length,
    totalThreads: threads.length,
    totalMoments,
    emailMoments,
    callMoments,
    meetingMoments,
    funnelStages,
    recentMoments: recentMoments.map((m: any) => ({
      type: m.type,
      date: m.createdAt,
      summary: m.summary || m.content?.substring(0, 100),
    })),
    integrations: integrations.map((i: any) => ({
      type: i.type,
      connected: i.apiKey ? true : false,
    })),
    topContacts: people.slice(0, 10).map((p: any) => ({
      name: p.name,
      email: p.email,
      company: p.company,
      title: p.title,
    })),
  };
}

function buildSystemPrompt(context: any): string {
  return `You are an AI assistant for CRM. You help users understand their CRM data, analyze their sales funnel, and answer questions about contacts, deals, and engagement metrics.

**Current CRM Data:**

- Total Contacts: ${context.totalContacts}
- Total Threads/Deals: ${context.totalThreads}
- Total Moments (Activities): ${context.totalMoments}
  - Emails: ${context.emailMoments}
  - Calls: ${context.callMoments}
  - Meetings: ${context.meetingMoments}

**Funnel Distribution:**
- Prospected: ${context.funnelStages.prospected}
- Engaged: ${context.funnelStages.engaged}
- Active: ${context.funnelStages.active}
- Waiting: ${context.funnelStages.waiting}
- Dormant: ${context.funnelStages.dormant}
- Closed Won: ${context.funnelStages.closedWon}
- Closed Lost: ${context.funnelStages.closedLost}

**Connected Integrations:**
${context.integrations.map((i: any) => `- ${i.type}: ${i.connected ? 'Connected' : 'Not connected'}`).join('\n')}

**Recent Activity:**
${context.recentMoments.map((m: any) => `- ${m.type} on ${new Date(m.date).toLocaleDateString()}: ${m.summary}`).join('\n')}

**Top Contacts:**
${context.topContacts.map((c: any) => `- ${c.name} (${c.email}) - ${c.title} at ${c.company}`).join('\n')}

**Your Role:**
- Answer questions about the CRM data above
- Provide insights on funnel performance
- Help find specific contacts or deals
- Suggest actions to improve sales metrics
- Be concise, helpful, and data-driven

**Guidelines:**
- Always base answers on the actual data provided
- If asked about specific contacts not in the top list, acknowledge you have limited visibility
- Provide actionable insights when possible
- Use markdown formatting for clarity
- Keep responses focused and relevant`;
}
