"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { generateInvoice, getInvoiceByBookingId, updatePaymentStatus, IInvoice } from "@/services/invoiceService";
import { checkOutBooking } from "@/services/bookingService";
import { toast } from "sonner";
import { FileText, CreditCard, CheckCircle2, Loader2, DollarSign } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CheckOutInvoiceFlowProps {
    bookingId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckOutInvoiceFlow = ({ bookingId, onSuccess, onCancel }: CheckOutInvoiceFlowProps) => {
    const [loading, setLoading] = useState(true);
    const [invoice, setInvoice] = useState<IInvoice | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const response = await getInvoiceByBookingId(bookingId);
            if (response.success && response.data) {
                setInvoice(response.data);
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
        fetchInvoice();
    }, [bookingId]);

    const handleGenerateInvoice = async () => {
        try {
            setActionLoading(true);
            const response = await generateInvoice(bookingId);
            if (response.success) {
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-gray-400">Loading invoice details...</p>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="py-8 text-center space-y-6">
                <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-12 w-12 text-gray-500 opacity-50" />
                    <h3 className="text-lg font-medium text-white">No Invoice Generated</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto">
                        An invoice must be generated before the guest can check out.
                    </p>
                </div>
                <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button
                        onClick={handleGenerateInvoice}
                        disabled={actionLoading}
                        className="bg-primary-600 hover:bg-primary-700"
                    >
                        {actionLoading ? "Generating..." : "Generate Final Invoice"}
                    </Button>
                </div>
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

                <Button
                    onClick={handleConfirmCheckOut}
                    disabled={!isPaid || actionLoading}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white gap-2 h-11"
                >
                    <CheckCircle2 className="h-4 w-4" />
                    {actionLoading ? "Processing..." : "Complete Check-out"}
                </Button>

                <p className="text-[10px] text-center text-gray-500">
                    {!isPaid ? "Payment must be settled before checkout." : "Invoice is settled. Ready for checkout."}
                </p>

                <Button variant="ghost" onClick={onCancel} disabled={actionLoading} className="text-gray-400 hover:text-white">
                    Cancel and Return
                </Button>
            </div>
        </div>
    );
};

export default CheckOutInvoiceFlow;
