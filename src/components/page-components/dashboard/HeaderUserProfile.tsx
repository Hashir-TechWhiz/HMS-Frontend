"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import { getInitials, formatUserRole } from "@/lib/utils"

const HeaderUserProfile = () => {
    const { user, role, loading } = useAuth()

    // Show loading skeleton while fetching user data
    if (loading) {
        return (
            <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 rounded-lg border border-white/20">
                <AvatarFallback className="rounded-lg bg-linear-to-br from-primary-400 to-primary-600 text-white font-semibold text-sm">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>

            <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-primary-200">
                    {user.name}
                </span>
                <span className="text-xs text-primary-100">
                    {role ? formatUserRole(role) : "User"}
                </span>
            </div>
        </div>

    )
}

export default HeaderUserProfile

