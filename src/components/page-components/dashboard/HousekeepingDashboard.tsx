"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAssignedServiceRequests } from "@/services/serviceRequestService";
import { KPICard, StatusBarChart, ActionCard } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ClipboardCheck, Clock, CheckCircle2, ListTodo } from "lucide-react";
import { ChartConfig } from "@/components/ui/chart";

export const HousekeepingDashboard = () => {
    const router = useRouter();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [serviceRequests, setServiceRequests] = useState<IServiceRequest[]>([]);

    useEffect(() => {
        const fetchServiceRequests = async () => {
            if (!user) return;

            try {
                setLoading(true);
                // Fetch all assigned service requests (no pagination for dashboard stats)
                const response = await getAssignedServiceRequests(1, 1000);

                if (response.success && response.data) {
                    // Handle different response structures
                    const serviceRequestsData: any = response.data;
                    const serviceRequestsArray = Array.isArray(serviceRequestsData)
                        ? serviceRequestsData
                        : (serviceRequestsData?.items || serviceRequestsData?.data || []);

                    // Backend already filters to return only requests assigned to current user
                    // No additional filtering needed - use all returned requests
                    setServiceRequests(serviceRequestsArray);
                } else {
                    setServiceRequests([]);
                    if (!response.success) {
                        toast.error(response.message || "Failed to fetch service requests");
                    }
                }
            } catch (error: any) {
                toast.error(error?.message || "An error occurred while fetching service requests");
            } finally {
                setLoading(false);
            }
        };

        fetchServiceRequests();
    }, [user]);

    // Calculate statistics from service requests
    // All requests are already filtered by backend to show only those assigned to current user
    const stats = {
        total: serviceRequests.length,
        // Pending = my assigned requests that are pending
        pending: serviceRequests.filter((sr) => sr.status === "pending").length,
        // In Progress = my assigned requests that are in progress
        in_progress: serviceRequests.filter((sr) => sr.status === "in_progress").length,
        // Completed = my assigned requests that are completed
        completed: serviceRequests.filter((sr) => sr.status === "completed").length,
    };

    // Get today's completed tasks
    // All requests are already filtered to show only those assigned to current user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = serviceRequests.filter((sr) => {
        if (sr.status !== "completed") return false;
        const completedDate = new Date(sr.updatedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
    }).length;

    // Chart configuration using global CSS variables
    const serviceRequestChartConfig: ChartConfig = {
        pending: {
            label: "Pending",
            color: "var(--chart-yellow-4)",
        },
        in_progress: {
            label: "In Progress",
            color: "var(--chart-cyan-1)",
        },
        completed: {
            label: "Completed",
            color: "var(--chart-green-3)",
        },
    };

    // Prepare chart data
    const serviceRequestData = [
        { name: "Pending", value: stats.pending, fill: "var(--chart-yellow-4)" },
        { name: "In Progress", value: stats.in_progress, fill: "var(--chart-cyan-1)" },
        { name: "Completed", value: stats.completed, fill: "var(--chart-green-3)" },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-96" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>

                <Skeleton className="h-[400px]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KPICard
                    title="Pending Tasks"
                    value={stats.pending}
                    icon={Clock}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    gradient="linear-gradient(79.74deg, rgba(255, 165, 0, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description="Your assigned pending requests"
                />
                <KPICard
                    title="In Progress"
                    value={stats.in_progress}
                    icon={ListTodo}
                    iconColor="text-cyan-400"
                    iconBg="bg-cyan-500/10"
                    gradient="linear-gradient(79.74deg, rgba(6, 182, 212, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description="Your tasks currently in progress"
                />
                <KPICard
                    title="Completed Today"
                    value={completedToday}
                    icon={CheckCircle2}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${stats.completed} total completed`}
                />
            </div>

            {/* Chart */}
            <div className="">
                <StatusBarChart
                    title="Assigned Service Requests by Status"
                    data={serviceRequestData}
                    config={serviceRequestChartConfig}
                    description="Your current workload breakdown"
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-4 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg 
            shadow-primary-900/15">
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <ActionCard
                        title="View Assigned Requests"
                        description="See all your assigned tasks"
                        icon={ClipboardCheck}
                        iconColor="text-cyan-400"
                        iconBg="bg-cyan-500/10"
                        gradient="linear-gradient(79.74deg, rgba(6, 182, 212, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/service-requests")}
                    />
                </div>
            </div>

            {/* No Data State */}
            {stats.total === 0 && (
                <div className="rounded-lg border border-border bg-card/50 p-12 text-center">
                    <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Assigned Tasks</h3>
                    <p className="text-muted-foreground">
                        You have no service requests assigned to you at the moment. New tasks will appear here when assigned by the admin.
                    </p>
                </div>
            )}
        </div>
    );
};

