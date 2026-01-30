"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle, Calendar, DollarSign, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getMyPayments, MyPaymentsResponse } from "@/services/paymentService";
import PaymentStatusBadge from "@/components/common/PaymentStatusBadge";
import { MakePaymentDialog } from "@/components/page-components/dashboard";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

const PaymentsPage = () => {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [paymentsData, setPaymentsData] = useState<MyPaymentsResponse | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const response = await getMyPayments(currentPage, itemsPerPage);

            if (response.success && response.data) {
                setPaymentsData(response.data);
            } else {
                toast.error(response.message || "Failed to load payments");
            }
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, [currentPage]);

    const handleMakePayment = (booking: any) => {
        setSelectedBooking(booking);
        setShowPaymentDialog(true);
    };

    const handlePaymentSuccess = () => {
        setShowPaymentDialog(false);
        setSelectedBooking(null);
        toast.success("Payment recorded successfully!");
        fetchPayments(); // Refresh the list
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString()}`;
    };

    // Calculate correct total from charges
    const calculateBookingTotal = (booking: any) => {
        const roomCharges = booking.roomCharges || 0;
        let serviceCharges = 0;

        // Sum all individual service charges if available
        if (booking.serviceDetails && booking.serviceDetails.length > 0) {
            serviceCharges = booking.serviceDetails.reduce((sum: number, service: any) => {
                return sum + (service.price || 0);
            }, 0);
        } else {
            serviceCharges = booking.serviceCharges || 0;
        }

        return roomCharges + serviceCharges;
    };

    // Calculate correct balance
    const calculateBalance = (booking: any) => {
        const total = calculateBookingTotal(booking);
        const paid = booking.totalPaid || 0;
        return total - paid;
    };

    const getTotalOutstanding = () => {
        if (!paymentsData) return 0;
        return paymentsData.payments.reduce((sum, booking) => sum + calculateBalance(booking), 0);
    };

    const getBookingsByStatus = () => {
        if (!paymentsData) return { unpaid: 0, partially_paid: 0, paid: 0 };

        return paymentsData.payments.reduce(
            (acc, booking) => {
                acc[booking.paymentStatus]++;
                return acc;
            },
            { unpaid: 0, partially_paid: 0, paid: 0 } as Record<PaymentStatus, number>
        );
    };

    const statusCounts = getBookingsByStatus();

    if (loading && !paymentsData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Payments</h1>
                        <p className="text-muted-foreground">
                            Manage your booking payments and view payment history
                        </p>
                    </div>
                    <Button
                        onClick={fetchPayments}
                        variant="outline"
                        className="border-white/20 hover:bg-white/10"
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="table-bg-gradient border border-white/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Outstanding</p>
                                    <p className="text-2xl font-bold text-red-500">
                                        {formatCurrency(getTotalOutstanding())}
                                    </p>
                                </div>
                                <DollarSign className="h-10 w-10 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="table-bg-gradient border border-white/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Unpaid Bookings</p>
                                    <p className="text-2xl font-bold text-foreground">{statusCounts.unpaid}</p>
                                </div>
                                <AlertCircle className="h-10 w-10 text-red-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="table-bg-gradient border border-white/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Partially Paid</p>
                                    <p className="text-2xl font-bold text-foreground">{statusCounts.partially_paid}</p>
                                </div>
                                <Calendar className="h-10 w-10 text-yellow-500/50" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="table-bg-gradient border border-white/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Paid Bookings</p>
                                    <p className="text-2xl font-bold text-foreground">{statusCounts.paid}</p>
                                </div>
                                <CreditCard className="h-10 w-10 text-green-500/50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bookings List */}
                <Card className="table-bg-gradient border border-white/20">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-foreground">
                            My Bookings & Payments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentsData && paymentsData.payments.length > 0 ? (
                            <div className="space-y-4">
                                {paymentsData.payments.map((booking) => {
                                    const room = booking.room as IRoom;
                                    return (
                                        <div
                                            key={booking.bookingId}
                                            className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
                                        >
                                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                                {/* Booking Info */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h3 className="font-semibold text-foreground">
                                                            {room.roomType} Room {room.roomNumber}
                                                        </h3>
                                                        <PaymentStatusBadge status={booking.paymentStatus} />
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                            {format(new Date(booking.checkInDate), "MMM dd")} - {format(new Date(booking.checkOutDate), "MMM dd, yyyy")}
                                                        </span>
                                                        <span>•</span>
                                                        <span>Status: {booking.bookingStatus}</span>
                                                    </div>
                                                </div>

                                                {/* Payment Summary */}
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                                    <div className="space-y-1 text-sm">
                                                        {/* Breakdown of charges */}
                                                        {(booking.roomCharges > 0 || booking.serviceCharges > 0 || (booking.serviceDetails && booking.serviceDetails.length > 0)) && (
                                                            <>
                                                                {booking.roomCharges > 0 && (
                                                                    <div className="flex justify-between gap-8 text-xs text-muted-foreground">
                                                                        <span>Room Charges:</span>
                                                                        <span>{formatCurrency(booking.roomCharges)}</span>
                                                                    </div>
                                                                )}
                                                                {booking.serviceDetails && booking.serviceDetails.length > 0 ? (
                                                                    <>
                                                                        {booking.serviceDetails.map((service: any, idx: number) => (
                                                                            <div key={idx} className="flex justify-between gap-8 text-xs text-muted-foreground pl-2">
                                                                                <span>• {service.description}:</span>
                                                                                <span>{formatCurrency(service.price)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </>
                                                                ) : booking.serviceCharges > 0 && (
                                                                    <div className="flex justify-between gap-8 text-xs text-muted-foreground">
                                                                        <span>Service Charges:</span>
                                                                        <span>{formatCurrency(booking.serviceCharges)}</span>
                                                                    </div>
                                                                )}
                                                                <div className="border-t border-white/10 my-1"></div>
                                                            </>
                                                        )}
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-muted-foreground">Total:</span>
                                                            <span className="font-semibold text-foreground">
                                                                {formatCurrency(calculateBookingTotal(booking))}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-muted-foreground">Paid:</span>
                                                            <span className="font-semibold text-green-500">
                                                                {formatCurrency(booking.totalPaid)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between gap-8">
                                                            <span className="text-muted-foreground">Balance:</span>
                                                            <span className={`font-bold ${calculateBalance(booking) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {formatCurrency(calculateBalance(booking))}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Action Button */}
                                                    {calculateBalance(booking) > 0 && booking.bookingStatus !== "cancelled" && (
                                                        <Button
                                                            onClick={() => handleMakePayment(booking)}
                                                            className="bg-primary hover:bg-primary/90 text-white"
                                                            size="sm"
                                                        >
                                                            <CreditCard className="h-4 w-4 mr-2" />
                                                            Make Payment
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Payment History Preview */}
                                            {booking.payments.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-white/10">
                                                    <p className="text-xs text-muted-foreground mb-2">
                                                        Recent Payments ({booking.payments.length})
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {booking.payments.slice(0, 3).map((payment, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10"
                                                            >
                                                                {formatCurrency(payment.amount)} - {payment.paymentMethod} - {format(new Date(payment.paymentDate), "MMM dd")}
                                                            </div>
                                                        ))}
                                                        {booking.payments.length > 3 && (
                                                            <div className="text-xs px-2 py-1 text-muted-foreground">
                                                                +{booking.payments.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">No Bookings Found</h3>
                                <p className="text-muted-foreground mb-4">
                                    You don't have any bookings yet. Start by booking a room!
                                </p>
                                <Button
                                    onClick={() => window.location.href = "/rooms"}
                                    className="main-button-gradient"
                                >
                                    Browse Rooms
                                </Button>
                            </div>
                        )}

                        {/* Pagination */}
                        {paymentsData && paymentsData.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                                <p className="text-sm text-muted-foreground">
                                    Page {paymentsData.pagination.currentPage} of {paymentsData.pagination.totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1 || loading}
                                        variant="outline"
                                        size="sm"
                                        className="border-white/20 hover:bg-white/10"
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={() => setCurrentPage((prev) => Math.min(paymentsData.pagination.totalPages, prev + 1))}
                                        disabled={currentPage === paymentsData.pagination.totalPages || loading}
                                        variant="outline"
                                        size="sm"
                                        className="border-white/20 hover:bg-white/10"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Make Payment Dialog */}
            {selectedBooking && (
                <MakePaymentDialog
                    open={showPaymentDialog}
                    onOpenChange={setShowPaymentDialog}
                    bookingId={selectedBooking.bookingId}
                    totalAmount={calculateBookingTotal(selectedBooking)}
                    totalPaid={selectedBooking.totalPaid}
                    balance={calculateBalance(selectedBooking)}
                    roomCharges={selectedBooking.roomCharges || 0}
                    serviceCharges={selectedBooking.serviceCharges || 0}
                    serviceDetails={selectedBooking.serviceDetails || []}
                    onPaymentSuccess={handlePaymentSuccess}
                    allowCash={false} // Guests can only pay by card
                />
            )}
        </div>
    );
};

export default PaymentsPage;
