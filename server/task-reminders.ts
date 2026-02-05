import { getDb } from "./db";
import { eq, and, lte, isNull } from "drizzle-orm";
import { sendEmail } from "./email";

/**
 * Check for tasks with upcoming reminders and send notifications
 */
export async function checkAndSendReminders() {
  const db = await getDb();
  if (!db) return;

  const { tasks, users } = await import("../drizzle/schema");
  
  // Find tasks with reminders due and not yet sent
  const now = new Date();
  const tasksWithReminders = await db
    .select({
      task: tasks,
      assignedUser: users,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.assignedToId, users.id))
    .where(
      and(
        lte(tasks.reminderAt, now),
        eq(tasks.reminderSent, false),
        isNull(tasks.completedAt)
      )
    );

  for (const { task, assignedUser } of tasksWithReminders) {
    if (!assignedUser) continue;

    // Send email notification
    try {
      await sendEmail(
        assignedUser.email,
        `Task Reminder: ${task.title}`,
        `
          <h2>Task Reminder</h2>
          <p>This is a reminder for your task:</p>
          <h3>${task.title}</h3>
          ${task.description ? `<p>${task.description}</p>` : ""}
          <p><strong>Priority:</strong> ${task.priority}</p>
          ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ""}
          <p>Log in to your CRM to view and complete this task.</p>
        `
      );

      // Mark reminder as sent
      await db
        .update(tasks)
        .set({ reminderSent: true })
        .where(eq(tasks.id, task.id));

      console.log(`[Task Reminders] Sent reminder for task ${task.id} to ${assignedUser.email}`);
    } catch (error) {
      console.error(`[Task Reminders] Failed to send reminder for task ${task.id}:`, error);
    }
  }

  return tasksWithReminders.length;
}

/**
 * Get upcoming reminders for a user
 */
export async function getUpcomingReminders(userId: string, tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const { tasks } = await import("../drizzle/schema");
  
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.assignedToId, userId),
        lte(tasks.reminderAt, next7Days),
        eq(tasks.reminderSent, false),
        isNull(tasks.completedAt)
      )
    );
}
