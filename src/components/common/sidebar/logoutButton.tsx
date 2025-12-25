"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

const LogoutButton = () => {
  const router = useRouter()
  const { logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return

    try {
      setIsLoggingOut(true)
      await logout()
      toast.success('Logged out successfully')
      router.push('/')
    } catch {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarMenu className="border-t border-primary-900">
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex items-center justify-start gap-3 p-2 my-1 rounded-md w-full",
            "text-primary-100 hover:bg-white/10 hover:text-primary-200 transition-colors",
            "group-data-[collapsible=icon]:justify-center",
            isLoggingOut && "opacity-50 cursor-not-allowed"
          )}
        >
          <LogOut size={18} className="shrink-0" />

          <span className="truncate group-data-[collapsible=icon]:hidden">
            {isLoggingOut ? 'Logging out...' : 'Logout Account'}
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export default LogoutButton;