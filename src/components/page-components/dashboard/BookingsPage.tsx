"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { getAllBookings, getMyBookings, cancelBooking, confirmBooking, checkInBooking, checkOutBooking } from "@/services/bookingService";
import { getBookingsReport } from "@/services/reportService";
import { getActiveHotels } from "@/services/hotelService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import CancellationPenaltyDialog from "./CancellationPenaltyDialog";
import CheckInForm from "./CheckInForm";
import CheckOutInvoiceFlow from "./CheckOutInvoiceFlow";
import StatCard from "@/components/common/StatCard";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, XCircle, CheckCircle, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { formatDateTime, normalizeDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { DateRange } from "react-day-picker";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const BookingsPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedHotel } = useHotel();

    const [allBookings, setAllBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    // KPI states
    const [kpiLoading, setKpiLoading] = useState(false);
    const [bookingStats, setBookingStats] = useState<IBookingReport | null>(null);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
    const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkOutLoading, setCheckOutLoading] = useState(false);

    // Penalty states
    const [penaltyAmount, setPenaltyAmount] = useState(0);
    const [penaltyMessage, setPenaltyMessage] = useState("");

    const itemsPerPage = 10;

    // Fetch bookings based on role
    const fetchBookings = useCallback(async (page: number = 1) => {
        if (!role || authLoading) return;

        try {
            setLoading(true);
            let response;

            // Normalize date range for API
            const { from, to } = normalizeDateRange(dateRange);
            const filters = from || to ? { from, to } : undefined;

            if (role === "guest") {
                response = await getMyBookings(page, itemsPerPage, filters);
            } else if (role === "receptionist" || role === "admin") {
                response = await getAllBookings(page, itemsPerPage, filters);
            } else {
                return;
            }

            if (response.success) {
                // Backend returns bookings array directly in 'data' field
                // and pagination at top level (not nested)
                const bookingsData: any = response.data;
                const bookingsArray = Array.isArray(bookingsData)
                    ? bookingsData
                    : (bookingsData?.items || bookingsData?.data || []);

                setAllBookings(bookingsArray);

                // Pagination is at the response level, not nested in data
                const paginationData: any = response;
                if (paginationData.pagination) {
                    setTotalPages(paginationData.pagination.totalPages || 0);
                    // Backend uses 'totalBookings' not 'totalItems'
                    setTotalItems(paginationData.pagination.totalBookings || paginationData.pagination.totalItems || 0);
                } else if (bookingsData?.pagination) {
                    setTotalPages(bookingsData.pagination.totalPages || 0);
                    setTotalItems(bookingsData.pagination.totalBookings || bookingsData.pagination.totalItems || 0);
                } else {
                    setTotalPages(bookingsArray.length > 0 ? 1 : 0);
                    setTotalItems(bookingsArray.length);
                }
            } else {
                toast.error(response.message || "Failed to fetch bookings");
            }
        } catch {
            toast.error("An error occurred while fetching bookings");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, dateRange]);

    // Fetch booking statistics (for receptionist/admin)
    const fetchBookingStats = useCallback(async () => {
        if (!role || authLoading || role === "guest" || role === "housekeeping") return;

        try {
            setKpiLoading(true);
            const response = await getBookingsReport();
            if (response.success && response.data) {
                console.log("Booking Stats Response:", response.data);
                setBookingStats(response.data);
            } else {
                console.error("Failed to fetch booking stats:", response.message);
                toast.error(response.message || "Failed to fetch booking statistics");
            }
        } catch (error) {
            console.error("Failed to fetch booking statistics:", error);
            toast.error("An error occurred while fetching booking statistics");
        } finally {
            setKpiLoading(false);
        }
    }, [role, authLoading]);

    // Fetch available hotels
    const fetchAvailableHotels = useCallback(async () => {
        if (role !== "admin") return;
        try {
            const response = await getActiveHotels();
            if (response.success && response.data) {
                setAvailableHotels(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch hotels:", error);
        }
    }, [role]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchBookings(currentPage);
            fetchBookingStats();
            fetchAvailableHotels();
        }
    }, [role, authLoading, currentPage, fetchBookings, fetchBookingStats, fetchAvailableHotels]);

    // Handle date range change
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Calculate cancellation penalty based on check-in date
    const calculateCancellationPenalty = (booking: IBooking): { amount: number; message: string } => {
        const now = new Date();
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);

        // Calculate hours until check-in
        const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Get room price per night
        const room = typeof booking.room === "string" ? null : booking.room;
        const pricePerNight = room?.pricePerNight || 0;

        // Calculate number of nights
        const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

        // Apply penalty rules
        if (hoursUntilCheckIn > 24) {
            // More than 24 hours before check-in → no penalty
            return {
                amount: 0,
                message: "No penalty applies (cancellation is more than 24 hours before check-in)"
            };
        } else if (hoursUntilCheckIn > 0) {
            // 24 hours or less before check-in → 1 night charge
            return {
                amount: pricePerNight,
                message: "Penalty of 1 night charge applies (cancellation within 24 hours of check-in)"
            };
        } else {
            // On or after check-in date → full amount (no refund)
            const totalAmount = pricePerNight * nights;
            return {
                amount: totalAmount,
                message: "Full booking amount applies as penalty (cancellation on or after check-in date)"
            };
        }
    };

    // Handle view details
    const handleViewDetails = (booking: IBooking) => {
        setSelectedBooking(booking);
        setViewDialogOpen(true);
    };

    // Handle cancel booking
    const handleCancelClick = (booking: IBooking) => {
        // Guests can only cancel bookings that are not yet confirmed
        if (role === "guest" && booking.status === "confirmed") {
            toast.error("You cannot cancel a confirmed booking. Please contact the hotel directly for assistance.");
            return;
        }

        setSelectedBooking(booking);

        // Staff cancelling confirmed bookings → show penalty dialog
        if ((role === "admin" || role === "receptionist") && booking.status === "confirmed") {
            const penalty = calculateCancellationPenalty(booking);
            setPenaltyAmount(penalty.amount);
            setPenaltyMessage(penalty.message);
            setPenaltyDialogOpen(true);
        } else {
            // Guest cancelling pending or staff cancelling pending → regular dialog
            setCancelDialogOpen(true);
        }
    };

    const handleCancelConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setCancelLoading(true);
            const response = await cancelBooking(selectedBooking._id);

            if (response.success) {
                toast.success("Booking cancelled successfully");
                setCancelDialogOpen(false);
                setSelectedBooking(null);
                fetchBookings(currentPage);
                fetchBookingStats();
            } else {
                toast.error(response.message || "Failed to cancel booking");
            }
        } catch {
            toast.error("An error occurred while cancelling the booking");
        } finally {
            setCancelLoading(false);
        }
    };

    const handlePenaltyCancelConfirm = async (reason?: string) => {
        if (!selectedBooking) return;

        try {
            setCancelLoading(true);
            const penaltyData = {
                cancellationPenalty: penaltyAmount,
                cancellationReason: reason
            };

            const response = await cancelBooking(selectedBooking._id, penaltyData);

            if (response.success) {
                if (penaltyAmount > 0) {
                    toast.success(`Booking cancelled with penalty of LKR ${penaltyAmount.toLocaleString()}`);
                } else {
                    toast.success("Booking cancelled successfully (no penalty)");
                }
                setPenaltyDialogOpen(false);
                setSelectedBooking(null);
                fetchBookings(currentPage);
                fetchBookingStats();
            } else {
                toast.error(response.message || "Failed to cancel booking");
            }
        } catch {
            toast.error("An error occurred while cancelling the booking");
        } finally {
            setCancelLoading(false);
        }
    };

    // Handle confirm booking
    const handleConfirmClick = (booking: IBooking) => {
        setSelectedBooking(booking);
        setConfirmDialogOpen(true);
    };

    const handleConfirmConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setConfirmLoading(true);
            const response = await confirmBooking(selectedBooking._id);

            if (response.success) {
                toast.success("Booking confirmed successfully!");
                setConfirmDialogOpen(false);
                setSelectedBooking(null);
                fetchBookings(currentPage);
                fetchBookingStats();
            } else {
                toast.error(response.message || "Failed to confirm booking");
            }
        } catch {
            toast.error("An error occurred while confirming the booking");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Check if check-in is allowed (date must be today or in the past)
    const isCheckInAllowed = (booking: IBooking): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkInDate = new Date(booking.checkInDate);
        checkInDate.setHours(0, 0, 0, 0);
        return today >= checkInDate;
    };

    // Handle check-in booking
    const handleCheckInClick = (booking: IBooking) => {
        // Check if check-in date has arrived
        if (!isCheckInAllowed(booking)) {
            toast.error("Check-in is not allowed before the scheduled check-in date");
            return;
        }
        setSelectedBooking(booking);
        setCheckInDialogOpen(true);
    };

    // Handle check-out booking
    const handleCheckOutClick = (booking: IBooking) => {
        setSelectedBooking(booking);
        setCheckOutDialogOpen(true);
    };


    // Get guest/customer name
    const getCustomerName = (booking: IBooking): string => {
        if (booking.guest && typeof booking.guest === "object") {
            return booking.guest.name;
        }
        if (booking.customerDetails) {
            return booking.customerDetails.name;
        }
        return "N/A";
    };

    // Get guest/customer phone
    const getCustomerPhone = (booking: IBooking): string => {
        if (booking.guest && typeof booking.guest === "object") {
            return booking.guest.email;
        }
        if (booking.customerDetails) {
            return booking.customerDetails.phone;
        }
        return "N/A";
    };

    // Get booking type
    const getBookingType = (booking: IBooking): string => {
        return booking.guest ? "Online" : "Walk-in";
    };

    // Get created by name
    const getCreatedByName = (booking: IBooking): string => {
        if (booking.createdBy && typeof booking.createdBy === "object") {
            return booking.createdBy.name;
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
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status] || ''}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Status filter options
    const statusFilterOptions: Option[] = [
        { value: "all", label: "All Bookings" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "checkedin", label: "Checked In" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    // Filter bookings based on status and hotel filters (client-side)
    const filteredBookings = useMemo(() => {
        let filtered = allBookings;

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((booking) => booking.status === statusFilter);
        }

        // Filter by hotel (admin only)
        if (role === "admin" && hotelFilter !== "all") {
            filtered = filtered.filter((booking) => {
                if (!booking.hotelId) return false;
                const bookingHotelId = typeof booking.hotelId === 'string' ? booking.hotelId : booking.hotelId._id;
                return bookingHotelId === hotelFilter;
            });
        }

        return filtered;
    }, [allBookings, statusFilter, hotelFilter, role]);

    // Update total items when filtered bookings change
    useEffect(() => {
        setTotalItems(filteredBookings.length);
    }, [filteredBookings]);

    // Define columns based on role
    const guestColumns = [
        {
            key: "room",
            label: "Room",
            render: (booking: IBooking) => (
                <div>
                    <div className="font-medium">{getRoomNumber(booking)}</div>
                    <div className="text-xs text-gray-400">{getRoomType(booking)}</div>
                </div>
            ),
        },
        {
            key: "bookedDate",
            label: "Booked Date",
            render: (booking: IBooking) => formatDateTime(booking.createdAt),
        },
        {
            key: "checkInDate",
            label: "Check-in",
            render: (booking: IBooking) => formatDateTime(booking.checkInDate),
        },
        {
            key: "checkOutDate",
            label: "Check-out",
            render: (booking: IBooking) => formatDateTime(booking.checkOutDate),
        },
        {
            key: "status",
            label: "Status",
            render: (booking: IBooking) => <StatusBadge status={booking.status} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (booking: IBooking) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(booking)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>

                    {/* Check-In Button for Confirmed Bookings */}
                    {booking.status === "confirmed" && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleCheckInClick(booking)}
                                            disabled={!isCheckInAllowed(booking)}
                                            className="h-8 px-2 bg-blue-600 hover:bg-blue-700 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            title="Check In"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!isCheckInAllowed(booking) && (
                                    <TooltipContent side="bottom">
                                        Check-in is only allowed on or after the scheduled check-in date
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Check-Out Button - Only for Staff (Admin/Receptionist) */}
                    {/* Guests cannot checkout - only staff can perform checkout */}

                    {/* Cancel Button for Pending Bookings */}
                    <TooltipProvider>
                        <Tooltip >
                            <TooltipTrigger asChild>
                                <span>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleCancelClick(booking)}
                                        disabled={booking.status !== "pending"}
                                        className="h-8 px-2"
                                        title="Cancel Booking"
                                    >
                                        <XCircle className="h-4 w-4" />
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {(booking.status !== "pending") && (
                                <TooltipContent side="bottom">
                                    {booking.status === "cancelled"
                                        ? "Booking already cancelled"
                                        : booking.status === "confirmed"
                                            ? "Cannot cancel confirmed bookings. Contact hotel for assistance."
                                            : booking.status === "checkedin"
                                                ? "Cannot cancel checked-in bookings."
                                                : "Cannot cancel completed bookings."}
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ),
        },
    ];

    const staffColumns = [
        {
            key: "customer",
            label: "Guest / Customer",
            render: (booking: IBooking) => (
                <div>
                    <div className="font-medium">{getCustomerName(booking)}</div>
                    <div className="text-xs text-gray-400">{getCustomerPhone(booking)}</div>
                </div>
            ),
        },
        {
            key: "room",
            label: "Room",
            render: (booking: IBooking) => (
                <div>
                    <div className="font-medium">{getRoomNumber(booking)}</div>
                    <div className="text-xs text-gray-400">{getRoomType(booking)}</div>
                </div>
            ),
        },
        {
            key: "bookedDate",
            label: "Booked Date",
            render: (booking: IBooking) => formatDateTime(booking.createdAt),
        },
        {
            key: "checkInDate",
            label: "Check-in",
            render: (booking: IBooking) => formatDateTime(booking.checkInDate),
        },
        {
            key: "checkOutDate",
            label: "Check-out",
            render: (booking: IBooking) => formatDateTime(booking.checkOutDate),
        },
        {
            key: "bookingType",
            label: "Type",
            render: (booking: IBooking) => (
                <span className="text-sm">{getBookingType(booking)}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (booking: IBooking) => <StatusBadge status={booking.status} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (booking: IBooking) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(booking)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === "pending" && (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleConfirmClick(booking)}
                            className="h-8 px-2 bg-green-600 hover:bg-green-700 border-green-700"
                            title="Confirm Booking"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    {booking.status === "confirmed" && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => handleCheckInClick(booking)}
                                            disabled={!isCheckInAllowed(booking)}
                                            className="h-8 px-2 bg-blue-600 hover:bg-blue-700 border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                    </span>
                                </TooltipTrigger>
                                {!isCheckInAllowed(booking) && (
                                    <TooltipContent side="bottom">
                                        Check-in is only allowed on or after the scheduled check-in date
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {booking.status === "checkedin" && (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleCheckOutClick(booking)}
                            className="h-8 px-2 bg-purple-600 hover:bg-purple-700 border-purple-700"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelClick(booking)}
                        disabled={["cancelled", "checkedin", "completed"].includes(booking.status)}
                        className="h-8 px-2"
                        title="Cancel Booking"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    const columns = role === "guest" ? guestColumns : staffColumns;
    const pageTitle = role === "guest" ? "My Bookings" : "All Bookings";

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards - Only for Admin/Receptionist */}
            {(role === "receptionist" || role === "admin") && bookingStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Bookings"
                        value={bookingStats?.totalBookings || 0}
                        icon={ClipboardList}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        loading={kpiLoading}
                    />
                    <StatCard
                        title="Confirmed"
                        value={bookingStats?.byStatus?.confirmed || 0}
                        icon={CheckCircle2}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        loading={kpiLoading}
                    />
                    <StatCard
                        title="Pending"
                        value={bookingStats?.byStatus?.pending || 0}
                        icon={Clock}
                        iconColor="text-yellow-400"
                        iconBg="bg-yellow-500/10"
                        loading={kpiLoading}

                    />
                    <StatCard
                        title="Cancelled"
                        value={bookingStats?.byStatus?.cancelled || 0}
                        icon={XCircle}
                        iconColor="text-red-400"
                        iconBg="bg-red-500/10"
                        loading={kpiLoading}
                    />
                </div>
            )}
            {/* KPI Card for Guests - Show only total */}
            {role === "guest" && totalItems > 0 && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                    <StatCard
                        title="My Bookings"
                        value={totalItems}
                        icon={ClipboardList}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        subtitle="Total bookings"
                    />
                </div>
            )}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="flex md:flex-row flex-col gap-5 md:items-center justify-between w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {role === "guest"
                                ? "View and manage your bookings"
                                : "View and manage all hotel bookings"}
                        </p>
                    </div>

                    <div className="flex lg:flex-row flex-col gap-5 w-full justify-end md:w-auto">
                        {(role === "admin" || role === "receptionist") && (
                            <>
                                {role === "admin" && (
                                    <SelectField
                                        name="hotelFilter"
                                        options={[
                                            { value: "all", label: "All Hotels" },
                                            ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
                                        ]}
                                        value={hotelFilter}
                                        onChange={(v) => { setHotelFilter(v); setCurrentPage(1); }}
                                        width="md:w-[250px]"
                                        className="text-xs md:text-sm h-11!"
                                    />
                                )}
                                <SelectField
                                    name="statusFilter"
                                    options={statusFilterOptions}
                                    value={statusFilter}
                                    onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                                    width="md:w-[150px]"
                                    className="text-xs md:text-sm h-11!"
                                />
                            </>
                        )}
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            className="w-full md:max-w-sm"
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredBookings}
                    loading={loading}
                    emptyMessage="No bookings found."
                    pagination={{
                        page: currentPage,
                        totalPages: totalPages,
                        total: totalItems,
                        onPageChange: handlePageChange,
                    }}
                    selectable={false}
                />
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
                                    <div>
                                        <p className="text-sm text-gray-400">Contact</p>
                                        <p className="text-sm font-medium">{getCustomerPhone(selectedBooking)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Booking Type</p>
                                        <p className="text-sm font-medium">{getBookingType(selectedBooking)}</p>
                                    </div>
                                    {(role === "receptionist" || role === "admin") && (
                                        <div>
                                            <p className="text-sm text-gray-400">Created By</p>
                                            <p className="text-sm font-medium">{getCreatedByName(selectedBooking)}</p>
                                        </div>
                                    )}
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
                            <div className="border-t border-gray-700 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Created At</p>
                                        <p className="text-sm font-medium">{formatDateTime(selectedBooking.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Last Updated</p>
                                        <p className="text-sm font-medium">{formatDateTime(selectedBooking.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogBox>
                {/* Cancel Confirmation Dialog */}
                <DialogBox
                    open={cancelDialogOpen}
                    onOpenChange={setCancelDialogOpen}
                    title="Cancel Booking"
                    description="Are you sure you want to cancel this booking? This action cannot be undone."
                    showFooter
                    confirmText="Cancel Booking"
                    cancelText="Go Back"
                    onConfirm={handleCancelConfirm}
                    onCancel={() => setCancelDialogOpen(false)}
                    confirmLoading={cancelLoading}
                    variant="danger"
                />
                {/* Cancellation Penalty Dialog (Staff Only) */}
                <CancellationPenaltyDialog
                    open={penaltyDialogOpen}
                    onOpenChange={setPenaltyDialogOpen}
                    booking={selectedBooking}
                    penaltyAmount={penaltyAmount}
                    penaltyMessage={penaltyMessage}
                    onConfirm={handlePenaltyCancelConfirm}
                    loading={cancelLoading}
                />
                {/* Confirm Booking Dialog */}
                <DialogBox
                    open={confirmDialogOpen}
                    onOpenChange={setConfirmDialogOpen}
                    title="Confirm Booking"
                    description="Are you sure you want to confirm this booking? The guest will receive a confirmation email notification."
                    showFooter
                    confirmText="Confirm Booking"
                    cancelText="Go Back"
                    onConfirm={handleConfirmConfirm}
                    onCancel={() => setConfirmDialogOpen(false)}
                    confirmLoading={confirmLoading}
                    variant="success"
                />
                {/* Check In Dialog */}
                <DialogBox
                    open={checkInDialogOpen}
                    onOpenChange={setCheckInDialogOpen}
                    title="Check In Booking"
                    widthClass="max-w-xl"
                >
                    {selectedBooking && (
                        <CheckInForm
                            bookingId={selectedBooking._id}
                            onSuccess={() => {
                                setCheckInDialogOpen(false);
                                fetchBookings(currentPage);
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
                                fetchBookings(currentPage);
                            }}
                            onCancel={() => setCheckOutDialogOpen(false)}
                        />
                    )}
                </DialogBox>
            </div>
        </div>
    );
};

export default BookingsPage;

