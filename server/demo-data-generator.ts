import * as db from "./db";
import { nanoid } from "nanoid";
import { people, threads, moments, nextActions } from "../drizzle/schema";
import { eq, and, like, inArray, sql } from "drizzle-orm";

const DEMO_COMPANIES = [
  { name: "Acme Corp", domain: "acme-demo.example", industry: "Technology", employees: "50-200", revenue: "$5M-$10M" },
  { name: "Globex Corporation", domain: "globex-demo.example", industry: "Manufacturing", employees: "200-500", revenue: "$10M-$50M" },
  { name: "Initech", domain: "initech-demo.example", industry: "Software", employees: "100-200", revenue: "$5M-$10M" },
  { name: "Umbrella Corporation", domain: "umbrella-demo.example", industry: "Pharmaceuticals", employees: "500-1000", revenue: "$50M-$100M" },
  { name: "Stark Industries", domain: "stark-demo.example", industry: "Technology", employees: "1000+", revenue: "$100M+" },
  { name: "Wayne Enterprises", domain: "wayne-demo.example", industry: "Conglomerate", employees: "1000+", revenue: "$100M+" },
  { name: "Dunder Mifflin", domain: "dundermifflin-demo.example", industry: "Paper Sales", employees: "20-50", revenue: "$1M-$5M" },
  { name: "Wonka Industries", domain: "wonka-demo.example", industry: "Food & Beverage", employees: "100-500", revenue: "$10M-$50M" },
];

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Skyler", "Dakota", "Reese", "Cameron", "Parker", "Sage", "River", "Phoenix", "Rowan", "Blake", "Drew", "Finley"];
const LAST_NAMES = ["Demo", "Test", "Sample", "Example", "Placeholder", "Fictional", "Simulated", "Virtual", "Imaginary", "Hypothetical", "Pretend", "Mockup", "Prototype", "Dummy", "Faux", "Pseudo", "Synthetic", "Artificial", "Fabricated", "Invented"];
const TITLES = ["CEO", "CTO", "VP of Sales", "Head of Marketing", "Product Manager", "Engineering Manager", "Sales Director", "Marketing Director", "Operations Manager", "Business Development Manager"];

const FUNNEL_STAGES = ["prospected", "engaged", "active", "waiting", "dormant", "closedWon", "closedLost"];

const MOMENT_TYPES = ["email", "call", "meeting", "note"];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomDate(daysAgo: number): Date {
  const now = Date.now();
  const randomDays = Math.floor(Math.random() * daysAgo);
  return new Date(now - randomDays * 24 * 60 * 60 * 1000);
}

