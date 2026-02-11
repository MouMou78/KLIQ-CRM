import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { format, addMinutes, parse, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";

const DEMO_DURATION = 30; // minutes
const BUFFER_TIME = 5; // minutes
const WORKING_HOURS_START = 9; // 9 AM
const WORKING_HOURS_END = 17; // 5 PM

// Generate time slots for a given date
function generateTimeSlots(date: Date): string[] {
  const slots: string[] = [];
  const startTime = new Date(date);
  startTime.setHours(WORKING_HOURS_START, 0, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(WORKING_HOURS_END, 0, 0, 0);
  
  let currentTime = startTime;
  
  while (currentTime < endTime) {
    slots.push(format(currentTime, "HH:mm"));
    currentTime = addMinutes(currentTime, DEMO_DURATION + BUFFER_TIME); // 30 min demo + 5 min buffer
  }
  
  return slots;
}

// Check if a time slot conflicts with existing bookings
function isSlotAvailable(
  slot: string,
  date: Date,
  existingBookings: Array<{ startTime: Date; endTime: Date }>
): boolean {
  const [hours, minutes] = slot.split(":").map(Number);
  const slotStart = new Date(date);
  slotStart.setHours(hours, minutes, 0, 0);
  
  const slotEnd = addMinutes(slotStart, DEMO_DURATION + BUFFER_TIME);
  
  for (const booking of existingBookings) {
    // Check if slot overlaps with existing booking
    if (
      (slotStart >= booking.startTime && slotStart < booking.endTime) ||
      (slotEnd > booking.startTime && slotEnd <= booking.endTime) ||
      (slotStart <= booking.startTime && slotEnd >= booking.endTime)
    ) {
      return false;
    }
  }
  
  return true;
}

export const calendarRouter = router({
  // Get availability for a specific manager on a specific date
  getAvailability: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        date: z.date(),
      })
    )
    .query(async ({ input }) => {
      const { userId, date } = input;
      
      // Get all events for this manager on this date
      const events = await db.getEventsByUserAndDate(userId, date);
      
      // Convert events to booking time ranges
      const existingBookings = events.map((event) => ({
        startTime: event.startTime,
        endTime: event.endTime,
      }));
      
      // Generate all possible time slots
      const allSlots = generateTimeSlots(date);
      
      // Filter out unavailable slots
      const availableSlots = allSlots.filter((slot) =>
        isSlotAvailable(slot, date, existingBookings)
      );
      
      return availableSlots;
    }),

  // Book a demo
  bookDemo: protectedProcedure
    .input(
      z.object({
        managerId: z.number(),
        date: z.date(),
        time: z.string(), // Format: "HH:mm"
        duration: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { managerId, date, time, duration } = input;
      
      // Parse the time
      const [hours, minutes] = time.split(":").map(Number);
      const startTime = new Date(date);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = addMinutes(startTime, duration);
      
      // Get manager details
      const manager = await db.getUserById(managerId.toString());
      if (!manager) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sales manager not found",
        });
      }
      
      // Generate Google Meet link (simplified - in production, use Google Calendar API)
      const meetingId = Math.random().toString(36).substring(2, 15);
      const meetLink = `https://meet.google.com/${meetingId}`;
      
      // Create the event in the database
      const event = await db.createEvent({
        title: `Demo Call - ${ctx.user?.name || "SDR"}`,
        description: `Demo call booked via CRM\n\nGoogle Meet: ${meetLink}`,
        startTime,
        endTime,
        location: meetLink,
        userId: managerId.toString(),
        tenantId: ctx.user?.tenantId || 'default',
        slug: `demo-${meetingId}`,
        createdAt: new Date(),
      });
      
      // In production, you would also:
      // 1. Create event in Google Calendar via API
      // 2. Send email notifications to both parties
      // 3. Add to both calendars
      
      return {
        success: true,
        eventId: event.id,
        meetLink,
        startTime,
        endTime,
      };
    }),
});
