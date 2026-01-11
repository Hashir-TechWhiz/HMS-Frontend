"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import { toast } from "sonner";
import { createServiceRequest } from "@/services/serviceRequestService";
import { getServiceCatalog } from "@/services/serviceCatalogService";
import { DollarSign, Info } from "lucide-react";

const serviceRequestSchema = z.object({
    serviceType: z.string().min(1, "Service type is required"),
    notes: z.string().optional(),
    priority: z.enum(["low", "normal", "high", "urgent"]),
});

type ServiceRequestFormValues = z.infer<typeof serviceRequestSchema>;

interface ServiceRequestFormProps {
    bookingId: string;
    hotelId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const ServiceRequestForm = ({ bookingId, hotelId, onSuccess, onCancel }: ServiceRequestFormProps) => {
    const [loading, setLoading] = useState(false);
    const [catalog, setCatalog] = useState<IServiceCatalog[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
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
        }
    });

    const watchedServiceType = watch("serviceType");

    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                setCatalogLoading(true);
                const response = await getServiceCatalog(hotelId);
                if (response.success && response.data) {
                    setCatalog(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch catalog:", error);
            } finally {
                setCatalogLoading(false);
            }
        };
        fetchCatalog();
    }, [hotelId]);

    useEffect(() => {
        if (watchedServiceType) {
            const service = catalog.find(s => s.serviceType === watchedServiceType);
            setSelectedService(service || null);
        }
    }, [watchedServiceType, catalog]);

    const onSubmit = async (data: ServiceRequestFormValues) => {
        try {
            setLoading(true);
            const response = await createServiceRequest({
                bookingId,
                ...data
            });

            if (response.success) {
                toast.success("Service request submitted successfully!");
                onSuccess();
            } else {
                toast.error(response.message || "Failed to submit request");
            }
        } catch (error) {
            toast.error("An error occurred during submission");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <SelectField
                label="Service Type"
                name="serviceType"
                options={catalog.map(s => ({ value: s.serviceType, label: s.displayName }))}
                control={control}
                error={errors.serviceType}
                placeholder={catalogLoading ? "Loading catalog..." : "Select a service"}
                required
            />

            {selectedService && (
                <div className="bg-primary-900/20 border border-primary-500/20 rounded-lg p-3 flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm text-white font-medium">{selectedService.displayName}</p>
                        <p className="text-xs text-gray-400">{selectedService.description || "No description available."}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-primary-300 font-semibold">
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>{selectedService.serviceType === 'other' ? "Pricing will be determined upon completion" : `Fixed Price: $${selectedService.fixedPrice?.toFixed(2)}`}</span>
                        </div>
                    </div>
                </div>
            )}

            <SelectField
                label="Priority"
                name="priority"
                options={[
                    { value: "low", label: "Low" },
                    { value: "normal", label: "Normal" },
                    { value: "high", label: "High" },
                    { value: "urgent", label: "Urgent" },
                ]}
                control={control}
                error={errors.priority}
            />

            <TextAreaField
                label="Additional Notes / Requirements"
                name="notes"
                register={register}
                error={errors.notes}
                placeholder="Describe your request in detail..."
            />

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={loading || catalogLoading}>
                    {loading ? "Submitting..." : "Submit Request"}
                </Button>
            </div>
        </form>
    );
};

export default ServiceRequestForm;
