"use client"

import * as React from "react"

import { NavMain } from "@/components/common/sidebar/nav-main"
import { LogoutButton } from "@/components/common/sidebar/Logout-button"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import SidebarLogo from "./sidebar-logo"

// This is sample data.
const data = {
  navMain: [
    {
      title: "Main",
      links: [
        {
          label: "Overview",
          href: "/dashboard",
          icon: "/icons/Dashboard.svg",
        },
      ],
    },
    {
      title: "Hotel Operations",
      links: [
        {
          label: "Rooms",
          href: "/dashboard/rooms",
          icon: "/icons/Rooms.svg",
        },
        {
          label: "Bookings",
          href: "/dashboard/bookings",
          icon: "/icons/Bookings.svg",
        },
        {
          label: "Guests",
          href: "/dashboard/guests",
          icon: "/icons/Guests.svg",
        },
        {
          label: "Housekeeping",
          href: "/dashboard/housekeeping",
          icon: "/icons/Housekeeping.svg",
        },
      ],
    },
    {
      title: "Finance",
      links: [
        {
          label: "Invoices",
          href: "/dashboard/invoices",
          icon: "/icons/Invoices.svg",
        },
        {
          label: "Payments",
          href: "/dashboard/payments",
          icon: "/icons/Payments.svg",
        },
        {
          label: "Expenses",
          href: "/dashboard/expenses",
          icon: "/icons/Expenses.svg",
        },
        {
          label: "Reports",
          href: "/dashboard/reports",
          icon: "/icons/Reports.svg",
        },
      ],
    },
    {
      title: "Administration",
      links: [
        {
          label: "Staff Management",
          href: "/dashboard/staff",
          icon: "/icons/Users.svg",
        },
        {
          label: "System Settings",
          href: "/dashboard/settings",
          icon: "/icons/Settings.svg",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="relative">

      {/* Gradients */}
      <div className="absolute top-0 left-0 w-50 h-30 gradient-01 pointer-events-none z-0" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-30 h-20 gradient-01 
      pointer-events-none z-0" />
      <div className="absolute bottom-0 right-2 w-30 h-30 gradient-01 pointer-events-none z-0" />

      <SidebarHeader className="border-b border-white/10">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
