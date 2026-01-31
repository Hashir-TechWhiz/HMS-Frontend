"use client";

import {
    useState,
    useEffect,
    useCallback,
    useMemo
} from "react";

import Image from "next/image";

import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";

import {
    getFacilities,
    createFacility,
    updateFacility,
    deleteFacility
} from "@/services/publicFacilityService";
import { getActiveHotels } from "@/services/hotelService";

import { useForm } from "react-hook-form";
import { useEdgeStore } from "@/lib/edgestore";

import { formatDateTime } from "@/lib/utils";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import CheckboxGroupField from "@/components/forms/CheckboxGroupField";
import { EdgeStoreUploader } from "@/components/common/EdgeStoreUploader";

import { Eye, Pencil, Trash2, Plus, Building2, CheckCircle2, Ban, Wrench } from "lucide-react";
import ViewFacilityDetails from "@/components/common/ViewFacilityDetails";

const FacilitiesPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedHotel } = useHotel();
    const { edgestore } = useEdgeStore();

    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    const [facilities, setFacilities] = useState<IPublicFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const ITEMS_PER_PAGE = 10;

    // KPI states
    const [kpiLoading, setKpiLoading] = useState(false);
    const [facilityStats, setFacilityStats] = useState<{
        totalFacilities: number;
        byStatus: {
            available: number;
            unavailable: number;
            maintenance: number;
        };
    } | null>(null);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<IPublicFacility | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [imageFiles, setImageFiles] = useState<(File | string)[]>([]);
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<{
        hotelId: string;
        name: string;
        facilityType: FacilityType;
        capacity: number;
        pricePerHour: number;
        pricePerDay: number;
        status: FacilityStatus;
        description: string;
        operatingHoursOpen: string;
        operatingHoursClose: string;
    }>();

    // Fetch facilities with pagination
    const fetchFacilities = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setLoading(true);

            // Prepare params with pagination
            const params: any = {
                page: currentPage,
                limit: ITEMS_PER_PAGE,
            };

            // Add status filter if not "all"
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }

            // Add hotel filter if not "all"
            if (hotelFilter !== "all") {
                params.hotelId = hotelFilter;
            }

            const response = await getFacilities(params);

            if (response.success) {
                const data: any = response.data;

                // Handle paginated response
                if (data.pagination) {
                    setFacilities(data.facilities || []);
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalItems(data.pagination.totalFacilities || 0);
                } else {
                    // Fallback for non-paginated response
                    const facilitiesArray = Array.isArray(data) ? data : [];
                    setFacilities(facilitiesArray);
                    setTotalPages(1);
                    setTotalItems(facilitiesArray.length);
                }
            } else {
                toast.error(response.message || "Failed to fetch facilities");
            }
        } catch {
            toast.error("An error occurred while fetching facilities");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, currentPage, statusFilter, hotelFilter, ITEMS_PER_PAGE]);

    // Reset to page 1 when status or hotel filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, hotelFilter]);

    // Fetch facility statistics (calculated from facilities data)
    const fetchFacilityStats = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setKpiLoading(true);
            // Fetch all facilities without pagination to calculate stats
            const response = await getFacilities();
            if (response.success && response.data) {
                const allFacilities = Array.isArray(response.data) ? response.data : response.data.facilities || [];
                
                const stats = {
                    totalFacilities: allFacilities.length,
                    byStatus: {
                        available: allFacilities.filter((f: IPublicFacility) => f.status === 'available').length,
                        unavailable: allFacilities.filter((f: IPublicFacility) => f.status === 'unavailable').length,
                        maintenance: allFacilities.filter((f: IPublicFacility) => f.status === 'maintenance').length,
                    }
                };
                
                setFacilityStats(stats);
            }
        } catch (error) {
            console.error("Failed to fetch facility statistics:", error);
        } finally {
            setKpiLoading(false);
        }
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchFacilities();
            fetchFacilityStats();
        }
    }, [role, authLoading, fetchFacilities, fetchFacilityStats]);

    // Fetch available hotels for selection
    const fetchAvailableHotels = useCallback(async () => {
        try {
            const response = await getActiveHotels();
            if (response.success && response.data) {
                setAvailableHotels(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch hotels:", error);
        }
    }, []);

    useEffect(() => {
        if (role === "admin" && !authLoading) {
            fetchAvailableHotels();
        }
    }, [role, authLoading, fetchAvailableHotels]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (facility: IPublicFacility) => {
        setSelectedFacility(facility);
        setViewDialogOpen(true);
    };

    // Handle add facility
    const handleAddClick = () => {
        setIsEditMode(false);
        setSelectedFacility(null);
        setImageFiles([]);
        setSelectedAmenities([]);
        setSubmitAttempted(false);
        reset({
            hotelId: selectedHotel?._id || "",
            name: "",
            facilityType: "Event Hall",
            capacity: 1,
            pricePerHour: 0,
            pricePerDay: 0,
            status: "available",
            description: "",
            operatingHoursOpen: "09:00",
            operatingHoursClose: "22:00",
        });
        setFormDialogOpen(true);
    };

    // Handle edit facility
    const handleEditClick = (facility: IPublicFacility) => {
        setIsEditMode(true);
        setSelectedFacility(facility);
        setImageFiles(facility.images);
        setSelectedAmenities(facility.amenities || []);
        setSubmitAttempted(false);
        const facilityHotelId = typeof facility.hotelId === 'string' ? facility.hotelId : facility.hotelId._id;
        reset({
            hotelId: facilityHotelId,
            name: facility.name,
            facilityType: facility.facilityType,
            capacity: facility.capacity,
            pricePerHour: facility.pricePerHour || 0,
            pricePerDay: facility.pricePerDay || 0,
            status: facility.status,
            description: facility.description || "",
            operatingHoursOpen: facility.operatingHours?.open || "09:00",
            operatingHoursClose: facility.operatingHours?.close || "22:00",
        });
        setFormDialogOpen(true);
    };

    // Handle delete facility
    const handleDeleteClick = (facility: IPublicFacility) => {
        setSelectedFacility(facility);
        setDeleteDialogOpen(true);
    };

    // Upload images to EdgeStore
    const uploadImages = async (files: (File | string)[]): Promise<string[]> => {
        const urls: string[] = [];

        for (const file of files) {
            if (typeof file === "string") {
                // Already uploaded URL, keep it
                urls.push(file);
            } else if (file instanceof File) {
                // Upload new file
                const result = await edgestore.facilities.upload({
                    file,
                });
                urls.push(result.url);
            }
        }

        return urls;
    };

    // Delete images from EdgeStore
    const deleteImages = async (urls: string[]) => {
        for (const url of urls) {
            try {
                await edgestore.facilities.delete({ url });
            } catch (error) {
                console.error(`Failed to delete image ${url}:`, error);
            }
        }
    };

    // Handle form submit
    const onSubmit = async (data: {
        hotelId: string;
        name: string;
        facilityType: FacilityType;
        capacity: number;
        pricePerHour: number;
        pricePerDay: number;
        status: FacilityStatus;
        description: string;
        operatingHoursOpen: string;
        operatingHoursClose: string;
    }) => {
        setSubmitAttempted(true);
        if (imageFiles.length < 1) {
            toast.error("At least one image is required");
            return;
        }

        if (imageFiles.length > 4) {
            toast.error("Maximum of 4 images allowed");
            return;
        }

        try {
            setFormLoading(true);

            // Upload new images first
            const imageUrls = await uploadImages(imageFiles);

            // Prepare facility data
            const facilityData = {
                hotelId: data.hotelId,
                name: data.name,
                facilityType: data.facilityType,
                description: data.description,
                capacity: data.capacity,
                pricePerHour: data.pricePerHour > 0 ? data.pricePerHour : undefined,
                pricePerDay: data.pricePerDay > 0 ? data.pricePerDay : undefined,
                amenities: selectedAmenities,
                images: imageUrls,
                operatingHours: {
                    open: data.operatingHoursOpen,
                    close: data.operatingHoursClose,
                },
                status: data.status,
            };

            let response;
            if (isEditMode && selectedFacility) {
                // Update existing facility
                response = await updateFacility(selectedFacility._id, facilityData);

                if (response.success) {
                    // Delete old images that were replaced
                    const oldImages = selectedFacility.images;
                    const imagesToDelete = oldImages.filter(
                        (oldUrl) => !imageUrls.includes(oldUrl)
                    );
                    if (imagesToDelete.length > 0) {
                        await deleteImages(imagesToDelete);
                    }

                    toast.success("Facility updated successfully");
                    setFormDialogOpen(false);
                    fetchFacilities();
                    fetchFacilityStats();
                } else {
                    // Rollback: delete uploaded images if update failed
                    const newImages = imageUrls.filter(
                        (url) => !selectedFacility.images.includes(url)
                    );
                    if (newImages.length > 0) {
                        await deleteImages(newImages);
                    }
                    toast.error(response.message || "Failed to update facility");
                }
            } else {
                // Create new facility
                response = await createFacility(facilityData);

                if (response.success) {
                    toast.success("Facility created successfully");
                    setFormDialogOpen(false);
                    fetchFacilities();
                    fetchFacilityStats();
                } else {
                    // Rollback: delete uploaded images if create failed
                    await deleteImages(imageUrls);
                    toast.error(response.message || "Failed to create facility");
                }
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete confirm
    const handleDeleteConfirm = async () => {
        if (!selectedFacility) return;

        try {
            setDeleteLoading(true);

            // Delete images first
            await deleteImages(selectedFacility.images);

            // Then delete facility
            const response = await deleteFacility(selectedFacility._id);

            if (response.success) {
                toast.success("Facility deleted successfully");
                setDeleteDialogOpen(false);
                setSelectedFacility(null);
                fetchFacilities();
                fetchFacilityStats();
            } else {
                toast.error(response.message || "Failed to delete facility");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred while deleting facility");
        } finally {
            setDeleteLoading(false);
        }
    };


    // Status badge
    const StatusBadge = ({ status }: { status: FacilityStatus }) => {
        const colors = {
            available: "bg-green-500/20 text-green-400 border-green-500/50",
            unavailable: "bg-red-500/20 text-red-400 border-red-500/50",
            maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    // Facility type options
    const facilityTypeOptions: Option[] = [
        { value: "Event Hall", label: "Event Hall" },
        { value: "Pool", label: "Pool" },
        { value: "Gym", label: "Gym" },
        { value: "Spa", label: "Spa" },
        { value: "Conference Room", label: "Conference Room" },
        { value: "Sports Court", label: "Sports Court" },
        { value: "Game Room", label: "Game Room" },
        { value: "Other", label: "Other" },
    ];

    // Status options for facility form
    const statusOptions: Option[] = [
        { value: "available", label: "Available" },
        { value: "unavailable", label: "Unavailable" },
        { value: "maintenance", label: "Maintenance" },
    ];

    // Status filter options for filtering facilities
    const statusFilterOptions: Option[] = [
        { value: "all", label: "All Facilities" },
        { value: "available", label: "Available" },
        { value: "unavailable", label: "Unavailable" },
        { value: "maintenance", label: "Maintenance" },
    ];

    // Amenities options
    const amenitiesOptions = [
        "Wi-Fi",
        "Air Conditioning",
        "Sound System",
        "Projector",
        "Whiteboard",
        "Parking",
        "Catering",
        "Security",
        "Locker Room",
        "Shower Facilities",
    ];

    // Hotel filter options
    const hotelFilterOptions: Option[] = [
        { value: "all", label: "All Hotels" },
        ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
    ];

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (facility: IPublicFacility) => formatDateTime(facility.createdAt),
        },
        {
            key: "name",
            label: "Facility Name",
            render: (facility: IPublicFacility) => (
                <span className="font-medium">{facility.name}</span>
            ),
        },
        {
            key: "image",
            label: "Image",
            render: (facility: IPublicFacility) => (
                <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                    {facility.images && facility.images.length > 0 ? (
                        <Image
                            src={facility.images[0]}
                            alt={facility.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                            No Image
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "facilityType",
            label: "Facility Type",
            render: (facility: IPublicFacility) => <span>{facility.facilityType}</span>,
        },
        {
            key: "capacity",
            label: "Capacity",
            render: (facility: IPublicFacility) => <span>{facility.capacity}</span>,
        },
        {
            key: "pricing",
            label: "Pricing",
            render: (facility: IPublicFacility) => (
                <div className="flex flex-col text-xs">
                    {facility.pricePerHour && (
                        <span className="font-medium">LKR {facility.pricePerHour.toFixed(2)}/hr</span>
                    )}
                    {facility.pricePerDay && (
                        <span className="font-medium">LKR {facility.pricePerDay.toFixed(2)}/day</span>
                    )}
                    {!facility.pricePerHour && !facility.pricePerDay && (
                        <span className="text-gray-400">N/A</span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (facility: IPublicFacility) => <StatusBadge status={facility.status} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (facility: IPublicFacility) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(facility)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(facility)}
                        className="h-8 px-2"
                        title="Edit Facility"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(facility)}
                        className="h-8 px-2"
                        title="Delete Facility"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            {facilityStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Facilities"
                        value={facilityStats.totalFacilities}
                        icon={Building2}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        loading={kpiLoading}
                    />
                    <StatCard
                        title="Available"
                        value={facilityStats.byStatus.available}
                        icon={CheckCircle2}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        loading={kpiLoading}
                        subtitle="Ready for booking"
                    />
                    <StatCard
                        title="Unavailable"
                        value={facilityStats.byStatus.unavailable}
                        icon={Ban}
                        iconColor="text-red-400"
                        iconBg="bg-red-500/10"
                        loading={kpiLoading}
                        subtitle="Currently occupied"
                    />
                    <StatCard
                        title="Maintenance"
                        value={facilityStats.byStatus.maintenance}
                        icon={Wrench}
                        iconColor="text-orange-400"
                        iconBg="bg-orange-500/10"
                        loading={kpiLoading}
                        subtitle="Under maintenance"
                    />
                </div>
            )}

            {/* Table */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">

                <div className="flex md:flex-row flex-col gap-5 items-center justify-between w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Facility Management</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            View and manage all public facilities
                        </p>
                    </div>

                    <div className="flex lg:flex-row flex-col gap-5 w-full justify-end md:w-auto">
                        <SelectField
                            name="hotelFilter"
                            options={hotelFilterOptions}
                            value={hotelFilter}
                            onChange={(v) => { setHotelFilter(v); setCurrentPage(1); }}
                            width="md:w-[200px]"
                            className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-10!"
                        />

                        <SelectField
                            name="facilityStatusFilter"
                            options={statusFilterOptions}
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                            width="md:w-[150px]"
                            className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-10!"
                        />

                        <Button onClick={handleAddClick} className="main-button-gradient w-full md:w-[150px]">
                            <Plus className="h-4 w-4" />
                            Add Facility
                        </Button>
                    </div>
                </div>


                <DataTable
                    columns={columns}
                    data={facilities}
                    loading={loading}
                    emptyMessage="No facilities found."
                    pagination={totalPages > 1 ? {
                        page: currentPage,
                        totalPages: totalPages,
                        total: totalItems,
                        onPageChange: handlePageChange,
                    } : undefined}
                    selectable={false}
                />
                {/* View Details Dialog */}
                <DialogBox
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    title="Facility Details"
                    widthClass="md:min-w-3xl!"
                >
                    <ViewFacilityDetails facility={selectedFacility} userRole="admin" />
                </DialogBox>

                {/* Add/Edit Form Dialog */}
                <DialogBox
                    open={formDialogOpen}
                    onOpenChange={(open) => {
                        setFormDialogOpen(open);
                        if (!open) {
                            setSubmitAttempted(false);
                        }
                    }}
                    title={isEditMode ? "Edit Facility" : "Add New Facility"}
                    widthClass="min-w-3xl!"
                    showFooter
                    confirmText={isEditMode ? "Update Facility" : "Create Facility"}
                    cancelText="Cancel"
                    onConfirm={handleSubmit(onSubmit)}
                    onCancel={() => {
                        setFormDialogOpen(false);
                        setSubmitAttempted(false);
                    }}
                    disableConfirm={formLoading}
                    confirmLoading={formLoading}
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4 py-4">
                        <div>
                            <SelectField
                                name="hotelId"
                                label="Hotel *"
                                options={availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))}
                                control={control}
                                required
                                error={errors.hotelId}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                name="name"
                                label="Facility Name *"
                                placeholder="e.g., Grand Conference Hall"
                                register={register}
                                error={errors.name}
                                validation={{
                                    required: "Facility name is required",
                                }}
                            />
                            <SelectField
                                name="facilityType"
                                label="Facility Type *"
                                options={facilityTypeOptions}
                                control={control}
                                required
                                error={errors.facilityType}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputField
                                    name="capacity"
                                    label="Capacity *"
                                    type="number"
                                    placeholder="e.g., 50"
                                    register={register}
                                    error={errors.capacity}
                                    validation={{
                                        required: "Capacity is required",
                                        min: { value: 1, message: "Capacity must be at least 1" },
                                        valueAsNumber: true,
                                    }}
                                />
                            </div>
                            <div>
                                <SelectField
                                    name="status"
                                    label="Status *"
                                    options={statusOptions}
                                    control={control}
                                    required
                                    error={errors.status}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputField
                                    name="pricePerHour"
                                    label="Price Per Hour (Optional)"
                                    type="number"
                                    placeholder="e.g., 50.00"
                                    register={register}
                                    error={errors.pricePerHour}
                                    validation={{
                                        min: { value: 0, message: "Price cannot be negative" },
                                        valueAsNumber: true,
                                    }}
                                />
                            </div>
                            <div>
                                <InputField
                                    name="pricePerDay"
                                    label="Price Per Day (Optional)"
                                    type="number"
                                    placeholder="e.g., 500.00"
                                    register={register}
                                    error={errors.pricePerDay}
                                    validation={{
                                        min: { value: 0, message: "Price cannot be negative" },
                                        valueAsNumber: true,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                name="operatingHoursOpen"
                                label="Opening Time *"
                                type="time"
                                placeholder="09:00"
                                register={register}
                                error={errors.operatingHoursOpen}
                                validation={{
                                    required: "Opening time is required",
                                }}
                            />
                            <InputField
                                name="operatingHoursClose"
                                label="Closing Time *"
                                type="time"
                                placeholder="22:00"
                                register={register}
                                error={errors.operatingHoursClose}
                                validation={{
                                    required: "Closing time is required",
                                }}
                            />
                        </div>
                        <div>
                            <TextAreaField
                                name="description"
                                label="Description"
                                placeholder="Facility description (optional)"
                                register={register}
                                error={errors.description}
                                rows={3}
                            />
                        </div>
                        <div>
                            <CheckboxGroupField
                                name="amenities"
                                label="Amenities (Optional)"
                                options={amenitiesOptions}
                                value={selectedAmenities}
                                onChange={setSelectedAmenities}
                            />
                        </div>
                        <div>
                            <EdgeStoreUploader
                                maxFiles={4}
                                maxSizeMB={4}
                                value={imageFiles}
                                onChange={setImageFiles}
                                initialUrls={isEditMode ? selectedFacility?.images || [] : []}
                                error={
                                    submitAttempted && imageFiles.length < 1
                                        ? "At least one image is required"
                                        : undefined
                                }
                            />
                        </div>
                    </form>
                </DialogBox>

                {/* Delete Confirmation Dialog */}
                <DialogBox
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Facility"
                    description={`Are you sure you want to delete ${selectedFacility?.name}? This action cannot be undone. All associated images will also be deleted.`}
                    showFooter
                    confirmText="Delete Facility"
                    cancelText="Cancel"
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteDialogOpen(false)}
                    confirmLoading={deleteLoading}
                    variant="danger"
                />
            </div>
        </div>
    );
};

export default FacilitiesPage;
