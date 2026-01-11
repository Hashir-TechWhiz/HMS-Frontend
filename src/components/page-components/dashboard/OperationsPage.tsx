"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { getAllBookings, checkInBooking, checkOutBooking } from "@/services/bookingService";
import { getReportsOverview } from "@/services/reportService";
import { getActiveHotels } from "@/services/hotelService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import DialogBox from "@/components/common/DialogBox";
import StatCard from "@/components/common/StatCard";
import SelectField from "@/components/forms/SelectField";
import CheckInForm from "./CheckInForm";
import CheckOutInvoiceFlow from "./CheckOutInvoiceFlow";
import { toast } from "sonner";
import { Eye, CheckCircle2, LogOut, Calendar, Hotel, Clock, Users } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const OperationsPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedHotel } = useHotel();

    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [kpiLoading, setKpiLoading] = useState(true);
    const [reportData, setReportData] = useState<IReportOverview | null>(null);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
    const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch all bookings (no pagination for operational view)
    const fetchBookings = useCallback(async () => {
        if (!role || authLoading || (role !== "admin" && role !== "receptionist")) return;

        try {
            setLoading(true);
            // Fetch a large batch to get all operational bookings
            const response = await getAllBookings(1, 1000);

            if (response.success) {
                const bookingsData: any = response.data;
                const bookingsArray = Array.isArray(bookingsData)
                    ? bookingsData
                    : (bookingsData?.items || bookingsData?.data || []);

                setBookings(bookingsArray);
            } else {
                toast.error(response.message || "Failed to fetch bookings");
            }
        } catch {
            toast.error("An error occurred while fetching bookings");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading]);

    // Fetch KPI data
    const fetchKPIs = useCallback(async () => {
        if (!role || authLoading || (role !== "admin" && role !== "receptionist")) return;

        try {
            setKpiLoading(true);
            const response = await getReportsOverview();
            if (response.success && response.data) {
                setReportData(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch KPIs:", error);
        } finally {
            setKpiLoading(false);
        }
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchBookings();
            fetchKPIs();
        }
    }, [role, authLoading, fetchBookings, fetchKPIs]);

    // Fetch available hotels
    const fetchAvailableHotels = useCallback(async () => {
        try {
            const response = await getActiveHotels();
            if (response.success && response.data) {
                setAvailableHotels(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch hotels:", error);
        }
    }, []);

    useEffect(() => {
        if (role && !authLoading && (role === "admin" || role === "receptionist")) {
            fetchAvailableHotels();
        }
    }, [role, authLoading, fetchAvailableHotels]);

    // Filter bookings by hotel
    const filteredBookings = useMemo(() => {
        if (hotelFilter === "all") return bookings;
        return bookings.filter(booking => {
            if (!booking.hotelId) return false;
            const bookingHotelId = typeof booking.hotelId === 'string' ? booking.hotelId : booking.hotelId._id;
            return bookingHotelId === hotelFilter;
        });
    }, [bookings, hotelFilter]);

    // Filter bookings by operational categories
    const getTodayDate = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    };

    const isSameDay = (date1: Date, date2: Date) => {
        return (
            date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
        );
    };

    const arrivalsToday = filteredBookings.filter((booking) => {
        const checkInDate = new Date(booking.checkInDate);
        const today = getTodayDate();
        return booking.status === "confirmed" && isSameDay(checkInDate, today);
    });

    const inHouse = filteredBookings.filter((booking) => booking.status === "checkedin");

    const departuresToday = filteredBookings.filter((booking) => {
        const checkOutDate = new Date(booking.checkOutDate);
        const today = getTodayDate();
        return booking.status === "checkedin" && isSameDay(checkOutDate, today);
    });

    const completed = filteredBookings.filter((booking) => booking.status === "completed");

    // Get customer name
    const getCustomerName = (booking: IBooking): string => {
        if (booking.guest && typeof booking.guest === "object") {
            return booking.guest.name;
        }
        if (booking.customerDetails) {
            return booking.customerDetails.name;
        }
        return "N/A";
    };

    // Get room number
    const getRoomNumber = (booking: IBooking): string => {
        if (booking.room && typeof booking.room === "object") {
            return booking.room.roomNumber;
        }
        return "N/A";
    };

    // Get room type
    const getRoomType = (booking: IBooking): string => {
        if (booking.room && typeof booking.room === "object") {
            return booking.room.roomType;
        }
        return "N/A";
    };

    // Status badge
    const StatusBadge = ({ status }: { status: BookingStatus }) => {
        const colors = {
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
            confirmed: "bg-green-500/20 text-green-400 border-green-500/50",
            checkedin: "bg-purple-500/20 text-purple-400 border-purple-500/50",
            completed: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
        };
        const labels = {
            pending: "Pending",
            confirmed: "Confirmed",
            checkedin: "Checked In",
            completed: "Completed",
            cancelled: "Cancelled",
        };
        return (
            <Badge className={`${colors[status] || ''} border`}>
                {labels[status] || status}
            </Badge>
        );
    };

    // Action handlers
    const handleViewDetails = (booking: IBooking) => {
        setSelectedBooking(booking);
        setViewDialogOpen(true);
    };

    const handleCheckInClick = (booking: IBooking) => {
        setSelectedBooking(booking);
        setCheckInDialogOpen(true);
    };

    const handleCheckOutClick = (booking: IBooking) => {
        setSelectedBooking(booking);
        setCheckOutDialogOpen(true);
    };

    const handleCheckInConfirm = async () => {
        // This is handled by CheckInForm now
    };

    const handleCheckOutConfirm = async () => {
        // This is handled by CheckOutInvoiceFlow now
    };



    // Booking Card Component
    const BookingCard = ({ booking }: { booking: IBooking }) => (
        <div className="bg-primary-500/5 border border-white/10 rounded-lg p-4 hover:border-primary/30 transition-all duration-200 space-y-3">
            {/* Header: Guest Name */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">
                        {getCustomerName(booking)}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Room {getRoomNumber(booking)} • {getRoomType(booking)}
                    </p>
                </div>
                <StatusBadge status={booking.status} />
            </div>

            {/* Dates */}
            <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-gray-300">
                    <Calendar className="h-3.5 w-3.5 text-green-400" />
                    <span>In: {formatDateTime(booking.checkInDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="h-3.5 w-3.5 text-orange-400" />
                    <span>Out: {formatDateTime(booking.checkOutDate)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-white/5">
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(booking)}
                    className="h-8 px-3 flex-1 text-xs"
                >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                </Button>

                {booking.status === "confirmed" && (
                    <Button
                        size="sm"
                        onClick={() => handleCheckInClick(booking)}
                        className="h-8 px-3 flex-1 bg-blue-600 hover:bg-blue-700 text-xs text-white"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                        Check In
                    </Button>
                )}

                {booking.status === "checkedin" && (
                    <Button
                        size="sm"
                        onClick={() => handleCheckOutClick(booking)}
                        className="h-8 px-3 flex-1 bg-purple-600 hover:bg-purple-700 text-xs text-white"
                    >
                        <LogOut className="h-3.5 w-3.5 mr-1" />
                        Check Out
                    </Button>
                )}
            </div>
        </div>
    );

    // Column Component
    const Column = ({
        title,
        count,
        bookings,
        emptyMessage,
        icon: Icon,
        iconColor,
    }: {
        title: string;
        count: number;
        bookings: IBooking[];
        emptyMessage: string;
        icon: any;
        iconColor: string;
    }) => (
        <div className="flex flex-col h-full flex-1 min-w-[280px]">
            {/* Column Header */}
            <div className="bg-primary-900/40 border-2 border-primary-900/40 rounded-t-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    <h3 className="font-semibold text-white">{title}</h3>
                </div>
                <Badge className="bg-white/10 text-white border-white/20">{count}</Badge>
            </div>

            {/* Column Content */}
            <div className="flex-1 bg-primary-900/20 border-2 border-t-0 border-primary-900/40 rounded-b-xl p-3 overflow-y-auto space-y-3 min-h-[400px] max-h-[calc(100vh-400px)]">
                {loading ? (
                    <>
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <Icon className={`h-12 w-12 ${iconColor} opacity-30 mb-3`} />
                        <p className="text-sm text-gray-400">{emptyMessage}</p>
                    </div>
                ) : (
                    bookings.map((booking) => <BookingCard key={booking._id} booking={booking} />)
                )}
            </div>
        </div>
    );

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    if (role !== "admin" && role !== "receptionist") {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Access denied. This page is only for Admin and Receptionist.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Today's Arrivals"
                    value={arrivalsToday.length}
                    icon={Calendar}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    loading={kpiLoading}
                />
                <StatCard
                    title="In-House Guests"
                    value={inHouse.length}
                    icon={Hotel}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    loading={kpiLoading}
                />
                <StatCard
                    title="Today's Departures"
                    value={departuresToday.length}
                    icon={LogOut}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    loading={kpiLoading}
                />
                <StatCard
                    title="Available Rooms"
                    value={reportData?.rooms.byStatus.available || 0}
                    icon={Users}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    loading={kpiLoading}
                />
            </div>

            {/* Kanban Board */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                {/* Hotel Filter */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Operations Hub</h2>
                        <p className="text-sm text-gray-400 mt-1">Manage check-ins, check-outs, and in-house guests</p>
                    </div>
                    {role === "admin" && (
                        <SelectField
                            name="hotelFilter"
                            options={[
                                { value: "all", label: "All Hotels" },
                                ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
                            ]}
                            value={hotelFilter}
                            onChange={(v) => setHotelFilter(v)}
                            width="md:w-[250px]"
                            className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-10!"
                        />
                    )}
                </div>

                <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-4">
                        <Column
                            title="Arrivals Today"
                            count={arrivalsToday.length}
                            bookings={arrivalsToday}
                            emptyMessage="No arrivals expected today"
                            icon={Calendar}
                            iconColor="text-green-400"
                        />
                        <Column
                            title="In-House"
                            count={inHouse.length}
                            bookings={inHouse}
                            emptyMessage="No guests currently checked in"
                            icon={Hotel}
                            iconColor="text-purple-400"
                        />
                        <Column
                            title="Departures Today"
                            count={departuresToday.length}
                            bookings={departuresToday}
                            emptyMessage="No departures expected today"
                            icon={LogOut}
                            iconColor="text-orange-400"
                        />
                        <Column
                            title="Completed"
                            count={completed.length}
                            bookings={completed.slice(0, 10)} // Show recent 10
                            emptyMessage="No completed bookings"
                            icon={CheckCircle2}
                            iconColor="text-blue-400"
                        />
                    </div>
                </div>
            </div>

            {/* View Details Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Booking Details"
                widthClass="max-w-2xl"
            >
                {selectedBooking && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Booking ID</p>
                                <p className="text-sm font-medium">{selectedBooking._id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Status</p>
                                <StatusBadge status={selectedBooking.status} />
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Customer Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Name</p>
                                    <p className="text-sm font-medium">{getCustomerName(selectedBooking)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Room Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Room Number</p>
                                    <p className="text-sm font-medium">{getRoomNumber(selectedBooking)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Room Type</p>
                                    <p className="text-sm font-medium">{getRoomType(selectedBooking)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Booking Dates</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Check-in Date</p>
                                    <p className="text-sm font-medium">{formatDateTime(selectedBooking.checkInDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Check-out Date</p>
                                    <p className="text-sm font-medium">{formatDateTime(selectedBooking.checkOutDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogBox>

            {/* Check In Dialog */}
            <DialogBox
                open={checkInDialogOpen}
                onOpenChange={setCheckInDialogOpen}
                title="Check In Guest"
                widthClass="max-w-xl"
            >
                {selectedBooking && (
                    <CheckInForm
                        bookingId={selectedBooking._id}
                        onSuccess={() => {
                            setCheckInDialogOpen(false);
                            fetchBookings();
                            fetchKPIs();
                        }}
                        onCancel={() => setCheckInDialogOpen(false)}
                    />
                )}
            </DialogBox>

            {/* Check Out Dialog */}
            <DialogBox
                open={checkOutDialogOpen}
                onOpenChange={setCheckOutDialogOpen}
                title="Check Out and Invoicing"
                widthClass="max-w-xl"
            >
                {selectedBooking && (
                    <CheckOutInvoiceFlow
                        bookingId={selectedBooking._id}
                        onSuccess={() => {
                            setCheckOutDialogOpen(false);
                            fetchBookings();
                            fetchKPIs();
                        }}
                        onCancel={() => setCheckOutDialogOpen(false)}
                    />
                )}
            </DialogBox>
        </div>
    );
};

export default OperationsPage;
