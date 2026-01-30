"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { generateInvoice, getInvoiceByBookingId, updatePaymentStatus, downloadInvoicePDF, IInvoice } from "@/services/invoiceService";
import { checkOutBooking, getBookingById } from "@/services/bookingService";
import { getBookingPayments, BookingPaymentsResponse } from "@/services/paymentService";
import { toast } from "sonner";
import { FileText, CreditCard, CheckCircle2, Loader2, Printer, AlertCircle, DollarSign } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MakePaymentDialog } from "@/components/page-components/dashboard";
import { useAuth } from "@/contexts/AuthContext";

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
    const [paymentData, setPaymentData] = useState<BookingPaymentsResponse | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);

    // Check if user is staff (can use cash payments)
    const isStaff = role === "receptionist" || role === "admin";

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch payment data first (always available)
            const paymentsResponse = await getBookingPayments(bookingId);
            if (paymentsResponse.success && paymentsResponse.data) {
                setPaymentData(paymentsResponse.data);
            }
            
            // Then try to fetch invoice (may not exist yet)
            const invoiceResponse = await getInvoiceByBookingId(bookingId);
            if (invoiceResponse.success && invoiceResponse.data) {
                setInvoice(invoiceResponse.data);
            } else {
                setInvoice(null);
            }
        } catch (error) {
            console.log("Error fetching checkout data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
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
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-400">Loading invoice details...</p>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString()}`;
    };

    // Calculate correct total from individual charges
    const calculateTotal = () => {
        if (!paymentData) return 0;
        const roomCharges = paymentData.roomCharges || 0;
        let serviceCharges = 0;

        // Sum all individual service charges if available
        if (paymentData.serviceDetails && paymentData.serviceDetails.length > 0) {
            serviceCharges = paymentData.serviceDetails.reduce((sum, service) => {
                return sum + (service.price || 0);
            }, 0);
        } else {
            serviceCharges = paymentData.serviceCharges || 0;
        }

        return roomCharges + serviceCharges;
    };

    const totalAmount = calculateTotal();
    const totalPaid = paymentData?.totalPaid || 0;
    const balance = totalAmount - totalPaid;
    const hasUnpaidBalance = balance > 0;

    if (!invoice) {
        return (
            <div className="py-6 space-y-6">
                {/* Payment Summary Card */}
                {paymentData && (
                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">Payment Summary</h3>
                        </div>

                        <div className="space-y-3">
                            {/* Room Charges */}
                            {paymentData.roomCharges > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Room Charges</span>
                                    <span className="text-foreground font-medium">{formatCurrency(paymentData.roomCharges)}</span>
                                </div>
                            )}

                            {/* Service Charges Breakdown */}
                            {paymentData.serviceDetails && paymentData.serviceDetails.length > 0 && (
                                <div className="space-y-2 pl-3 border-l-2 border-white/10">
                                    <div className="text-xs font-medium text-muted-foreground">Service Charges:</div>
                                    {paymentData.serviceDetails.map((service, index) => (
                                        <div key={index} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">• {service.description}</span>
                                            <span className="text-foreground">{formatCurrency(service.price)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="border-t border-white/10 pt-3 space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-foreground font-medium">Total Amount</span>
                                    <span className="text-foreground font-semibold">{formatCurrency(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Already Paid</span>
                                    <span className="text-green-500 font-semibold">{formatCurrency(totalPaid)}</span>
                                </div>
                                <div className={`flex justify-between items-center p-3 rounded-lg ${hasUnpaidBalance ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'}`}>
                                    <span className="font-bold text-foreground">Balance Due</span>
                                    <span className={`text-lg font-bold ${hasUnpaidBalance ? 'text-red-500' : 'text-green-500'}`}>
                                        {formatCurrency(balance)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Warning or Ready Message */}
                {hasUnpaidBalance ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex gap-3">
                        <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2 flex-1">
                            <h4 className="font-semibold text-yellow-400">Payment Required Before Checkout</h4>
                            <p className="text-sm text-yellow-300/80">
                                You have an outstanding balance of <strong>{formatCurrency(balance)}</strong>.
                                Please complete the payment before proceeding with checkout.
                            </p>
                            <Button
                                onClick={() => setShowPaymentDialog(true)}
                                className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Make Payment Now
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="font-semibold text-green-400">Payment Complete!</h4>
                            <p className="text-sm text-green-300/80">
                                All charges have been paid. You can proceed with checkout.
                            </p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button
                        onClick={handleConfirmCheckOut}
                        disabled={hasUnpaidBalance || actionLoading}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                        {actionLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Generate Invoice & Checkout
                            </>
                        )}
                    </Button>
                </div>

                {hasUnpaidBalance && (
                    <p className="text-center text-xs text-red-400">
                        * Checkout is disabled until payment is complete
                    </p>
                )}

                {/* Payment Dialog */}
                {paymentData && (
                    <MakePaymentDialog
                        open={showPaymentDialog}
                        onOpenChange={setShowPaymentDialog}
                        bookingId={bookingId}
                        totalAmount={totalAmount}
                        totalPaid={totalPaid}
                        balance={balance}
                        roomCharges={paymentData.roomCharges}
                        serviceCharges={paymentData.serviceCharges}
                        serviceDetails={paymentData.serviceDetails || []}
                        onPaymentSuccess={() => {
                            setShowPaymentDialog(false);
                            toast.success("Payment recorded! Refreshing data...");
                            fetchData(); // Refresh payment data
                        }}
                        allowCash={isStaff} // Staff can accept cash, guests can only use card
                    />
                )}
            </div>
        );
    }

    const isPaid = invoice.paymentStatus === 'paid';

    return (
        <div className="space-y-6 py-4">
            <div className="bg-primary-900/10 border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Invoice #{invoice.invoiceNumber}</h3>
                        <p className="text-xs text-gray-400">Generated on {formatDateTime(invoice.createdAt)}</p>
                    </div>
                    <Badge className={isPaid ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"}>
                        {isPaid ? "Paid" : "Unpaid"}
                    </Badge>
                </div>

                <div className="space-y-3 border-t border-white/5 pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Room Charges ({invoice.roomCharges?.numberOfNights || 0} nights)</span>
                        <span className="text-white font-medium">LKR {(invoice.roomCharges?.subtotal || 0).toFixed(2)}</span>
                    </div>

                    {invoice.serviceCharges && invoice.serviceCharges.length > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Service Charges</span>
                            {invoice.serviceCharges.map((service, idx) => (
                                <div key={idx} className="flex justify-between text-sm pl-2">
                                    <span className="text-gray-400">{service.description || service.serviceType}</span>
                                    <span className="text-white">LKR {(service.total || 0).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between text-sm pt-2 border-t border-white/5 font-semibold">
                        <span className="text-white text-base">Total Amount</span>
                        <span className="text-primary-400 text-lg">LKR {(invoice.summary?.grandTotal || 0).toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {!isPaid && (
                    <Button
                        onClick={handleMarkAsPaid}
                        disabled={actionLoading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 h-11"
                    >
                        <CreditCard className="h-4 w-4" />
                        Mark as Paid (Confirm Settlement)
                    </Button>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={handlePrintInvoice}
                        disabled={actionLoading}
                        variant="outline"
                        className="flex-1 gap-2 h-11 border-primary-500/30 hover:bg-primary-500/10 text-white"
                    >
                        <Printer className="h-4 w-4" />
                        Print Invoice
                    </Button>

                    <Button
                        onClick={handleConfirmCheckOut}
                        disabled={!isPaid || actionLoading}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white gap-2 h-11"
                    >
                        <CheckCircle2 className="h-4 w-4" />
                        {actionLoading ? "Processing..." : "Complete Check-out"}
                    </Button>
                </div>

                <p className="text-[10px] text-center text-gray-500">
                    {!isPaid ? "Payment must be settled before checkout." : "Invoice is settled. Ready for checkout."}
                </p>

                <Button variant="ghost" onClick={onCancel} disabled={actionLoading} className="text-gray-400 hover:text-white">
                    Close
                </Button>
            </div>
        </div>
    );
};

export default CheckOutInvoiceFlow;
