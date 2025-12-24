"use client"

import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function LogoutButton() {
  return (
    <SidebarMenu className="border-t border-primary-900">
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className={cn(
            "flex items-center justify-start gap-3 p-2 my-1 rounded-md w-full",
            "text-primary-100 hover:bg-white/10 hover:text-primary-200 transition-colors",
            "group-data-[collapsible=icon]:justify-center"
          )}
        >
          <LogOut size={18} className="shrink-0" />

          <span className="truncate group-data-[collapsible=icon]:hidden">
            Logout Account
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
