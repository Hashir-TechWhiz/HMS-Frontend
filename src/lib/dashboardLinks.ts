import { getAllowedRoles } from "./auth/permissions";

/**
 * Dashboard Navigation Links
 * 
 * Aligned with backend API capabilities and role-based access control.
 * Each link includes a `roles` array indicating which user roles can access it.
 * 
 * Role permissions are centralized in @/lib/auth/permissions
 * Roles: guest, receptionist, housekeeping, admin
 */

export const DASHBOARD_LINKS = {
    navMain: [
        {
            title: "Main",
            links: [
                {
                    label: "Overview",
                    href: "/dashboard",
                    icon: "/icons/Dashboard.svg",
                    roles: getAllowedRoles("/dashboard")!,
                },
                {
                    label: "Browse Rooms",
                    href: "/rooms",
                    icon: "/icons/Rooms.svg",
                    roles: getAllowedRoles("/rooms")!,
                },
            ],
        },
        {
            title: "Management",
            links: [
                {
                    label: "Bookings",
                    href: "/dashboard/bookings",
                    icon: "/icons/Bookings.svg",
                    roles: getAllowedRoles("/dashboard/bookings")!,
                },
                {
                    label: "My Service Requests",
                    href: "/dashboard/my-requests",
                    icon: "/icons/Housekeeping.svg",
                    roles: getAllowedRoles("/dashboard/my-requests")!,
                },
                {
                    label: "Service Requests",
                    href: "/dashboard/service-requests",
                    icon: "/icons/Housekeeping.svg",
                    roles: getAllowedRoles("/dashboard/service-requests")!,
                },
                {
                    label: "Rooms",
                    href: "/dashboard/rooms",
                    icon: "/icons/Rooms.svg",
                    roles: getAllowedRoles("/dashboard/rooms")!,
                },
                {
                    label: "Guests",
                    href: "/dashboard/guests",
                    icon: "/icons/Guests.svg",
                    roles: getAllowedRoles("/dashboard/guests")!,
                },
            ],
        },
        {
            title: "Reports",
            links: [
                {
                    label: "Reports",
                    href: "/dashboard/reports",
                    icon: "/icons/Reports.svg",
                    roles: getAllowedRoles("/dashboard/reports")!,
                },
            ],
        },
        {
            title: "Administration",
            links: [
                {
                    label: "User Management",
                    href: "/dashboard/users",
                    icon: "/icons/Users.svg",
                    roles: getAllowedRoles("/dashboard/users")!,
                },
                {
                    label: "Profile Settings",
                    href: "/dashboard/profile",
                    icon: "/icons/Settings.svg",
                    roles: getAllowedRoles("/dashboard/profile")!,
                },
            ],
        },
    ],
}