"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import InputField from "@/components/forms/InputField";
import { toast } from "sonner";
import { checkInBooking, CheckInData } from "@/services/bookingService";
import { addPayment, AddPaymentData } from "@/services/paymentService";
import { useState } from "react";
import { CreditCard, Banknote } from "lucide-react";
import CardPayment from "@/components/common/CardPayment";

const checkInSchema = z.object({
    nicPassport: z.string().min(1, "NIC / Passport Number is required"),
    nationality: z.string().min(1, "Nationality is required"),
    phoneNumber: z.string().regex(/^\+94\d{9}$/, "Phone Number must be in format +94771234567"),
    country: z.string().min(1, "Country is required"),
    visaDetails: z.string().optional(),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

interface CheckInFormProps {
    bookingId: string;
    totalAmount: number;
    totalPaid: number;
    balance: number;
    onSuccess: () => void;
    onCancel: () => void;
    allowCashPayment?: boolean; // Allow cash payment for staff users
}

const CheckInForm = ({ 
    bookingId, 
    totalAmount, 
    totalPaid, 
    balance, 
    onSuccess, 
    onCancel,
    allowCashPayment = false 
}: CheckInFormProps) => {
    const [loading, setLoading] = useState(false);
    const [showPaymentOptions, setShowPaymentOptions] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [payLater, setPayLater] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<CheckInFormValues>({
        resolver: zodResolver(checkInSchema),
        defaultValues: {
            phoneNumber: "+94",
        }
    });

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString()}`;
    };

    const handlePaymentMethodSelection = (method: "card" | "cash") => {
        setPaymentMethod(method);
        setPaymentAmount(balance.toString());
    };

    const handleCardPaymentSuccess = async () => {
        // Card payment processed successfully
        return true;
    };

    const onSubmit = async (data: CheckInFormValues) => {
        try {
            setLoading(true);
            
            // Step 1: Check in the booking
            const checkInResponse = await checkInBooking(bookingId, data as CheckInData);

            if (!checkInResponse.success) {
                toast.error(checkInResponse.message || "Failed to check in");
                return;
            }

            // Step 2: Handle payment if user chose to pay now
            if (showPaymentOptions && !payLater && paymentMethod && parseFloat(paymentAmount) > 0) {
                const amount = parseFloat(paymentAmount);
                
                if (amount > balance) {
                    toast.error(`Payment amount cannot exceed balance of ${formatCurrency(balance)}`);
                    return;
                }

                const paymentData: AddPaymentData = {
                    amount,
                    paymentMethod,
                    transactionId: paymentMethod === "card" ? `TXN-CARD-${Date.now()}` : undefined,
                    notes: amount < balance
                        ? `Partial payment of ${formatCurrency(amount)} during check-in`
                        : "Full payment during check-in",
                };

                const paymentResponse = await addPayment(bookingId, paymentData);
                
                if (!paymentResponse.success) {
                    toast.warning("Checked in successfully, but payment failed: " + paymentResponse.message);
                    onSuccess();
                    return;
                }
            }

            toast.success("Checked in successfully!" + (showPaymentOptions && !payLater ? " Payment recorded." : ""));
            onSuccess();
        } catch (error) {
            toast.error("An error occurred during check-in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Guest Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                        label="NIC / Passport Number"
                        name="nicPassport"
                        register={register}
                        error={errors.nicPassport}
                        placeholder="e.g. 199012345678 or N1234567"
                    />
                    <InputField
                        label="Nationality"
                        name="nationality"
                        register={register}
                        error={errors.nationality}
                        placeholder="e.g. Sri Lankan"
                    />
                    <InputField
                        label="Phone Number (+94)"
                        name="phoneNumber"
                        register={register}
                        error={errors.phoneNumber}
                        placeholder="+947XXXXXXXX"
                    />
                    <InputField
                        label="Country"
                        name="country"
                        register={register}
                        error={errors.country}
                        placeholder="e.g. Sri Lanka"
                    />
                </div>
                <InputField
                    label="Visa Details (Optional)"
                    name="visaDetails"
                    register={register}
                    error={errors.visaDetails}
                    placeholder="Enter visa details if applicable"
                />
            </div>

            {/* Payment Section */}
            {balance > 0 && (
                <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-foreground">Payment</h3>
                        <div className="text-sm space-y-1 text-right">
                            <div className="flex gap-4">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-muted-foreground">Paid:</span>
                                <span className="font-semibold text-green-500">{formatCurrency(totalPaid)}</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-muted-foreground">Balance:</span>
                                <span className="font-bold text-primary">{formatCurrency(balance)}</span>
                            </div>
                        </div>
                    </div>

                    {!showPaymentOptions ? (
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                onClick={() => setShowPaymentOptions(true)}
                                className="flex-1 bg-primary hover:bg-primary/90"
                            >
                                Pay Now
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setPayLater(true);
                                    setShowPaymentOptions(false);
                                }}
                                className="flex-1"
                            >
                                Pay Later
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {!paymentMethod ? (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">Payment Amount</label>
                                        <Input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            min="0"
                                            max={balance}
                                            step="0.01"
                                            className="bg-white/5 border-white/20"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Enter an amount between LKR 1 and {formatCurrency(balance)}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <Button
                                            type="button"
                                            onClick={() => handlePaymentMethodSelection("card")}
                                            className="h-auto py-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20"
                                            variant="outline"
                                        >
                                            <CreditCard className="h-5 w-5 text-primary" />
                                            <span>Pay with Card</span>
                                        </Button>
                                        {allowCashPayment && (
                                            <Button
                                                type="button"
                                                onClick={() => handlePaymentMethodSelection("cash")}
                                                className="h-auto py-3 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20"
                                                variant="outline"
                                            >
                                                <Banknote className="h-5 w-5 text-green-500" />
                                                <span>Pay with Cash</span>
                                            </Button>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setShowPaymentOptions(false);
                                            setPaymentMethod(null);
                                        }}
                                        className="w-full"
                                    >
                                        Back
                                    </Button>
                                </>
                            ) : paymentMethod === "card" ? (
                                <div>
                                    <CardPayment
                                        totalAmount={parseFloat(paymentAmount) || balance}
                                        onPaymentSuccess={handleCardPaymentSuccess}
                                        onPaymentCancel={() => setPaymentMethod(null)}
                                        submitButtonText="Pay and Check In"
                                        showTestModeNotice={true}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                                        <p className="text-sm text-yellow-400">
                                            Cash payment of {formatCurrency(parseFloat(paymentAmount) || balance)} will be recorded.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setPaymentMethod(null)}
                                    >
                                        Back
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={loading}>
                    {loading ? "Processing..." : paymentMethod === "card" ? "Processing Payment..." : "Confirm Check-In"}
                </Button>
            </div>
        </form>
    );
};

export default CheckInForm;
