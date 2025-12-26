"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAssignedServiceRequests, updateServiceRequestStatus } from "@/services/serviceRequestService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/forms/SelectField";
import { toast } from "sonner";
import { Eye, RefreshCw, Check } from "lucide-react";
import { useForm } from "react-hook-form";
import { formatDateTime } from "@/lib/utils";

const HousekeepingServiceRequestsPage = () => {
    const { role, user, loading: authLoading } = useAuth();

    const [serviceRequests, setServiceRequests] = useState<IServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<IServiceRequest | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const itemsPerPage = 10;

    const {
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<{
        status: ServiceStatus;
    }>();

    // Fetch assigned service requests
    const fetchServiceRequests = useCallback(async (page: number = 1) => {
        if (!role || authLoading || role !== "housekeeping" || !user) return;

        try {
            setLoading(true);
            const response = await getAssignedServiceRequests(page, itemsPerPage);

            if (response.success) {
                const requestsData: any = response.data;
                const requestsArray = Array.isArray(requestsData)
                    ? requestsData
                    : (requestsData?.items || []);

                // Filter to show only:
                // 1. Pending requests with no assignedTo (available to accept)
                // 2. Requests assigned to current user (any status)
                const filteredRequests = requestsArray.filter((request: IServiceRequest) => {
                    // Show unassigned pending requests
                    if (request.status === "pending" && !request.assignedTo) {
                        return true;
                    }
                    // Show requests assigned to current user
                    if (request.assignedTo && typeof request.assignedTo === "object") {
                        return request.assignedTo._id === user._id;
                    }
                    return false;
                });

                setServiceRequests(filteredRequests);

                // Handle pagination
                if (requestsData?.pagination) {
                    setTotalPages(requestsData.pagination.totalPages || 1);
                    setTotalItems(filteredRequests.length);
                } else {
                    setTotalPages(filteredRequests.length > 0 ? 1 : 0);
                    setTotalItems(filteredRequests.length);
                }
            } else {
                toast.error(response.message || "Failed to fetch service requests");
            }
        } catch {
            toast.error("An error occurred while fetching service requests");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, user]);

    useEffect(() => {
        if (role && !authLoading && role === "housekeeping") {
            fetchServiceRequests(currentPage);
        }
    }, [role, authLoading, currentPage, fetchServiceRequests]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (request: IServiceRequest) => {
        setSelectedRequest(request);
        setViewDialogOpen(true);
    };

    // Handle accept request
    const handleAcceptRequest = async (request: IServiceRequest) => {
        try {
            setStatusLoading(true);

            const response = await updateServiceRequestStatus(request._id, "in_progress");

            if (response.success) {
                toast.success("Service request accepted successfully");
                fetchServiceRequests(currentPage);
            } else {
                toast.error(response.message || "Failed to accept request");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setStatusLoading(false);
        }
    };

    // Handle update status
    const handleUpdateStatusClick = (request: IServiceRequest) => {
        setSelectedRequest(request);
        reset({
            status: request.status,
        });
        setStatusDialogOpen(true);
    };

    // Handle status update submit
    const onStatusSubmit = async (data: { status: ServiceStatus }) => {
        if (!selectedRequest) return;

        try {
            setStatusLoading(true);

            const response = await updateServiceRequestStatus(selectedRequest._id, data.status);

            if (response.success) {
                toast.success("Service request status updated successfully");
                setStatusDialogOpen(false);
                fetchServiceRequests(currentPage);
            } else {
                toast.error(response.message || "Failed to update status");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setStatusLoading(false);
        }
    };

    // Get room number
    const getRoomNumber = (request: IServiceRequest): string => {
        if (request.room && typeof request.room === "object") {
            return request.room.roomNumber;
        }
        return "N/A";
    };

    // Get room type
    const getRoomType = (request: IServiceRequest): string => {
        if (request.room && typeof request.room === "object") {
            return request.room.roomType;
        }
        return "N/A";
    };

    // Get guest name
    const getGuestName = (request: IServiceRequest): string => {
        if (request.requestedBy && typeof request.requestedBy === "object") {
            return request.requestedBy.name;
        }
        return "N/A";
    };

    // Get booking reference
    const getBookingReference = (request: IServiceRequest): string => {
        if (request.booking && typeof request.booking === "object") {
            return request.booking._id.slice(-8).toUpperCase();
        }
        return "N/A";
    };

    // Status badge
    const StatusBadge = ({ status }: { status: ServiceStatus }) => {
        const colors = {
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
            in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            completed: "bg-green-500/20 text-green-400 border-green-500/50",
        };

        const labels = {
            pending: "Pending",
            in_progress: "In Progress",
            completed: "Completed",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status]}`}>
                {labels[status]}
            </span>
        );
    };

    // Service type labels
    const serviceTypeLabels: Record<ServiceType, string> = {
        housekeeping: "Housekeeping",
        room_service: "Room Service",
        maintenance: "Maintenance",
    };

    // Status options
    const statusOptions: Option[] = [
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (request: IServiceRequest) => formatDateTime(request.createdAt),
        },
        {
            key: "room",
            label: "Room",
            render: (request: IServiceRequest) => (
                <div>
                    <div className="font-medium">{getRoomNumber(request)}</div>
                    <div className="text-xs text-gray-400">{getRoomType(request)}</div>
                </div>
            ),
        },
        {
            key: "serviceType",
            label: "Service Type",
            render: (request: IServiceRequest) => (
                <span className="font-medium">{serviceTypeLabels[request.serviceType]}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (request: IServiceRequest) => <StatusBadge status={request.status} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (request: IServiceRequest) => {
                const isUnassignedPending = request.status === "pending" && !request.assignedTo;
                const isAssignedToMe = request.assignedTo && typeof request.assignedTo === "object" && user && request.assignedTo._id === user._id;

                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(request)}
                            className="h-8 px-2"
                            title="View Details"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        {isUnassignedPending ? (
                            <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleAcceptRequest(request)}
                                className="h-8 px-2 bg-green-600 hover:bg-green-700"
                                title="Accept Request"
                                disabled={statusLoading}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        ) : isAssignedToMe && request.status !== "completed" ? (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatusClick(request)}
                                className="h-8 px-2"
                                title="Update Status"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        ) : null}
                    </div>
                );
            },
        },
    ];

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Assigned Service Requests</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        View and manage service requests assigned to housekeeping
                    </p>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={serviceRequests}
                loading={loading}
                emptyMessage="No assigned service requests found."
                pagination={{
                    page: currentPage,
                    totalPages: totalPages,
                    total: totalItems,
                    onPageChange: handlePageChange,
                }}
                selectable={false}
            />

            {/* View Details Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Service Request Details"
                widthClass="max-w-2xl"
            >
                {selectedRequest && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Request ID</p>
                                <p className="text-sm font-medium">{selectedRequest._id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Status</p>
                                <StatusBadge status={selectedRequest.status} />
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Service Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Service Type</p>
                                    <p className="text-sm font-medium">
                                        {serviceTypeLabels[selectedRequest.serviceType]}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Booking Reference</p>
                                    <p className="text-sm font-medium">
                                        {getBookingReference(selectedRequest)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Room Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Room Number</p>
                                    <p className="text-sm font-medium">{getRoomNumber(selectedRequest)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Room Type</p>
                                    <p className="text-sm font-medium">{getRoomType(selectedRequest)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Guest Information</h3>
                            <div>
                                <p className="text-sm text-gray-400">Guest Name</p>
                                <p className="text-sm font-medium">{getGuestName(selectedRequest)}</p>
                            </div>
                        </div>

                        {selectedRequest.notes && (
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold mb-2">Notes</h3>
                                <p className="text-sm text-gray-300">{selectedRequest.notes}</p>
                            </div>
                        )}

                        <div className="border-t border-gray-700 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Created At</p>
                                    <p className="text-sm font-medium">
                                        {formatDateTime(selectedRequest.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Last Updated</p>
                                    <p className="text-sm font-medium">
                                        {formatDateTime(selectedRequest.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogBox>

            {/* Update Status Dialog */}
            <DialogBox
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                title="Update Service Request Status"
                widthClass="max-w-md"
                showFooter
                confirmText="Update Status"
                cancelText="Cancel"
                onConfirm={handleSubmit(onStatusSubmit)}
                onCancel={() => setStatusDialogOpen(false)}
                disableConfirm={statusLoading}
                confirmLoading={statusLoading}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onStatusSubmit)(e); }} className="space-y-4 py-4">
                    <SelectField
                        name="status"
                        label="Service Request Status *"
                        options={statusOptions}
                        control={control}
                        required
                        error={errors.status}
                    />
                    <p className="text-xs text-gray-400">
                        Update the status to reflect the current state of the service request.
                    </p>
                </form>
            </DialogBox>
        </div>
    );
};

export default HousekeepingServiceRequestsPage;

