"use client";

import {
    useState,
    useEffect,
    useCallback,
    useMemo
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";

import {
    getAllServiceRequests,
    updateServiceRequestStatus,
    assignServiceRequest
} from "@/services/serviceRequestService";

import { getServiceRequestsReport } from "@/services/reportService";
import { getUsers } from "@/services/adminUserService";
import { getActiveHotels } from "@/services/hotelService";

import { DateRange } from "react-day-picker";
import { useForm } from "react-hook-form";

import {
    formatDateTime,
    normalizeDateRange
} from "@/lib/utils";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import SelectField from "@/components/forms/SelectField";
import { DateRangePicker } from "@/components/common/DateRangePicker";

import { Eye, RefreshCw, Settings, Clock, Loader2 as LoaderIcon, CheckCircle2, UserPlus } from "lucide-react";

const AdminServiceRequestsPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedHotel } = useHotel();

    const [allServiceRequests, setAllServiceRequests] = useState<IServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    // KPI states
    const [kpiLoading, setKpiLoading] = useState(false);
    const [serviceRequestStats, setServiceRequestStats] = useState<IServiceRequestReport | null>(null);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<IServiceRequest | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [housekeepingStaff, setHousekeepingStaff] = useState<IUser[]>([]);

    const itemsPerPage = 10;

    const {
        handleSubmit: handleStatusSubmit,
        formState: { errors: statusErrors },
        reset: resetStatus,
        control: statusControl,
    } = useForm<{
        status: ServiceStatus;
    }>();

    const {
        handleSubmit: handleAssignSubmit,
        formState: { errors: assignErrors },
        reset: resetAssign,
        control: assignControl,
    } = useForm<{
        staffId: string;
    }>();

    // Fetch all service requests
    const fetchServiceRequests = useCallback(async (page: number = 1) => {
        if (!role || authLoading || role !== "admin") return;

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

                setAllServiceRequests(requestsArray);

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

    // Fetch service request statistics
    const fetchServiceRequestStats = useCallback(async () => {
        if (!role || authLoading || role !== "admin") return;

        try {
            setKpiLoading(true);
            const response = await getServiceRequestsReport();
            if (response.success && response.data) {
                setServiceRequestStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch service request statistics:", error);
        } finally {
            setKpiLoading(false);
        }
    }, [role, authLoading]);

    // Fetch housekeeping staff (hotel-scoped)
    const fetchHousekeepingStaff = useCallback(async (hotelId?: string) => {
        try {
            const response = await getUsers({ role: 'housekeeping', isActive: true });
            if (response.success && response.data) {
                const usersData: any = response.data;
                const usersArray = Array.isArray(usersData)
                    ? usersData
                    : (usersData?.items || usersData?.users || []);

                // Filter by hotel if hotelId is provided
                if (hotelId) {
                    const filteredStaff = usersArray.filter((user: IUser) => {
                        const userHotelId = typeof user.hotelId === 'string' ? user.hotelId : user.hotelId?._id;
                        return userHotelId === hotelId;
                    });
                    setHousekeepingStaff(filteredStaff);
                } else {
                    setHousekeepingStaff(usersArray);
                }
            }
        } catch (error) {
            console.error("Failed to fetch housekeeping staff:", error);
        }
    }, []);

    // Fetch available hotels
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
        if (role && !authLoading && role === "admin") {
            fetchServiceRequests(currentPage);
            fetchServiceRequestStats();
            fetchHousekeepingStaff();
            fetchAvailableHotels();
        }
    }, [role, authLoading, currentPage, fetchServiceRequests, fetchServiceRequestStats, fetchHousekeepingStaff, fetchAvailableHotels]);

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

    // Handle update status
    const handleUpdateStatusClick = (request: IServiceRequest) => {
        setSelectedRequest(request);
        resetStatus({
            status: request.status,
        });
        setStatusDialogOpen(true);
    };

    // Handle assign request
    const handleAssignRequestClick = (request: IServiceRequest) => {
        setSelectedRequest(request);
        resetAssign({
            staffId: '',
        });

        // Fetch staff from the same hotel as the service request
        const requestHotelId = typeof request.hotelId === 'string' ? request.hotelId : request.hotelId?._id;
        if (requestHotelId) {
            fetchHousekeepingStaff(requestHotelId);
        }

        setAssignDialogOpen(true);
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
                fetchServiceRequestStats();
            } else {
                toast.error(response.message || "Failed to update status");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setStatusLoading(false);
        }
    };

    // Handle assignment submit
    const onAssignSubmit = async (data: { staffId: string }) => {
        if (!selectedRequest) return;

        try {
            setAssignLoading(true);

            const response = await assignServiceRequest(selectedRequest._id, data.staffId);

            if (response.success) {
                toast.success("Service request assigned successfully");
                setAssignDialogOpen(false);
                fetchServiceRequests(currentPage);
                fetchServiceRequestStats();
            } else {
                toast.error(response.message || "Failed to assign request");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setAssignLoading(false);
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

    // Status options for form
    const statusOptions: Option[] = [
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    // Status filter options
    const statusFilterOptions: Option[] = [
        { value: "all", label: "All Requests" },
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    // Filter service requests based on status and hotel filters (client-side)
    const filteredServiceRequests = useMemo(() => {
        let filtered = allServiceRequests;

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((request) => request.status === statusFilter);
        }

        // Filter by hotel
        if (hotelFilter !== "all") {
            filtered = filtered.filter((request) => {
                if (!request.hotelId) return false;
                const requestHotelId = typeof request.hotelId === 'string' ? request.hotelId : request.hotelId._id;
                return requestHotelId === hotelFilter;
            });
        }

        return filtered;
    }, [allServiceRequests, statusFilter, hotelFilter]);

    // Update total items when filtered requests change
    useEffect(() => {
        setTotalItems(filteredServiceRequests.length);
    }, [filteredServiceRequests]);

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
            label: "Assigned To",
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
                    {request.status === "pending" && !request.assignedTo && (
                        <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleAssignRequestClick(request)}
                            className="h-8 px-2 bg-blue-600 hover:bg-blue-700"
                            title="Assign to Staff"
                        >
                            <UserPlus className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatusClick(request)}
                        className="h-8 px-2"
                        title="Update Status"
                    >
                        <RefreshCw className="h-4 w-4" />
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
            {/* KPI Cards */}
            {serviceRequestStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Requests"
                        value={serviceRequestStats.totalServiceRequests}
                        icon={Settings}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        loading={kpiLoading}
                    />
                    <StatCard
                        title="Pending"
                        value={serviceRequestStats.byStatus.pending}
                        icon={Clock}
                        iconColor="text-yellow-400"
                        iconBg="bg-yellow-500/10"
                        loading={kpiLoading}
                        subtitle="Awaiting action"
                    />
                    <StatCard
                        title="In Progress"
                        value={serviceRequestStats.byStatus.in_progress}
                        icon={LoaderIcon}
                        iconColor="text-blue-400"
                        iconBg="bg-blue-500/10"
                        loading={kpiLoading}
                        subtitle="Being handled"
                    />
                    <StatCard
                        title="Completed"
                        value={serviceRequestStats.byStatus.completed}
                        icon={CheckCircle2}
                        iconColor="text-green-400"
                        iconBg="bg-green-500/10"
                        loading={kpiLoading}
                        subtitle="Finished requests"
                    />
                </div>
            )}

            {/* Table */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">

                <div className="flex md:flex-row flex-col gap-5 md:items-center justify-between w-full">
                    <div>
                        <h1 className="text-2xl font-semibold">Service Requests</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            View and manage all service requests
                        </p>
                    </div>

                    <div className="flex lg:flex-row flex-col gap-5 w-full justify-end md:w-auto">
                        {role === "admin" && (
                            <SelectField
                                name="hotelFilter"
                                options={[
                                    { value: "all", label: "All Hotels" },
                                    ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
                                ]}
                                value={hotelFilter}
                                onChange={(v) => { setHotelFilter(v); setCurrentPage(1); }}
                                width="md:w-[250px]"
                                className="text-xs md:text-sm h-11!"
                            />
                        )}
                        <SelectField
                            name="statusFilter"
                            options={statusFilterOptions}
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                            width="md:w-[250px]"
                            className="text-xs md:text-sm h-11!"
                        />
                        <DateRangePicker
                            value={dateRange}
                            onChange={handleDateRangeChange}
                            className="w-full max-w-sm"
                        />
                    </div>
                </div>
                <DataTable
                    columns={columns}
                    data={filteredServiceRequests}
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

                {/* Assign Request Dialog */}
                <DialogBox
                    open={assignDialogOpen}
                    onOpenChange={setAssignDialogOpen}
                    title="Assign Service Request"
                    widthClass="max-w-md"
                    showFooter
                    confirmText="Assign"
                    cancelText="Cancel"
                    onConfirm={handleAssignSubmit(onAssignSubmit)}
                    onCancel={() => setAssignDialogOpen(false)}
                    disableConfirm={assignLoading}
                    confirmLoading={assignLoading}
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleAssignSubmit(onAssignSubmit)(e); }} className="space-y-4 py-4">
                        <SelectField
                            name="staffId"
                            label="Assign to Housekeeping Staff *"
                            options={housekeepingStaff.map(staff => ({
                                value: staff._id,
                                label: staff.name
                            }))}
                            control={assignControl}
                            required
                            error={assignErrors.staffId}
                        />
                        <p className="text-xs text-gray-400">
                            Select a housekeeping staff member to assign this request to.
                        </p>
                    </form>
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
                    onConfirm={handleStatusSubmit(onStatusSubmit)}
                    onCancel={() => setStatusDialogOpen(false)}
                    disableConfirm={statusLoading}
                    confirmLoading={statusLoading}
                >
                    <form onSubmit={(e) => { e.preventDefault(); handleStatusSubmit(onStatusSubmit)(e); }} className="space-y-4 py-4">
                        <SelectField
                            name="status"
                            label="Service Request Status *"
                            options={statusOptions}
                            control={statusControl}
                            required
                            error={statusErrors.status}
                        />
                        <p className="text-xs text-gray-400">
                            Update the status to reflect the current state of the service request.
                        </p>
                    </form>
                </DialogBox>
            </div>
        </div>
    );
};

export default AdminServiceRequestsPage;

