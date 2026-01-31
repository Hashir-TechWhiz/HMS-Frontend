"use client";

import {
    useEffect,
    useState
} from "react";

import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { getReportsOverview } from "@/services/reportService";



import {
    KPICard,
    StatusPieChart,
    StatusBarChart,
    ActionCard
} from "@/components/charts";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartConfig } from "@/components/ui/chart";

import { Building2, Users, ClipboardList, Settings, FileText } from "lucide-react";

export const AdminDashboard = () => {
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
            color: "var(--chart-cyan-1)",
        },
        pending: {
            label: "Pending",
            color: "var(--chart-yellow-5)",
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
        maintenance: {
            label: "Maintenance",
            color: "var(--chart-violet-1)",
        },
    };

    const serviceRequestChartConfig: ChartConfig = {
        pending: {
            label: "Pending",
            color: "var(--chart-yellow-1)",
        },
        in_progress: {
            label: "In Progress",
            color: "var(--chart-cyan-1)",
        },
        completed: {
            label: "Completed",
            color: "var(--chart-green-1)",
        },
    };

    // Prepare chart data
    const bookingChartData = reportData
        ? [
            { name: "Confirmed", value: reportData.bookings.byStatus.confirmed, fill: "var(--chart-cyan-1)" },
            { name: "Pending", value: reportData.bookings.byStatus.pending, fill: "var(--chart-yellow-5)" },
            { name: "Cancelled", value: reportData.bookings.byStatus.cancelled, fill: "var(--chart-rose-4)" },
        ]
        : [];

    const roomStatusData = reportData
        ? [
            { name: "Available", value: reportData.rooms.byStatus.available, fill: "var(--chart-2)" },
            { name: "Unavailable", value: reportData.rooms.byStatus.unavailable, fill: "var(--chart-rose-4)" },
            { name: "Maintenance", value: reportData.rooms.byStatus.maintenance, fill: "var(--chart-violet-1)" },
        ]
        : [];

    const serviceRequestData = reportData
        ? [
            { name: "Pending", value: reportData.serviceRequests.byStatus.pending, fill: "var(--chart-yellow-1)" },
            { name: "In Progress", value: reportData.serviceRequests.byStatus.in_progress, fill: "var(--chart-cyan-1)" },
            { name: "Completed", value: reportData.serviceRequests.byStatus.completed, fill: "var(--chart-green-1)" },
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

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-[400px]" />
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

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KPICard
                    title="Total Bookings"
                    value={reportData.bookings.totalBookings}
                    icon={ClipboardList}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 128, 255, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${reportData.bookings.byStatus.confirmed} confirmed, ${reportData.bookings.byStatus.pending} pending`}
                />
                <KPICard
                    title="Total Rooms"
                    value={reportData.rooms.totalRooms}
                    icon={Building2}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${reportData.rooms.byStatus.available} available`}
                />
                <KPICard
                    title="Service Requests"
                    value={reportData.serviceRequests.totalServiceRequests}
                    icon={Settings}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    gradient="linear-gradient(79.74deg, rgba(255, 165, 0, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${reportData.serviceRequests.byStatus.pending} pending`}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 grid-cols-2">
                <StatusPieChart
                    title="Booking Status Distribution"
                    data={bookingChartData}
                    config={bookingChartConfig}
                    description="Overview of all bookings by status"
                />

                <StatusBarChart
                    title="Room Availability"
                    data={roomStatusData}
                    config={roomChartConfig}
                    description="Current room status breakdown"
                />

                {/* <StatusBarChart
                    title="Service Request Status"
                    data={serviceRequestData}
                    config={serviceRequestChartConfig}
                    description="Service requests by status"
                /> */}
            </div>

            {/* Quick Actions */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg 
            shadow-primary-900/15">
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <ActionCard
                        title="Manage Rooms"
                        description="Add, edit, or remove rooms"
                        icon={Building2}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/rooms")}
                    />

                    <ActionCard
                        title="Manage Users"
                        description="View and manage user accounts"
                        icon={Users}
                        iconColor="text-purple-400"
                        iconBg="bg-purple-500/10"
                        gradient="linear-gradient(79.74deg, rgba(168, 85, 247, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/users")}
                    />

                    <ActionCard
                        title="View Bookings"
                        description="View all booking records"
                        icon={FileText}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        gradient="linear-gradient(79.74deg, rgba(0, 128, 255, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/bookings")}
                    />
                </div>
            </div>
        </div>
    );
};

