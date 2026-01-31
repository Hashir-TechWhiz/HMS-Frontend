"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CreditCard, Lock, Calendar, Hash } from "lucide-react";
import InputField from "@/components/forms/InputField";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface CardPaymentProps {
    totalAmount: number;
    onPaymentSuccess: () => void;
    onPaymentCancel: () => void;
    submitButtonText?: string;
    showTestModeNotice?: boolean;
}

interface PaymentFormData {
    cardNumber: string;
    cardHolder: string;
    expiryDate: string;
    cvv: string;
}

const CardPayment = ({
    totalAmount,
    onPaymentSuccess,
    onPaymentCancel,
    submitButtonText = "Pay Now",
    showTestModeNotice = true,
}: CardPaymentProps) => {
    const [processing, setProcessing] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        control,
        setError,
        clearErrors,
    } = useForm<PaymentFormData>({
        mode: "onBlur",
        defaultValues: {
            cardNumber: "",
            cardHolder: "",
            expiryDate: "",
            cvv: "",
        },
    });

    const expiryDate = useWatch({ control, name: "expiryDate" });

    // Validate expiry date against current date
    const validateExpiryDate = (value: string): boolean => {
        if (!value || value.length !== 5) return false;

        const [month, year] = value.split("/");
        if (!month || !year) return false;

        const expiryMonth = parseInt(month, 10);
        const expiryYear = 2000 + parseInt(year, 10);

        if (expiryMonth < 1 || expiryMonth > 12) return false;

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (expiryYear < currentYear) return false;
        if (expiryYear === currentYear && expiryMonth < currentMonth) return false;

        return true;
    };

    // Register expiry date with validation
    const expiryDateRegister = register("expiryDate", {
        required: "Expiry date is required",
        pattern: {
            value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
            message: "Format: MM/YY",
        },
        validate: (value) => {
            if (!value || value.length !== 5) return "Expiry date is required";
            if (!validateExpiryDate(value)) {
                return "Card has expired. Please use a valid expiry date.";
            }
            return true;
        },
    });

    // Handle expiry date input formatting
    const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        let value = inputValue.replace(/\D/g, "");

        if (value.length > 4) {
            value = value.slice(0, 4);
        }

        if (value.length >= 2) {
            value = value.slice(0, 2) + "/" + value.slice(2);
        }

        setValue("expiryDate", value, { shouldValidate: false });
        clearErrors("expiryDate");

        if (value.length === 5) {
            const month = parseInt(value.slice(0, 2), 10);
            if (month < 1 || month > 12) {
                setError("expiryDate", {
                    type: "manual",
                    message: "Month must be between 01 and 12",
                });
                return;
            }

            if (!validateExpiryDate(value)) {
                setError("expiryDate", {
                    type: "manual",
                    message: "Card has expired. Please use a valid expiry date.",
                });
            }
        }
    };

    // Reset form when component unmounts
    useEffect(() => {
        return () => {
            reset();
            setProcessing(false);
        };
    }, [reset]);

    const onSubmit = async (data: PaymentFormData) => {
        if (!validateExpiryDate(data.expiryDate)) {
            setError("expiryDate", {
                type: "manual",
                message: "Card has expired. Please use a valid expiry date.",
            });
            return;
        }

        setProcessing(true);

        // Simulate payment processing (1.5 seconds delay)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Simulate success/failure based on card number
        const isSuccess = data.cardNumber.startsWith("4");

        if (isSuccess) {
            toast.success("Payment processed successfully!");
            reset();
            onPaymentSuccess();
        } else {
            toast.error("Payment failed. Please try a different card.");
            setProcessing(false);
        }
    };

    const handleCancel = () => {
        reset();
        setProcessing(false);
        onPaymentCancel();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Test Mode Notice */}
            {showTestModeNotice && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-xs text-yellow-400 flex items-center gap-2">
                        <Lock className="h-3 w-3" />
                        <span>
                            Use card number starting with 4 for success (e.g., 4111 1111 1111 1111)
                        </span>
                    </p>
                </div>
            )}

            {/* Card Number */}
            <div className="space-y-2">
                <InputField
                    name="cardNumber"
                    label="Card Number"
                    placeholder="1234 5678 9012 3456"
                    register={register}
                    error={errors.cardNumber}
                    icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
                    validation={{
                        required: "Card number is required",
                        pattern: {
                            value: /^[0-9]{16}$/,
                            message: "Card number must be 16 digits",
                        },
                    }}
                    maxLength={16}
                />
            </div>

            {/* Card Holder Name */}
            <div className="space-y-2">
                <InputField
                    name="cardHolder"
                    label="Card Holder Name"
                    placeholder="John Doe"
                    register={register}
                    error={errors.cardHolder}
                    validation={{
                        required: "Card holder name is required",
                        minLength: {
                            value: 3,
                            message: "Name must be at least 3 characters",
                        },
                    }}
                />
            </div>

            {/* Expiry Date and CVV */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="expiryDate" className="text-sm font-medium text-gray-400">
                        Expiry Date
                    </Label>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                            {...expiryDateRegister}
                            id="expiryDate"
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate || ""}
                            onChange={(e) => {
                                handleExpiryDateChange(e);
                                expiryDateRegister.onChange(e);
                            }}
                            onBlur={(e) => {
                                expiryDateRegister.onBlur(e);
                                if (expiryDate && expiryDate.length === 5) {
                                    const month = parseInt(expiryDate.slice(0, 2), 10);
                                    if (month < 1 || month > 12) {
                                        setError("expiryDate", {
                                            type: "manual",
                                            message: "Month must be between 01 and 12",
                                        });
                                    } else if (!validateExpiryDate(expiryDate)) {
                                        setError("expiryDate", {
                                            type: "manual",
                                            message: "Card has expired. Please use a valid expiry date.",
                                        });
                                    }
                                }
                            }}
                            maxLength={5}
                            className={`text-white text-base placeholder:text-gray-500 border border-gray-500/20 backdrop-blur-2xl rounded-lg pl-10 pr-10 h-12 ${errors.expiryDate
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : ""
                                }`}
                        />
                    </div>
                    {errors.expiryDate && (
                        <p className="text-sm text-error-500">{errors.expiryDate.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <InputField
                        name="cvv"
                        label="CVV"
                        placeholder="123"
                        type="password"
                        register={register}
                        error={errors.cvv}
                        icon={<Hash className="h-4 w-4 text-muted-foreground" />}
                        validation={{
                            required: "CVV is required",
                            pattern: {
                                value: /^[0-9]{3,4}$/,
                                message: "CVV must be 3-4 digits",
                            },
                        }}
                        maxLength={4}
                    />
                </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-gray-700 pt-4 mt-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <span className="text-sm font-medium text-foreground">Total Amount</span>
                    <span className="text-lg font-bold text-primary">
                        LKR {totalAmount.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={processing}
                    className="flex-1 border-gray-700 hover:bg-gray-800 h-10"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={processing}
                    className="flex-1 main-button-gradient"
                >
                    {processing ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Lock className="h-4 w-4" />
                            {submitButtonText}
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
};

export default CardPayment;

