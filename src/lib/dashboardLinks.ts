import { getAllowedRoles } from "./auth/permissions";
import {
    LayoutDashboard,
    Home,
    Building2,
    Settings,
    Calendar,
    FileText,
    CreditCard,
    ClipboardList,
    Wrench,
    List,
    Users,
    Clock,
    BarChart3,
    User,
    Sparkles,
} from "lucide-react";

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
                    icon: LayoutDashboard,
                    roles: getAllowedRoles("/dashboard")!,
                },
                {
                    label: "Browse Rooms",
                    href: "/rooms",
                    icon: Home,
                    roles: getAllowedRoles("/rooms")!,
                },
                {
                    label: "Browse Facilities",
                    href: "/facilities",
                    icon: Sparkles,
                    roles: getAllowedRoles("/facilities")!,
                },
            ],
        },
        {
            title: "Management",
            links: [
                {
                    label: "Operations Hub",
                    href: "/dashboard/operations",
                    icon: Settings,
                    roles: getAllowedRoles("/dashboard/operations")!,
                },
                {
                    label: "Bookings",
                    href: "/dashboard/bookings",
                    icon: Calendar,
                    roles: getAllowedRoles("/dashboard/bookings")!,
                },
                {
                    label: "Invoices",
                    href: "/dashboard/invoices",
                    icon: FileText,
                    roles: getAllowedRoles("/dashboard/invoices")!,
                },
                {
                    label: "My Payments",
                    href: "/dashboard/my-payments",
                    icon: CreditCard,
                    roles: getAllowedRoles("/dashboard/my-payments")!,
                },
                {
                    label: "My Service Requests",
                    href: "/dashboard/my-requests",
                    icon: ClipboardList,
                    roles: getAllowedRoles("/dashboard/my-requests")!,
                },
                {
                    label: "Service Requests",
                    href: "/dashboard/service-requests",
                    icon: Wrench,
                    roles: getAllowedRoles("/dashboard/service-requests")!,
                },
                {
                    label: "Service Catalog",
                    href: "/dashboard/service-catalog",
                    icon: List,
                    roles: getAllowedRoles("/dashboard/service-catalog")!,
                },
                {
                    label: "Rooms",
                    href: "/dashboard/rooms",
                    icon: Home,
                    roles: getAllowedRoles("/dashboard/rooms")!,
                },
                {
                    label: "Facilities",
                    href: "/dashboard/facilities",
                    icon: Building2,
                    roles: getAllowedRoles("/dashboard/facilities")!,
                },
                {
                    label: "Facility Bookings",
                    href: "/dashboard/facility-bookings",
                    icon: Calendar,
                    roles: getAllowedRoles("/dashboard/facility-bookings")!,
                },
                {
                    label: "Guests",
                    href: "/dashboard/guests",
                    icon: Users,
                    roles: getAllowedRoles("/dashboard/guests")!,
                },
                {
                    label: "Staff Roster",
                    href: "/dashboard/roster",
                    icon: Calendar,
                    roles: getAllowedRoles("/dashboard/roster")!,
                },
                {
                    label: "My Roster",
                    href: "/dashboard/my-roster",
                    icon: Clock,
                    roles: getAllowedRoles("/dashboard/my-roster")!,
                },
            ],
        },
        {
            title: "Reports",
            links: [
                {
                    label: "Reports",
                    href: "/dashboard/reports",
                    icon: BarChart3,
                    roles: getAllowedRoles("/dashboard/reports")!,
                },
            ],
        },
        {
            title: "Administration",
            links: [
                {
                    label: "Hotels",
                    href: "/dashboard/hotels",
                    icon: Building2,
                    roles: getAllowedRoles("/dashboard/hotels")!,
                },
                {
                    label: "User Management",
                    href: "/dashboard/users",
                    icon: Users,
                    roles: getAllowedRoles("/dashboard/users")!,
                },
                {
                    label: "Profile Settings",
                    href: "/dashboard/profile",
                    icon: User,
                    roles: getAllowedRoles("/dashboard/profile")!,
                },
            ],
        },
    ],
}