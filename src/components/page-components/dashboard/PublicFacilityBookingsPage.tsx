"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";

import {
    getAllFacilityBookings,
    getFacilityBookingById,
    cancelFacilityBooking,
    confirmFacilityBooking,
    checkInFacilityBooking,
    checkOutFacilityBooking,
    checkFacilityAvailability,
    createFacilityBooking,
    addFacilityPayment
} from "@/services/publicFacilityBookingService";
import { getPublicFacilities, getFacilitiesByHotel } from "@/services/publicFacilityService";

import { useForm } from "react-hook-form";
import { formatDateTime } from "@/lib/utils";
import { format } from "date-fns";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import TextAreaField from "@/components/forms/TextAreaField";
import PaymentStatusBadge from "@/components/common/PaymentStatusBadge";

import {
    Eye,
    Plus,
    Calendar,
    CheckCircle2,
    Clock,
    XCircle,
    Ban,
    DollarSign,
    LogIn,
    LogOut
} from "lucide-react";

const BOOKING_TYPES: FacilityBookingType[] = ['hourly', 'daily'];
const BOOKING_STATUS: FacilityBookingStatus[] = ['pending', 'confirmed', 'in_use', 'completed', 'cancelled'];

const PublicFacilityBookingsPage = () => {
    const { role, user } = useAuth();
    const { selectedHotel } = useHotel();

    const [bookings, setBookings] = useState<IPublicFacilityBooking[]>([]);
    const [facilities, setFacilities] = useState<IPublicFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const ITEMS_PER_PAGE = 10;

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<IPublicFacilityBooking | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const {
        register: registerBooking,
        handleSubmit: handleSubmitBooking,
        formState: { errors: bookingErrors },
        reset: resetBooking,
        control: controlBooking,
        watch: watchBooking,
        setValue: setValueBooking
    } = useForm<{
        facility: string;
        bookingType: FacilityBookingType;
        startDate: string;
        endDate: string;
        startTime: string;
        endTime: string;
        numberOfGuests: number;
        purpose: string;
        specialRequests: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
    }>();

    const {
        register: registerPayment,
        handleSubmit: handleSubmitPayment,
        formState: { errors: paymentErrors },
        reset: resetPayment,
        control: controlPayment
    } = useForm<{
        amount: number;
        paymentMethod: PaymentMethod;
        transactionId: string;
        notes: string;
    }>();

    const bookingType = watchBooking('bookingType');
    const selectedFacilityId = watchBooking('facility');
    const startDate = watchBooking('startDate');
    const endDate = watchBooking('endDate');
    const startTime = watchBooking('startTime');
    const endTime = watchBooking('endTime');

    // Get selected facility details
    const selectedFacilityData = facilities.find(f => f._id === selectedFacilityId);

    // Calculate estimated amount
    const calculateEstimatedAmount = () => {
        if (!selectedFacilityData || !startDate || !endDate) return 0;

        if (bookingType === 'hourly' && startTime && endTime) {
            const start = new Date(`${startDate}T${startTime}`);
            const end = new Date(`${endDate}T${endTime}`);
            const hours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
            return hours * (selectedFacilityData.pricePerHour || 0);
        } else if (bookingType === 'daily') {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return days * (selectedFacilityData.pricePerDay || 0);
        }
        return 0;
    };

    const estimatedAmount = calculateEstimatedAmount();

    // Fetch bookings
    const fetchBookings = useCallback(async () => {
        try {
            setLoading(true);

            const filters: any = {};
            if (statusFilter !== "all") {
                filters.status = statusFilter as FacilityBookingStatus;
            }

            const response = await getAllFacilityBookings(currentPage, ITEMS_PER_PAGE, filters);

            if (response.success && response.data) {
                const data = response.data as any;
                setBookings(data.items || []);
                if (data.pagination) {
                    setTotalPages(data.pagination.totalPages);
                }
            } else {
                toast.error(response.message || "Failed to fetch bookings");
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
            toast.error("An error occurred while fetching bookings");
        } finally {
            setLoading(false);
        }
    }, [currentPage, statusFilter]);

    // Fetch facilities
    const fetchFacilities = useCallback(async () => {
        try {
            if (selectedHotel) {
                console.log("Fetching facilities for hotel:", selectedHotel._id);
                const response = await getFacilitiesByHotel(selectedHotel._id);
                console.log("Facilities response:", response);
                if (response.success && response.data) {
                    const facilitiesData = response.data as IPublicFacility[];
                    console.log("Fetched facilities:", facilitiesData);
                    setFacilities(facilitiesData);
                } else {
                    console.log("No facilities data or failed:", response.message);
                    setFacilities([]);
                }
            } else {
                console.log("No hotel selected");
            }
        } catch (error) {
            console.error("Error fetching facilities:", error);
            setFacilities([]);
        }
    }, [selectedHotel]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    // Auto-set booking type based on selected facility
    useEffect(() => {
        if (selectedFacilityData) {
            // Determine available booking types based on pricing
            const hasHourlyPrice = selectedFacilityData.pricePerHour && selectedFacilityData.pricePerHour > 0;
            const hasDailyPrice = selectedFacilityData.pricePerDay && selectedFacilityData.pricePerDay > 0;
            
            // Set default booking type
            if (hasHourlyPrice && !hasDailyPrice) {
                setValueBooking('bookingType', 'hourly');
            } else if (hasDailyPrice && !hasHourlyPrice) {
                setValueBooking('bookingType', 'daily');
            } else if (hasHourlyPrice && hasDailyPrice) {
                // Both available, keep current selection or default to hourly
                if (!bookingType) {
                    setValueBooking('bookingType', 'hourly');
                }
            }
        }
    }, [selectedFacilityData, setValueBooking]);

    // Calculate statistics
    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length,
        inUse: bookings.filter(b => b.status === 'in_use').length,
        completed: bookings.filter(b => b.status === 'completed').length
    };

    // Handle view booking
    const handleView = async (booking: IPublicFacilityBooking) => {
        try {
            const response = await getFacilityBookingById(booking._id);
            if (response.success && response.data) {
                setSelectedBooking(response.data as IPublicFacilityBooking);
                setViewDialogOpen(true);
            }
        } catch (error) {
            toast.error("Failed to fetch booking details");
        }
    };

    // Handle add new booking
    const handleAddNew = () => {
        resetBooking({
            facility: '',
            bookingType: 'hourly',
            startDate: format(new Date(), 'yyyy-MM-dd'),
            endDate: format(new Date(), 'yyyy-MM-dd'),
            startTime: '09:00',
            endTime: '17:00',
            numberOfGuests: 1,
            purpose: '',
            specialRequests: '',
            customerName: '',
            customerPhone: '',
            customerEmail: ''
        });
        setFormDialogOpen(true);
    };

    // Handle booking submit
    const onSubmitBooking = async (data: any) => {
        try {
            setFormLoading(true);

            // Check availability first
            const availabilityResponse = await checkFacilityAvailability(
                data.facility,
                data.startDate,
                data.endDate,
                data.bookingType === 'hourly' ? data.startTime : undefined,
                data.bookingType === 'hourly' ? data.endTime : undefined
            );

            if (!availabilityResponse.success || !availabilityResponse.data?.available) {
                toast.error("Facility is not available for the selected date/time");
                return;
            }

            const bookingData: any = {
                facility: data.facility,
                bookingType: data.bookingType,
                startDate: data.startDate,
                endDate: data.endDate,
                numberOfGuests: Number(data.numberOfGuests),
                purpose: data.purpose,
                specialRequests: data.specialRequests
            };

            if (data.bookingType === 'hourly') {
                bookingData.startTime = data.startTime;
                bookingData.endTime = data.endTime;
            }

            // For staff creating walk-in bookings
            if (role !== 'guest' && data.customerName && data.customerPhone) {
                bookingData.customerDetails = {
                    name: data.customerName,
                    phone: data.customerPhone,
                    email: data.customerEmail || undefined
                };
            }

            const response = await createFacilityBooking(bookingData);

            if (response.success) {
                toast.success("Booking created successfully");
                setFormDialogOpen(false);
                fetchBookings();
            } else {
                toast.error(response.message || "Failed to create booking");
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            toast.error("An error occurred while creating booking");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle confirm booking
    const handleConfirm = async (booking: IPublicFacilityBooking) => {
        try {
            setActionLoading(true);
            const response = await confirmFacilityBooking(booking._id);

            if (response.success) {
                toast.success("Booking confirmed successfully");
                fetchBookings();
            } else {
                toast.error(response.message || "Failed to confirm booking");
            }
        } catch (error) {
            toast.error("An error occurred while confirming booking");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle check-in
    const handleCheckIn = async (booking: IPublicFacilityBooking) => {
        try {
            setActionLoading(true);
            const response = await checkInFacilityBooking(booking._id);

            if (response.success) {
                toast.success("Checked in successfully");
                fetchBookings();
            } else {
                toast.error(response.message || "Failed to check in");
            }
        } catch (error) {
            toast.error("An error occurred during check-in");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle check-out
    const handleCheckOut = async (booking: IPublicFacilityBooking) => {
        try {
            setActionLoading(true);
            const response = await checkOutFacilityBooking(booking._id);

            if (response.success) {
                toast.success("Checked out successfully");
                fetchBookings();
            } else {
                toast.error(response.message || "Failed to check out");
            }
        } catch (error) {
            toast.error("An error occurred during check-out");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle cancel booking
    const handleCancelBooking = async () => {
        if (!selectedBooking) return;

        try {
            setActionLoading(true);
            const response = await cancelFacilityBooking(selectedBooking._id);

            if (response.success) {
                toast.success("Booking cancelled successfully");
                setCancelDialogOpen(false);
                fetchBookings();
            } else {
                toast.error(response.message || "Failed to cancel booking");
            }
        } catch (error) {
            toast.error("An error occurred while cancelling booking");
        } finally {
            setActionLoading(false);
        }
    };

    // Handle payment
    const handlePayment = (booking: IPublicFacilityBooking) => {
        setSelectedBooking(booking);
        resetPayment({
            amount: booking.totalAmount - booking.totalPaid,
            paymentMethod: 'card',
            transactionId: '',
            notes: ''
        });
        setPaymentDialogOpen(true);
    };

    // Handle payment submit
    const onSubmitPayment = async (data: any) => {
        if (!selectedBooking) return;

        try {
            setFormLoading(true);

            const response = await addFacilityPayment(selectedBooking._id, {
                bookingType: 'facility',
                amount: Number(data.amount),
                paymentMethod: data.paymentMethod,
                transactionId: data.transactionId || undefined,
                notes: data.notes || undefined
            });

            if (response.success) {
                toast.success("Payment added successfully");
                setPaymentDialogOpen(false);
                fetchBookings();
            } else {
                toast.error(response.message || "Failed to add payment");
            }
        } catch (error) {
            console.error("Error adding payment:", error);
            toast.error("An error occurred while adding payment");
        } finally {
            setFormLoading(false);
        }
    };

    // Table columns
    const columns = [
        {
            key: "facility",
            label: "Facility",
            render: (booking: IPublicFacilityBooking) => {
                const facility = booking.facility as IPublicFacility;
                return facility?.name || 'N/A';
            }
        },
        {
            key: "customer",
            label: "Customer",
            render: (booking: IPublicFacilityBooking) => {
                if (booking.guest) {
                    const guest = booking.guest as IUser;
                    return guest.name;
                }
                return booking.customerDetails?.name || 'Walk-in';
            }
        },
        {
            key: "date",
            label: "Date",
            render: (booking: IPublicFacilityBooking) => {
                const start = format(new Date(booking.startDate), 'MMM dd, yyyy');
                const end = format(new Date(booking.endDate), 'MMM dd, yyyy');
                return start === end ? start : `${start} - ${end}`;
            }
        },
        {
            key: "time",
            label: "Time",
            render: (booking: IPublicFacilityBooking) => {
                if (booking.bookingType === 'hourly' && booking.startTime && booking.endTime) {
                    return `${booking.startTime} - ${booking.endTime}`;
                }
                return 'All Day';
            }
        },
        {
            key: "guests",
            label: "Guests",
            render: (booking: IPublicFacilityBooking) => booking.numberOfGuests
        },
        {
            key: "amount",
            label: "Amount",
            render: (booking: IPublicFacilityBooking) => `$${booking.totalAmount.toFixed(2)}`
        },
        {
            key: "payment",
            label: "Payment",
            render: (booking: IPublicFacilityBooking) => (
                <PaymentStatusBadge status={booking.paymentStatus} />
            )
        },
        {
            key: "status",
            label: "Status",
            render: (booking: IPublicFacilityBooking) => (
                <span className={`px-2 py-1 rounded text-xs ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                }`}>
                    {booking.status}
                </span>
            )
        },
        {
            key: "actions",
            label: "Actions",
            render: (booking: IPublicFacilityBooking) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleView(booking)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {booking.status === 'pending' && role !== 'guest' && (
                        <Button variant="ghost" size="sm" onClick={() => handleConfirm(booking)}>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                    )}
                    {booking.status === 'confirmed' && role !== 'guest' && (
                        <Button variant="ghost" size="sm" onClick={() => handleCheckIn(booking)}>
                            <LogIn className="h-4 w-4 text-blue-500" />
                        </Button>
                    )}
                    {booking.status === 'in_use' && role !== 'guest' && (
                        <Button variant="ghost" size="sm" onClick={() => handleCheckOut(booking)}>
                            <LogOut className="h-4 w-4 text-purple-500" />
                        </Button>
                    )}
                    {booking.paymentStatus !== 'paid' && booking.status !== 'cancelled' && (
                        <Button variant="ghost" size="sm" onClick={() => handlePayment(booking)}>
                            <DollarSign className="h-4 w-4 text-green-500" />
                        </Button>
                    )}
                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedBooking(booking);
                                setCancelDialogOpen(true);
                            }}
                        >
                            <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Facility Bookings</h1>
                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Booking
                </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <StatCard
                    title="Total Bookings"
                    value={stats.total}
                    icon={Calendar}
                />
                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon={Clock}
                    iconColor="text-yellow-500"
                    iconBg="bg-yellow-500/10"
                />
                <StatCard
                    title="Confirmed"
                    value={stats.confirmed}
                    icon={CheckCircle2}
                    iconColor="text-green-500"
                    iconBg="bg-green-500/10"
                />
                <StatCard
                    title="In Use"
                    value={stats.inUse}
                    icon={LogIn}
                    iconColor="text-blue-500"
                    iconBg="bg-blue-500/10"
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle2}
                    iconColor="text-gray-500"
                    iconBg="bg-gray-500/10"
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
                        ...BOOKING_STATUS.map(status => ({
                            value: status,
                            label: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
                        }))
                    ]}
                />
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={bookings}
                loading={loading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />

            {/* View Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Booking Details"
                description="View facility booking information"
            >
                {selectedBooking && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Facility</p>
                                <p className="font-medium">
                                    {(selectedBooking.facility as IPublicFacility)?.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Booking Type</p>
                                <p className="font-medium capitalize">{selectedBooking.bookingType}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Start Date</p>
                                <p className="font-medium">
                                    {format(new Date(selectedBooking.startDate), 'MMM dd, yyyy')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">End Date</p>
                                <p className="font-medium">
                                    {format(new Date(selectedBooking.endDate), 'MMM dd, yyyy')}
                                </p>
                            </div>
                            {selectedBooking.startTime && (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-500">Start Time</p>
                                        <p className="font-medium">{selectedBooking.startTime}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">End Time</p>
                                        <p className="font-medium">{selectedBooking.endTime}</p>
                                    </div>
                                </>
                            )}
                            <div>
                                <p className="text-sm text-gray-500">Number of Guests</p>
                                <p className="font-medium">{selectedBooking.numberOfGuests}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <p className="font-medium capitalize">{selectedBooking.status}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Amount</p>
                                <p className="font-medium">${selectedBooking.totalAmount.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Paid</p>
                                <p className="font-medium">${selectedBooking.totalPaid.toFixed(2)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Balance</p>
                                <p className="font-medium">
                                    ${(selectedBooking.totalAmount - selectedBooking.totalPaid).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Payment Status</p>
                                <PaymentStatusBadge status={selectedBooking.paymentStatus} />
                            </div>
                        </div>
                        {selectedBooking.purpose && (
                            <div>
                                <p className="text-sm text-gray-500">Purpose</p>
                                <p className="font-medium">{selectedBooking.purpose}</p>
                            </div>
                        )}
                        {selectedBooking.specialRequests && (
                            <div>
                                <p className="text-sm text-gray-500">Special Requests</p>
                                <p className="font-medium">{selectedBooking.specialRequests}</p>
                            </div>
                        )}
                    </div>
                )}
            </DialogBox>

            {/* Booking Form Dialog */}
            <DialogBox
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                title="New Facility Booking"
                description="Create a new facility booking"
            >
                <form onSubmit={handleSubmitBooking(onSubmitBooking)} className="space-y-4">
                    {facilities.length === 0 ? (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                No facilities available. Please create facilities first in the Public Facilities page.
                            </p>
                        </div>
                    ) : (
                        <SelectField
                            name="facility"
                            label="Facility"
                            control={controlBooking}
                            error={bookingErrors.facility}
                            required
                            placeholder={`Select a facility (${facilities.filter(f => f.status === 'available').length} available)`}
                            options={facilities
                                .filter(f => f.status === 'available')
                                .map(f => ({
                                    value: f._id,
                                    label: `${f.name} - ${f.facilityType} (${f.pricePerHour ? `$${f.pricePerHour}/hr` : ''}${f.pricePerHour && f.pricePerDay ? ' | ' : ''}${f.pricePerDay ? `$${f.pricePerDay}/day` : ''})`
                                }))
                            }
                        />
                    )}
                    {selectedFacilityData && (
                        <>
                            <div className="p-3 bg-blue-50 rounded-lg text-sm">
                                <p className="font-medium text-blue-900">Facility Details:</p>
                                <p className="text-blue-700">Capacity: {selectedFacilityData.capacity} guests</p>
                                <p className="text-blue-700">
                                    Pricing: 
                                    {selectedFacilityData.pricePerHour && ` $${selectedFacilityData.pricePerHour}/hour`}
                                    {selectedFacilityData.pricePerHour && selectedFacilityData.pricePerDay && ' | '}
                                    {selectedFacilityData.pricePerDay && ` $${selectedFacilityData.pricePerDay}/day`}
                                </p>
                                {selectedFacilityData.operatingHours && (
                                    <p className="text-blue-700">
                                        Operating Hours: {selectedFacilityData.operatingHours.start} - {selectedFacilityData.operatingHours.end}
                                    </p>
                                )}
                            </div>
                            <SelectField
                                name="bookingType"
                                label="Booking Type"
                                control={controlBooking}
                                error={bookingErrors.bookingType}
                                required
                                options={[
                                    ...(selectedFacilityData.pricePerHour && selectedFacilityData.pricePerHour > 0 
                                        ? [{ value: 'hourly', label: `Hourly ($${selectedFacilityData.pricePerHour}/hour)` }] 
                                        : []),
                                    ...(selectedFacilityData.pricePerDay && selectedFacilityData.pricePerDay > 0 
                                        ? [{ value: 'daily', label: `Daily ($${selectedFacilityData.pricePerDay}/day)` }] 
                                        : [])
                                ]}
                            />
                        </>
                    )}
                    {selectedFacilityData && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <InputField
                                    name="startDate"
                                    label="Start Date"
                                    type="date"
                                    register={registerBooking}
                                    error={bookingErrors.startDate}
                                    validation={{ 
                                        required: "Start date is required",
                                        min: {
                                            value: format(new Date(), 'yyyy-MM-dd'),
                                            message: "Start date cannot be in the past"
                                        }
                                    }}
                                />
                                <InputField
                                    name="endDate"
                                    label="End Date"
                                    type="date"
                                    register={registerBooking}
                                    error={bookingErrors.endDate}
                                    validation={{ 
                                        required: "End date is required",
                                        min: {
                                            value: format(new Date(), 'yyyy-MM-dd'),
                                            message: "End date cannot be in the past"
                                        }
                                    }}
                                />
                            </div>
                            {bookingType === 'hourly' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        name="startTime"
                                        label="Start Time"
                                        type="time"
                                        register={registerBooking}
                                        error={bookingErrors.startTime}
                                        validation={{ required: "Start time is required for hourly bookings" }}
                                    />
                                    <InputField
                                        name="endTime"
                                        label="End Time"
                                        type="time"
                                        register={registerBooking}
                                        error={bookingErrors.endTime}
                                        validation={{ required: "End time is required for hourly bookings" }}
                                    />
                                </div>
                            )}
                            <InputField
                                name="numberOfGuests"
                                label="Number of Guests"
                                type="number"
                                placeholder="Enter number of guests"
                                register={registerBooking}
                                error={bookingErrors.numberOfGuests}
                                validation={{
                                    required: "Number of guests is required",
                                    min: { value: 1, message: "Must be at least 1 guest" },
                                    max: { value: selectedFacilityData.capacity, message: `Maximum ${selectedFacilityData.capacity} guests allowed` }
                                }}
                            />
                            {estimatedAmount > 0 && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-green-900">Estimated Total Amount:</span>
                                        <span className="text-lg font-bold text-green-700">${estimatedAmount.toFixed(2)}</span>
                                    </div>
                                    {bookingType === 'hourly' && startTime && endTime && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Based on {Math.ceil((new Date(`${endDate}T${endTime}`).getTime() - new Date(`${startDate}T${startTime}`).getTime()) / (1000 * 60 * 60))} hour(s) @ ${selectedFacilityData?.pricePerHour}/hour
                                        </p>
                                    )}
                                    {bookingType === 'daily' && (
                                        <p className="text-xs text-green-600 mt-1">
                                            Based on {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} day(s) @ ${selectedFacilityData?.pricePerDay}/day
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                    <InputField
                        name="purpose"
                        label="Purpose"
                        placeholder="e.g., Corporate Meeting, Wedding"
                        register={registerBooking}
                        error={bookingErrors.purpose}
                    />
                    <TextAreaField
                        name="specialRequests"
                        label="Special Requests"
                        placeholder="Any special requirements..."
                        register={registerBooking}
                        error={bookingErrors.specialRequests}
                    />
                    {role !== 'guest' && (
                        <>
                            <h3 className="font-semibold text-sm">Walk-in Customer Details (Optional)</h3>
                            <InputField
                                name="customerName"
                                label="Customer Name"
                                placeholder="Enter customer name"
                                register={registerBooking}
                                error={bookingErrors.customerName}
                            />
                            <InputField
                                name="customerPhone"
                                label="Customer Phone"
                                placeholder="Enter phone number"
                                register={registerBooking}
                                error={bookingErrors.customerPhone}
                            />
                            <InputField
                                name="customerEmail"
                                label="Customer Email"
                                type="email"
                                placeholder="Enter email address"
                                register={registerBooking}
                                error={bookingErrors.customerEmail}
                            />
                        </>
                    )}
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
                            {formLoading ? "Creating..." : "Create Booking"}
                        </Button>
                    </div>
                </form>
            </DialogBox>

            {/* Payment Dialog */}
            <DialogBox
                open={paymentDialogOpen}
                onOpenChange={setPaymentDialogOpen}
                title="Add Payment"
                description="Add payment for facility booking"
            >
                <form onSubmit={handleSubmitPayment(onSubmitPayment)} className="space-y-4">
                    {selectedBooking && (
                        <div className="bg-gray-50 p-4 rounded">
                            <p className="text-sm text-gray-600">Balance Due</p>
                            <p className="text-2xl font-bold">
                                ${(selectedBooking.totalAmount - selectedBooking.totalPaid).toFixed(2)}
                            </p>
                        </div>
                    )}
                    <InputField
                        name="amount"
                        label="Amount"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        register={registerPayment}
                        error={paymentErrors.amount}
                        validation={{
                            required: "Amount is required",
                            min: { value: 0.01, message: "Amount must be greater than 0" }
                        }}
                    />
                    <SelectField
                        name="paymentMethod"
                        label="Payment Method"
                        control={controlPayment}
                        error={paymentErrors.paymentMethod}
                        required
                        options={[
                            { value: 'card', label: 'Card' },
                            { value: 'cash', label: 'Cash' }
                        ]}
                    />
                    <InputField
                        name="transactionId"
                        label="Transaction ID (Optional)"
                        placeholder="Enter transaction ID"
                        register={registerPayment}
                        error={paymentErrors.transactionId}
                    />
                    <TextAreaField
                        name="notes"
                        label="Notes (Optional)"
                        placeholder="Payment notes..."
                        register={registerPayment}
                        error={paymentErrors.notes}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setPaymentDialogOpen(false)}
                            disabled={formLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                            {formLoading ? "Processing..." : "Add Payment"}
                        </Button>
                    </div>
                </form>
            </DialogBox>

            {/* Cancel Dialog */}
            <DialogBox
                open={cancelDialogOpen}
                onOpenChange={setCancelDialogOpen}
                title="Cancel Booking"
                description="Are you sure you want to cancel this booking?"
            >
                <div className="flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setCancelDialogOpen(false)}
                        disabled={actionLoading}
                    >
                        No, Keep It
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleCancelBooking}
                        disabled={actionLoading}
                    >
                        {actionLoading ? "Cancelling..." : "Yes, Cancel"}
                    </Button>
                </div>
            </DialogBox>
        </div>
    );
};

export default PublicFacilityBookingsPage;
