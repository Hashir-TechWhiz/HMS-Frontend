"use client";

import { useState } from "react";
import { CreditCard, Wallet, CheckCircle, AlertCircle } from "lucide-react";
import DialogBox from "@/components/common/DialogBox";
import CardPayment from "@/components/common/CardPayment";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { addPayment } from "@/services/paymentService";

interface CheckoutPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bookingId: string;
    outstandingBalance: number;
    totalAmount: number;
    totalPaid: number;
    onPaymentSuccess: () => void;
    onCancel: () => void;
}

const CheckoutPaymentDialog = ({
    open,
    onOpenChange,
    bookingId,
    outstandingBalance,
    totalAmount,
    totalPaid,
    onPaymentSuccess,
    onCancel,
}: CheckoutPaymentDialogProps) => {
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
    const [processing, setProcessing] = useState(false);
    const [cashConfirmed, setCashConfirmed] = useState(false);

    const resetState = () => {
        setProcessing(false);
        setCashConfirmed(false);
        setPaymentMethod("card");
    };

    const handleCardPaymentSuccess = async () => {
        try {
            setProcessing(true);

            // Add payment to booking
            const response = await addPayment(bookingId, {
                amount: outstandingBalance,
                paymentMethod: "card",
                notes: "Payment at checkout",
            });

            if (response.success) {
                toast.success("Payment processed successfully!");
                resetState();
                onPaymentSuccess();
            } else {
                toast.error(response.message || "Failed to process payment");
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            toast.error("Failed to process payment");
        } finally {
            setProcessing(false);
        }
    };

    const handleCardPaymentCancel = () => {
        resetState();
    };

    const handleCashPayment = async () => {
        if (!cashConfirmed) {
            toast.error("Please confirm cash payment received");
            return;
        }

        try {
            setProcessing(true);

            // Add payment to booking
            const response = await addPayment(bookingId, {
                amount: outstandingBalance,
                paymentMethod: "cash",
                notes: "Cash payment at checkout",
            });

            if (response.success) {
                toast.success("Cash payment confirmed!");
                resetState();
                onPaymentSuccess();
            } else {
                toast.error(response.message || "Failed to process payment");
            }
        } catch (error) {
            console.error("Error processing payment:", error);
            toast.error("Failed to process payment");
        } finally {
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        resetState();
        onCancel();
        onOpenChange(false);
    };

    return (
        <DialogBox
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleCancel();
                }
            }}
            title="Checkout Payment Required"
            description="Outstanding balance must be settled before completing checkout"
            showFooter={false}
            widthClass="max-w-lg"
            centerTitle={false}
        >
            <div className="space-y-6 py-4">
                {/* Payment Summary */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 shrink-0" />
                        <div>
                            <h4 className="text-sm font-semibold text-yellow-400 mb-1">
                                Payment Required
                            </h4>
                            <p className="text-xs text-gray-300">
                                The guest has an outstanding balance that must be settled before checkout can be completed.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-3">
                    <div className="flex justify-between p-3 rounded-lg bg-white/5 text-sm">
                        <span className="text-muted-foreground">Total Amount</span>
                        <span className="font-medium">LKR {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-white/5 text-sm">
                        <span className="text-muted-foreground">Already Paid</span>
                        <span className="font-medium text-green-500">LKR {totalPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <span className="font-semibold text-foreground">Outstanding Balance</span>
                        <span className="font-bold text-primary text-lg">
                            LKR {outstandingBalance.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Payment Method Selection */}
                <Tabs value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as "card" | "cash")}>
                    <TabsList className="grid w-full grid-cols-2 bg-white/5">
                        <TabsTrigger value="card" className="data-[state=active]:bg-primary/20">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Card
                        </TabsTrigger>
                        <TabsTrigger value="cash" className="data-[state=active]:bg-primary/20">
                            <Wallet className="h-4 w-4 mr-2" />
                            Cash
                        </TabsTrigger>
                    </TabsList>

                    {/* Card Payment Tab */}
                    <TabsContent value="card" className="mt-4">
                        <CardPayment
                            totalAmount={outstandingBalance}
                            onPaymentSuccess={handleCardPaymentSuccess}
                            onPaymentCancel={handleCardPaymentCancel}
                            submitButtonText="Process Payment & Continue Checkout"
                            showTestModeNotice={true}
                        />
                    </TabsContent>

                    {/* Cash Payment Tab */}
                    <TabsContent value="cash" className="space-y-4 mt-4">
                        <div className="space-y-4">
                            {/* Cash Payment Instructions */}
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Wallet className="h-5 w-5 text-green-400 mt-0.5" />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-semibold text-green-400 mb-1">
                                            Cash Payment Instructions
                                        </h4>
                                        <p className="text-xs text-gray-300">
                                            Please collect the outstanding balance from the guest before confirming checkout.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Cash Confirmation Checkbox */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <label className="flex items-start gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center mt-0.5">
                                        <input
                                            type="checkbox"
                                            checked={cashConfirmed}
                                            onChange={(e) => setCashConfirmed(e.target.checked)}
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded border-2 border-gray-500 bg-transparent checked:bg-green-600 checked:border-green-600 transition-colors"
                                        />
                                        <CheckCircle className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                            I confirm that I have received cash payment of LKR {outstandingBalance.toLocaleString()} from the guest
                                        </span>
                                    </div>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCancel}
                                    disabled={processing}
                                    className="flex-1 border-gray-700 hover:bg-gray-800"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleCashPayment}
                                    disabled={processing || !cashConfirmed}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white border border-green-700"
                                >
                                    {processing ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Confirm Payment & Continue
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </DialogBox>
    );
};

export default CheckoutPaymentDialog;
