/**
 * Compatibility layer between Manus OAuth and multi-tenant CRM
 * Maps OAuth users to tenant-based users
 */

import { getUserById, createUser, createTenant } from "./db";
import { User } from "../drizzle/schema";
import { hashPassword } from "./utils";
import { nanoid } from "nanoid";

// Map OAuth openId to CRM user
const oauthUserMap = new Map<string, string>();

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const userId = oauthUserMap.get(openId);
  if (!userId) return undefined;
  return getUserById(userId);
}

export async function upsertUser(data: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  lastSignedIn?: Date;
}): Promise<void> {
  // Check if user already exists
  let user = await getUserByOpenId(data.openId);
  
  if (!user && data.email) {
    // Create new tenant and user for OAuth login
    const tenant = await createTenant({
      name: data.name || data.email.split("@")[0] || "My Organization",
    });
    
    user = await createUser({
      tenantId: tenant.id,
      email: data.email,
      passwordHash: hashPassword(nanoid()), // Random password for OAuth users
      role: "owner",
    });
    
    oauthUserMap.set(data.openId, user.id);
  }
  
  // Update last signed in is handled by the caller if needed
}
