"use client";

import { useState } from "react";
import { CreditCard, Wallet, CheckCircle, Clock } from "lucide-react";
import DialogBox from "@/components/common/DialogBox";
import CardPayment from "@/components/common/CardPayment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export interface PaymentChoice {
    type: 'skip' | 'partial' | 'full';
    amount?: number;
}

interface FlexiblePaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    onPaymentChoice: (choice: PaymentChoice) => void;
    onCancel: () => void;
}

const FlexiblePaymentDialog = ({
    open,
    onOpenChange,
    totalAmount,
    onPaymentChoice,
    onCancel,
}: FlexiblePaymentDialogProps) => {
    const [paymentType, setPaymentType] = useState<'skip' | 'partial' | 'full'>('full');
    const [partialAmount, setPartialAmount] = useState<string>('');
    const [showCardPayment, setShowCardPayment] = useState(false);
    const [processing, setProcessing] = useState(false);

    const resetState = () => {
        setPaymentType('full');
        setPartialAmount('');
        setShowCardPayment(false);
        setProcessing(false);
    };

    const handleCancel = () => {
        resetState();
        onCancel();
        onOpenChange(false);
    };

    const handleContinue = () => {
        if (paymentType === 'skip') {
            // Skip payment - create booking without payment
            onPaymentChoice({ type: 'skip' });
            resetState();
            return;
        }

        if (paymentType === 'partial') {
            const amount = parseFloat(partialAmount);
            if (!partialAmount || isNaN(amount) || amount <= 0) {
                toast.error("Please enter a valid payment amount");
                return;
            }
            if (amount > totalAmount) {
                toast.error(`Payment amount cannot exceed total amount (LKR ${totalAmount.toLocaleString()})`);
                return;
            }
            // Show card payment form for partial amount
            setShowCardPayment(true);
            return;
        }

        if (paymentType === 'full') {
            // Show card payment form for full amount
            setShowCardPayment(true);
            return;
        }
    };

    const handlePaymentSuccess = () => {
        const amount = paymentType === 'full' ? totalAmount : parseFloat(partialAmount);
        onPaymentChoice({ 
            type: paymentType, 
            amount 
        });
        resetState();
    };

    const handlePaymentCancel = () => {
        setShowCardPayment(false);
    };

    const getPaymentAmount = () => {
        if (paymentType === 'full') return totalAmount;
        if (paymentType === 'partial') return parseFloat(partialAmount) || 0;
        return 0;
    };

    return (
        <DialogBox
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) {
                    handleCancel();
                }
            }}
            title={showCardPayment ? "Complete Payment" : "Payment Options"}
            description={
                showCardPayment
                    ? `Please enter your card details to complete the payment of LKR ${getPaymentAmount().toLocaleString()}`
                    : "Choose how you'd like to proceed with your booking payment"
            }
            showFooter={false}
            widthClass="max-w-lg"
            centerTitle={false}
        >
            {!showCardPayment ? (
                <div className="space-y-6 py-4">
                    {/* Total Amount Display */}
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Total Booking Amount</span>
                            <span className="text-2xl font-bold text-primary">
                                LKR {totalAmount.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Payment Type Selection */}
                    <RadioGroup value={paymentType} onValueChange={(value: any) => setPaymentType(value)}>
                        <div className="space-y-3">
                            {/* Pay Full Amount */}
                            <label
                                htmlFor="full"
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    paymentType === 'full'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/10 bg-white/5 hover:border-primary/50'
                                }`}
                            >
                                <RadioGroupItem value="full" id="full" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CreditCard className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-foreground">Pay Full Amount</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Pay LKR {totalAmount.toLocaleString()} now and complete your booking
                                    </p>
                                </div>
                            </label>

                            {/* Pay Partial Amount */}
                            <label
                                htmlFor="partial"
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    paymentType === 'partial'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/10 bg-white/5 hover:border-primary/50'
                                }`}
                            >
                                <RadioGroupItem value="partial" id="partial" className="mt-1" />
                                <div className="flex-1 space-y-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Wallet className="h-4 w-4 text-primary" />
                                            <span className="font-semibold text-foreground">Pay Partial Amount</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Pay a portion now, settle the remaining balance at checkout
                                        </p>
                                    </div>
                                    {paymentType === 'partial' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="partialAmount" className="text-sm">
                                                Enter Amount (LKR)
                                            </Label>
                                            <Input
                                                id="partialAmount"
                                                type="number"
                                                placeholder={`Enter amount (Max: ${totalAmount.toLocaleString()})`}
                                                value={partialAmount}
                                                onChange={(e) => setPartialAmount(e.target.value)}
                                                min={1}
                                                max={totalAmount}
                                                step={0.01}
                                                className="bg-white/5 border-white/20"
                                            />
                                            {partialAmount && parseFloat(partialAmount) > 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    Remaining balance: LKR {(totalAmount - parseFloat(partialAmount)).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </label>

                            {/* Pay Later */}
                            <label
                                htmlFor="skip"
                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                    paymentType === 'skip'
                                        ? 'border-primary bg-primary/10'
                                        : 'border-white/10 bg-white/5 hover:border-primary/50'
                                }`}
                            >
                                <RadioGroupItem value="skip" id="skip" className="mt-1" />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-foreground">Pay Later</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Skip payment now, pay the full amount at checkout
                                    </p>
                                </div>
                            </label>
                        </div>
                    </RadioGroup>

                    {/* Information Box */}
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-blue-400 mb-1">
                                    Flexible Payment Options
                                </h4>
                                <p className="text-xs text-gray-300">
                                    {paymentType === 'skip' && "You can make payments anytime before checkout. Full payment is required at checkout."}
                                    {paymentType === 'partial' && "Pay what's comfortable now. The remaining balance must be settled before checkout."}
                                    {paymentType === 'full' && "Complete your booking with full payment now. No balance due at checkout."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="flex-1 border-gray-700 hover:bg-gray-800"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleContinue}
                            className="flex-1 main-button-gradient"
                        >
                            {paymentType === 'skip' ? 'Confirm Booking' : 'Continue to Payment'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="py-4">
                    <CardPayment
                        totalAmount={getPaymentAmount()}
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentCancel={handlePaymentCancel}
                        submitButtonText="Complete Payment"
                        showTestModeNotice={true}
                    />
                </div>
            )}
        </DialogBox>
    );
};

export default FlexiblePaymentDialog;
