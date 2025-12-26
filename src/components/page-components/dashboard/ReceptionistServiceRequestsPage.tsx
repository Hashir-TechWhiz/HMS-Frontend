"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllServiceRequests } from "@/services/serviceRequestService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { formatDateTime, normalizeDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { DateRange } from "react-day-picker";

const ReceptionistServiceRequestsPage = () => {
    const { role, loading: authLoading } = useAuth();

    const [serviceRequests, setServiceRequests] = useState<IServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<IServiceRequest | null>(null);

    const itemsPerPage = 10;

    // Fetch all service requests
    const fetchServiceRequests = useCallback(async (page: number = 1) => {
        if (!role || authLoading || role !== "receptionist") return;

        try {
            setLoading(true);

            // Normalize date range for API
            const { from, to } = normalizeDateRange(dateRange);
            const filters = from || to ? { from, to } : undefined;

            const response = await getAllServiceRequests(page, itemsPerPage, filters);

            if (response.success) {
                const requestsData: any = response.data;
                const requestsArray = Array.isArray(requestsData)
                    ? requestsData
                    : (requestsData?.items || []);

                setServiceRequests(requestsArray);

                // Handle pagination
                if (requestsData?.pagination) {
                    setTotalPages(requestsData.pagination.totalPages || 1);
                    setTotalItems(requestsData.pagination.totalItems || 0);
                } else {
                    setTotalPages(requestsArray.length > 0 ? 1 : 0);
                    setTotalItems(requestsArray.length);
                }
            } else {
                toast.error(response.message || "Failed to fetch service requests");
            }
        } catch {
            toast.error("An error occurred while fetching service requests");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, dateRange]);

    useEffect(() => {
        if (role && !authLoading && role === "receptionist") {
            fetchServiceRequests(currentPage);
        }
    }, [role, authLoading, currentPage, fetchServiceRequests]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle date range change
    const handleDateRangeChange = (range: DateRange | undefined) => {
        setDateRange(range);
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle view details
    const handleViewDetails = (request: IServiceRequest) => {
        setSelectedRequest(request);
        setViewDialogOpen(true);
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

    // Get assigned staff name
    const getAssignedStaffName = (request: IServiceRequest): string => {
        if (request.assignedTo && typeof request.assignedTo === "object") {
            return request.assignedTo.name;
        }
        return "Unassigned";
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

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (request: IServiceRequest) => formatDateTime(request.createdAt),
        },
        {
            key: "guest",
            label: "Guest",
            render: (request: IServiceRequest) => (
                <span className="font-medium">{getGuestName(request)}</span>
            ),
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
                <span>{serviceTypeLabels[request.serviceType]}</span>
            ),
        },
        {
            key: "assignedStaff",
            label: "Assigned Staff",
            render: (request: IServiceRequest) => (
                <div>
                    <div className={`text-sm ${getAssignedStaffName(request) === "Unassigned" ? "text-gray-400" : "font-medium"}`}>
                        {getAssignedStaffName(request)}
                    </div>
                </div>
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
            render: (request: IServiceRequest) => (
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
                </div>
            ),
        },
    ];

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Service Requests</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        View all service requests from guests
                    </p>
                </div>
                <DateRangePicker
                    value={dateRange}
                    onChange={handleDateRangeChange}
                    className="w-full max-w-sm"
                />
            </div>

            <DataTable
                columns={columns}
                data={serviceRequests}
                loading={loading}
                emptyMessage="No service requests found."
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
                                <div>
                                    <p className="text-sm text-gray-400">Assigned Role</p>
                                    <p className="text-sm font-medium capitalize">
                                        {selectedRequest.assignedRole || "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Assigned Staff</p>
                                    <p className={`text-sm ${getAssignedStaffName(selectedRequest) === "Unassigned" ? "text-gray-400" : "font-medium"}`}>
                                        {getAssignedStaffName(selectedRequest)}
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
        </div>
    );
};

export default ReceptionistServiceRequestsPage;

