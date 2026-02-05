import { getDb } from "./db";
import { tasks } from "../drizzle/schema";
import { eq, and, desc, asc, or, isNull } from "drizzle-orm";

export async function createTask(data: {
  tenantId: string;
  title: string;
  description?: string;
  status?: "todo" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  assignedToId?: string;
  createdById: string;
  linkedEntityType?: "deal" | "contact" | "account";
  linkedEntityId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await db.insert(tasks).values({
    id,
    ...data,
  });

  return id;
}

export async function getTasksByTenant(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(tasks)
    .where(eq(tasks.tenantId, tenantId))
    .orderBy(desc(tasks.createdAt));
}

export async function getTasksByAssignee(tenantId: string, assignedToId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.assignedToId, assignedToId)
      )
    )
    .orderBy(asc(tasks.dueDate));
}

export async function getTasksByEntity(
  tenantId: string,
  entityType: "deal" | "contact" | "account",
  entityId: string
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        eq(tasks.linkedEntityType, entityType),
        eq(tasks.linkedEntityId, entityId)
      )
    )
    .orderBy(desc(tasks.createdAt));
}

export async function getOverdueTasks(tenantId: string) {
  const db = await getDb();
  if (!db) return [];

  const now = new Date();

  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.tenantId, tenantId),
        or(
          eq(tasks.status, "todo"),
          eq(tasks.status, "in_progress")
        )
      )
    )
    .orderBy(asc(tasks.dueDate));
}

export async function updateTask(
  taskId: string,
  data: Partial<{
    title: string;
    description: string;
    status: "todo" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: Date;
    assignedToId: string;
    completedAt: Date;
    reminderAt: Date;
    reminderSent: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tasks)
    .set(data)
    .where(eq(tasks.id, taskId));

  return true;
}

export async function deleteTask(taskId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(tasks)
    .where(eq(tasks.id, taskId));

  return true;
}

export async function completeTask(taskId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(tasks)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  return true;
}
