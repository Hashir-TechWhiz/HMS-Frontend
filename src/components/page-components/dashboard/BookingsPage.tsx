"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllBookings, getMyBookings, cancelBooking, confirmBooking } from "@/services/bookingService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Eye, XCircle, CheckCircle } from "lucide-react";

const BookingsPage = () => {
    const { role, loading: authLoading } = useAuth();

    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IBooking | null>(null);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    const itemsPerPage = 10;

    // Fetch bookings based on role
    const fetchBookings = useCallback(async (page: number = 1) => {
        if (!role || authLoading) return;

        try {
            setLoading(true);
            let response;

            if (role === "guest") {
                response = await getMyBookings(page, itemsPerPage);
            } else if (role === "receptionist" || role === "admin") {
                response = await getAllBookings(page, itemsPerPage);
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

                setBookings(bookingsArray);

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
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchBookings(currentPage);
        }
    }, [role, authLoading, currentPage, fetchBookings]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (booking: IBooking) => {
        setSelectedBooking(booking);
        setViewDialogOpen(true);
    };

    // Handle cancel booking
    const handleCancelClick = (booking: IBooking) => {
        setSelectedBooking(booking);
        setCancelDialogOpen(true);
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
            } else {
                toast.error(response.message || "Failed to confirm booking");
            }
        } catch {
            toast.error("An error occurred while confirming the booking");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Format date helper
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMM dd, yyyy");
        } catch {
            return dateString;
        }
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
            cancelled: "bg-red-500/20 text-red-400 border-red-500/50",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

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
            key: "checkInDate",
            label: "Check-in",
            render: (booking: IBooking) => formatDate(booking.checkInDate),
        },
        {
            key: "checkOutDate",
            label: "Check-out",
            render: (booking: IBooking) => formatDate(booking.checkOutDate),
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
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelClick(booking)}
                        disabled={booking.status === "cancelled"}
                        className="h-8 px-2"
                    >
                        <XCircle className="h-4 w-4" />
                    </Button>
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
            key: "checkInDate",
            label: "Check-in",
            render: (booking: IBooking) => formatDate(booking.checkInDate),
        },
        {
            key: "checkOutDate",
            label: "Check-out",
            render: (booking: IBooking) => formatDate(booking.checkOutDate),
        },
        {
            key: "bookingType",
            label: "Type",
            render: (booking: IBooking) => (
                <span className="text-sm">{getBookingType(booking)}</span>
            ),
        },
        {
            key: "createdBy",
            label: "Created By",
            render: (booking: IBooking) => (
                <span className="text-sm">{getCreatedByName(booking)}</span>
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
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelClick(booking)}
                        disabled={booking.status === "cancelled"}
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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">{pageTitle}</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        {role === "guest"
                            ? "View and manage your bookings"
                            : "View and manage all hotel bookings"}
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={bookings}
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
                                    <p className="text-sm font-medium">{formatDate(selectedBooking.checkInDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Check-out Date</p>
                                    <p className="text-sm font-medium">{formatDate(selectedBooking.checkOutDate)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Created At</p>
                                    <p className="text-sm font-medium">{formatDate(selectedBooking.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Last Updated</p>
                                    <p className="text-sm font-medium">{formatDate(selectedBooking.updatedAt)}</p>
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
        </div>
    );
};

export default BookingsPage;

