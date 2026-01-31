"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { getServiceCatalog, deleteServiceCatalog } from "@/services/serviceCatalogService";
import { getActiveHotels } from "@/services/hotelService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import ServiceCatalogForm from "./ServiceCatalogForm";

const ServiceCatalogPage = () => {
    const { role, user } = useAuth();
    const { selectedHotel } = useHotel();

    const [catalog, setCatalog] = useState<IServiceCatalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [selectedService, setSelectedService] = useState<IServiceCatalog | null>(null);
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);
    const [filterHotel, setFilterHotel] = useState<string>("");

    // Fetch available hotels for admin
    const fetchAvailableHotels = useCallback(async () => {
        if (role !== "admin") return;
        try {
            const response = await getActiveHotels();
            if (response.success && response.data) {
                setAvailableHotels(response.data);
                // Set default hotel to first available if not already set
                if (!filterHotel && response.data.length > 0) {
                    setFilterHotel(response.data[0]._id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch hotels:", error);
        }
    }, [role, filterHotel]);

    // Initialize hotel filter based on role
    useEffect(() => {
        if (role === "admin") {
            fetchAvailableHotels();
        } else if (role === "receptionist") {
            // For receptionist, set to their hotel
            const hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id);
            if (hotelId) {
                setFilterHotel(hotelId);
            }
        }
    }, [role, selectedHotel, user, fetchAvailableHotels]);

    // Use filterHotel for admin, or user's hotel for receptionist
    const hotelId = role === "admin" ? filterHotel : (selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id));

    const fetchCatalog = useCallback(async () => {
        if (!hotelId) return;
        try {
            setLoading(true);
            const response = await getServiceCatalog(hotelId);
            if (response.success && response.data) {
                setCatalog(response.data);
            }
        } catch {
            toast.error("Failed to fetch service catalog");
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    useEffect(() => {
        if (hotelId) {
            fetchCatalog();
        }
    }, [hotelId, fetchCatalog]);

    const handleAddClick = () => {
        setSelectedService(null);
        setDialogOpen(true);
    };

    const handleEditClick = (service: IServiceCatalog) => {
        setSelectedService(service);
        setDialogOpen(true);
    };

    const handleDeleteClick = (service: IServiceCatalog) => {
        setSelectedService(service);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!hotelId || !selectedService) return;

        try {
            setDeleteLoading(true);
            const response = await deleteServiceCatalog(hotelId, selectedService._id);
            if (response.success) {
                toast.success("Service deleted successfully");
                setDeleteDialogOpen(false);
                fetchCatalog();
            } else {
                toast.error(response.message || "Failed to delete service");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setDeleteLoading(false);
        }
    };

    const columns = [
        {
            key: "displayName",
            label: "Service Name",
            render: (item: IServiceCatalog) => (
                <div>
                    <div className="font-medium text-white">{item.displayName}</div>
                    <div className="text-xs text-gray-400 capitalize">{item.serviceType.replace("_", " ")}</div>
                </div>
            ),
        },
        {
            key: "fixedPrice",
            label: "Fixed Price",
            render: (item: IServiceCatalog) => (
                <span className="font-semibold text-primary-400">
                    {item.serviceType === 'other' ? "Varies" : `$${item.fixedPrice?.toFixed(2)}`}
                </span>
            ),
        },
        {
            key: "isActive",
            label: "Status",
            render: (item: IServiceCatalog) => (
                <div className="flex items-center gap-1.5">
                    {item.isActive ? (
                        <><CheckCircle2 className="h-4 w-4 text-green-500" /> <span className="text-xs text-green-500">Active</span></>
                    ) : (
                        <><XCircle className="h-4 w-4 text-red-500" /> <span className="text-xs text-red-500">Inactive</span></>
                    )}
                </div>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (item: IServiceCatalog) => (
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditClick(item)} className="h-8 px-2">
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(item)} className="h-8 px-2">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Service Catalog</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage predefined services and pricing for this hotel</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    {role === "admin" && (
                        <SelectField
                            name="hotelFilter"
                            options={[
                                ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
                            ]}
                            value={filterHotel}
                            onChange={setFilterHotel}
                            width="md:w-[250px]"
                            className="bg-black-500! border border-white/50 focus:ring-1! focus:ring-primary-800! text-xs md:text-sm h-10!"
                        />
                    )}
                    <Button onClick={handleAddClick} className="main-button-gradient gap-2">
                        <Plus className="h-4 w-4" />
                        Add a Service
                    </Button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={catalog}
                loading={loading}
                emptyMessage="No services defined in the catalog."
                pagination={{
                    page: 1,
                    totalPages: 1,
                    total: catalog.length,
                    onPageChange: () => { },
                }}
            />

            <DialogBox
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                title={selectedService ? "Edit Service" : "Add New Service"}
                widthClass="max-w-md"
            >
                <ServiceCatalogForm
                    hotelId={hotelId!}
                    initialData={selectedService}
                    onSuccess={() => {
                        setDialogOpen(false);
                        fetchCatalog();
                    }}
                    onCancel={() => setDialogOpen(false)}
                />
            </DialogBox>

            {/* Delete Confirmation Dialog */}
            <DialogBox
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Service"
                description={`Are you sure you want to delete "${selectedService?.displayName}"? This action cannot be undone.`}
                showFooter
                confirmText="Delete Service"
                cancelText="Cancel"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogOpen(false)}
                confirmLoading={deleteLoading}
                variant="danger"
            />
        </div>
    );
};

export default ServiceCatalogPage;
