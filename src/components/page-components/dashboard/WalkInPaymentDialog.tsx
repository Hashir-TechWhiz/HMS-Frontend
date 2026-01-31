"use client";

import { useState } from "react";
import { CreditCard, Wallet, CheckCircle, Clock, X } from "lucide-react";
import DialogBox from "@/components/common/DialogBox";
import CardPayment from "@/components/common/CardPayment";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface WalkInPaymentChoice {
    type: 'skip' | 'partial' | 'full';
    amount?: number;
    paymentMethod?: 'card' | 'cash';
}

interface WalkInPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    onPaymentSuccess: (choice: WalkInPaymentChoice) => void;
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
    const [paymentType, setPaymentType] = useState<'skip' | 'partial' | 'full'>('full');
    const [partialAmount, setPartialAmount] = useState<string>('');
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
    const [cashConfirmed, setCashConfirmed] = useState(false);
    const [showPaymentCollection, setShowPaymentCollection] = useState(false);

    const resetState = () => {
        setProcessing(false);
        setPaymentType('full');
        setPartialAmount('');
        setPaymentMethod('card');
        setCashConfirmed(false);
        setShowPaymentCollection(false);
    };

    const getPaymentAmount = () => {
        if (paymentType === 'full') return totalAmount;
        if (paymentType === 'partial') return parseFloat(partialAmount) || 0;
        return 0;
    };

    const handleContinue = () => {
        if (paymentType === 'skip') {
            // Skip payment - create booking without payment
            onPaymentSuccess({ type: 'skip' });
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
            // Show payment collection form
            setShowPaymentCollection(true);
            return;
        }

        if (paymentType === 'full') {
            // Show payment collection form
            setShowPaymentCollection(true);
            return;
        }
    };

    const handleCardPaymentSuccess = () => {
        const amount = getPaymentAmount();
        onPaymentSuccess({ 
            type: paymentType, 
            amount,
            paymentMethod: 'card'
        });
        resetState();
    };

    const handleCardPaymentCancel = () => {
        setShowPaymentCollection(false);
    };

    const handleCashPayment = async () => {
        if (!cashConfirmed) {
            toast.error("Please confirm cash payment received");
            return;
        }

        setProcessing(true);

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const amount = getPaymentAmount();
        toast.success("Cash payment confirmed!");
        onPaymentSuccess({ 
            type: paymentType, 
            amount,
            paymentMethod: 'cash'
        });
        resetState();
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
            title={showPaymentCollection ? "Process Payment" : "Walk-In Payment Options"}
            description={
                showPaymentCollection
                    ? `Select payment method and collect LKR ${getPaymentAmount().toLocaleString()}`
                    : "Choose payment option for this walk-in booking"
            }
            showFooter={false}
            widthClass="max-w-lg"
            centerTitle={false}
        >
            {!showPaymentCollection ? (
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
                                        <span className="font-semibold text-foreground">Collect Full Payment</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Collect LKR {totalAmount.toLocaleString()} now (card or cash)
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
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Wallet className="h-4 w-4 text-primary" />
                                        <span className="font-semibold text-foreground">Collect Partial Payment</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Collect a partial amount now, customer pays remaining balance later
                                    </p>
                                    {paymentType === 'partial' && (
                                        <div className="mt-2">
                                            <Input
                                                type="number"
                                                placeholder="Enter amount"
                                                value={partialAmount}
                                                onChange={(e) => setPartialAmount(e.target.value)}
                                                className="bg-background"
                                                min="1"
                                                max={totalAmount}
                                            />
                                        </div>
                                    )}
                                </div>
                            </label>

                            {/* Skip Payment */}
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
                                        Skip payment now, customer will pay before checkout
                                    </p>
                                </div>
                            </label>
                        </div>
                    </RadioGroup>

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
                            className="flex-1"
                        >
                            {paymentType === 'skip' ? 'Continue Without Payment' : 'Continue to Payment'}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4 py-4">
                    {/* Back Button */}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPaymentCollection(false)}
                        className="mb-2"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Change Payment Option
                    </Button>

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
                                totalAmount={getPaymentAmount()}
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
                                                Please collect the cash payment from the customer before confirming.
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
                                        <span className="text-base font-medium text-foreground">Amount to Collect</span>
                                        <span className="text-2xl font-bold text-primary">
                                            LKR {getPaymentAmount().toLocaleString()}
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
                                                I confirm that I have received the cash payment of LKR {getPaymentAmount().toLocaleString()} from the customer
                                            </span>
                                        </div>
                                    </label>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowPaymentCollection(false)}
                                        disabled={processing}
                                        className="flex-1 border-gray-700 hover:bg-gray-800"
                                    >
                                        Back
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
                                                Confirm Cash Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </DialogBox>
    );
};

export default WalkInPaymentDialog;
