"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyBookings } from "@/services/bookingService";
import { getMyServiceRequests } from "@/services/serviceRequestService";
import { KPICard, StatusPieChart, StatusBarChart, ActionCard } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, ClipboardList, Settings, Building2, Home } from "lucide-react";
import { ChartConfig } from "@/components/ui/chart";

export const GuestDashboard = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [serviceRequests, setServiceRequests] = useState<IServiceRequest[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch bookings and service requests in parallel
                const [bookingsResponse, serviceRequestsResponse] = await Promise.all([
                    getMyBookings(1, 1000), // Fetch all for dashboard stats
                    getMyServiceRequests(1, 1000),
                ]);

                if (bookingsResponse.success && bookingsResponse.data) {
                    // Handle different response structures
                    const bookingsData: any = bookingsResponse.data;
                    const bookingsArray = Array.isArray(bookingsData)
                        ? bookingsData
                        : (bookingsData?.items || bookingsData?.data || []);
                    setBookings(bookingsArray);
                } else {
                    setBookings([]);
                    if (!bookingsResponse.success) {
                        toast.error(bookingsResponse.message || "Failed to fetch bookings");
                    }
                }

                if (serviceRequestsResponse.success && serviceRequestsResponse.data) {
                    // Handle different response structures
                    const serviceRequestsData: any = serviceRequestsResponse.data;
                    const serviceRequestsArray = Array.isArray(serviceRequestsData)
                        ? serviceRequestsData
                        : (serviceRequestsData?.items || serviceRequestsData?.data || []);
                    setServiceRequests(serviceRequestsArray);
                } else {
                    setServiceRequests([]);
                    if (!serviceRequestsResponse.success) {
                        toast.error(serviceRequestsResponse.message || "Failed to fetch service requests");
                    }
                }
            } catch (error: any) {
                toast.error(error?.message || "An error occurred while fetching data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate booking statistics
    const bookingStats = {
        total: bookings.length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        pending: bookings.filter((b) => b.status === "pending").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
    };

    // Get upcoming bookings (confirmed or pending, check-in date is in the future)
    const now = new Date();
    const upcomingBookings = bookings.filter((b) => {
        if (b.status === "cancelled") return false;
        const checkInDate = new Date(b.checkInDate);
        return checkInDate > now;
    }).length;

    // Get active stay (confirmed, check-in date is in the past, check-out date is in the future)
    const activeStay = bookings.filter((b) => {
        if (b.status !== "confirmed") return false;
        const checkInDate = new Date(b.checkInDate);
        const checkOutDate = new Date(b.checkOutDate);
        return checkInDate <= now && checkOutDate >= now;
    }).length;

    // Service request statistics
    const serviceRequestStats = {
        total: serviceRequests.length,
        pending: serviceRequests.filter((sr) => sr.status === "pending").length,
        in_progress: serviceRequests.filter((sr) => sr.status === "in_progress").length,
        completed: serviceRequests.filter((sr) => sr.status === "completed").length,
    };

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

    const serviceRequestChartConfig: ChartConfig = {
        pending: {
            label: "Pending",
            color: "var(--chart-yellow-4)",
        },
        in_progress: {
            label: "In Progress",
            color: "var(--chart-cyan-2)",
        },
        completed: {
            label: "Completed",
            color: "var(--chart-green-3)",
        },
    };

    // Prepare chart data
    const bookingChartData = [
        { name: "Confirmed", value: bookingStats.confirmed, fill: "var(--chart-cyan-1)" },
        { name: "Pending", value: bookingStats.pending, fill: "var(--chart-yellow-4)" },
        { name: "Cancelled", value: bookingStats.cancelled, fill: "var(--chart-rose-4)" },
    ];

    const serviceRequestData = [
        { name: "Pending", value: serviceRequestStats.pending, fill: "var(--chart-yellow-1)" },
        { name: "In Progress", value: serviceRequestStats.in_progress, fill: "var(--chart-cyan-2)" },
        { name: "Completed", value: serviceRequestStats.completed, fill: "var(--chart-green-3)" },
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

                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[400px]" />
                    <Skeleton className="h-[400px]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <KPICard
                    title="Upcoming Bookings"
                    value={upcomingBookings}
                    icon={Calendar}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 128, 255, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${bookingStats.total} total bookings`}
                />
                <KPICard
                    title="Active Stay"
                    value={activeStay}
                    icon={Home}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={activeStay > 0 ? "Currently checked in" : "No active stay"}
                />
                <KPICard
                    title="Pending Requests"
                    value={serviceRequestStats.pending}
                    icon={Settings}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    gradient="linear-gradient(79.74deg, rgba(255, 165, 0, 0.15) 0%, rgba(0, 0, 0, 0.12) 100%)"
                    description={`${serviceRequestStats.total} total requests`}
                />
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                <StatusPieChart
                    title="Booking History"
                    data={bookingChartData}
                    config={bookingChartConfig}
                    description="Your bookings by status"
                />

                <StatusBarChart
                    title="Service Requests"
                    data={serviceRequestData}
                    config={serviceRequestChartConfig}
                    description="Your service request status"
                />
            </div>

            {/* Quick Actions */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg 
            shadow-primary-900/15">
                <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <ActionCard
                        title="My Bookings"
                        description="View and manage your bookings"
                        icon={ClipboardList}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        gradient="linear-gradient(79.74deg, rgba(0, 128, 255, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/bookings")}
                    />

                    <ActionCard
                        title="My Service Requests"
                        description="View your service requests"
                        icon={Settings}
                        iconColor="text-orange-400"
                        iconBg="bg-orange-500/10"
                        gradient="linear-gradient(79.74deg, rgba(255, 165, 0, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/dashboard/my-requests")}
                    />

                    <ActionCard
                        title="Browse Rooms"
                        description="Explore available rooms"
                        icon={Building2}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        gradient="linear-gradient(79.74deg, rgba(0, 255, 132, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)"
                        onClick={() => router.push("/rooms")}
                    />
                </div>
            </div>

            {/* First Time User State */}
            {bookingStats.total === 0 && (
                <div className="rounded-lg border border-border bg-card/50 p-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Welcome to Our Hotel!</h3>
                    <p className="text-muted-foreground mb-6">
                        You haven&apos;t made any bookings yet. Browse our available rooms to get started.
                    </p>
                    <Button onClick={() => router.push("/rooms")}>
                        Browse Rooms
                    </Button>
                </div>
            )}
        </div>
    );
};

