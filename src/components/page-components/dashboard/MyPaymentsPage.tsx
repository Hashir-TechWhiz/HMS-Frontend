"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyPayments } from "@/services/paymentService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, CreditCard, Clock, CheckCircle, XCircle, Wallet } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const MyPaymentsPage = () => {
    const { role, loading: authLoading } = useAuth();

    const [paymentsData, setPaymentsData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

    const itemsPerPage = 10;

    // Fetch payments
    const fetchPayments = useCallback(async (page: number = 1) => {
        if (!role || authLoading || role !== "guest") return;

        try {
            setLoading(true);

            const response = await getMyPayments(page, itemsPerPage);

            if (response.success) {
                const data: any = response.data;

                if (data?.payments) {
                    setPaymentsData(data.payments);

                    if (data.pagination) {
                        setTotalPages(data.pagination.totalPages || 1);
                        setTotalItems(data.pagination.totalBookings || 0);
                    }
                }
            } else {
                toast.error(response.message || "Failed to fetch payments");
            }
        } catch {
            toast.error("An error occurred while fetching payments");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading]);

    // Initial fetch
    useEffect(() => {
        fetchPayments(currentPage);
    }, [fetchPayments, currentPage]);

    // Handle view details
    const handleViewDetails = (booking: any) => {
        setSelectedBooking(booking);
        setViewDialogOpen(true);
    };

    // Payment status badge
    const getPaymentStatusBadge = (status: string) => {
        switch (status) {
            case "paid":
                return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
            case "partially_paid":
                return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Partially Paid</Badge>;
            case "unpaid":
                return <Badge className="bg-red-300"><XCircle className="h-3 w-3 mr-1" />Unpaid</Badge>;
            default:
                return <Badge className="bg-gray-600">{status}</Badge>;
        }
    };

    // Booking status badge
    const getBookingStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            pending: "bg-yellow-600",
            confirmed: "bg-blue-600 text-white",
            checkedin: "bg-green-600",
            completed: "bg-gray-600",
            cancelled: "bg-red-600",
        };

        return (
            <Badge className={statusColors[status] || "bg-gray-600"}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Table columns
    const columns = [
        {
            key: "room",
            label: "Room",
            render: (booking: any) => (
                <div>
                    <p className="font-medium">{booking.room?.roomType}</p>
                    <p className="text-xs text-muted-foreground">Room {booking.room?.roomNumber}</p>
                </div>
            ),
        },
        {
            key: "dates",
            label: "Check-In / Check-Out",
            render: (booking: any) => (
                <div className="text-xs">
                    <p>{new Date(booking.checkInDate).toLocaleDateString()}</p>
                    <p className="text-muted-foreground">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                </div>
            ),
        },
        {
            key: "bookingStatus",
            label: "Booking Status",
            render: (booking: any) => getBookingStatusBadge(booking.bookingStatus),
        },
        {
            key: "totalAmount",
            label: "Total Amount",
            render: (booking: any) => (
                <span className="font-semibold">LKR {booking.totalAmount?.toLocaleString() || 0}</span>
            ),
        },
        {
            key: "totalPaid",
            label: "Paid",
            render: (booking: any) => (
                <span className="text-green-500">LKR {booking.totalPaid?.toLocaleString() || 0}</span>
            ),
        },
        {
            key: "balance",
            label: "Balance",
            render: (booking: any) => {
                const balance = (booking.totalAmount || 0) - (booking.totalPaid || 0);
                return (
                    <span className={balance > 0 ? "text-yellow-500" : "text-green-500"}>
                        LKR {balance.toLocaleString()}
                    </span>
                );
            },
        },
        {
            key: "paymentStatus",
            label: "Payment Status",
            render: (booking: any) => getPaymentStatusBadge(booking.paymentStatus),
        },
        {
            key: "actions",
            label: "Actions",
            render: (booking: any) => (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(booking)}
                    className="gap-1"
                >
                    <Eye className="h-3 w-3" />
                </Button>
            ),
        },
    ];

    // Loading state
    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">My Payments</h1>
                    <p className="text-muted-foreground mt-1">View your bookings and payment status</p>
                </div>
            </div>

            {/* Summary Cards */}
            {paymentsData.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-linear-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <Wallet className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Bookings</p>
                                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-linear-to-br from-green-500/10 to-green-600/10 border border-green-500/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <CheckCircle className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Fully Paid</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {paymentsData.filter(b => b.paymentStatus === 'paid').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 rounded-lg bg-linear-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                                <Clock className="h-5 w-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Payment</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {paymentsData.filter(b => b.paymentStatus !== 'paid').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <DataTable
                columns={columns}
                data={paymentsData}
                loading={loading}
                pagination={{
                    page: currentPage,
                    totalPages: totalPages,
                    total: totalItems,
                    onPageChange: setCurrentPage,
                }}
                emptyMessage="No bookings found"
                selectable={false}
            />

            {/* View Details Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Payment Details"
                description={`Booking ${selectedBooking?.bookingId?.toString().slice(-8)}`}
                showFooter={false}
                widthClass="max-w-2xl"
            >
                {selectedBooking && (
                    <div className="space-y-6 py-4">
                        {/* Booking Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Booking Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Room</p>
                                    <p className="font-medium">{selectedBooking.room?.roomType} - Room {selectedBooking.room?.roomNumber}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Booking Status</p>
                                    {getBookingStatusBadge(selectedBooking.bookingStatus)}
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Check-In</p>
                                    <p className="font-medium">{new Date(selectedBooking.checkInDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Check-Out</p>
                                    <p className="font-medium">{new Date(selectedBooking.checkOutDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Charges Breakdown */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Charges Breakdown</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-muted-foreground">Room Charges</span>
                                    <span className="font-medium">LKR {selectedBooking.roomCharges?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-muted-foreground">Service Charges</span>
                                    <span className="font-medium">LKR {selectedBooking.serviceCharges?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                                    <span className="font-semibold text-foreground">Total Amount</span>
                                    <span className="font-bold text-primary">LKR {selectedBooking.totalAmount?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>

                        {/* Service Details */}
                        {selectedBooking.serviceDetails && selectedBooking.serviceDetails.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-foreground">Service Requests</h3>
                                <div className="space-y-2">
                                    {selectedBooking.serviceDetails.map((service: any, index: number) => (
                                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-white/5 text-sm">
                                            <div>
                                                <p className="font-medium">{service.description}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(service.completedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className="font-medium">LKR {service.price?.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Summary */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-foreground">Payment Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-muted-foreground">Total Paid</span>
                                    <span className="font-medium text-green-500">LKR {selectedBooking.totalPaid?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-muted-foreground">Outstanding Balance</span>
                                    <span className={`font-medium ${selectedBooking.balance > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                                        LKR {selectedBooking.balance?.toLocaleString() || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between p-3 rounded-lg bg-white/5">
                                    <span className="text-muted-foreground">Payment Status</span>
                                    {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                                </div>
                            </div>
                        </div>

                        {/* Payment History */}
                        {selectedBooking.payments && selectedBooking.payments.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-foreground">Payment History</h3>
                                <div className="space-y-2">
                                    {selectedBooking.payments.map((payment: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm">
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                <div>
                                                    <p className="font-medium">LKR {payment.amount?.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDateTime(payment.paymentDate)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className="bg-green-600">{payment.paymentMethod}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Note for balance */}
                        {selectedBooking.balance > 0 && (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-yellow-400 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-semibold text-yellow-400 mb-1">
                                            Outstanding Balance
                                        </h4>
                                        <p className="text-xs text-gray-300">
                                            Please ensure the remaining balance of LKR {selectedBooking.balance?.toLocaleString()} is paid before checkout.
                                            Full payment is required to complete checkout.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogBox>
        </div>
    );
};

export default MyPaymentsPage;
