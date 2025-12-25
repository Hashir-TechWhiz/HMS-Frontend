"use client"

import * as React from "react"

import SidebarLogo from "./sidebarLogo"
import LogoutButton from "./logoutButton"
import SidebarNavigations from "./sidebarNavigations"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

import { DASHBOARD_LINKS } from "@/lib/dashboardLinks"


const AppSidebar = ({ ...props }: React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar collapsible="icon" {...props} className="relative">

      {/* Gradients */}
      <div className="absolute top-0 left-0 w-50 h-30 gradient-01 pointer-events-none z-0" />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-30 h-20 gradient-01 
      pointer-events-none z-0" />
      <div className="absolute bottom-0 right-2 w-30 h-30 gradient-01 pointer-events-none z-0" />

      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-white/10">
        <SidebarLogo />
      </SidebarHeader>

      {/* Contents (LINKS) */}
      <SidebarContent>
        <SidebarNavigations items={DASHBOARD_LINKS.navMain as NavSection[]} />
      </SidebarContent>

      {/* Footer (LOGOUT BUTTON) */}
      <SidebarFooter>
        <LogoutButton />
      </SidebarFooter>

    </Sidebar>
  )
}

export default AppSidebar;
