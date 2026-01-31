"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
    getFacilityBookings,
    confirmFacilityBooking,
    checkInFacilityBooking,
    checkOutFacilityBooking,
    cancelFacilityBooking
} from "@/services/publicFacilityBookingService";
import { getActiveHotels } from "@/services/hotelService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import StatCard from "@/components/common/StatCard";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, XCircle, CheckCircle, ClipboardList, CheckCircle2, Clock, Activity } from "lucide-react";
import { formatDateTime, normalizeDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { DateRange } from "react-day-picker";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const FacilityBookingsPage = () => {
    const { role, loading: authLoading, user } = useAuth();

    const [allBookings, setAllBookings] = useState<IPublicFacilityBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [bookingTypeFilter, setBookingTypeFilter] = useState<string>("all");
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [cancelWithPenaltyOpen, setCancelWithPenaltyOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
    const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IPublicFacilityBooking | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkOutLoading, setCheckOutLoading] = useState(false);

    // Cancel with penalty states
    const [cancellationReason, setCancellationReason] = useState("");
    const [cancellationPenalty, setCancellationPenalty] = useState(0);

    // Check-out states
    const [additionalCharges, setAdditionalCharges] = useState(0);

    const itemsPerPage = 10;

    // Fetch bookings based on role
    const fetchBookings = useCallback(async (page: number = 1) => {
        if (!role || authLoading) return;

        try {
            setLoading(true);

            // Normalize date range for API
            const { from, to } = normalizeDateRange(dateRange);

            const params: any = {
                page,
                limit: itemsPerPage,
            };

            if (from) params.from = from;
            if (to) params.to = to;

            const response = await getFacilityBookings(params);

            if (response.success) {
                const bookingsData: any = response.data;

                if (bookingsData.bookings && bookingsData.pagination) {
                    // Paginated response
                    setAllBookings(bookingsData.bookings);
                    setTotalPages(bookingsData.pagination.totalPages || 0);
                    setTotalItems(bookingsData.pagination.totalBookings || 0);
                } else if (Array.isArray(bookingsData)) {
                    // Array response
                    setAllBookings(bookingsData);
                    setTotalPages(bookingsData.length > 0 ? 1 : 0);
                    setTotalItems(bookingsData.length);
                } else {
                    setAllBookings([]);
                    setTotalPages(0);
                    setTotalItems(0);
                }
            } else {
                toast.error(response.message || "Failed to fetch facility bookings");
            }
        } catch (error) {
            console.error("Error fetching facility bookings:", error);
            toast.error("An error occurred while fetching facility bookings");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, dateRange]);

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
            fetchAvailableHotels();
        }
    }, [role, authLoading, currentPage, fetchBookings, fetchAvailableHotels]);

    // Handle date range change
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Calculate cancellation penalty
    const calculateCancellationPenalty = (booking: IPublicFacilityBooking): number => {
        const now = new Date();
        let bookingStartDate: Date;

        if (booking.bookingType === "hourly" && booking.bookingDate) {
            bookingStartDate = new Date(booking.bookingDate);
        } else if (booking.bookingType === "daily" && booking.startDate) {
            bookingStartDate = new Date(booking.startDate);
        } else {
            return 0;
        }

        // Calculate hours until booking starts
        const hoursUntilStart = (bookingStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        // Apply penalty rules
        if (hoursUntilStart > 24) {
            // More than 24 hours before start → no penalty
            return 0;
        } else if (hoursUntilStart > 0) {
            // Within 24 hours → 50% penalty
            return booking.totalAmount * 0.5;
        } else {
            // On or after start date → full amount (no refund)
            return booking.totalAmount;
        }
    };

    // Handle view details
    const handleViewDetails = (booking: IPublicFacilityBooking) => {
        setSelectedBooking(booking);
        setViewDialogOpen(true);
    };

    // Handle cancel booking
    const handleCancelClick = (booking: IPublicFacilityBooking) => {
        // Guests can only cancel bookings that are not yet confirmed
        if (role === "guest" && booking.status === "confirmed") {
            toast.error("You cannot cancel a confirmed booking. Please contact the hotel directly for assistance.");
            return;
        }

        setSelectedBooking(booking);

        // Staff cancelling confirmed bookings → show penalty dialog
        if ((role === "admin" || role === "receptionist") && booking.status === "confirmed") {
            const penalty = calculateCancellationPenalty(booking);
            setCancellationPenalty(penalty);
            setCancellationReason("");
            setCancelWithPenaltyOpen(true);
        } else {
            // Guest cancelling pending or staff cancelling pending → regular dialog
            setCancelDialogOpen(true);
        }
    };

    const handleCancelConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setCancelLoading(true);
            const response = await cancelFacilityBooking(selectedBooking._id);

            if (response.success) {
                toast.success("Facility booking cancelled successfully");
                setCancelDialogOpen(false);
                setSelectedBooking(null);
                fetchBookings(currentPage);
            } else {
                toast.error(response.message || "Failed to cancel facility booking");
            }
        } catch (error) {
            console.error("Error cancelling facility booking:", error);
            toast.error("An error occurred while cancelling the facility booking");
        } finally {
            setCancelLoading(false);
        }
    };

    const handleCancelWithPenaltyConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setCancelLoading(true);
            const response = await cancelFacilityBooking(
                selectedBooking._id,
                cancellationReason || undefined,
                cancellationPenalty
            );

            if (response.success) {
                if (cancellationPenalty > 0) {
                    toast.success(`Facility booking cancelled with penalty of LKR ${cancellationPenalty.toLocaleString()}`);
                } else {
                    toast.success("Facility booking cancelled successfully (no penalty)");
                }
                setCancelWithPenaltyOpen(false);
                setSelectedBooking(null);
                setCancellationReason("");
                setCancellationPenalty(0);
                fetchBookings(currentPage);
            } else {
                toast.error(response.message || "Failed to cancel facility booking");
            }
        } catch (error) {
            console.error("Error cancelling facility booking:", error);
            toast.error("An error occurred while cancelling the facility booking");
        } finally {
            setCancelLoading(false);
        }
    };

    // Handle confirm booking
    const handleConfirmClick = (booking: IPublicFacilityBooking) => {
        setSelectedBooking(booking);
        setConfirmDialogOpen(true);
    };

    const handleConfirmConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setConfirmLoading(true);
            const response = await confirmFacilityBooking(selectedBooking._id);

            if (response.success) {
                toast.success("Facility booking confirmed successfully!");
                setConfirmDialogOpen(false);
                setSelectedBooking(null);
                fetchBookings(currentPage);
            } else {
                toast.error(response.message || "Failed to confirm facility booking");
            }
        } catch (error) {
            console.error("Error confirming facility booking:", error);
            toast.error("An error occurred while confirming the facility booking");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Check if check-in is allowed
    const isCheckInAllowed = (booking: IPublicFacilityBooking): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let bookingStartDate: Date;
        if (booking.bookingType === "hourly" && booking.bookingDate) {
            bookingStartDate = new Date(booking.bookingDate);
        } else if (booking.bookingType === "daily" && booking.startDate) {
            bookingStartDate = new Date(booking.startDate);
        } else {
            return false;
        }

        bookingStartDate.setHours(0, 0, 0, 0);
        return today >= bookingStartDate;
    };

    // Handle check-in booking
    const handleCheckInClick = (booking: IPublicFacilityBooking) => {
        if (!isCheckInAllowed(booking)) {
            toast.error("Check-in is not allowed before the scheduled booking date");
            return;
        }
        setSelectedBooking(booking);
        setCheckInDialogOpen(true);
    };

    const handleCheckInConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setCheckInLoading(true);
            const response = await checkInFacilityBooking(selectedBooking._id);

            if (response.success) {
                toast.success("Facility booking checked in successfully!");
                setCheckInDialogOpen(false);
                setSelectedBooking(null);
                fetchBookings(currentPage);
            } else {
                toast.error(response.message || "Failed to check in facility booking");
            }
        } catch (error) {
            console.error("Error checking in facility booking:", error);
            toast.error("An error occurred while checking in the facility booking");
        } finally {
            setCheckInLoading(false);
        }
    };

    // Handle check-out booking
    const handleCheckOutClick = (booking: IPublicFacilityBooking) => {
        setSelectedBooking(booking);
        setAdditionalCharges(0);
        setCheckOutDialogOpen(true);
    };

    const handleCheckOutConfirm = async () => {
        if (!selectedBooking) return;

        try {
            setCheckOutLoading(true);
            const response = await checkOutFacilityBooking(
                selectedBooking._id,
                additionalCharges > 0 ? additionalCharges : undefined
            );

            if (response.success) {
                toast.success("Facility booking checked out successfully!");
                setCheckOutDialogOpen(false);
                setSelectedBooking(null);
                setAdditionalCharges(0);
                fetchBookings(currentPage);
            } else {
                toast.error(response.message || "Failed to check out facility booking");
            }
        } catch (error) {
            console.error("Error checking out facility booking:", error);
            toast.error("An error occurred while checking out the facility booking");
        } finally {
            setCheckOutLoading(false);
        }
    };

    // Get customer/guest name
    const getCustomerName = (booking: IPublicFacilityBooking): string => {
        // Check customer details first (backend always populates this for all bookings)
        if (booking.customerDetails?.name) {
            return booking.customerDetails.name;
        }
        // Check if guest is populated as an object with name
        if (booking.guest && typeof booking.guest === "object" && booking.guest.name) {
            return booking.guest.name;
        }
        // Fallback: If guest is viewing their own booking, use authenticated user's name
        if (role === "guest" && user && booking.guest) {
            return user.name;
        }
        return "N/A";
    };

    // Get customer/guest contact
    const getCustomerPhone = (booking: IPublicFacilityBooking): string => {
        // Check customer details first (backend always populates this for all bookings)
        if (booking.customerDetails?.phone) {
            return booking.customerDetails.phone;
        }
        // Check if guest is populated as an object
        if (booking.guest && typeof booking.guest === "object" && booking.guest.email) {
            return booking.guest.email;
        }
        // Fallback: If guest is viewing their own booking, use authenticated user's contact
        if (role === "guest" && user && booking.guest) {
            return user.email || "N/A";
        }
        return "N/A";
    };

    // Get customer email
    const getCustomerEmail = (booking: IPublicFacilityBooking): string => {
        // Check customer details first (backend always populates this for all bookings)
        if (booking.customerDetails?.email) {
            return booking.customerDetails.email;
        }
        // Check if guest is populated as an object with email
        if (booking.guest && typeof booking.guest === "object" && booking.guest.email) {
            return booking.guest.email;
        }
        // Fallback: If guest is viewing their own booking, use authenticated user's email
        if (role === "guest" && user && booking.guest) {
            return user.email || "N/A";
        }
        return "N/A";
    };

    // Get booking type label
    const getBookingTypeLabel = (booking: IPublicFacilityBooking): string => {
        return booking.guest ? "Online" : "Walk-in";
    };

    // Get created by name
    const getCreatedByName = (booking: IPublicFacilityBooking): string => {
        if (booking.createdBy && typeof booking.createdBy === "object") {
            return booking.createdBy.name;
        }
        return "N/A";
    };

    // Get facility name
    const getFacilityName = (booking: IPublicFacilityBooking): string => {
        if (booking.facility && typeof booking.facility === "object") {
            return booking.facility.name;
        }
        return "N/A";
    };

    // Get facility type
    const getFacilityType = (booking: IPublicFacilityBooking): string => {
        if (booking.facility && typeof booking.facility === "object") {
            return booking.facility.facilityType;
        }
        return "N/A";
    };

    // Get facility image
    const getFacilityImage = (booking: IPublicFacilityBooking): string => {
        if (booking.facility && typeof booking.facility === "object") {
            return booking.facility.images?.[0] || "";
        }
        return "";
    };

    // Get hotel name
    const getHotelName = (booking: IPublicFacilityBooking): string => {
        if (booking.hotelId && typeof booking.hotelId === "object") {
            return booking.hotelId.name;
        }
        return "N/A";
    };


    // Get booking date/time info
    const getBookingDateTimeInfo = (booking: IPublicFacilityBooking): string => {
        if (booking.bookingType === "hourly") {
            const date = formatDateTime(booking.bookingDate);
            return `${date} (${booking.startTime} - ${booking.endTime})`;
        } else {
            const start = formatDateTime(booking.startDate);
            const end = formatDateTime(booking.endDate);
            return `${start} to ${end}`;
        }
    };

    // Status badge
    const StatusBadge = ({ status }: { status: FacilityBookingStatus }) => {
        const colors = {
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
            confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            in_use: "bg-green-500/20 text-green-400 border-green-500/50",
            completed: "bg-green-500/20 text-green-400 border-green-500/50",
            cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
        };
        const labels = {
            pending: "Pending",
            confirmed: "Confirmed",
            in_use: "In Use",
            completed: "Completed",
            cancelled: "Cancelled",
        };
        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status] || ''}`}>
                {labels[status] || status}
            </span>
        );
    };

    // Payment status badge
    const PaymentStatusBadge = ({ status }: { status?: 'unpaid' | 'partially_paid' | 'paid' }) => {
        if (!status) return null;

        const colors = {
            paid: 'bg-green-500/20 text-green-400 border-green-500/50',
            partially_paid: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
            unpaid: 'bg-red-500/20 text-red-400 border-red-500/50'
        };

        const labels = {
            paid: 'Fully Paid',
            partially_paid: 'Partially Paid',
            unpaid: 'Unpaid'
        };

        return (
            <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    // Status filter options
    const statusFilterOptions: Option[] = [
        { value: "all", label: "All Bookings" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "in_use", label: "In Use" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" },
    ];

    // Booking type filter options
    const bookingTypeFilterOptions: Option[] = [
        { value: "all", label: "All Types" },
        { value: "hourly", label: "Hourly" },
        { value: "daily", label: "Daily" },
    ];

    // Filter bookings based on filters (client-side)
    const filteredBookings = useMemo(() => {
        let filtered = allBookings;

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((booking) => booking.status === statusFilter);
        }

        // Filter by booking type
        if (bookingTypeFilter !== "all") {
            filtered = filtered.filter((booking) => booking.bookingType === bookingTypeFilter);
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
    }, [allBookings, statusFilter, bookingTypeFilter, hotelFilter, role]);

    // Calculate KPI stats from filtered bookings
    const bookingStats = useMemo(() => {
        return {
            total: filteredBookings.length,
            pending: filteredBookings.filter(b => b.status === "pending").length,
            confirmed: filteredBookings.filter(b => b.status === "confirmed").length,
            inUse: filteredBookings.filter(b => b.status === "in_use").length,
            completed: filteredBookings.filter(b => b.status === "completed").length,
            cancelled: filteredBookings.filter(b => b.status === "cancelled").length,
        };
    }, [filteredBookings]);

    // Update total items when filtered bookings change
    useEffect(() => {
        setTotalItems(filteredBookings.length);
    }, [filteredBookings]);

    // Define columns based on role
    const guestColumns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (booking: IPublicFacilityBooking) => formatDateTime(booking.createdAt),
        },
        {
            key: "facility",
            label: "Facility",
            render: (booking: IPublicFacilityBooking) => (
                <div className="flex items-center gap-3">
                    {getFacilityImage(booking) && (
                        <Image
                            src={getFacilityImage(booking) || ''}
                            alt={getFacilityName(booking)}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded object-cover"
                        />
                    )}
                    <div>
                        <div className="font-medium">{getFacilityName(booking)}</div>
                        <div className="text-xs text-gray-400">{getFacilityType(booking)}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "bookingType",
            label: "Booking Type",
            render: (booking: IPublicFacilityBooking) => (
                <span className="text-sm capitalize">{booking.bookingType}</span>
            ),
        },
        {
            key: "dateTime",
            label: "Date/Time",
            render: (booking: IPublicFacilityBooking) => (
                <div className="text-sm">{getBookingDateTimeInfo(booking)}</div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (booking: IPublicFacilityBooking) => <StatusBadge status={booking.status} />,
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            render: (booking: IPublicFacilityBooking) => (
                <span className="font-medium">LKR {(booking.totalAmount || 0).toLocaleString()}</span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (booking: IPublicFacilityBooking) => (
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

                    {/* Cancel Button for Pending Bookings */}
                    <TooltipProvider>
                        <Tooltip>
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
                                            : booking.status === "in_use"
                                                ? "Cannot cancel in-use bookings."
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
            key: "createdAt",
            label: "Created Date",
            render: (booking: IPublicFacilityBooking) => formatDateTime(booking.createdAt),
        },
        {
            key: "facility",
            label: "Facility",
            render: (booking: IPublicFacilityBooking) => (
                <div className="flex items-center gap-3">
                    {getFacilityImage(booking) && (
                        <Image
                            src={getFacilityImage(booking) || ''}
                            alt={getFacilityName(booking)}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded object-cover"
                        />
                    )}
                    <div>
                        <div className="font-medium">{getFacilityName(booking)}</div>
                        <div className="text-xs text-gray-400">{getFacilityType(booking)}</div>
                    </div>
                </div>
            ),
        },
        {
            key: "customer",
            label: "Customer",
            render: (booking: IPublicFacilityBooking) => (
                <div>
                    <div className="font-medium">{getCustomerName(booking)}</div>
                    <div className="text-xs text-gray-400">{getCustomerPhone(booking)}</div>
                </div>
            ),
        },
        {
            key: "bookingType",
            label: "Type",
            render: (booking: IPublicFacilityBooking) => (
                <span className="text-sm capitalize">{booking.bookingType}</span>
            ),
        },
        {
            key: "dateTime",
            label: "Date/Time",
            render: (booking: IPublicFacilityBooking) => (
                <div className="text-sm">{getBookingDateTimeInfo(booking)}</div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (booking: IPublicFacilityBooking) => <StatusBadge status={booking.status} />,
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            render: (booking: IPublicFacilityBooking) => (
                <span className="font-medium">LKR {(booking.totalAmount || 0).toLocaleString()}</span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (booking: IPublicFacilityBooking) => (
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
                                        Check-in is only allowed on or after the scheduled booking date
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {booking.status === "in_use" && (
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
                        disabled={["cancelled", "in_use", "completed"].includes(booking.status)}
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
    const pageTitle = role === "guest" ? "My Facility Bookings" : "Facility Bookings";

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards - Only for Admin/Receptionist */}
            {(role === "receptionist" || role === "admin") && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <StatCard
                        title="Total Bookings"
                        value={bookingStats.total}
                        icon={ClipboardList}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                    />
                    <StatCard
                        title="Pending"
                        value={bookingStats.pending}
                        icon={Clock}
                        iconColor="text-yellow-400"
                        iconBg="bg-yellow-500/10"
                    />
                    <StatCard
                        title="Confirmed"
                        value={bookingStats.confirmed}
                        icon={CheckCircle2}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                    />
                    <StatCard
                        title="In Use"
                        value={bookingStats.inUse}
                        icon={Activity}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                    />
                    <StatCard
                        title="Completed"
                        value={bookingStats.completed}
                        icon={CheckCircle}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                    />
                    <StatCard
                        title="Cancelled"
                        value={bookingStats.cancelled}
                        icon={XCircle}
                        iconColor="text-red-400"
                        iconBg="bg-red-500/10"
                    />
                </div>
            )}
            {/* KPI Card for Guests - Show only total */}
            {role === "guest" && totalItems > 0 && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
                    <StatCard
                        title="My Facility Bookings"
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
                                ? "View and manage your facility bookings"
                                : "View and manage all facility bookings"}
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
                                        width="md:w-[350px]"
                                        className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-11!"
                                    />
                                )}
                                <SelectField
                                    name="statusFilter"
                                    options={statusFilterOptions}
                                    value={statusFilter}
                                    onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                                    width="md:w-[250px]"
                                    className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-11!"
                                />
                                {/* <SelectField
                                    name="bookingTypeFilter"
                                    options={bookingTypeFilterOptions}
                                    value={bookingTypeFilter}
                                    onChange={(v) => { setBookingTypeFilter(v); setCurrentPage(1); }}
                                    width="md:w-[250px]"
                                    className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-10!"
                                /> */}
                            </>
                        )}
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            className="w-full md:max-w-xs"
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={filteredBookings}
                    loading={loading}
                    emptyMessage="No facility bookings found."
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
                    title="Facility Booking Details"
                    widthClass="max-w-3xl"
                >
                    {selectedBooking && (
                        <div className="space-y-5 py-4">
                            {/* Header Section - Booking ID and Status */}
                            <div className="flex justify-between items-start pb-3 border-b border-gray-700">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Booking Reference</p>
                                    <p className="text-base font-mono font-semibold text-white">{selectedBooking._id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                    <StatusBadge status={selectedBooking.status} />
                                </div>
                            </div>

                            {/* Facility Information Section */}
                            <div className="bg-primary-900/10 border border-white/10 rounded-lg p-4">
                                <h3 className="text-sm font-semibold mb-3 text-primary-400 uppercase tracking-wider">Facility Information</h3>
                                <div className="space-y-3">
                                    {getFacilityImage(selectedBooking) && (
                                        <div className="mb-3">
                                            <Image
                                                src={getFacilityImage(selectedBooking) || ''}
                                                alt={getFacilityName(selectedBooking)}
                                                width={800}
                                                height={192}
                                                className="w-full h-48 rounded-lg object-cover"
                                            />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Facility Name</p>
                                            <p className="text-base font-semibold text-white">{getFacilityName(selectedBooking)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Facility Type</p>
                                            <p className="text-sm text-white">{getFacilityType(selectedBooking)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Hotel Name</p>
                                            <p className="text-sm text-white">{getHotelName(selectedBooking)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Information Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-gray-300">Customer Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Name</p>
                                        <p className="text-sm font-medium text-white">{getCustomerName(selectedBooking)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Phone</p>
                                        <p className="text-sm font-medium text-white">{getCustomerPhone(selectedBooking)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Email</p>
                                        <p className="text-sm font-medium text-white">{getCustomerEmail(selectedBooking)}</p>
                                    </div>
                                    {/* Show Booking Type only for staff */}
                                    {(role === "receptionist" || role === "admin") && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Booking Origin</p>
                                            <p className="text-sm font-medium text-white">{getBookingTypeLabel(selectedBooking)}</p>
                                        </div>
                                    )}
                                    {/* Show Created By only for staff */}
                                    {(role === "receptionist" || role === "admin") && selectedBooking.createdBy && (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Created By</p>
                                            <p className="text-sm font-medium text-white">{getCreatedByName(selectedBooking)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Booking Details Section */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 text-gray-300">Booking Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Booking Type</p>
                                        <p className="text-sm font-medium text-white capitalize">{selectedBooking.bookingType}</p>
                                    </div>
                                    {selectedBooking.bookingType === "hourly" ? (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Booking Date</p>
                                                <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.bookingDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Start Time</p>
                                                <p className="text-sm font-medium text-white">{selectedBooking.startTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">End Time</p>
                                                <p className="text-sm font-medium text-white">{selectedBooking.endTime}</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">Start Date</p>
                                                <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.startDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-400 mb-1">End Date</p>
                                                <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.endDate)}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment Information Section */}
                            <div className="bg-green-900/10 border border-green-500/20 rounded-lg p-4">
                                <h3 className="text-sm font-semibold mb-3 text-green-400 uppercase tracking-wider">Payment Information</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Base Charge</p>
                                            <p className="text-sm font-medium text-white">LKR {(selectedBooking.baseCharge || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Additional Charges</p>
                                            <p className="text-sm font-medium text-white">LKR {(selectedBooking.additionalCharges || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                                            <p className="text-base font-semibold text-white">LKR {(selectedBooking.totalAmount || 0).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Amount Paid</p>
                                            <p className="text-base font-semibold text-green-400">LKR {(selectedBooking.totalPaid || 0).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    {selectedBooking.totalPaid !== undefined && selectedBooking.totalAmount !== undefined && (
                                        <div className="pt-3 border-t border-green-500/20">
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-gray-400">Outstanding Balance</p>
                                                <p className={`text-base font-bold ${(selectedBooking.totalAmount - selectedBooking.totalPaid) > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                                                    LKR {(selectedBooking.totalAmount - selectedBooking.totalPaid).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <p className="text-xs text-gray-400">Payment Status</p>
                                                <PaymentStatusBadge status={selectedBooking.paymentStatus} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Check-in/Check-out Details */}
                            {(selectedBooking.checkInDetails || selectedBooking.checkOutDetails) && (
                                <div className="pt-3 border-t border-gray-700">
                                    <h3 className="text-sm font-semibold mb-3 text-gray-300">Activity Timeline</h3>
                                    <div className="space-y-3">
                                        {selectedBooking.checkInDetails && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">Checked In At</p>
                                                    <p className="text-sm font-medium text-white">
                                                        {formatDateTime(selectedBooking.checkInDetails.checkedInAt, { hideTime: false })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">Checked In By</p>
                                                    <p className="text-sm font-medium text-white">
                                                        {typeof selectedBooking.checkInDetails.checkedInBy === 'object'
                                                            ? selectedBooking.checkInDetails.checkedInBy.name
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        {selectedBooking.checkOutDetails && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">Checked Out At</p>
                                                    <p className="text-sm font-medium text-white">
                                                        {formatDateTime(selectedBooking.checkOutDetails.checkedOutAt, { hideTime: false })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 mb-1">Checked Out By</p>
                                                    <p className="text-sm font-medium text-white">
                                                        {typeof selectedBooking.checkOutDetails.checkedOutBy === 'object'
                                                            ? selectedBooking.checkOutDetails.checkedOutBy.name
                                                            : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Booking Timeline Section */}
                            <div className="pt-3 border-t border-gray-700">
                                <h3 className="text-sm font-semibold mb-3 text-gray-300">Booking Timeline</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Booked On</p>
                                        <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.createdAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                                        <p className="text-sm font-medium text-white">{formatDateTime(selectedBooking.updatedAt)}</p>
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
                    title="Cancel Facility Booking"
                    description="Are you sure you want to cancel this facility booking? This action cannot be undone."
                    showFooter
                    confirmText="Cancel Booking"
                    cancelText="Go Back"
                    onConfirm={handleCancelConfirm}
                    onCancel={() => setCancelDialogOpen(false)}
                    confirmLoading={cancelLoading}
                    variant="danger"
                />

                {/* Cancel with Penalty Dialog (Staff Only) */}
                <DialogBox
                    open={cancelWithPenaltyOpen}
                    onOpenChange={setCancelWithPenaltyOpen}
                    title="Cancel Facility Booking with Penalty"
                    widthClass="max-w-md"
                >
                    <div className="space-y-4 py-4">
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                            <p className="text-sm text-yellow-200 mb-2">
                                Cancelling a confirmed facility booking may incur a penalty based on the cancellation policy.
                            </p>
                            <div className="mt-3">
                                <p className="text-xs text-gray-400 mb-1">Calculated Penalty</p>
                                <p className="text-2xl font-bold text-yellow-400">
                                    LKR {cancellationPenalty.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Cancellation Reason
                            </label>
                            <Textarea
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Enter reason for cancellation (optional)"
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Adjust Penalty Amount (if needed)
                            </label>
                            <Input
                                type="number"
                                value={cancellationPenalty}
                                onChange={(e) => setCancellationPenalty(Number(e.target.value))}
                                min={0}
                                className="w-full"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleCancelWithPenaltyConfirm}
                                disabled={cancelLoading}
                                className="flex-1 bg-red-600 hover:bg-red-700"
                            >
                                {cancelLoading ? "Cancelling..." : "Confirm Cancellation"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setCancelWithPenaltyOpen(false);
                                    setCancellationReason("");
                                }}
                                variant="outline"
                                disabled={cancelLoading}
                                className="flex-1"
                            >
                                Go Back
                            </Button>
                        </div>
                    </div>
                </DialogBox>

                {/* Confirm Booking Dialog */}
                <DialogBox
                    open={confirmDialogOpen}
                    onOpenChange={setConfirmDialogOpen}
                    title="Confirm Facility Booking"
                    description="Are you sure you want to confirm this facility booking? The customer will receive a confirmation notification."
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
                    title="Check In Facility Booking"
                    description="Are you sure you want to check in this facility booking? This will mark the facility as in use."
                    showFooter
                    confirmText="Check In"
                    cancelText="Go Back"
                    onConfirm={handleCheckInConfirm}
                    onCancel={() => setCheckInDialogOpen(false)}
                    confirmLoading={checkInLoading}
                    variant="success"
                />

                {/* Check Out Dialog */}
                <DialogBox
                    open={checkOutDialogOpen}
                    onOpenChange={setCheckOutDialogOpen}
                    title="Check Out Facility Booking"
                    widthClass="max-w-md"
                >
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-gray-300">
                            Check out this facility booking and optionally add any additional charges.
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Additional Charges (Optional)
                            </label>
                            <Input
                                type="number"
                                value={additionalCharges}
                                onChange={(e) => setAdditionalCharges(Number(e.target.value))}
                                min={0}
                                placeholder="Enter additional charges if any"
                                className="w-full"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                                For damages, extra hours, or other charges
                            </p>
                        </div>

                        {selectedBooking && (
                            <div className="bg-primary-900/20 border border-primary-500/30 rounded-lg p-3">
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Base Amount:</span>
                                        <span className="text-white font-medium">
                                            LKR {(selectedBooking.totalAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    {additionalCharges > 0 && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-gray-400">Additional Charges:</span>
                                                <span className="text-white font-medium">
                                                    LKR {additionalCharges.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-2 border-t border-gray-600">
                                                <span className="text-gray-300 font-semibold">Final Total:</span>
                                                <span className="text-green-400 font-bold">
                                                    LKR {((selectedBooking.totalAmount || 0) + additionalCharges).toLocaleString()}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleCheckOutConfirm}
                                disabled={checkOutLoading}
                                className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                                {checkOutLoading ? "Checking Out..." : "Confirm Check Out"}
                            </Button>
                            <Button
                                onClick={() => {
                                    setCheckOutDialogOpen(false);
                                    setAdditionalCharges(0);
                                }}
                                variant="outline"
                                disabled={checkOutLoading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogBox>
            </div>
        </div>
    );
};

export default FacilityBookingsPage;
