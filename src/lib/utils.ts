import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get user initials from full name
 * 
 * @param name - Full name of the user
 * @returns Uppercase initials (e.g., "John Doe" -> "JD")
 * 
 * @example
 * getInitials("John Doe") // "JD"
 * getInitials("Alice") // "AL"
 */
export function getInitials(name: string): string {
  const names = name.trim().split(' ')

  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }

  return name.substring(0, 2).toUpperCase()
}

/**
 * Format user role for display
 * 
 * @param role - User role enum value
 * @returns Human-readable role label
 * 
 * @example
 * formatUserRole("admin") // "Administrator"
 * formatUserRole("guest") // "Guest"
 */
export function formatUserRole(role: UserRole): string {
  const roleMap: Record<UserRole, string> = {
    guest: 'Guest',
    receptionist: 'Receptionist',
    housekeeping: 'Housekeeping',
    admin: 'Administrator'
  }

  return roleMap[role] || role
}

/**
 * Check if a user role has permission to access a specific feature
 * 
 * @param userRole - Current user's role
 * @param allowedRoles - Array of roles that have permission
 * @returns true if user has permission, false otherwise
 * 
 * @example
 * hasRolePermission("admin", ["admin", "receptionist"]) // true
 * hasRolePermission("guest", ["admin"]) // false
 */
export function hasRolePermission(userRole: UserRole | null, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}
