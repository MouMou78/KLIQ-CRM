import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { people } from "../drizzle/schema";

export async function updatePersonRole(personId: string, buyingRole: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(people)
    .set({ buyingRole })
    .where(eq(people.id, personId));
}
