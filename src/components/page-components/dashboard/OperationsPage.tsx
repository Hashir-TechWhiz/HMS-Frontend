"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBookings } from "@/services/bookingService";
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
import { Eye, CheckCircle2, LogOut, Calendar, Hotel, Clock, Users, User, Mail, Phone, MapPin, CreditCard, FileText, Hash } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const OperationsPage = () => {
    const { role, loading: authLoading } = useAuth();

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
                widthClass="max-w-4xl"
            >
                {selectedBooking && (
                    <div className="space-y-6 py-4">
                        {/* Header Section */}
                        <div className="flex items-start justify-between pb-4 border-b border-primary-900/40">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-primary-600/20">
                                    <FileText className="h-5 w-5 text-primary-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Booking Information</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Hash className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="text-xs text-gray-400 font-mono">{selectedBooking._id}</span>
                                    </div>
                                </div>
                            </div>
                            <StatusBadge status={selectedBooking.status} />
                        </div>

                        {/* Customer Information */}
                        <div className="bg-primary-900/20 rounded-lg p-4 border border-primary-900/40">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="h-4 w-4 text-primary-400" />
                                <h3 className="text-sm font-semibold text-white">Customer Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Name</p>
                                    <p className="text-sm font-medium text-white">{getCustomerName(selectedBooking)}</p>
                                </div>
                                {selectedBooking.guest && typeof selectedBooking.guest === 'object' && (
                                    <>
                                        {selectedBooking.guest.email && (
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Email</p>
                                                <div className="flex items-center gap-1.5">
                                                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                                                    <a 
                                                        href={`mailto:${selectedBooking.guest.email}`}
                                                        className="text-sm text-primary-400 hover:text-primary-300"
                                                    >
                                                        {selectedBooking.guest.email}
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {selectedBooking.customerDetails?.email && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Email</p>
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                                            <a 
                                                href={`mailto:${selectedBooking.customerDetails.email}`}
                                                className="text-sm text-primary-400 hover:text-primary-300"
                                            >
                                                {selectedBooking.customerDetails.email}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {selectedBooking.customerDetails?.phone && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Phone</p>
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                            <a 
                                                href={`tel:${selectedBooking.customerDetails.phone}`}
                                                className="text-sm text-primary-400 hover:text-primary-300"
                                            >
                                                {selectedBooking.customerDetails.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}
                                {selectedBooking.checkInDetails?.phoneNumber && (
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Phone</p>
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                                            <a 
                                                href={`tel:${selectedBooking.checkInDetails.phoneNumber}`}
                                                className="text-sm text-primary-400 hover:text-primary-300"
                                            >
                                                {selectedBooking.checkInDetails.phoneNumber}
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedBooking.checkInDetails && (
                                <div className="mt-4 pt-4 border-t border-primary-900/40 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedBooking.checkInDetails.nicPassport && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">NIC/Passport</p>
                                            <p className="text-sm font-medium text-white">{selectedBooking.checkInDetails.nicPassport}</p>
                                        </div>
                                    )}
                                    {selectedBooking.checkInDetails.country && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Country</p>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                <p className="text-sm font-medium text-white">{selectedBooking.checkInDetails.country}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Room Information */}
                        <div className="bg-primary-900/20 rounded-lg p-4 border border-primary-900/40">
                            <div className="flex items-center gap-2 mb-4">
                                <Hotel className="h-4 w-4 text-primary-400" />
                                <h3 className="text-sm font-semibold text-white">Room Information</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Room Number</p>
                                    <p className="text-sm font-medium text-white">{getRoomNumber(selectedBooking)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Room Type</p>
                                    <p className="text-sm font-medium text-white">{getRoomType(selectedBooking)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Booking Dates */}
                        <div className="bg-primary-900/20 rounded-lg p-4 border border-primary-900/40">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="h-4 w-4 text-primary-400" />
                                <h3 className="text-sm font-semibold text-white">Stay Duration</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Check-in Date</p>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-green-400" />
                                        <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.checkInDate)}</p>
                                    </div>
                                    {selectedBooking.checkInDetails?.checkedInAt && (
                                        <p className="text-xs text-gray-400 mt-1 ml-5">
                                            Checked in: {formatDateTime(selectedBooking.checkInDetails.checkedInAt)}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">Check-out Date</p>
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                                        <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.checkOutDate)}</p>
                                    </div>
                                    {selectedBooking.checkOutDetails?.checkedOutAt && (
                                        <p className="text-xs text-gray-400 mt-1 ml-5">
                                            Checked out: {formatDateTime(selectedBooking.checkOutDetails.checkedOutAt)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Information */}
                        {(selectedBooking.totalAmount || selectedBooking.paymentStatus) && (
                            <div className="bg-primary-900/20 rounded-lg p-4 border border-primary-900/40">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="h-4 w-4 text-primary-400" />
                                    <h3 className="text-sm font-semibold text-white">Payment Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedBooking.paymentStatus && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Payment Status</p>
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                    selectedBooking.paymentStatus === 'paid'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : selectedBooking.paymentStatus === 'partially_paid'
                                                        ? 'bg-orange-500/10 text-orange-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                }`}
                                            >
                                                {selectedBooking.paymentStatus.replace('_', ' ').charAt(0).toUpperCase() + 
                                                 selectedBooking.paymentStatus.replace('_', ' ').slice(1)}
                                            </span>
                                        </div>
                                    )}
                                    {selectedBooking.totalAmount !== undefined && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                                            <p className="text-sm font-bold text-green-400">
                                                LKR {selectedBooking.totalAmount.toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                    {selectedBooking.totalPaid !== undefined && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Total Paid</p>
                                            <p className="text-sm font-medium text-white">
                                                LKR {selectedBooking.totalPaid.toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        <div className="bg-primary-900/10 rounded-lg p-4 border border-primary-900/20">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                <h3 className="text-xs font-semibold text-gray-400">Metadata</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div>
                                    <p className="text-gray-500">Created</p>
                                    <p className="text-gray-300">{formatDateTime(selectedBooking.createdAt)}</p>
                                </div>
                                {selectedBooking.updatedAt && (
                                    <div>
                                        <p className="text-gray-500">Last Updated</p>
                                        <p className="text-gray-300">{formatDateTime(selectedBooking.updatedAt)}</p>
                                    </div>
                                )}
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
