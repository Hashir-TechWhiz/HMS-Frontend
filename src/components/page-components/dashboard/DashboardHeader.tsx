"use client"

import HeaderUserProfile from "./HeaderUserProfile"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const DashboardHeader = () => {
    const pathname = usePathname()
    const currentSegment =
        pathname.split("/").filter(Boolean).pop() || "Dashboard"

    return (
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 py-2">
            <div className="flex items-center gap-2 h-full py-3">
                <SidebarTrigger />

                <Separator
                    orientation="vertical"
                    className="mx-2 bg-white/30"
                />

                <span className="text-sm font-medium uppercase">
                    {currentSegment}
                </span>
            </div>

            <HeaderUserProfile />
        </header>
    )
}

export default DashboardHeader
