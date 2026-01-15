"use client"

import Image from "next/image"
import { useAuth } from "@/contexts/AuthContext"
import { useHotel } from "@/contexts/HotelContext"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const SidebarLogo = () => {
  const { role } = useAuth()
  const { selectedHotel } = useHotel()

  // Determine display text based on role
  const getDisplayText = () => {
    if (role === "admin") {
      return {
        title: "HMS",
        subtitle: "Hotel Management System",
      }
    }

    if (role === "receptionist" || role === "housekeeping") {
      // Staff users see their assigned hotel name
      return {
        title: "HMS",
        subtitle: selectedHotel?.name || "Hotel Management System",
      }
    }

    if (role === "guest") {
      // Guests see HMS with welcome subtitle
      return {
        title: "HMS",
        subtitle: "Welcome",
      }
    }

    // Fallback for undefined role
    return {
      title: "HMS",
      subtitle: "Hotel Management System",
    }
  }

  const { title, subtitle } = getDisplayText()

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
              className="relative shrink-0 h-17 w-10 group-data-[collapsible=icon]:h-11 group-data-[collapsible=icon]:w-10 transition-all"
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
            <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
              {title && (
                <span className="truncate font-semibold text-lg text-amber-100">
                  {title}
                </span>
              )}
              <span className="truncate text-xs text-primary-100">
                {subtitle}
              </span>
            </div>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default SidebarLogo
