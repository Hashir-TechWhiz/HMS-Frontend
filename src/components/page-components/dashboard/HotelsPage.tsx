"use client";

import {
    useState,
    useEffect,
    useCallback,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";

import {
    getHotels,
    createHotel,
    updateHotel,
    deleteHotel
} from "@/services/hotelService";

import { useForm } from "react-hook-form";

import { formatDateTime } from "@/lib/utils";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";

import { Eye, Pencil, Trash2, Plus, Building2, CheckCircle2, XCircle } from "lucide-react";

const HotelsPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { refreshHotels } = useHotel();

    const [hotels, setHotels] = useState<IHotel[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const ITEMS_PER_PAGE = 10;

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedHotel, setSelectedHotel] = useState<IHotel | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<{
        name: string;
        code: string;
        address: string;
        city: string;
        country: string;
        contactEmail: string;
        contactPhone: string;
        status: HotelStatus;
    }>();

    // Fetch hotels with pagination
    const fetchHotels = useCallback(async () => {
        if (role !== "admin" || authLoading) return;

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

            const response = await getHotels(params);

            if (response.success) {
                const data: any = response.data;

                // Handle paginated response
                if (data.pagination) {
                    setHotels(data.hotels || []);
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalItems(data.pagination.totalHotels || 0);
                } else {
                    // Fallback for non-paginated response
                    const hotelsArray = Array.isArray(data) ? data : [];
                    setHotels(hotelsArray);
                    setTotalPages(1);
                    setTotalItems(hotelsArray.length);
                }
            } else {
                toast.error(response.message || "Failed to fetch hotels");
            }
        } catch {
            toast.error("An error occurred while fetching hotels");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, currentPage, statusFilter, ITEMS_PER_PAGE]);

    // Reset to page 1 when status filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    useEffect(() => {
        if (role === "admin" && !authLoading) {
            fetchHotels();
        }
    }, [role, authLoading, fetchHotels]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (hotel: IHotel) => {
        setSelectedHotel(hotel);
        setViewDialogOpen(true);
    };

    // Handle add hotel
    const handleAddClick = () => {
        setIsEditMode(false);
        setSelectedHotel(null);
        reset({
            name: "",
            code: "",
            address: "",
            city: "",
            country: "",
            contactEmail: "",
            contactPhone: "",
            status: "Active",
        });
        setFormDialogOpen(true);
    };

    // Handle edit hotel
    const handleEditClick = (hotel: IHotel) => {
        setIsEditMode(true);
        setSelectedHotel(hotel);
        reset({
            name: hotel.name,
            code: hotel.code,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            contactEmail: hotel.contactEmail,
            contactPhone: hotel.contactPhone,
            status: hotel.status,
        });
        setFormDialogOpen(true);
    };

    // Handle delete hotel
    const handleDeleteClick = (hotel: IHotel) => {
        setSelectedHotel(hotel);
        setDeleteDialogOpen(true);
    };

    // Handle form submit
    const onSubmit = async (data: {
        name: string;
        code: string;
        address: string;
        city: string;
        country: string;
        contactEmail: string;
        contactPhone: string;
        status: HotelStatus;
    }) => {
        try {
            setFormLoading(true);

            let response;
            if (isEditMode && selectedHotel) {
                // Update existing hotel
                response = await updateHotel(selectedHotel._id, data);

                if (response.success) {
                    toast.success("Hotel updated successfully");
                    setFormDialogOpen(false);
                    fetchHotels();
                    refreshHotels(); // Refresh hotel context
                } else {
                    toast.error(response.message || "Failed to update hotel");
                }
            } else {
                // Create new hotel
                response = await createHotel(data);

                if (response.success) {
                    toast.success("Hotel created successfully");
                    setFormDialogOpen(false);
                    fetchHotels();
                    refreshHotels(); // Refresh hotel context
                } else {
                    toast.error(response.message || "Failed to create hotel");
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
        if (!selectedHotel) return;

        try {
            setDeleteLoading(true);

            const response = await deleteHotel(selectedHotel._id);

            if (response.success) {
                toast.success("Hotel deleted successfully");
                setDeleteDialogOpen(false);
                setSelectedHotel(null);
                fetchHotels();
                refreshHotels(); // Refresh hotel context
            } else {
                toast.error(response.message || "Failed to delete hotel");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred while deleting hotel");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Status badge
    const StatusBadge = ({ status }: { status: HotelStatus }) => {
        const colors = {
            Active: "bg-green-500/20 text-green-400 border-green-500/50",
            Inactive: "bg-red-500/20 text-red-400 border-red-500/50",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status]}`}>
                {status}
            </span>
        );
    };

    // Status options for hotel form
    const statusOptions: Option[] = [
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
    ];

    // Status filter options for filtering hotels
    const statusFilterOptions: Option[] = [
        { value: "all", label: "All Hotels" },
        { value: "Active", label: "Active" },
        { value: "Inactive", label: "Inactive" },
    ];

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (hotel: IHotel) => formatDateTime(hotel.createdAt),
        },
        {
            key: "code",
            label: "Hotel Code",
            render: (hotel: IHotel) => (
                <span className="font-medium text-primary-400">{hotel.code}</span>
            ),
        },
        {
            key: "name",
            label: "Hotel Name",
            render: (hotel: IHotel) => (
                <span className="font-medium">{hotel.name}</span>
            ),
        },
        {
            key: "city",
            label: "City",
            render: (hotel: IHotel) => <span>{hotel.city}</span>,
        },
        {
            key: "country",
            label: "Country",
            render: (hotel: IHotel) => <span>{hotel.country}</span>,
        },
        {
            key: "contactEmail",
            label: "Contact Email",
            render: (hotel: IHotel) => (
                <span className="text-sm text-gray-400">{hotel.contactEmail}</span>
            ),
        },
        {
            key: "contactPhone",
            label: "Contact Phone",
            render: (hotel: IHotel) => <span>{hotel.contactPhone}</span>,
        },
        {
            key: "status",
            label: "Status",
            render: (hotel: IHotel) => <StatusBadge status={hotel.status} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (hotel: IHotel) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(hotel)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(hotel)}
                        className="h-8 px-2"
                        title="Edit Hotel"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteClick(hotel)}
                        className="h-8 px-2"
                        title="Delete Hotel"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // Calculate stats from hotels
    const hotelStats = {
        total: hotels.length,
        active: hotels.filter(h => h.status === "Active").length,
        inactive: hotels.filter(h => h.status === "Inactive").length,
    };

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    if (role !== "admin") {
        return <div className="p-6">Access denied. Admin only.</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Hotels"
                    value={totalItems}
                    icon={Building2}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    loading={loading}
                />
                <StatCard
                    title="Active Hotels"
                    value={hotelStats.active}
                    icon={CheckCircle2}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    loading={loading}
                    subtitle="Currently operational"
                />
                <StatCard
                    title="Inactive Hotels"
                    value={hotelStats.inactive}
                    icon={XCircle}
                    iconColor="text-red-400"
                    iconBg="bg-red-500/10"
                    loading={loading}
                    subtitle="Temporarily closed"
                />
            </div>

            {/* Table */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">

                <div className="flex md:flex-row flex-col gap-5 items-center justify-between w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Hotel Management</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage your hotel chain properties
                        </p>
                    </div>

                    <div className="flex lg:flex-row flex-col gap-5 w-full justify-end md:w-auto">
                        <SelectField
                            name="hotelStatusFilter"
                            options={statusFilterOptions}
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                            width="md:w-[150px]"
                            className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-10!"
                        />

                        <Button onClick={handleAddClick} className="main-button-gradient w-full md:w-[150px]">
                            <Plus className="h-4 w-4" />
                            Add Hotel
                        </Button>
                    </div>
                </div>


                <DataTable
                    columns={columns}
                    data={hotels}
                    loading={loading}
                    emptyMessage="No hotels found."
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
                    title="Hotel Details"
                    widthClass="md:min-w-2xl!"
                >
                    {selectedHotel && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Hotel Code</label>
                                    <p className="text-white font-medium">{selectedHotel.code}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Status</label>
                                    <div className="mt-1">
                                        <StatusBadge status={selectedHotel.status} />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Hotel Name</label>
                                <p className="text-white font-medium">{selectedHotel.name}</p>
                            </div>
                            <div>
                                <label className="text-sm text-gray-400">Address</label>
                                <p className="text-white">{selectedHotel.address}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">City</label>
                                    <p className="text-white">{selectedHotel.city}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Country</label>
                                    <p className="text-white">{selectedHotel.country}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Contact Email</label>
                                    <p className="text-white">{selectedHotel.contactEmail}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Contact Phone</label>
                                    <p className="text-white">{selectedHotel.contactPhone}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm text-gray-400">Created At</label>
                                    <p className="text-white">{formatDateTime(selectedHotel.createdAt)}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-400">Updated At</label>
                                    <p className="text-white">{formatDateTime(selectedHotel.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogBox>

                {/* Add/Edit Form Dialog */}
                <DialogBox
                    open={formDialogOpen}
                    onOpenChange={setFormDialogOpen}
                    title={isEditMode ? "Edit Hotel" : "Add New Hotel"}
                    widthClass="min-w-3xl!"
                    showFooter
                    confirmText={isEditMode ? "Update Hotel" : "Create Hotel"}
                    cancelText="Cancel"
                    onConfirm={handleSubmit(onSubmit)}
                    onCancel={() => setFormDialogOpen(false)}
                    disableConfirm={formLoading}
                    confirmLoading={formLoading}
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                name="name"
                                label="Hotel Name *"
                                placeholder="e.g., Grand Plaza Hotel"
                                register={register}
                                error={errors.name}
                                validation={{
                                    required: "Hotel name is required",
                                }}
                            />
                            <InputField
                                name="code"
                                label="Hotel Code *"
                                placeholder="e.g., HMS-002"
                                register={register}
                                error={errors.code}
                                validation={{
                                    required: "Hotel code is required",
                                    pattern: {
                                        value: /^HMS-\d{3}$/,
                                        message: "Code must be in format HMS-XXX (e.g., HMS-002)"
                                    }
                                }}
                                disabled={isEditMode}
                            />
                        </div>
                        <div>
                            <InputField
                                name="address"
                                label="Address *"
                                placeholder="e.g., 123 Main Street"
                                register={register}
                                error={errors.address}
                                validation={{
                                    required: "Address is required",
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                name="city"
                                label="City *"
                                placeholder="e.g., Colombo"
                                register={register}
                                error={errors.city}
                                validation={{
                                    required: "City is required",
                                }}
                            />
                            <InputField
                                name="country"
                                label="Country *"
                                placeholder="e.g., Sri Lanka"
                                register={register}
                                error={errors.country}
                                validation={{
                                    required: "Country is required",
                                }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField
                                name="contactEmail"
                                label="Contact Email *"
                                type="email"
                                placeholder="e.g., contact@hotel.com"
                                register={register}
                                error={errors.contactEmail}
                                validation={{
                                    required: "Contact email is required",
                                    pattern: {
                                        value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                                        message: "Please provide a valid email address"
                                    }
                                }}
                            />
                            <InputField
                                name="contactPhone"
                                label="Contact Phone *"
                                placeholder="e.g., +94 11 234 5678"
                                register={register}
                                error={errors.contactPhone}
                                validation={{
                                    required: "Contact phone is required",
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
                    </form>
                </DialogBox>

                {/* Delete Confirmation Dialog */}
                <DialogBox
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Hotel"
                    description={`Are you sure you want to delete ${selectedHotel?.name} (${selectedHotel?.code})? This action cannot be undone. All associated rooms, bookings, and service requests will also be affected.`}
                    showFooter
                    confirmText="Delete Hotel"
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

export default HotelsPage;
