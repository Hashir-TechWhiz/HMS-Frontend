"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getMyServiceRequests, createServiceRequest } from "@/services/serviceRequestService";
import { getMyBookings } from "@/services/bookingService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import { toast } from "sonner";
import { Eye, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { formatDateTime, normalizeDateRange } from "@/lib/utils";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { DateRange } from "react-day-picker";

const MyServiceRequestsPage = () => {
    const { role, loading: authLoading } = useAuth();

    const [allServiceRequests, setAllServiceRequests] = useState<IServiceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Bookings for dropdown
    const [bookings, setBookings] = useState<IBooking[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<IServiceRequest | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    const itemsPerPage = 10;

    const {
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<{
        bookingId: string;
        serviceType: ServiceType;
        notes: string;
    }>();

    // Fetch service requests
    const fetchServiceRequests = useCallback(async (page: number = 1) => {
        if (!role || authLoading || role !== "guest") return;

        try {
            setLoading(true);

            // Normalize date range for API
            const { from, to } = normalizeDateRange(dateRange);
            const filters = from || to ? { from, to } : undefined;

            const response = await getMyServiceRequests(page, itemsPerPage, filters);

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

    // Fetch bookings for dropdown
    const fetchBookings = useCallback(async () => {
        if (!role || authLoading || role !== "guest") return;

        try {
            setBookingsLoading(true);
            // Fetch all guest bookings (only active/confirmed ones)
            const response = await getMyBookings(1, 100);

            if (response.success) {
                const bookingsData: any = response.data;
                const bookingsArray = Array.isArray(bookingsData)
                    ? bookingsData
                    : (bookingsData?.items || []);

                // Filter for confirmed bookings only
                const eligibleBookings = bookingsArray.filter(
                    (booking: IBooking) => booking.status === "confirmed"
                );

                setBookings(eligibleBookings);
            }
        } catch {
            // Silent fail - not critical
        } finally {
            setBookingsLoading(false);
        }
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading && role === "guest") {
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

    // Handle add service request
    const handleAddClick = async () => {
        // Fetch bookings when opening form
        await fetchBookings();

        reset({
            bookingId: "",
            serviceType: "housekeeping",
            notes: "",
        });
        setFormDialogOpen(true);
    };

    // Handle form submit
    const onSubmit = async (data: {
        bookingId: string;
        serviceType: ServiceType;
        notes: string;
    }) => {
        try {
            setFormLoading(true);

            // Find selected booking
            const selectedBooking = bookings.find(b => b._id === data.bookingId);
            if (!selectedBooking) {
                toast.error("Selected booking not found");
                return;
            }

            // Validation 1: Check if current date is before check-in date
            const currentDate = new Date();
            const checkInDate = new Date(selectedBooking.checkInDate);

            // Reset time to compare dates only
            currentDate.setHours(0, 0, 0, 0);
            checkInDate.setHours(0, 0, 0, 0);

            if (currentDate < checkInDate) {
                toast.error("Service requests can only be made after check-in date");
                return;
            }

            // Validation 2: Check for duplicate pending/in_progress requests
            const existingRequest = allServiceRequests.find(
                (request: IServiceRequest) => {
                    const requestBookingId = typeof request.booking === "object"
                        ? request.booking._id
                        : request.booking;

                    return requestBookingId === data.bookingId &&
                        request.serviceType === data.serviceType &&
                        (request.status === "pending" || request.status === "in_progress");
                }
            );

            if (existingRequest) {
                const serviceTypeLabel = serviceTypeOptions.find(
                    opt => opt.value === data.serviceType
                )?.label || data.serviceType;
                toast.error(`A ${serviceTypeLabel} request is already in progress for this booking`);
                return;
            }

            const requestData = {
                bookingId: data.bookingId,
                serviceType: data.serviceType,
                notes: data.notes || undefined,
            };

            const response = await createServiceRequest(requestData);

            if (response.success) {
                toast.success("Service request created successfully");
                setFormDialogOpen(false);
                fetchServiceRequests(currentPage);
            } else {
                toast.error(response.message || "Failed to create service request");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setFormLoading(false);
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

    // Service type options
    const serviceTypeOptions: Option[] = [
        { value: "housekeeping", label: "Housekeeping" },
        { value: "room_service", label: "Room Service" },
        { value: "maintenance", label: "Maintenance" },
    ];

    // Status filter options
    const statusFilterOptions: Option[] = [
        { value: "all", label: "All Requests" },
        { value: "pending", label: "Pending" },
        { value: "in_progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
    ];

    // Filter service requests based on status filter (client-side)
    const filteredServiceRequests = useMemo(() => {
        if (statusFilter === "all") {
            return allServiceRequests;
        }
        return allServiceRequests.filter((request) => request.status === statusFilter);
    }, [allServiceRequests, statusFilter]);

    // Update total items when filtered requests change
    useEffect(() => {
        setTotalItems(filteredServiceRequests.length);
    }, [filteredServiceRequests]);

    // Booking options
    const bookingOptions: Option[] = bookings.map((booking) => {
        const roomNumber = typeof booking.room === "object" ? booking.room.roomNumber : "N/A";
        const checkIn = formatDateTime(booking.checkInDate);
        return {
            value: booking._id,
            label: `Room ${roomNumber} - Check-in: ${checkIn}`,
        };
    });

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (request: IServiceRequest) => formatDateTime(request.createdAt),
        },
        {
            key: "serviceType",
            label: "Service Type",
            render: (request: IServiceRequest) => {
                const typeLabels: Record<ServiceType, string> = {
                    housekeeping: "Housekeeping",
                    room_service: "Room Service",
                    maintenance: "Maintenance",
                };
                return <span className="font-medium">{typeLabels[request.serviceType]}</span>;
            },
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
        <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg 
            shadow-primary-900/15">
            <div className="flex md:flex-row flex-col gap-5 md:items-center justify-between w-full">
                <div>
                    <h1 className="text-2xl font-bold text-white">My Service Requests</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Create and track your service requests
                    </p>
                </div>

                <div className="flex lg:flex-row flex-col gap-5 w-full justify-end md:w-auto">
                    <div>
                        <SelectField
                            name="statusFilter"
                            options={statusFilterOptions}
                            value={statusFilter}
                            onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
                            width="md:w-[150px]"
                            className="text-xs md:text-sm h-11!"
                        />
                    </div>

                    <DateRangePicker
                        value={dateRange}
                        onChange={handleDateRangeChange}
                        className="w-full md:max-w-sm"
                    />

                    <Button onClick={handleAddClick} className="flex items-center gap-2 main-button-gradient">
                        <Plus className="h-4 w-4" />
                        New Service Request
                    </Button>
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
                                        {serviceTypeOptions.find(
                                            (opt) => opt.value === selectedRequest.serviceType
                                        )?.label}
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

            {/* Create Form Dialog */}
            <DialogBox
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                title="New Service Request"
                widthClass="max-w-xl"
                showFooter
                confirmText="Submit Request"
                cancelText="Cancel"
                onConfirm={handleSubmit(onSubmit)}
                onCancel={() => setFormDialogOpen(false)}
                disableConfirm={formLoading || bookingsLoading}
                confirmLoading={formLoading}
            >
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-4 py-4">
                    {bookingsLoading ? (
                        <div className="text-center py-4 text-gray-400">Loading bookings...</div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-4">
                            <p className="text-sm text-gray-400">
                                No confirmed bookings found. You need a confirmed booking to create a service request.
                            </p>
                        </div>
                    ) : (
                        <>
                            <SelectField
                                name="bookingId"
                                label="Select Booking *"
                                placeholder="Select your Booking"
                                options={bookingOptions}
                                control={control}
                                required
                                error={errors.bookingId}
                            />

                            <SelectField
                                name="serviceType"
                                label="Service Type *"
                                options={serviceTypeOptions}
                                control={control}
                                required
                                error={errors.serviceType}
                            />

                            <TextAreaField
                                name="notes"
                                label="Notes"
                                placeholder="Please provide any additional details about your request (optional)"
                                register={control.register}
                                error={errors.notes}
                                rows={4}
                            />
                        </>
                    )}
                </form>
            </DialogBox>
        </div>
    );
};

export default MyServiceRequestsPage;

