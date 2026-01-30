import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { hashPassword, verifyPassword, parseTriggerDate } from "./utils";
import { TRPCError } from "@trpc/server";
import { processMoment } from "./rules-engine";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    signup: publicProcedure
      .input(z.object({
        tenantName: z.string(),
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Create tenant
        const tenant = await db.createTenant({ name: input.tenantName });
        
        // Create owner user
        const user = await db.createUser({
          tenantId: tenant.id,
          email: input.email,
          passwordHash: hashPassword(input.password),
          name: input.name,
          role: "owner",
        });
        
        return { success: true, userId: user.id, tenantId: tenant.id };
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
        tenantId: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // For now, we'll need tenant ID to be provided
        // In a real app, you might look up by email across tenants or use domain
        if (!input.tenantId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Tenant ID required" });
        }
        
        const user = await db.getUserByEmail(input.tenantId, input.email);
        if (!user || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
        }
        
        return { success: true, user };
      }),
  }),
  
  home: router({
    dashboard: protectedProcedure.query(async ({ ctx }) => {
      const tenantId = ctx.user.tenantId;
      
      // Get today's actions
      const todayActions = await db.getOpenActionsByTenant(tenantId);
      
      // Get recently touched threads
      const people = await db.getPeopleByTenant(tenantId);
      
      return {
        todayActions: todayActions.slice(0, 7),
        waitingOn: todayActions.filter(a => a.actionType === "follow_up"),
        recentlyTouched: people.slice(0, 10),
      };
    }),
  }),
  
  people: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getPeopleByTenant(ctx.user.tenantId);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const person = await db.getPersonById(input.id);
        if (!person || person.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const threads = await db.getThreadsByPerson(ctx.user.tenantId, input.id);
        return { person, threads };
      }),
    
    create: protectedProcedure
      .input(z.object({
        fullName: z.string(),
        primaryEmail: z.string().email(),
        companyName: z.string().optional(),
        roleTitle: z.string().optional(),
        phone: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createPerson({
          tenantId: ctx.user.tenantId,
          ...input,
        });
      }),
  }),
  
  threads: router({
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const thread = await db.getThreadById(input.id);
        if (!thread || thread.tenantId !== ctx.user.tenantId) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        const moments = await db.getMomentsByThread(ctx.user.tenantId, input.id);
        const nextAction = await db.getOpenActionForThread(ctx.user.tenantId, input.id);
        
        return { thread, moments, nextAction };
      }),
    
    create: protectedProcedure
      .input(z.object({
        personId: z.string(),
        source: z.string(),
        intent: z.string(),
        title: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createThread({
          tenantId: ctx.user.tenantId,
          ...input,
        });
      }),
  }),
  
  moments: router({
    create: protectedProcedure
      .input(z.object({
        threadId: z.string(),
        personId: z.string(),
        type: z.enum(["note_added"]),
        content: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const moment = await db.createMoment({
          tenantId: ctx.user.tenantId,
          threadId: input.threadId,
          personId: input.personId,
          source: "manual",
          type: input.type,
          timestamp: new Date(),
          metadata: { content: input.content },
        });
        
        // Process through rules engine
        await processMoment(moment);
        
        return moment;
      }),
  }),
  
  actions: router({
    create: protectedProcedure
      .input(z.object({
        threadId: z.string(),
        actionType: z.string(),
        triggerType: z.string(),
        triggerValue: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Close existing open actions for this thread
        await db.closeOpenActionsForThread(ctx.user.tenantId, input.threadId);
        
        return db.createNextAction({
          tenantId: ctx.user.tenantId,
          ...input,
        });
      }),
    
    complete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await db.completeNextAction(input.id);
        return { success: true };
      }),
  }),
  
  events: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getEventsByTenant(ctx.user.tenantId);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input, ctx }) => {
        const events = await db.getEventsByTenant(ctx.user.tenantId);
        const event = events.find(e => e.id === input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return event;
      }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        slug: z.string(),
        startsAt: z.date().optional(),
        endsAt: z.date().optional(),
        defaultIntent: z.string().optional(),
        defaultTags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createEvent({
          tenantId: ctx.user.tenantId,
          ...input,
        });
      }),
    
    // Public endpoint for lead capture form
    getPublic: publicProcedure
      .input(z.object({ slug: z.string(), tenantId: z.string() }))
      .query(async ({ input }) => {
        const event = await db.getEventBySlug(input.tenantId, input.slug);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        return event;
      }),
    
    submitLead: publicProcedure
      .input(z.object({
        slug: z.string(),
        tenantId: z.string(),
        formData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ input }) => {
        const event = await db.getEventBySlug(input.tenantId, input.slug);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        
        // Extract person data from form
        const { full_name, email, company_name, role_title, phone, notes, ...rest } = input.formData;
        
        if (!email || !full_name) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Name and email required" });
        }
        
        // Upsert person
        const person = await db.upsertPerson(input.tenantId, email as string, {
          fullName: full_name as string,
          companyName: company_name as string | undefined,
          roleTitle: role_title as string | undefined,
          phone: phone as string | undefined,
          tags: [...(event.defaultTags || [])],
        });
        
        // Create or find thread
        const existingThreads = await db.getThreadsByPerson(input.tenantId, person.id);
        const eventThread = existingThreads.find(t => t.title === `Event: ${event.name}`);
        
        const thread = eventThread || await db.createThread({
          tenantId: input.tenantId,
          personId: person.id,
          source: "manual",
          intent: event.defaultIntent,
          title: `Event: ${event.name}`,
        });
        
        // Create moment
        await db.createMoment({
          tenantId: input.tenantId,
          threadId: thread.id,
          personId: person.id,
          source: "manual",
          type: "lead_captured",
          timestamp: new Date(),
          metadata: { eventId: event.id, notes, ...rest },
        });
        
        // Create next action
        await db.createNextAction({
          tenantId: input.tenantId,
          threadId: thread.id,
          actionType: "follow_up",
          triggerType: "date",
          triggerValue: "now+1d",
        });
        
        return { success: true };
      }),
  }),
  
  integrations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getIntegrationsByTenant(ctx.user.tenantId);
    }),
    
    connectGoogle: protectedProcedure.mutation(async ({ ctx }) => {
      // Placeholder for Google OAuth flow
      // TODO: Implement Google OAuth flow
      throw new TRPCError({ code: "NOT_IMPLEMENTED", message: "Google OAuth not yet implemented" });
    }),
    
    connectAmplemarket: protectedProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertIntegration(ctx.user.tenantId, "amplemarket", {
          status: "connected",
          config: { apiKey: input.apiKey },
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
