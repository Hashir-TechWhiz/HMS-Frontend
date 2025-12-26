"use client"

import { ReactNode } from "react"

import AppSidebar from "@/components/common/sidebar/appSidebar"
import DashboardHeader from "@/components/page-components/dashboard/DashboardHeader"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

interface DashboardLayoutProps {
    children: ReactNode
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
    return (
        <SidebarProvider>
            <AppSidebar variant="inset" />

            <SidebarInset className="border border-white/10 overflow-hidden">
                <DashboardHeader />

                <main className="relative flex-1 overflow-y-auto p-4">
                    <div className="absolute top-1/2 left-1/2 -translate-y-1/2 w-30 h-30 gradient-01 pointer-events-none z-0" />
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default DashboardLayout
