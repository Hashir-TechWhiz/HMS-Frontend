"use client"

import Image from "next/image"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const SidebarLogo = () => {

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="p-0 hover:bg-transparent pointer-events-none"
        >
          {/* Inner layout wrapper */}
          <div className="flex items-center w-full h-full gap-3 px-2 md:px-0">
            {/* Logo */}
            <div
              className="relative shrink-0 h-17 w-10 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-10 transition-all
    "
            >
              <Image
                src="/images/HMSLogo.png"
                alt="HMS Logo"
                fill
                priority
                className="object-cover mt-1"
              />
            </div>

            {/* Text */}
            <div
              className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden"
            >
              <span className="truncate font-semibold text-lg text-amber-100">
                HMS
              </span>
              <span className="truncate text-xs text-primary-100">
                Hotel Management System
              </span>
            </div>
          </div>

        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default SidebarLogo;