"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getReportsOverview } from "@/services/reportService";
import { KPICard, StatusPieChart, StatusBarChart, ActionCard } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, ClipboardList, Settings, Calendar } from "lucide-react";
import { ChartConfig } from "@/components/ui/chart";

export const ReceptionistDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<IReportOverview | null>(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const response = await getReportsOverview();

                if (response.success && response.data) {
                    setReportData(response.data);
                } else {
                    if (!response.success) {
                        toast.error(response.message || "Failed to fetch reports");
                    }
                }
            } catch (error: any) {
                toast.error(error?.message || "An error occurred while fetching reports");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, []);

    // Chart configurations using global CSS variables
    const bookingChartConfig: ChartConfig = {
        confirmed: {
            label: "Confirmed",
            color: "var(--chart-cyan-2)",
        },
        pending: {
            label: "Pending",
            color: "var(--chart-yellow-4)",
        },
        cancelled: {
            label: "Cancelled",
            color: "var(--chart-rose-4)",
        },
    };

    const roomChartConfig: ChartConfig = {
        available: {
            label: "Available",
            color: "var(--chart-2)",
        },
        unavailable: {
            label: "Unavailable",
            color: "var(--chart-rose-4)",
        },
    };

    // Prepare chart data
    const bookingChartData = reportData
        ? [
            { name: "Confirmed", value: reportData.bookings.byStatus.confirmed, fill: "var(--chart-cyan-2)" },
            { name: "Pending", value: reportData.bookings.byStatus.pending, fill: "var(--chart-yellow-1)" },
            { name: "Cancelled", value: reportData.bookings.byStatus.cancelled, fill: "var(--chart-rose-4)" },
        ]
        : [];

    const roomOccupancyData = reportData
        ? [
            { name: "Available", value: reportData.rooms.byStatus.available, fill: "var(--chart-2)" },
            { name: "Occupied", value: reportData.rooms.byStatus.unavailable, fill: "var(--chart-rose-4)" },
        ]
        : [];

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

                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <p className="text-muted-foreground">Failed to load dashboard data</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
        );
    }

    const activeBookings = reportData.bookings.byStatus.confirmed + reportData.bookings.byStatus.pending;

    return (
        <div className="space-y-6">

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KPICard
                    title="Active Bookings"
                    value={activeBookings}
                    icon={Calendar}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 128, 255, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${reportData.bookings.byStatus.confirmed} confirmed`}
                />
                <KPICard
                    title="Available Rooms"
                    value={reportData.rooms.byStatus.available}
                    icon={Building2}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`Out of ${reportData.rooms.totalRooms} total rooms`}
                />
                <KPICard
                    title="Pending Service Requests"
                    value={reportData.serviceRequests.byStatus.pending}
                    icon={Settings}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    gradient="linear-gradient(79.74deg, rgba(255, 165, 0, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${reportData.serviceRequests.byStatus.in_progress} in progress`}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <StatusPieChart
                    title="Today's Bookings"
                    data={bookingChartData}
                    config={bookingChartConfig}
                    description="Current booking status overview"
                />

                <StatusBarChart
                    title="Room Occupancy"
                    data={roomOccupancyData}
                    config={roomChartConfig}
                    description="Current room availability"
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg 
            shadow-primary-900/15">
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <ActionCard
                        title="View Bookings"
                        description="Manage all bookings"
                        icon={ClipboardList}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        gradient="linear-gradient(79.74deg, rgba(0, 128, 255, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/bookings")}
                    />

                    <ActionCard
                        title="Service Requests"
                        description="View all service requests"
                        icon={Settings}
                        iconColor="text-orange-400"
                        iconBg="bg-orange-500/10"
                        gradient="linear-gradient(79.74deg, rgba(255, 165, 0, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/service-requests")}
                    />

                    <ActionCard
                        title="Browse Rooms"
                        description="View available rooms"
                        icon={Building2}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/rooms")}
                    />
                </div>
            </div>
        </div>
    );
};

