"use client"

import { ReactNode } from "react"

import AppSidebar from "@/components/common/sidebar/appSidebar"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"

interface DashboardLayoutProps {
    children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />

            <SidebarInset className="border border-white/10">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 py-2">
                    <SidebarTrigger />
                    <Separator orientation="vertical" className="mx-2" />
                </header>

                <main className="p-4">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default DashboardLayout
