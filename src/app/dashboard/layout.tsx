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

            <SidebarInset className="border border-white/10">
                <DashboardHeader />

                <main className="p-4">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    )
}

export default DashboardLayout
