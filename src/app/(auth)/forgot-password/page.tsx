"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/forms/Stepper";
import InputField from "@/components/forms/InputField";
import { ForgotPasswordStepContent } from "@/constants";
import { useForm, Controller } from "react-hook-form";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { forgotPassword, verifyResetOtp, resetPassword } from "@/services/authService";
import { toast } from "sonner";

const ForgotPassword = () => {
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
    const [storedEmail, setStoredEmail] = useState<string>("");
    const steps = ["Reset Password", "Verify OTP", "Set New Password"];

    const router = useRouter();

    const {
        register,
        watch,
        control,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<IForgotPasswordForm>({
        mode: "onBlur",
    });

    // Step 1: Request OTP
    const handleRequestOtp = async (data: IForgotPasswordForm) => {
        try {
            const response = await forgotPassword(data.email);

            if (response.success) {
                setStoredEmail(data.email);
                toast.success(response.message || "OTP sent to your email!");
                setStep(2);
            } else {
                const errorMessage = response.message || "Failed to send OTP";
                const lowerCaseError = errorMessage.toLowerCase();

                if (lowerCaseError.includes("email") || lowerCaseError.includes("account")) {
                    setError("email", {
                        type: "manual",
                        message: errorMessage,
                    });
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (data: IForgotPasswordForm) => {
        try {
            const response = await verifyResetOtp(storedEmail, data.otp);

            if (response.success) {
                toast.success(response.message || "OTP verified successfully!");
                setStep(3);
            } else {
                const errorMessage = response.message || "Invalid OTP";
                const lowerCaseError = errorMessage.toLowerCase();

                if (lowerCaseError.includes("otp")) {
                    setError("otp", {
                        type: "manual",
                        message: errorMessage,
                    });
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (data: IForgotPasswordForm) => {
        try {
            const response = await resetPassword(storedEmail, data.otp, data.newPassword);

            if (response.success) {
                toast.success(response.message || "Password reset successfully!");
                setStep(4);
            } else {
                const errorMessage = response.message || "Failed to reset password";
                const lowerCaseError = errorMessage.toLowerCase();

                if (lowerCaseError.includes("password")) {
                    setError("newPassword", {
                        type: "manual",
                        message: errorMessage,
                    });
                } else {
                    toast.error(errorMessage);
                }
            }
        } catch {
            toast.error("An unexpected error occurred. Please try again.");
        }
    };

    // Form submission handler based on current step
    const onSubmit = (data: IForgotPasswordForm) => {
        if (step === 1) {
            return handleRequestOtp(data);
        } else if (step === 2) {
            return handleVerifyOtp(data);
        } else if (step === 3) {
            return handleResetPassword(data);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full lg:px-8">
            {/* Stepper */}
            {step < 4 && <Stepper steps={steps} currentStep={step} />}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full">
                {/* Title + description */}
                <div className="flex flex-col items-center gap-2 mt-4">
                    <h2 className="text-2xl font-semibold text-white">
                        {ForgotPasswordStepContent[step - 1].title}
                    </h2>
                    <p className="text-sm text-gray-400">
                        {ForgotPasswordStepContent[step - 1].description}
                    </p>
                </div>

                {/* Step 1: Email */}
                {step === 1 && (
                    <InputField
                        name="email"
                        placeholder="Enter your email"
                        register={register}
                        error={errors.email}
                        validation={{
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Invalid email address",
                            },
                        }}
                    />
                )}

                {/* Step 2: OTP */}
                {step === 2 && (
                    <div className="flex flex-col items-center gap-2.5">
                        <Controller
                            name="otp"
                            control={control}
                            rules={{
                                required: "OTP is required",
                                minLength: {
                                    value: 6,
                                    message: "OTP must be 6 digits",
                                },
                            }}
                            render={({ field }) => (
                                <InputOTP
                                    maxLength={6}
                                    pattern={REGEXP_ONLY_DIGITS}
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    className="flex justify-center"
                                >
                                    <InputOTPGroup>
                                        {[...Array(6)].map((_, i) => (
                                            <InputOTPSlot
                                                key={i}
                                                index={i}
                                                className="mx-1 lg:mx-2 border border-white/35 w-10 h-10 rounded-md"
                                            />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                            )}
                        />

                        {errors.otp && (
                            <p className="text-error-500 text-sm">
                                {errors.otp.message}
                            </p>
                        )}
                    </div>
                )}

                {/* Step 3: Reset Password */}
                {step === 3 && (
                    <>
                        <InputField
                            name="newPassword"
                            label="New Password"
                            placeholder="Enter new password"
                            type="password"
                            register={register}
                            error={errors.newPassword}
                            validation={{
                                required: "New password is required",
                                minLength: {
                                    value: 6,
                                    message:
                                        "Password must be at least 6 characters long",
                                },
                            }}
                        />
                        <InputField
                            name="confirmPassword"
                            label="Confirm Password"
                            placeholder="Confirm new password"
                            type="password"
                            register={register}
                            error={errors.confirmPassword}
                            validation={{
                                required: "Please confirm your password",
                                validate: (value: string) =>
                                    value === watch("newPassword") ||
                                    "Passwords do not match",
                            }}
                        />
                    </>
                )}

                {/* Step 4: Success */}
                {step === 4 && (
                    <Link href="/login" className="w-full">
                        <Button className="w-full main-button-gradient">
                            Continue
                        </Button>
                    </Link>
                )}

                {/* Buttons */}
                {step < 4 && (
                    <div className="relative flex gap-2 w-full">
                        {step === 1 ? (
                            <>
                                {/* Back Button */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-10 border-white/40!"
                                    onClick={() => router.back()}
                                    disabled={isSubmitting}
                                >
                                    Back
                                </Button>

                                {/* Next Button */}
                                <Button
                                    type="submit"
                                    className="flex-1 main-button-gradient"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Sending..." : "Send OTP"}
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="submit"
                                className="w-full mt-2 main-button-gradient"
                                disabled={isSubmitting}
                            >
                                {isSubmitting
                                    ? "Processing..."
                                    : step === 2
                                        ? "Verify OTP"
                                        : "Reset Password"}
                            </Button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default ForgotPassword;
