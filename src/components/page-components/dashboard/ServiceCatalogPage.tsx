"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { getServiceCatalog, deleteServiceCatalog } from "@/services/serviceCatalogService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Edit, Trash2, CheckCircle2, XCircle } from "lucide-react";
import ServiceCatalogForm from "./ServiceCatalogForm";
import { Badge } from "@/components/ui/badge";

const ServiceCatalogPage = () => {
    const { role, user } = useAuth();
    const { selectedHotel } = useHotel();

    const [catalog, setCatalog] = useState<IServiceCatalog[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<IServiceCatalog | null>(null);

    const hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id);

    const fetchCatalog = useCallback(async () => {
        if (!hotelId) return;
        try {
            setLoading(true);
            const response = await getServiceCatalog(hotelId);
            if (response.success && response.data) {
                setCatalog(response.data);
            }
        } catch (error) {
            toast.error("Failed to fetch service catalog");
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    const handleAddClick = () => {
        setSelectedService(null);
        setDialogOpen(true);
    };

    const handleEditClick = (service: IServiceCatalog) => {
        setSelectedService(service);
        setDialogOpen(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (!hotelId) return;
        if (!confirm("Are you sure you want to delete this service?")) return;

        try {
            const response = await deleteServiceCatalog(hotelId, id);
            if (response.success) {
                toast.success("Service deleted successfully");
                fetchCatalog();
            } else {
                toast.error(response.message || "Failed to delete service");
            }
        } catch (error) {
            toast.error("An error occurred");
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
            key: "category",
            label: "Category",
            render: (item: IServiceCatalog) => (
                <Badge variant="outline" className="capitalize">{item.category || "General"}</Badge>
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
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteClick(item._id)} className="h-8 px-2">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Service Catalog</h1>
                    <p className="text-sm text-gray-400 mt-1">Manage predefined services and pricing for this hotel</p>
                </div>
                <Button onClick={handleAddClick} className="main-button-gradient gap-2">
                    <Plus className="h-4 w-4" />
                    Add Service
                </Button>
            </div>

            <div className="bg-primary-900/10 border border-white/10 rounded-xl p-5">
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
            </div>

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
        </div>
    );
};

export default ServiceCatalogPage;
