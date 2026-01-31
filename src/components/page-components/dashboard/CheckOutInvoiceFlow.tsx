"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { generateInvoice, getInvoiceByBookingId, updatePaymentStatus, downloadInvoicePDF, IInvoice } from "@/services/invoiceService";
import { checkOutBooking, getBookingById } from "@/services/bookingService";
import { toast } from "sonner";
import { FileText, CreditCard, CheckCircle2, Loader2, Printer, Receipt, AlertCircle, DollarSign } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import CheckoutPaymentDialog from "./CheckoutPaymentDialog";
import { Separator } from "@/components/ui/separator";

interface CheckOutInvoiceFlowProps {
    bookingId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckOutInvoiceFlow = ({ bookingId, onSuccess, onCancel }: CheckOutInvoiceFlowProps) => {
    const { role } = useAuth();
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<IInvoice | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [booking, setBooking] = useState<IBooking | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    const fetchBookingAndInvoice = async () => {
        try {
            setLoading(true);

            // Fetch booking details to check payment status
            const bookingResponse = await getBookingById(bookingId);
            if (bookingResponse.success && bookingResponse.data) {
                setBooking(bookingResponse.data);
            } else {
                toast.error("Failed to load booking details");
                return;
            }

            // Fetch invoice if it exists
            const invoiceResponse = await getInvoiceByBookingId(bookingId);
            if (invoiceResponse.success && invoiceResponse.data) {
                setInvoice(invoiceResponse.data);
            } else {
                // Invoice not found is expected - guest hasn't generated it yet
                // Don't show error toast, just set invoice to null
                setInvoice(null);
            }
        } catch (error) {
            // Silent fail - invoice not found is expected behavior
            console.log("No invoice found for this booking (expected on first checkout attempt)");
            setInvoice(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookingAndInvoice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingId]);

    const handleGenerateInvoice = async () => {
        try {
            setActionLoading(true);
            const response = await generateInvoice(bookingId);
            if (response.success && response.data) {
                toast.success("Invoice generated successfully!");
                setInvoice(response.data);
            } else {
                toast.error(response.message || "Failed to generate invoice");
            }
        } catch (error) {
            toast.error("An error occurred during invoice generation");
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!invoice) return;
        try {
            setActionLoading(true);
            const response = await updatePaymentStatus(invoice._id, {
                paymentStatus: 'paid'
            });
            if (response.success && response.data) {
                toast.success("Payment confirmed!");
                setInvoice(response.data);
            } else {
                toast.error(response.message || "Failed to update payment status");
            }
        } catch (error) {
            toast.error("An error occurred during payment update");
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmCheckOut = async () => {
        // Check if booking data is loaded
        if (!booking) {
            toast.error("Booking details not loaded");
            return;
        }

        // Calculate outstanding balance
        const totalAmount = booking.totalAmount || 0;
        const totalPaid = booking.totalPaid || 0;
        const outstandingBalance = totalAmount - totalPaid;

        // If there's an outstanding balance, show payment dialog first
        if (outstandingBalance > 0) {
            setShowPaymentDialog(true);
            return;
        }

        // Proceed with checkout if fully paid
        try {
            setActionLoading(true);
            const response = await checkOutBooking(bookingId);
            if (response.success) {
                toast.success("Checked out successfully!");
                onSuccess();
            } else {
                toast.error(response.message || "Failed to check out");
            }
        } catch (error) {
            toast.error("An error occurred during check-out");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        // Close payment dialog
        setShowPaymentDialog(false);

        // Refresh booking data to get updated payment status
        await fetchBookingAndInvoice();

        // Show success message
        toast.success("Payment processed successfully! You can now complete checkout.");

        // Automatically proceed with checkout after payment
        try {
            setActionLoading(true);
            const response = await checkOutBooking(bookingId);
            if (response.success) {
                toast.success("Checked out successfully!");
                onSuccess();
            } else {
                toast.error(response.message || "Failed to check out");
            }
        } catch (error) {
            toast.error("An error occurred during check-out");
        } finally {
            setActionLoading(false);
        }
    };

    const handlePrintInvoice = async () => {
        if (!invoice) return;
        try {
            setActionLoading(true);
            await downloadInvoicePDF(invoice._id, invoice.invoiceNumber);
            toast.success("Invoice downloaded successfully!");
        } catch (error) {
            toast.error("Failed to download invoice");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                    <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                </div>
                <div className="text-center space-y-1">
                    <p className="text-base font-medium text-foreground">Loading Booking Details</p>
                    <p className="text-sm text-muted-foreground">Please wait...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        // Calculate outstanding balance if booking data is loaded
        const totalAmount = booking?.totalAmount || 0;
        const totalPaid = booking?.totalPaid || 0;
        const outstandingBalance = totalAmount - totalPaid;

        return (
            <>
                <div className="py-6 space-y-6">
                    {/* Header Section */}
                    <div className="text-center space-y-3 pb-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20">
                            <Receipt className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold text-foreground">Ready for Checkout</h3>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Final invoice will be generated automatically during checkout process
                            </p>
                        </div>
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Payment Summary Section */}
                    {booking && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-primary" />
                                Payment Summary
                            </h4>

                            <div className="space-y-3">
                                {/* Total Amount */}
                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                                    <span className="text-sm text-muted-foreground">Total Amount</span>
                                    <span className="text-base font-semibold text-foreground">
                                        LKR {totalAmount.toLocaleString()}
                                    </span>
                                </div>

                                {/* Amount Paid */}
                                <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                                    <span className="text-sm text-muted-foreground">Amount Paid</span>
                                    <span className="text-base font-semibold text-green-500">
                                        LKR {totalPaid.toLocaleString()}
                                    </span>
                                </div>

                                {/* Outstanding Balance */}
                                {outstandingBalance > 0 ? (
                                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                        <div className="flex items-start gap-3 mb-3">
                                            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-yellow-400 mb-1">
                                                    Payment Required
                                                </p>
                                                <p className="text-xs text-gray-300">
                                                    Outstanding balance must be settled before checkout
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t border-yellow-500/20">
                                            <span className="text-sm font-semibold text-yellow-400">Outstanding Balance</span>
                                            <span className="text-xl font-bold text-yellow-400">
                                                LKR {outstandingBalance.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-green-400">
                                                    Fully Paid
                                                </p>
                                                <p className="text-xs text-gray-300">
                                                    No outstanding balance. Ready for checkout.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <Separator className="bg-white/10" />

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            variant="outline"
                            onClick={onCancel}
                            disabled={actionLoading}
                            className="flex-1 border-gray-700 hover:bg-gray-800 h-10"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmCheckOut}
                            disabled={actionLoading}
                            className="flex-1 main-button-gradient"
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    {outstandingBalance > 0 ? "Settle Balance & Checkout" : "Generate Invoice & Checkout"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Checkout Payment Dialog */}
                {booking && (
                    <CheckoutPaymentDialog
                        open={showPaymentDialog}
                        onOpenChange={setShowPaymentDialog}
                        bookingId={bookingId}
                        outstandingBalance={outstandingBalance}
                        totalAmount={totalAmount}
                        totalPaid={totalPaid}
                        onPaymentSuccess={handlePaymentSuccess}
                        onCancel={() => setShowPaymentDialog(false)}
                        userRole={role}
                    />
                )}
            </>
        );
    }

    const isPaid = invoice.paymentStatus === 'paid';

    // Calculate outstanding balance
    const totalAmount = booking?.totalAmount || 0;
    const totalPaid = booking?.totalPaid || 0;
    const outstandingBalance = totalAmount - totalPaid;

    return (
        <>
            <div className="space-y-6 py-6">
                {/* Invoice Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">
                                Invoice #{invoice.invoiceNumber}
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Generated on {formatDateTime(invoice.createdAt)}
                        </p>
                    </div>
                    <Badge
                        className={
                            isPaid
                                ? "bg-green-500/20 text-green-400 border-green-500/50"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
                        }
                    >
                        {isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                </div>

                <Separator className="bg-white/10" />

                {/* Invoice Details Card */}
                <div className="rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                    {/* Charges Breakdown */}
                    <div className="p-5 space-y-4">
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            Charges Breakdown
                        </h4>

                        {/* Room Charges */}
                        <div className="flex justify-between items-center py-3 border-b border-white/5">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium text-foreground">Room Charges</p>
                                <p className="text-xs text-muted-foreground">
                                    {invoice.roomCharges?.numberOfNights || 0} {(invoice.roomCharges?.numberOfNights || 0) === 1 ? 'night' : 'nights'}
                                </p>
                            </div>
                            <span className="text-base font-semibold text-foreground">
                                LKR {(invoice.roomCharges?.subtotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        {/* Service Charges */}
                        {invoice.serviceCharges && invoice.serviceCharges.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                                    Additional Services
                                </p>
                                <div className="space-y-2 pl-3">
                                    {invoice.serviceCharges.map((service, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2">
                                            <span className="text-sm text-muted-foreground">
                                                {service.description || service.serviceType}
                                            </span>
                                            <span className="text-sm font-medium text-foreground">
                                                LKR {(service.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Total Amount Section */}
                    <div className="px-5 py-4 bg-primary/5 border-t border-white/10">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-semibold text-foreground">Total Amount</span>
                            <span className="text-2xl font-bold text-primary">
                                LKR {(invoice.summary?.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Payment Summary Section */}
                {booking && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Payment Status
                        </h4>

                        <div className="space-y-3">
                            {/* Amount Paid */}
                            <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                                <span className="text-sm text-muted-foreground">Amount Paid</span>
                                <span className="text-base font-semibold text-green-500">
                                    LKR {totalPaid.toLocaleString()}
                                </span>
                            </div>

                            {/* Outstanding Balance */}
                            {outstandingBalance > 0 ? (
                                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                    <div className="flex items-start gap-3 mb-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-yellow-400 mb-1">
                                                Payment Required
                                            </p>
                                            <p className="text-xs text-gray-300">
                                                Balance must be settled before checkout
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-yellow-500/20">
                                        <span className="text-sm font-semibold text-yellow-400">Outstanding Balance</span>
                                        <span className="text-xl font-bold text-yellow-400">
                                            LKR {outstandingBalance.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-green-400">
                                                Fully Paid
                                            </p>
                                            <p className="text-xs text-gray-300">
                                                No outstanding balance. Ready for checkout.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <Separator className="bg-white/10" />

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Settle Balance Button (if needed) */}
                    {outstandingBalance > 0 && (
                        <Button
                            onClick={() => setShowPaymentDialog(true)}
                            disabled={actionLoading}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white h-11"
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Settle Outstanding Balance
                        </Button>
                    )}

                    {/* Print & Checkout Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            onClick={handlePrintInvoice}
                            disabled={actionLoading}
                            variant="outline"
                            className="flex-1 border-gray-700 hover:bg-gray-800 h-11"
                        >
                            <Printer className="h-4 w-4 mr-2" />
                            Download Invoice
                        </Button>

                        <Button
                            onClick={handleConfirmCheckOut}
                            disabled={actionLoading || outstandingBalance > 0}
                            className="flex-1 bg-primary hover:bg-primary/90 text-white h-11"
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Complete Checkout
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Cancel Button */}
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={actionLoading}
                        className="w-full text-muted-foreground hover:text-foreground"
                    >
                        Close
                    </Button>
                </div>
            </div>

            {/* Checkout Payment Dialog */}
            {booking && (
                <CheckoutPaymentDialog
                    open={showPaymentDialog}
                    onOpenChange={setShowPaymentDialog}
                    bookingId={bookingId}
                    outstandingBalance={outstandingBalance}
                    totalAmount={totalAmount}
                    totalPaid={totalPaid}
                    onPaymentSuccess={handlePaymentSuccess}
                    onCancel={() => setShowPaymentDialog(false)}
                    userRole={role}
                />
            )}
        </>
    );
};

export default CheckOutInvoiceFlow;