export async function generateDemoData(tenantId: string) {
  console.log("[Demo] Starting demo data generation for tenant:", tenantId);

  // Generate contacts
  const people: any[] = [];
  for (let i = 0; i < 25; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    const company = randomElement(DEMO_COMPANIES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.domain}`;
    
    const person = await db.createPerson({
      tenantId,
      fullName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      primaryEmail: email,
      secondaryEmails: [],
      companyName: company.name,
      roleTitle: randomElement(TITLES),
      manuallyAddedNumber: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
      linkedinUrl: `https://demo-linkedin.example/profile/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${nanoid(6)}`,
      tags: ["demo-data"]
    });
    
    people.push(person);
    console.log(`[Demo] Created person: ${person.fullName}`);
  }

  // Generate threads (deals)
  const threads: any[] = [];
  for (let i = 0; i < 15; i++) {
    const person = randomElement(people);
    const stage = randomElement(FUNNEL_STAGES);
    
    const thread = await db.createThread({
      tenantId,
      personId: person.id,
      source: "demo",
      intent: `${randomElement(["Partnership", "Sales", "Consulting", "Project"])} Discussion with ${person.company}`,
      title: `${randomElement(["Partnership", "Sales", "Consulting", "Project"])} Discussion with ${person.company}`,
      status: stage === "closedWon" || stage === "closedLost" ? "closed" : "active",
      dealSignal: {
        value_estimate: Math.floor(Math.random() * 100000) + 10000,
        confidence: randomElement(["low", "medium", "high"] as const),
      },
    });
    
    threads.push(thread);
    console.log(`[Demo] Created thread: ${thread.title} (${thread.status})`);
  }

  // Generate moments
  for (const thread of threads) {
    const momentCount = Math.floor(Math.random() * 5) + 2;
    
    for (let i = 0; i < momentCount; i++) {
      const type = randomElement(MOMENT_TYPES);
      const timestamp = randomDate(60);
      
      let momentType: "email_sent" | "email_received" | "reply_received" | "call_completed" | "meeting_held" | "note_added" = "note_added";
      let summary = "";
      
      switch (type) {
        case "email":
          momentType = "email_sent";
          summary = `Sent email about ${randomElement(["proposal", "follow-up", "introduction", "demo request"])}`;
          break;
        case "call":
          momentType = "call_completed";
          summary = `${randomElement(["Discovery", "Follow-up", "Demo", "Closing"])} call - Discussed ${randomElement(["requirements", "timeline", "pricing", "next steps"])}`;
          break;
        case "meeting":
          momentType = "meeting_held";
          summary = `${randomElement(["Initial", "Follow-up", "Demo", "Closing"])} meeting - Met to discuss ${randomElement(["partnership opportunities", "project scope", "implementation plan", "contract terms"])}`;
          break;
        case "note":
          momentType = "note_added";
          summary = `Note: ${randomElement(["Interested in Q2", "Budget approved", "Waiting for decision", "Strong fit"])}`;
          break;
      }
      
      await db.createMoment({
        tenantId,
        threadId: thread.id,
        personId: thread.personId,
        source: "demo",
        type: momentType,
        timestamp,
        metadata: { summary },
      });
    }
  }

  // Generate next actions
  for (const thread of threads) {
    if (["prospected", "engaged", "active", "waiting"].includes(thread.funnelStage)) {
      const daysFromNow = Math.floor(Math.random() * 14) - 7; // -7 to +7 days
      const dueAt = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
      
      await db.createNextAction({
        tenantId,
        threadId: thread.id,
        actionType: "manual",
        triggerType: "manual",
        triggerValue: `${randomElement(["Follow up on", "Schedule", "Send", "Review"])} ${randomElement(["proposal", "demo", "contract", "pricing"])}`,
        dueAt,
        status: "open",
      });
    }
  }

  console.log("[Demo] Demo data generation complete!");
  console.log(`[Demo] Created ${people.length} contacts, ${threads.length} threads, and ${threads.length * 3} moments`);
  
  return {
    peopleCount: people.length,
    threadsCount: threads.length,
    momentsCount: threads.length * 3,
  };
}

export async function clearDemoData(tenantId: string) {
  console.log("[Demo] Clearing demo data for tenant:", tenantId);
  
  // Get all demo-tagged items for counting before deletion
  const allPeople = await db.getPeopleByTenant(tenantId);
  const demoPeople = allPeople.filter((p: any) => p.tags?.includes("demo-data"));
  const allThreads = await db.getThreadsByTenant(tenantId);
  const demoThreads = allThreads.filter((t: any) => t.tags?.includes("demo-data"));
  
  console.log("[Demo] Found demo data to clear:");
  console.log(`[Demo] - ${demoPeople.length} people`);
  console.log(`[Demo] - ${demoThreads.length} threads`);
  
  // Delete demo data using direct SQL
  const database = await db.getDb();
  
  if (!database) {
    throw new Error("Database connection not available");
  }
  
  // Delete moments for demo threads
  if (demoThreads.length > 0) {
    const threadIds = demoThreads.map((t: any) => t.id);
    await database.delete(moments).where(
      and(
        eq(moments.tenantId, tenantId),
        inArray(moments.threadId, threadIds)
      )
    );
  }
  
  // Delete next actions for demo threads
  if (demoThreads.length > 0) {
    const threadIds = demoThreads.map((t: any) => t.id);
    await database.delete(nextActions).where(
      and(
        eq(nextActions.tenantId, tenantId),
        inArray(nextActions.threadId, threadIds)
      )
    );
  }
  
  // Delete demo threads (using tags JSON column - search for demo-data in array)
  if (demoThreads.length > 0) {
    const threadIds = demoThreads.map((t: any) => t.id);
    await database.delete(threads).where(
      and(
        eq(threads.tenantId, tenantId),
        inArray(threads.id, threadIds)
      )
    );
  }
  
  // Delete demo people (using source column)
  if (demoPeople.length > 0) {
    const peopleIds = demoPeople.map((p: any) => p.id);
    await database.delete(people).where(
      and(
        eq(people.tenantId, tenantId),
        inArray(people.id, peopleIds)
      )
    );
  }
  
  console.log("[Demo] Successfully cleared demo data");
  
  return {
    peopleDeleted: demoPeople.length,
    threadsDeleted: demoThreads.length,
    message: `Successfully cleared ${demoPeople.length} contacts and ${demoThreads.length} deals.`,
  };
}
