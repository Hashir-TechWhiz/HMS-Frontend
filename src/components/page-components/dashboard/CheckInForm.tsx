"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import { toast } from "sonner";
import { checkInBooking, CheckInData } from "@/services/bookingService";
import { useState } from "react";

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
    onSuccess: () => void;
    onCancel: () => void;
}

const CheckInForm = ({ bookingId, onSuccess, onCancel }: CheckInFormProps) => {
    const [loading, setLoading] = useState(false);

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
        } catch (error) {
            toast.error("An error occurred during check-in");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
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

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={loading}>
                    {loading ? "Processing..." : "Confirm Check-In"}
                </Button>
            </div>
        </form>
    );
};

export default CheckInForm;
