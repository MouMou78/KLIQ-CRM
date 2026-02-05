import { TRPCError } from "@trpc/server";

export type UserRole = "owner" | "admin" | "manager" | "sales" | "operations" | "collaborator" | "restricted" | "user";

/**
 * Check if user has permission to delete records
 * Only admins and owners can delete
 */
export function canDelete(userRole: string): boolean {
  return userRole === "admin" || userRole === "owner";
}

/**
 * Check if user has permission to manage users (create, update, delete users)
 * Only owners can manage users
 */
export function canManageUsers(userRole: string): boolean {
  return userRole === "owner";
}

/**
 * Check if user has permission to manage settings
 * Owners and admins can manage settings
 */
export function canManageSettings(userRole: string): boolean {
  return userRole === "admin" || userRole === "owner";
}

/**
 * Check if user has permission to view reports
 * All roles except restricted can view reports
 */
export function canViewReports(userRole: string): boolean {
  return userRole !== "restricted";
}

/**
 * Check if user has permission to export data
 * Managers, admins, and owners can export data
 */
export function canExportData(userRole: string): boolean {
  return userRole === "manager" || userRole === "admin" || userRole === "owner";
}

/**
 * Throw error if user doesn't have delete permission
 */
export function requireDeletePermission(userRole: string) {
  if (!canDelete(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to delete records. Only administrators and owners can delete data.",
    });
  }
}

/**
 * Throw error if user doesn't have user management permission
 */
export function requireUserManagementPermission(userRole: string) {
  if (!canManageUsers(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage users. Only owners can manage user accounts.",
    });
  }
}

/**
 * Throw error if user doesn't have settings management permission
 */
export function requireSettingsPermission(userRole: string) {
  if (!canManageSettings(userRole)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to manage settings. Only administrators and owners can modify settings.",
    });
  }
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: string): string {
  const roleNames: Record<string, string> = {
    owner: "Owner",
    admin: "Administrator",
    manager: "Manager",
    sales: "Sales",
    operations: "Operations",
    collaborator: "Collaborator",
    restricted: "Restricted",
    user: "User",
  };
  return roleNames[role] || "User";
}
