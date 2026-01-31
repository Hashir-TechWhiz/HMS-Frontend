"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import { toast } from "sonner";
import { createServiceRequest } from "@/services/serviceRequestService";
import { getServiceCatalog } from "@/services/serviceCatalogService";
import { Info } from "lucide-react";

/* -------------------- Schema -------------------- */
const serviceRequestSchema = z.object({
    bookingId: z.string().min(1, "Active stay is required"),
    serviceType: z.string().min(1, "Service type is required"),
    notes: z.string().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
    bookings: IBooking[];
    onSuccess: () => void;
    onCancel: () => void;
}

const ServiceRequestForm = ({
    bookings,
    onSuccess,
    onCancel,
}: ServiceRequestFormProps) => {
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState<IServiceCatalog[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<IServiceCatalog | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm<ServiceRequestFormValues>({
        resolver: zodResolver(serviceRequestSchema),
        defaultValues: {
            priority: "normal",
        },
    });

    const watchedBookingId = watch("bookingId");
    const watchedServiceType = watch("serviceType");

    /* -------------------- Resolve Selected Booking -------------------- */
    const selectedBooking = bookings.find((b) => b._id === watchedBookingId);

    const hotelId =
        typeof selectedBooking?.hotelId === "object"
            ? selectedBooking.hotelId._id
            : selectedBooking?.hotelId;

    /* -------------------- Fetch Service Catalog -------------------- */
    useEffect(() => {
        const fetchCatalog = async () => {
            if (!hotelId) {
                setCatalog([]);
                return;
            }

            try {
                setCatalogLoading(true);
                const response = await getServiceCatalog(hotelId);

                if (response.success && response.data) {
                    setCatalog(response.data);
                } else {
                    toast.error(response.message || "Failed to load service catalog");
                }
            } catch {
                toast.error("Failed to load services. Please try again.");
            } finally {
                setCatalogLoading(false);
            }
        };

        fetchCatalog();
    }, [hotelId]);

    /* -------------------- Selected Service Info -------------------- */
    useEffect(() => {
        if (watchedServiceType) {
            const service = catalog.find(
                (s) => s.serviceType === watchedServiceType
            );
            setSelectedService(service || null);
        } else {
            setSelectedService(null);
        }
    }, [watchedServiceType, catalog]);

    /* -------------------- Submit -------------------- */
    const onSubmit = async (data: ServiceRequestFormValues) => {
        try {
            setLoading(true);
            const response = await createServiceRequest({
                bookingId: data.bookingId,
                serviceType: data.serviceType,
                priority: data.priority,
                notes: data.notes,
            });

            if (response.success) {
                toast.success("Service request submitted successfully!");
                onSuccess();
            } else {
                toast.error(response.message || "Failed to submit request");
            }
        } catch {
            toast.error("An error occurred during submission");
        } finally {
            setLoading(false);
        }
    };

    /* -------------------- UI -------------------- */
    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Active Stay Selection */}
            <SelectField
                label="Active Stay"
                name="bookingId"
                control={control}
                error={errors.bookingId}
                required
                placeholder="Select your active stay"
                options={bookings.map((booking) => ({
                    value: booking._id,
                    label: `Room ${typeof booking.room === "object"
                        ? booking.room.roomNumber
                        : "N/A"
                        }`,
                }))}
            />

            {/* No Catalog Warning */}
            {!catalogLoading && watchedBookingId && catalog.length === 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-yellow-400">
                        <strong>No services available.</strong> Please contact the
                        hotel administrator.
                    </p>
                </div>
            )}

            {/* Service Type */}
            <SelectField
                label="Service Type"
                name="serviceType"
                control={control}
                error={errors.serviceType}
                required
                disabled={!watchedBookingId || catalogLoading || catalog.length === 0}
                placeholder={
                    !watchedBookingId
                        ? "Select an active stay first"
                        : catalogLoading
                            ? "Loading services..."
                            : "Select a service"
                }
                options={catalog.map((s) => ({
                    value: s.serviceType,
                    label: s.displayName,
                }))}
            />

            {/* Service Info Card */}
            {selectedService && (
                <div className="bg-primary-900/20 border border-primary-500/20 rounded-lg p-3 flex gap-3">
                    <Info className="h-5 w-5 text-primary-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-white">
                            {selectedService.displayName}
                        </p>
                        <p className="text-xs text-gray-400">
                            {selectedService.description || "No description available."}
                        </p>
                        <p className="text-sm font-semibold text-primary-300 mt-2">
                            {selectedService.serviceType === "other"
                                ? "Pricing will be determined upon completion"
                                : `Extra Charge: LKR ${selectedService.fixedPrice?.toFixed(
                                    2
                                )}`}
                        </p>
                    </div>
                </div>
            )}

            {/* Priority */}
            <SelectField
                label="Priority"
                name="priority"
                control={control}
                error={errors.priority}
                options={[
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                ]}
            />

            {/* Notes */}
            <TextAreaField
                label="Additional Notes / Requirements"
                name="notes"
                register={register}
                error={errors.notes}
                placeholder="Describe your request in detail..."
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                    className="flex-1 h-10"
                >
                    Cancel
                </Button>

                <Button
                    type="submit"
                    disabled={loading || catalogLoading || !watchedBookingId}
                    className="flex-1 main-button-gradient h-10!"
                >
                    {loading ? "Submitting..." : "Submit Request"}
                </Button>
            </div>
        </form>
    );
};

export default ServiceRequestForm;
