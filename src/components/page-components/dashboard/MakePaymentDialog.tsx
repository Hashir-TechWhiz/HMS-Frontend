"use client";

import { useState, useEffect } from "react";
import DialogBox from "@/components/common/DialogBox";
import CardPayment from "@/components/common/CardPayment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreditCard, Banknote, Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";
import { addPayment, AddPaymentData, ServiceDetail } from "@/services/paymentService";

interface MakePaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: string;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    roomCharges?: number;
    serviceCharges?: number;
    serviceDetails?: ServiceDetail[];
    onPaymentSuccess: () => void;
    allowCash?: boolean; // For staff users
}

const MakePaymentDialog = ({
    open,
    onOpenChange,
    bookingId,
    totalAmount,
    totalPaid,
    balance,
    roomCharges = 0,
    serviceCharges = 0,
    serviceDetails = [],
    onPaymentSuccess,
    allowCash = false,
}: MakePaymentDialogProps) => {
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | null>(null);
    const [processing, setProcessing] = useState(false);
    const [customAmount, setCustomAmount] = useState<string>(balance.toString());
    const [isPartialPayment, setIsPartialPayment] = useState(false);

    // Update customAmount when balance changes or dialog opens
    useEffect(() => {
        if (open) {
            setCustomAmount(balance.toString());
            setIsPartialPayment(false);
            setPaymentMethod(null);
        }
    }, [open, balance]);

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString()}`;
    };

    const handleCardPaymentSuccess = async () => {
        // Card payment simulation successful
        setProcessing(true);
        try {
            const paymentAmount = parseFloat(customAmount);

            console.log("Payment Request:", {
                bookingId,
                paymentAmount,
                currentBalance: balance,
                totalAmount,
                totalPaid
            });

            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                toast.error("Please enter a valid payment amount");
                setProcessing(false);
                return;
            }

            if (paymentAmount > balance) {
                toast.error(`Payment amount cannot exceed balance of ${formatCurrency(balance)}`);
                setProcessing(false);
                return;
            }

            // Additional check: ensure balance is still valid
            if (balance <= 0) {
                toast.error("No outstanding balance. Payment not required.");
                setProcessing(false);
                onOpenChange(false);
                return;
            }

            const paymentData: AddPaymentData = {
                amount: paymentAmount,
                paymentMethod: "card",
                transactionId: `TXN-CARD-${Date.now()}`, // Simulated transaction ID
                notes: paymentAmount < balance
                    ? `Partial card payment of ${formatCurrency(paymentAmount)} out of ${formatCurrency(balance)} balance`
                    : "Full payment via card",
            };

            const response = await addPayment(bookingId, paymentData);

            if (response.success) {
                toast.success("Payment processed successfully!");
                onPaymentSuccess();
                onOpenChange(false);
                setPaymentMethod(null);
                setCustomAmount(balance.toString());
                setIsPartialPayment(false);
            } else {
                toast.error(response.message || "Failed to record payment");
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setProcessing(false);
        }
    };

    const handleCardPaymentCancel = () => {
        setPaymentMethod(null);
    };

    const handleCashPayment = async () => {
        setProcessing(true);
        try {
            const paymentAmount = parseFloat(customAmount);

            console.log("Cash Payment Request:", {
                bookingId,
                paymentAmount,
                currentBalance: balance,
                totalAmount,
                totalPaid
            });

            if (isNaN(paymentAmount) || paymentAmount <= 0) {
                toast.error("Please enter a valid payment amount");
                setProcessing(false);
                return;
            }

            if (paymentAmount > balance) {
                toast.error(`Payment amount cannot exceed balance of ${formatCurrency(balance)}`);
                setProcessing(false);
                return;
            }

            // Additional check: ensure balance is still valid
            if (balance <= 0) {
                toast.error("No outstanding balance. Payment not required.");
                setProcessing(false);
                onOpenChange(false);
                return;
            }

            const paymentData: AddPaymentData = {
                amount: paymentAmount,
                paymentMethod: "cash",
                notes: paymentAmount < balance
                    ? `Partial cash payment of ${formatCurrency(paymentAmount)} out of ${formatCurrency(balance)} balance`
                    : "Full payment via cash at reception",
            };

            const response = await addPayment(bookingId, paymentData);

            if (response.success) {
                toast.success("Cash payment recorded successfully!");
                onPaymentSuccess();
                onOpenChange(false);
                setPaymentMethod(null);
                setCustomAmount(balance.toString());
                setIsPartialPayment(false);
            } else {
                toast.error(response.message || "Failed to record payment");
            }
        } catch (error) {
            console.error("Error recording cash payment:", error);
            toast.error("An unexpected error occurred");
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        if (!processing) {
            setPaymentMethod(null);
            setCustomAmount(balance.toString());
            setIsPartialPayment(false);
            onOpenChange(false);
        }
    };

    return (
        <DialogBox
            open={open}
            onOpenChange={handleClose}
            title="Make Payment"
            description={`Complete payment for your booking. Balance due: ${formatCurrency(balance)}`}
            showFooter={false}
            widthClass="max-w-md"
            centerTitle={false}
        >
            <div className="py-4 space-y-6">
                {/* No Balance Warning */}
                {balance <= 0 && (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-sm text-green-400 text-center font-medium">
                            ✓ All payments completed! No outstanding balance.
                        </p>
                    </div>
                )}

                {/* Payment Summary */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-muted-foreground">Total Amount</span>
                        <span className="font-semibold text-foreground">{formatCurrency(totalAmount)}</span>
                    </div>

                    {/* Room and Service Charges Breakdown */}
                    {(roomCharges > 0 || serviceCharges > 0) && (
                        <div className="pl-4 space-y-2 border-l-2 border-white/10">
                            {roomCharges > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Receipt className="h-3.5 w-3.5" />
                                        Room Charges
                                    </span>
                                    <span className="text-foreground">{formatCurrency(roomCharges)}</span>
                                </div>
                            )}
                            {serviceDetails && serviceDetails.length > 0 ? (
                                <>
                                    <div className="text-xs font-medium text-muted-foreground pt-1">Service Charges:</div>
                                    {serviceDetails.map((service, index) => (
                                        <div key={index} className="flex justify-between items-center text-sm pl-4">
                                            <span className="text-muted-foreground flex items-center gap-1.5">
                                                <Receipt className="h-3 w-3" />
                                                {service.description}
                                            </span>
                                            <span className="text-foreground">{formatCurrency(service.price)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm pt-1 border-t border-white/10">
                                        <span className="text-muted-foreground font-medium">Total Services</span>
                                        <span className="text-foreground font-medium">{formatCurrency(serviceCharges)}</span>
                                    </div>
                                </>
                            ) : serviceCharges > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground flex items-center gap-1.5">
                                        <Receipt className="h-3.5 w-3.5" />
                                        Service Charges
                                    </span>
                                    <span className="text-foreground">{formatCurrency(serviceCharges)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                        <span className="text-sm text-muted-foreground">Already Paid</span>
                        <span className="font-semibold text-green-500">{formatCurrency(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="text-sm font-medium text-foreground">Balance Due</span>
                        <span className="font-bold text-lg text-primary">{formatCurrency(balance)}</span>
                    </div>
                </div>

                {/* Partial Payment Option */}
                {!paymentMethod && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground">Choose Payment Amount</h4>
                            <Button
                                onClick={() => {
                                    setIsPartialPayment(!isPartialPayment);
                                    if (!isPartialPayment) {
                                        setCustomAmount("");
                                    } else {
                                        setCustomAmount(balance.toString());
                                    }
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary hover:text-primary/80"
                            >
                                {isPartialPayment ? "Pay Full Balance" : "Pay Partial Amount"}
                            </Button>
                        </div>

                        {isPartialPayment ? (
                            <div className="space-y-2">
                                <Input
                                    type="number"
                                    placeholder="Enter amount"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    min="0"
                                    max={balance}
                                    step="0.01"
                                    className="bg-white/5 border-white/20 text-foreground"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Enter an amount between LKR 1 and {formatCurrency(balance)}
                                </p>
                            </div>
                        ) : (
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-sm text-foreground">
                                    You will pay the full balance: <span className="font-bold text-primary">{formatCurrency(balance)}</span>
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Payment Method Selection or Payment Form */}
                {!paymentMethod ? (
                    balance > 0 ? (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">Select Payment Method</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <Button
                                    onClick={() => setPaymentMethod("card")}
                                    className="h-auto py-4 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-primary/30 transition-all duration-300"
                                    variant="outline"
                                    disabled={processing}
                                >
                                    <CreditCard className="h-6 w-6 text-primary" />
                                    <div className="text-center">
                                        <p className="font-semibold text-foreground">Card Payment</p>
                                        <p className="text-xs text-muted-foreground">Pay securely with your card</p>
                                    </div>
                                </Button>
                                {allowCash && (
                                    <Button
                                        onClick={() => setPaymentMethod("cash")}
                                        className="h-auto py-4 flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-primary/30 transition-all duration-300"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        <Banknote className="h-6 w-6 text-green-500" />
                                        <div className="text-center">
                                            <p className="font-semibold text-foreground">Cash Payment</p>
                                            <p className="text-xs text-muted-foreground">Record cash payment received</p>
                                        </div>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <Button
                                onClick={() => onOpenChange(false)}
                                variant="outline"
                                className="border-green-500/30 hover:bg-green-500/10"
                            >
                                Close
                            </Button>
                        </div>
                    )
                ) : paymentMethod === "card" ? (
                    <div>
                        <CardPayment
                            totalAmount={balance}
                            onPaymentSuccess={handleCardPaymentSuccess}
                            onPaymentCancel={handleCardPaymentCancel}
                            submitButtonText="Pay Now"
                            showTestModeNotice={true}
                        />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <p className="text-sm text-yellow-400">
                                You are about to record a cash payment of {formatCurrency(parseFloat(customAmount) || balance)}.
                                Please ensure you have received the cash before confirming.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => setPaymentMethod(null)}
                                variant="outline"
                                className="flex-1 border-gray-700 hover:bg-gray-800"
                                disabled={processing}
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleCashPayment}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white border border-green-700"
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <Banknote className="mr-2 h-4 w-4" />
                                        Confirm Cash Payment
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </DialogBox>
    );
};

export default MakePaymentDialog;
