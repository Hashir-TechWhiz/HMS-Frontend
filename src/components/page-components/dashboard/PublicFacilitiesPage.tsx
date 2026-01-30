"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";

import {
    getPublicFacilities,
    createPublicFacility,
    updatePublicFacility,
    deletePublicFacility
} from "@/services/publicFacilityService";
import { getActiveHotels } from "@/services/hotelService";

import { useForm } from "react-hook-form";
import { formatDateTime } from "@/lib/utils";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";

import { Eye, Pencil, Trash2, Plus, Building2, CheckCircle2, Ban, Wrench } from "lucide-react";

const FACILITY_TYPES: FacilityType[] = [
    'Event Hall',
    'Pool',
    'Gym',
    'Spa',
    'Conference Room',
    'Sports Court',
    'Game Room',
    'Other'
];

const FACILITY_STATUS: FacilityStatus[] = ['available', 'unavailable', 'maintenance'];

const PublicFacilitiesPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedHotel } = useHotel();

    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);
    const [facilities, setFacilities] = useState<IPublicFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const ITEMS_PER_PAGE = 10;

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<IPublicFacility | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
        setValue,
        watch
    } = useForm<{
        hotelId: string;
        name: string;
        facilityType: FacilityType;
        capacity: number;
        pricePerHour: number;
        pricePerDay: number;
        status: FacilityStatus;
        description: string;
        operatingHoursStart: string;
        operatingHoursEnd: string;
    }>();

    // Fetch facilities with pagination
    const fetchFacilities = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setLoading(true);

            const params: any = {
                page: currentPage,
                limit: ITEMS_PER_PAGE
            };

            if (statusFilter !== "all") {
                params.status = statusFilter;
            }

            if (role === "admin" && hotelFilter !== "all") {
                params.hotelId = hotelFilter;
            }

            const response = await getPublicFacilities(params);

            if (response.success && response.data) {
                const data = response.data as any;
                setFacilities(data.facilities || data);
                if (data.pagination) {
                    setTotalPages(data.pagination.pages);
                    setTotalItems(data.pagination.total);
                }
            } else {
                toast.error(response.message || "Failed to fetch facilities");
            }
        } catch (error) {
            console.error("Error fetching facilities:", error);
            toast.error("An error occurred while fetching facilities");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, currentPage, statusFilter, hotelFilter]);

    // Fetch available hotels (for admin)
    const fetchHotels = useCallback(async () => {
        if (role !== "admin") return;

        try {
            const response = await getActiveHotels();
            if (response.success && response.data) {
                setAvailableHotels(response.data as IHotel[]);
            }
        } catch (error) {
            console.error("Error fetching hotels:", error);
        }
    }, [role]);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    useEffect(() => {
        fetchHotels();
    }, [fetchHotels]);

    // Calculate statistics
    const stats = {
        total: facilities.length,
        available: facilities.filter(f => f.status === 'available').length,
        unavailable: facilities.filter(f => f.status === 'unavailable').length,
        maintenance: facilities.filter(f => f.status === 'maintenance').length
    };

    // Handle view facility
    const handleView = (facility: IPublicFacility) => {
        setSelectedFacility(facility);
        setViewDialogOpen(true);
    };

    // Handle edit facility
    const handleEdit = (facility: IPublicFacility) => {
        setSelectedFacility(facility);
        setIsEditMode(true);

        reset({
            hotelId: typeof facility.hotelId === 'string' ? facility.hotelId : facility.hotelId._id,
            name: facility.name,
            facilityType: facility.facilityType,
            capacity: facility.capacity,
            pricePerHour: facility.pricePerHour,
            pricePerDay: facility.pricePerDay || 0,
            status: facility.status,
            description: facility.description || '',
            operatingHoursStart: facility.operatingHours.start,
            operatingHoursEnd: facility.operatingHours.end
        });

        setFormDialogOpen(true);
    };

    // Handle delete facility
    const handleDelete = (facility: IPublicFacility) => {
        setSelectedFacility(facility);
        setDeleteDialogOpen(true);
    };

    // Handle add new facility
    const handleAddNew = () => {
        setIsEditMode(false);
        reset({
            hotelId: selectedHotel?._id || '',
            name: '',
            facilityType: 'Event Hall',
            capacity: 1,
            pricePerHour: 0,
            pricePerDay: 0,
            status: 'available',
            description: '',
            operatingHoursStart: '08:00',
            operatingHoursEnd: '22:00'
        });
        setFormDialogOpen(true);
    };

    // Handle form submit
    const onSubmit = async (data: any) => {
        try {
            setFormLoading(true);

            const facilityData = {
                hotelId: data.hotelId,
                name: data.name,
                facilityType: data.facilityType,
                description: data.description,
                capacity: Number(data.capacity),
                pricePerHour: Number(data.pricePerHour),
                pricePerDay: data.pricePerDay ? Number(data.pricePerDay) : undefined,
                images: ['https://via.placeholder.com/400x300?text=Facility+Image'], // Placeholder image
                operatingHours: {
                    start: data.operatingHoursStart,
                    end: data.operatingHoursEnd
                },
                status: data.status
            };

            let response;
            if (isEditMode && selectedFacility) {
                response = await updatePublicFacility(selectedFacility._id, facilityData);
            } else {
                response = await createPublicFacility(facilityData);
            }

            if (response.success) {
                toast.success(isEditMode ? "Facility updated successfully" : "Facility created successfully");
                setFormDialogOpen(false);
                fetchFacilities();
            } else {
                toast.error(response.message || "Failed to save facility");
            }
        } catch (error) {
            console.error("Error saving facility:", error);
            toast.error("An error occurred while saving facility");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        if (!selectedFacility) return;

        try {
            setDeleteLoading(true);
            const response = await deletePublicFacility(selectedFacility._id);

            if (response.success) {
                toast.success("Facility deleted successfully");
                setDeleteDialogOpen(false);
                fetchFacilities();
            } else {
                toast.error(response.message || "Failed to delete facility");
            }
        } catch (error) {
            console.error("Error deleting facility:", error);
            toast.error("An error occurred while deleting facility");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Table columns configuration
    const columns = [
        {
            key: "name",
            label: "Name",
            render: (facility: IPublicFacility) => facility.name
        },
        {
            key: "type",
            label: "Type",
            render: (facility: IPublicFacility) => facility.facilityType
        },
        {
            key: "capacity",
            label: "Capacity",
            render: (facility: IPublicFacility) => facility.capacity
        },
        {
            key: "price",
            label: "Price/Hour",
            render: (facility: IPublicFacility) => `$${facility.pricePerHour}`
        },
        {
            key: "status",
            label: "Status",
            render: (facility: IPublicFacility) => (
                <span className={`px-2 py-1 rounded text-xs ${
                    facility.status === 'available' ? 'bg-green-100 text-green-800' :
                    facility.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                    {facility.status}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (facility: IPublicFacility) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(facility)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {role === 'admin' && (
                        <>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(facility)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(facility)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Public Facilities</h1>
                {role === 'admin' && (
                    <Button onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Facility
                    </Button>
                )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Facilities"
                    value={stats.total}
                    icon={Building2}
                />
                <StatCard
                    title="Available"
                    value={stats.available}
                    icon={CheckCircle2}
                    iconColor="text-green-500"
                    iconBg="bg-green-500/10"
                />
                <StatCard
                    title="Unavailable"
                    value={stats.unavailable}
                    icon={Ban}
                    iconColor="text-red-500"
                    iconBg="bg-red-500/10"
                />
                <StatCard
                    title="Maintenance"
                    value={stats.maintenance}
                    icon={Wrench}
                    iconColor="text-yellow-500"
                    iconBg="bg-yellow-500/10"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
                <SelectField
                    placeholder="Filter by status"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: 'all', label: 'All Status' },
                        { value: 'available', label: 'Available' },
                        { value: 'unavailable', label: 'Unavailable' },
                        { value: 'maintenance', label: 'Maintenance' }
                    ]}
                />
                {role === 'admin' && (
                    <SelectField
                        placeholder="Filter by hotel"
                        value={hotelFilter}
                        onChange={setHotelFilter}
                        options={[
                            { value: 'all', label: 'All Hotels' },
                            ...availableHotels.map(hotel => ({
                                value: hotel._id,
                                label: hotel.name
                            }))
                        ]}
                    />
                )}
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={facilities}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* View Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Facility Details"
                description="View facility information"
            >
                {selectedFacility && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">{selectedFacility.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Type</p>
                                <p className="font-medium">{selectedFacility.facilityType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Capacity</p>
                                <p className="font-medium">{selectedFacility.capacity} guests</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Price per Hour</p>
                                <p className="font-medium">${selectedFacility.pricePerHour}</p>
                            </div>
                            {selectedFacility.pricePerDay && (
                                <div>
                                    <p className="text-sm text-gray-500">Price per Day</p>
                                    <p className="font-medium">${selectedFacility.pricePerDay}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Operating Hours</p>
                                <p className="font-medium">
                                    {selectedFacility.operatingHours.start} - {selectedFacility.operatingHours.end}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="font-medium capitalize">{selectedFacility.status}</p>
                            </div>
                        </div>
                        {selectedFacility.description && (
                            <div>
                                <p className="text-sm text-gray-500">Description</p>
                                <p className="font-medium">{selectedFacility.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </DialogBox>

            {/* Form Dialog */}
            <DialogBox
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                title={isEditMode ? "Edit Facility" : "Add New Facility"}
                description={isEditMode ? "Update facility information" : "Create a new facility"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {role === 'admin' && (
                        <SelectField
                            name="hotelId"
                            label="Hotel"
                            control={control}
                            error={errors.hotelId}
                            required
                            options={availableHotels.map(hotel => ({
                                value: hotel._id,
                                label: hotel.name
                            }))}
                        />
                    )}
                    <InputField
                        name="name"
                        label="Facility Name"
                        placeholder="Enter facility name"
                        register={register}
                        error={errors.name}
                        validation={{ required: "Facility name is required" }}
                    />
                    <SelectField
                        name="facilityType"
                        label="Facility Type"
                        control={control}
                        error={errors.facilityType}
                        required
                        options={FACILITY_TYPES.map(type => ({
                            value: type,
                            label: type
                        }))}
                    />
                    <InputField
                        name="capacity"
                        label="Capacity"
                        type="number"
                        placeholder="Enter capacity"
                        register={register}
                        error={errors.capacity}
                        validation={{
                            required: "Capacity is required",
                            min: { value: 1, message: "Capacity must be at least 1" }
                        }}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            name="pricePerHour"
                            label="Price per Hour"
                            type="number"
                            placeholder="0.00"
                            register={register}
                            error={errors.pricePerHour}
                            validation={{
                                required: "Price per hour is required",
                                min: { value: 0, message: "Price cannot be negative" }
                            }}
                        />
                        <InputField
                            name="pricePerDay"
                            label="Price per Day (Optional)"
                            type="number"
                            placeholder="0.00"
                            register={register}
                            error={errors.pricePerDay}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            name="operatingHoursStart"
                            label="Opening Time"
                            type="time"
                            register={register}
                            error={errors.operatingHoursStart}
                            validation={{ required: "Opening time is required" }}
                        />
                        <InputField
                            name="operatingHoursEnd"
                            label="Closing Time"
                            type="time"
                            register={register}
                            error={errors.operatingHoursEnd}
                            validation={{ required: "Closing time is required" }}
                        />
                    </div>
                    <SelectField
                        name="status"
                        label="Status"
                        control={control}
                        error={errors.status}
                        required
                        options={FACILITY_STATUS.map(status => ({
                            value: status,
                            label: status.charAt(0).toUpperCase() + status.slice(1)
                        }))}
                    />
                    <TextAreaField
                        name="description"
                        label="Description"
                        placeholder="Enter facility description"
                        register={register}
                        error={errors.description}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setFormDialogOpen(false)}
                            disabled={formLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                            {formLoading ? "Saving..." : isEditMode ? "Update" : "Create"}
                        </Button>
                    </div>
                </form>
            </DialogBox>

            {/* Delete Dialog */}
            <DialogBox
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Facility"
                description="Are you sure you want to delete this facility? This action cannot be undone."
            >
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteConfirm}
                        disabled={deleteLoading}
                    >
                        {deleteLoading ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </DialogBox>
        </div>
    );
};

export default PublicFacilitiesPage;
