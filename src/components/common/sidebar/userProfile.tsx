"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import { getInitials, formatUserRole } from "@/lib/utils"

const UserProfile = () => {
    const { user, role, loading } = useAuth()

    if (loading) {
        return (
            <SidebarMenu className="border-t border-white/10">
                <SidebarMenuItem>
                    <div className="flex items-center gap-3 p-2 my-1">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex flex-col gap-2 flex-1">
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-2 w-16" />
                        </div>
                    </div>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    if (!user) {
        return null
    }

    return (
        <SidebarMenu className="border-t border-white/10">
            <SidebarMenuItem>
                <SidebarMenuButton
                    size="lg"
                    className="flex items-center gap-3 p-2 my-1 rounded-md w-full hover:bg-white/10"
                >
                    <Avatar className="h-10 w-10 rounded-lg border border-white/20">
                        <AvatarFallback className="rounded-lg bg-linear-to-br from-primary-400 to-primary-600 text-white font-semibold">
                            {getInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-medium text-primary-200 truncate max-w-[150px]">
                            {user.name}
                        </span>
                        <span className="text-xs text-primary-100 capitalize">
                            {role ? formatUserRole(role) : 'User'}
                        </span>
                    </div>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}

export default UserProfile

