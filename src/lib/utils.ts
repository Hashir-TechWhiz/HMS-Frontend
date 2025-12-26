import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

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

/**
 * Format date and time for display with Asia/Colombo timezone
 * 
 * @param dateString - Date string or null to format
 * @param options - Optional configuration
 * @param options.hideTime - If true, only show date without time (default: true)
 * @param options.format - Custom date format string (default: "MMM dd, yyyy")
 * @returns Formatted date string or "—" for invalid/empty dates
 * 
 * @example
 * formatDateTime("2024-01-15T10:30:00Z") // "Jan 15, 2024"
 * formatDateTime("2024-01-15T10:30:00Z", { hideTime: false }) // "Jan 15, 2024, 10:30 AM"
 * formatDateTime(null) // "—"
 * formatDateTime("invalid") // "—"
 */
export function formatDateTime(
  dateString: string | null | undefined,
  options?: { hideTime?: boolean; format?: string }
): string {
  // Fallback symbol for invalid or empty dates
  const FALLBACK = "—";

  if (!dateString) {
    return FALLBACK;
  }

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return FALLBACK;
    }

    // If custom format is provided, use date-fns with timezone conversion
    if (options?.format) {
      // Get date parts in Asia/Colombo timezone
      const colomboParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Colombo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(date);

      // Extract parts
      const year = parseInt(colomboParts.find(p => p.type === "year")?.value || "0");
      const month = parseInt(colomboParts.find(p => p.type === "month")?.value || "1") - 1; // 0-indexed
      const day = parseInt(colomboParts.find(p => p.type === "day")?.value || "1");
      const hour = parseInt(colomboParts.find(p => p.type === "hour")?.value || "0");
      const minute = parseInt(colomboParts.find(p => p.type === "minute")?.value || "0");
      const second = parseInt(colomboParts.find(p => p.type === "second")?.value || "0");

      // Create date object with Colombo timezone values (in local timezone)
      const colomboDate = new Date(year, month, day, hour, minute, second);
      return format(colomboDate, options.format);
    }

    // Default formatting with Asia/Colombo timezone
    const hideTime = options?.hideTime !== false; // Default to true

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "short",
      day: "2-digit",
      ...(hideTime === false && {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    });

    return formatter.format(date);
  } catch {
    return FALLBACK;
  }
}


/**
 * normalizeDateRange()
 * ----------------------------------------------
 * Takes a DateRange object and returns:
 * { from: ISO string | "", to: ISO string | "" }
 *
 * - Ensures start-of-day for `from`
 * - Ensures end-of-day for `to`
 * - Prevents timezone shift issues
 */
export function normalizeDateRange(range?: { from?: Date; to?: Date }) {
  if (!range) {
    return { from: "", to: "" };
  }

  let from = "";
  let to = "";

  if (range.from instanceof Date && !isNaN(range.from.getTime())) {
    const start = new Date(range.from);
    start.setHours(0, 0, 0, 0);
    from = start.toISOString();
  }

  if (range.to instanceof Date && !isNaN(range.to.getTime())) {
    const end = new Date(range.to);
    end.setHours(23, 59, 59, 999);
    to = end.toISOString();
  }

  return { from, to };
}


