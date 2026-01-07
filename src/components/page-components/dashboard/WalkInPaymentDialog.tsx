"use client";

import { useState } from "react";
import { CreditCard, Wallet, CheckCircle } from "lucide-react";
import DialogBox from "@/components/common/DialogBox";
import CardPayment from "@/components/common/CardPayment";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface WalkInPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    onPaymentSuccess: (paymentMethod: "card" | "cash") => void;
    onPaymentCancel: () => void;
}

const WalkInPaymentDialog = ({
    open,
    onOpenChange,
    totalAmount,
    onPaymentSuccess,
    onPaymentCancel,
}: WalkInPaymentDialogProps) => {
    const [processing, setProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
    const [cashConfirmed, setCashConfirmed] = useState(false);

    const resetState = () => {
        setProcessing(false);
        setCashConfirmed(false);
        setPaymentMethod("card");
    };

    const handleCardPaymentSuccess = () => {
        resetState();
        onPaymentSuccess("card");
    };

    const handleCardPaymentCancel = () => {
        resetState();
        onPaymentCancel();
    };

    const onCashSubmit = async () => {
        if (!cashConfirmed) {
            toast.error("Please confirm cash payment received");
            return;
        }

        setProcessing(true);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        toast.success("Cash payment confirmed!");
        resetState();
        onPaymentSuccess("cash");
    };

    const handleCancel = () => {
        resetState();
        onPaymentCancel();
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
            title="Walk-In Payment"
            description={`Select payment method and process payment of LKR ${totalAmount.toLocaleString()}`}
            showFooter={false}
            widthClass="max-w-lg"
            centerTitle={false}
        >
            <div className="space-y-4 py-4">
                {/* Tabs for Payment Method Selection */}
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
                            totalAmount={totalAmount}
                            onPaymentSuccess={handleCardPaymentSuccess}
                            onPaymentCancel={handleCardPaymentCancel}
                            submitButtonText="Process Card Payment"
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
                                            Please collect the cash payment from the customer before confirming this booking.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Amount Display */}
                            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm text-muted-foreground">Payment Method</span>
                                    <span className="text-sm font-semibold text-foreground">Cash</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-medium text-foreground">Total Amount</span>
                                    <span className="text-2xl font-bold text-primary">
                                        LKR {totalAmount.toLocaleString()}
                                    </span>
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
                                            I confirm that I have received the cash payment of LKR {totalAmount.toLocaleString()} from the customer
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
                                    onClick={onCashSubmit}
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
                                            Confirm Cash Payment
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

export default WalkInPaymentDialog;

