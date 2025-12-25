"use client"

import HeaderUserProfile from "./HeaderUserProfile"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const DashboardHeader = () => {
    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
            <div className="flex items-center gap-2">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-2" />
            </div>

            <HeaderUserProfile />
        </header>
    )
}

export default DashboardHeader

