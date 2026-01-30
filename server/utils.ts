import { createHash, randomBytes, pbkdf2Sync } from "crypto";

/**
 * Hash a password using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;
  
  const verifyHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === verifyHash;
}

/**
 * Calculate business days from a date
 */
export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

/**
 * Parse trigger value to Date
 * Supports formats like "now", "now+4d", "now+4bd" (business days), ISO date strings
 */
export function parseTriggerDate(triggerValue: string): Date {
  if (triggerValue === "now") {
    return new Date();
  }
  
  const businessDayMatch = triggerValue.match(/^now\+(\d+)bd$/);
  if (businessDayMatch) {
    const days = parseInt(businessDayMatch[1]!, 10);
    return addBusinessDays(new Date(), days);
  }
  
  const dayMatch = triggerValue.match(/^now\+(\d+)d$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]!, 10);
    const result = new Date();
    result.setDate(result.getDate() + days);
    return result;
  }
  
  const hourMatch = triggerValue.match(/^now\+(\d+)h$/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]!, 10);
    const result = new Date();
    result.setHours(result.getHours() + hours);
    return result;
  }
  
  // Try parsing as ISO date
  return new Date(triggerValue);
}
