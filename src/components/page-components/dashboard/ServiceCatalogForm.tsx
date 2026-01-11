"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import { toast } from "sonner";
import { upsertServiceCatalog } from "@/services/serviceCatalogService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const serviceCatalogSchema = z.object({
    serviceType: z.string().min(1, "Service type is required"),
    displayName: z.string().min(2, "Display name is required"),
    description: z.string().optional(),
    fixedPrice: z.coerce.number().min(0, "Price cannot be negative"),
    isActive: z.boolean(),
    category: z.string().optional(),
});

type ServiceCatalogFormValues = z.infer<typeof serviceCatalogSchema>;

interface ServiceCatalogFormProps {
    hotelId: string;
    initialData?: IServiceCatalog | null;
    onSuccess: () => void;
    onCancel: () => void;
}

const ServiceCatalogForm = ({ hotelId, initialData, onSuccess, onCancel }: ServiceCatalogFormProps) => {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ServiceCatalogFormValues>({
        resolver: zodResolver(serviceCatalogSchema),
        defaultValues: initialData ? {
            serviceType: initialData.serviceType,
            displayName: initialData.displayName,
            description: initialData.description || "",
            fixedPrice: initialData.fixedPrice || 0,
            isActive: !!initialData.isActive,
            category: initialData.category || "General",
        } : {
            serviceType: "",
            displayName: "",
            description: "",
            isActive: true,
            fixedPrice: 0,
            category: "General",
        }
    });

    const isActive = watch("isActive");

    const onSubmit = async (data: ServiceCatalogFormValues) => {
        try {
            setLoading(true);
            const response = await upsertServiceCatalog(hotelId, data);

            if (response.success) {
                toast.success(initialData ? "Service updated successfully" : "Service added successfully");
                onSuccess();
            } else {
                toast.error(response.message || "Failed to save service");
            }
        } catch (error) {
            toast.error("An error occurred during save");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <SelectField
                label="Service Type"
                name="serviceType"
                options={[
                    { value: "housekeeping", label: "Housekeeping" },
                    { value: "room_service", label: "Room Service" },
                    { value: "maintenance", label: "Maintenance" },
                    { value: "laundry", label: "Laundry" },
                    { value: "spa", label: "Spa" },
                    { value: "other", label: "Other" },
                ]}
                control={control}
                error={errors.serviceType}
                required
                disabled={!!initialData}
            />

            <InputField
                label="Display Name"
                name="displayName"
                register={register}
                error={errors.displayName}
                placeholder="e.g. Deep Cleaning, Extra Towels"
            />

            <InputField
                label="Fixed Price ($)"
                name="fixedPrice"
                type="number"
                register={register}
                validation={{ valueAsNumber: true, min: 0 }}
                error={errors.fixedPrice}
                placeholder="0.00"
            />

            <InputField
                label="Category"
                name="category"
                register={register}
                error={errors.category}
                placeholder="e.g. Cleaning, Food, Wellness"
            />

            <TextAreaField
                label="Description"
                name="description"
                register={register}
                error={errors.description}
                placeholder="Briefly describe the service..."
            />

            <div className="flex items-center space-x-2 py-2">
                <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked: boolean) => setValue("isActive", checked)}
                />
                <Label htmlFor="isActive" className="text-white">Active (Visible to guests)</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={loading}>
                    {loading ? "Saving..." : initialData ? "Update Service" : "Add Service"}
                </Button>
            </div>
        </form>
    );
};

export default ServiceCatalogForm;
