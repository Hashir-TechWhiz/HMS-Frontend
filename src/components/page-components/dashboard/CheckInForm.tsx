"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import { toast } from "sonner";
import { checkInBooking, CheckInData } from "@/services/bookingService";
import { useState } from "react";
import { CreditCard, Phone, CheckCircle2, X } from "lucide-react";
import { COUNTRIES } from "@/constants/countries";

const checkInSchema = z.object({
    nicPassport: z.string().min(1, "NIC / Passport Number is required"),
    phoneNumber: z.string()
        .min(1, "Phone number is required")
        .regex(/^\+?\d{7,15}$/, "Please enter a valid phone number"),
    country: z.string().min(1, "Country is required"),
});

type CheckInFormValues = z.infer<typeof checkInSchema>;

interface CheckInFormProps {
    bookingId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckInForm = ({ bookingId, onSuccess, onCancel }: CheckInFormProps) => {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<CheckInFormValues>({
        resolver: zodResolver(checkInSchema),
    });

    // Map countries to options for SelectField
    const countryOptions = COUNTRIES.map((country) => ({
        value: country,
        label: country,
    }));

    const onSubmit = async (data: CheckInFormValues) => {
        try {
            setLoading(true);
            const response = await checkInBooking(bookingId, data as CheckInData);

            if (response.success) {
                toast.success("Checked in successfully!");
                onSuccess();
            } else {
                toast.error(response.message || "Failed to check in");
            }
        } catch {
            toast.error("An error occurred during check-in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-center gap-3 pb-2 border-b border-primary-800/30">
                <div className="p-2 rounded-lg bg-primary-500/10 border border-primary-500/20">
                    <CheckCircle2 className="h-5 w-5 text-primary-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-primary-100">Guest Check-In</h3>
                    <p className="text-sm text-primary-400">Please provide guest identification details</p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                        <InputField
                            label="NIC / Passport Number"
                            name="nicPassport"
                            register={register}
                            error={errors.nicPassport}
                            placeholder="e.g. 199012345678 or N1234567"
                            icon={<CreditCard className="h-4 w-4 text-primary-400" />}
                        />
                    </div>
                    <div className="space-y-1">
                        <InputField
                            label="Phone Number"
                            name="phoneNumber"
                            register={register}
                            error={errors.phoneNumber}
                            placeholder="e.g. +94771234567"
                            icon={<Phone className="h-4 w-4 text-primary-400" />}
                        />
                    </div>
                </div>
                
                <div className="space-y-1">
                    <SelectField
                        label="Country"
                        name="country"
                        placeholder="Select country"
                        options={countryOptions}
                        control={control}
                        error={errors.country}
                        required
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 py-6 border-t border-primary-800/30">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onCancel} 
                        disabled={loading} 
                        className="flex-1 h-11 font-medium transition-all hover:bg-primary-900/30"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button 
                        type="submit" 
                        className="flex-1 h-11 main-button-gradient font-medium transition-all hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50" 
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm Check-In
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CheckInForm;
