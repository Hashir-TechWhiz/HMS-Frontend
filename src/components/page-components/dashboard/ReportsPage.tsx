"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import DataTable from "@/components/common/DataTable";
import StatCard from "@/components/common/StatCard";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import ExportActions from "@/components/common/ExportActions";
import SelectField from "@/components/forms/SelectField";
import {
    getReportsOverview,
    getDetailedBookingReport,
    getDetailedPaymentReport,
    getDetailedRoomReport,
    getDetailedServiceRequestReport,
    getDetailedRevenueReport,
} from "@/services/reportService";
import { getActiveHotels } from "@/services/hotelService";
import {
    exportToCSV,
    exportToPDF,
    formatDateForExport,
    formatDateTimeForExport,
    formatCurrencyForExport,
    formatStatusForExport,
} from "@/lib/exportUtils";
import { normalizeDateRange } from "@/lib/utils";
import {
    FileText,
    DollarSign,
    Calendar,
    XCircle,
    CreditCard,
    Home,
    Wrench,
    TrendingUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const ReportsPage = () => {
    const { role } = useAuth();

    // Active tab state
    const [activeTab, setActiveTab] = useState<string>("bookings");

    // Hotel filter state (admin only)
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    // Overview KPIs
    const [overview, setOverview] = useState<IReportOverview | null>(null);
    const [overviewLoading, setOverviewLoading] = useState(true);

    // Booking Report State
    const [bookings, setBookings] = useState<IDetailedBookingReport[]>([]);
    const [bookingsLoading, setBookingsLoading] = useState(false);
    const [bookingsPage, setBookingsPage] = useState(1);
    const [bookingsPagination, setBookingsPagination] = useState<PaginationMeta | null>(null);
    const [bookingsDateRange, setBookingsDateRange] = useState<DateRange | undefined>(undefined);
    const [bookingsStatus, setBookingsStatus] = useState<string>("all");

    // Payment Report State
    const [payments, setPayments] = useState<IPaymentReport[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [paymentsPage, setPaymentsPage] = useState(1);
    const [paymentsPagination, setPaymentsPagination] = useState<PaginationMeta | null>(null);
    const [paymentsDateRange, setPaymentsDateRange] = useState<DateRange | undefined>(undefined);
    const [paymentsStatus, setPaymentsStatus] = useState<string>("all");

    // Room Report State
    const [rooms, setRooms] = useState<IRoomUtilizationReport[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [roomsPage, setRoomsPage] = useState(1);
    const [roomsPagination, setRoomsPagination] = useState<PaginationMeta | null>(null);
    const [roomsStatus, setRoomsStatus] = useState<string>("all");

    // Service Request Report State
    const [serviceRequests, setServiceRequests] = useState<IDetailedServiceRequestReport[]>([]);
    const [serviceRequestsLoading, setServiceRequestsLoading] = useState(false);
    const [serviceRequestsPage, setServiceRequestsPage] = useState(1);
    const [serviceRequestsPagination, setServiceRequestsPagination] = useState<PaginationMeta | null>(null);
    const [serviceRequestsDateRange, setServiceRequestsDateRange] = useState<DateRange | undefined>(undefined);
    const [serviceRequestsStatus, setServiceRequestsStatus] = useState<string>("all");

    // Revenue Report State
    const [revenue, setRevenue] = useState<IRevenueReport[]>([]);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revenuePage, setRevenuePage] = useState(1);
    const [revenuePagination, setRevenuePagination] = useState<PaginationMeta | null>(null);
    const [revenueDateRange, setRevenueDateRange] = useState<DateRange | undefined>(undefined);
    const [revenuePaymentStatus, setRevenuePaymentStatus] = useState<string>("all");

    // Fetch available hotels for admin
    useEffect(() => {
        if (role === "admin") {
            const fetchHotels = async () => {
                try {
                    const response = await getActiveHotels();
                    if (response.success && response.data) {
                        setAvailableHotels(response.data);
                    }
                } catch (error) {
                    console.error("Failed to fetch hotels:", error);
                }
            };
            fetchHotels();
        }
    }, [role]);

    // Fetch Overview KPIs
    useEffect(() => {
        const fetchOverview = async () => {
            setOverviewLoading(true);
            const response = await getReportsOverview();
            if (response.success && response.data) {
                setOverview(response.data);
            } else {
                toast.error(response.message || "Failed to load overview data");
            }
            setOverviewLoading(false);
        };

        fetchOverview();
    }, []);

    // Fetch Booking Report
    useEffect(() => {
        const fetchBookings = async () => {
            setBookingsLoading(true);
            const dateFilter = normalizeDateRange(bookingsDateRange);
            const response = await getDetailedBookingReport(
                bookingsPage,
                10,
                dateFilter.from || dateFilter.to ? dateFilter : undefined,
                bookingsStatus !== "all" ? bookingsStatus : undefined,
                hotelFilter !== "all" ? hotelFilter : undefined
            );
            if (response.success && response.data) {
                setBookings(response.data.items);
                setBookingsPagination(response.data.pagination);
            } else {
                toast.error(response.message || "Failed to load booking report");
            }
            setBookingsLoading(false);
        };

        fetchBookings();
    }, [bookingsPage, bookingsDateRange, bookingsStatus, hotelFilter]);

    // Reset booking pagination when filters change
    useEffect(() => {
        if (bookingsPage !== 1) {
            setBookingsPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookingsDateRange, bookingsStatus, hotelFilter]);

    // Fetch Payment Report
    useEffect(() => {
        const fetchPayments = async () => {
            setPaymentsLoading(true);
            const dateFilter = normalizeDateRange(paymentsDateRange);
            const response = await getDetailedPaymentReport(
                paymentsPage,
                10,
                dateFilter.from || dateFilter.to ? dateFilter : undefined,
                paymentsStatus !== "all" ? paymentsStatus : undefined,
                hotelFilter !== "all" ? hotelFilter : undefined
            );
            if (response.success && response.data) {
                setPayments(response.data.items);
                setPaymentsPagination(response.data.pagination);
            } else {
                toast.error(response.message || "Failed to load payment report");
            }
            setPaymentsLoading(false);
        };

        fetchPayments();
    }, [paymentsPage, paymentsDateRange, paymentsStatus, hotelFilter]);

    // Reset payment pagination when filters change
    useEffect(() => {
        if (paymentsPage !== 1) {
            setPaymentsPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentsDateRange, paymentsStatus, hotelFilter]);

    // Fetch Room Report
    useEffect(() => {
        const fetchRooms = async () => {
            setRoomsLoading(true);
            const response = await getDetailedRoomReport(
                roomsPage,
                10,
                roomsStatus !== "all" ? roomsStatus : undefined,
                hotelFilter !== "all" ? hotelFilter : undefined
            );
            if (response.success && response.data) {
                setRooms(response.data.items);
                setRoomsPagination(response.data.pagination);
            } else {
                toast.error(response.message || "Failed to load room report");
            }
            setRoomsLoading(false);
        };

        fetchRooms();
    }, [roomsPage, roomsStatus, hotelFilter]);

    // Reset room pagination when filters change
    useEffect(() => {
        if (roomsPage !== 1) {
            setRoomsPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomsStatus, hotelFilter]);

    // Fetch Service Request Report
    useEffect(() => {
        const fetchServiceRequests = async () => {
            setServiceRequestsLoading(true);
            const dateFilter = normalizeDateRange(serviceRequestsDateRange);
            const response = await getDetailedServiceRequestReport(
                serviceRequestsPage,
                10,
                dateFilter.from || dateFilter.to ? dateFilter : undefined,
                serviceRequestsStatus !== "all" ? serviceRequestsStatus : undefined,
                hotelFilter !== "all" ? hotelFilter : undefined
            );
            if (response.success && response.data) {
                setServiceRequests(response.data.items);
                setServiceRequestsPagination(response.data.pagination);
            } else {
                toast.error(response.message || "Failed to load service request report");
            }
            setServiceRequestsLoading(false);
        };

        fetchServiceRequests();
    }, [serviceRequestsPage, serviceRequestsDateRange, serviceRequestsStatus, hotelFilter]);

    // Reset service request pagination when filters change
    useEffect(() => {
        if (serviceRequestsPage !== 1) {
            setServiceRequestsPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceRequestsDateRange, serviceRequestsStatus, hotelFilter]);

    // Fetch Revenue Report
    useEffect(() => {
        const fetchRevenue = async () => {
            setRevenueLoading(true);
            const dateFilter = normalizeDateRange(revenueDateRange);
            const response = await getDetailedRevenueReport(
                revenuePage,
                10,
                dateFilter.from || dateFilter.to ? dateFilter : undefined,
                revenuePaymentStatus !== "all" ? revenuePaymentStatus : undefined,
                hotelFilter !== "all" ? hotelFilter : undefined
            );
            if (response.success && response.data) {
                setRevenue(response.data.items);
                setRevenuePagination(response.data.pagination);
            } else {
                toast.error(response.message || "Failed to load revenue report");
            }
            setRevenueLoading(false);
        };

        fetchRevenue();
    }, [revenuePage, revenueDateRange, revenuePaymentStatus, hotelFilter]);

    // Reset revenue pagination when filters change
    useEffect(() => {
        if (revenuePage !== 1) {
            setRevenuePage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [revenueDateRange, revenuePaymentStatus, hotelFilter]);

    // Export Handlers
    const handleExportBookings = (format: 'csv' | 'pdf') => {
        const columns = [
            { header: 'Type', dataKey: 'type' },
            { header: 'Guest / Customer', dataKey: 'guestName' },
            {
                header: 'Room',
                dataKey: 'roomNumber'
            },
            {
                header: 'Check-in',
                dataKey: 'checkInDate',
                formatter: formatDateForExport
            },
            {
                header: 'Check-out',
                dataKey: 'checkOutDate',
                formatter: formatDateForExport
            },
            {
                header: 'Status',
                dataKey: 'status',
                formatter: formatStatusForExport
            },
            {
                header: 'Created',
                dataKey: 'createdAt',
                formatter: formatDateTimeForExport
            },
        ];

        const dataWithFormatted = bookings.map(item => ({
            type: (item.guest && item.guest._id) ? 'Online' : 'Walk-in',
            guestName: item.guest?.name || item.customerDetails?.name || 'N/A',
            roomNumber: item.room?.roomNumber || 'N/A',
            checkInDate: item.checkInDate,
            checkOutDate: item.checkOutDate,
            status: item.status,
            createdAt: item.createdAt,
        }));

        if (format === 'csv') {
            exportToCSV(dataWithFormatted, columns, `booking-report-${new Date().toISOString().split('T')[0]}`);
        } else {
            exportToPDF(dataWithFormatted, columns, `booking-report-${new Date().toISOString().split('T')[0]}`, 'Booking Report');
        }
        toast.success(`Booking report exported as ${format.toUpperCase()}`);
    };

    const handleExportPayments = (format: 'csv' | 'pdf') => {
        const columns = [
            { header: 'Booking ID', dataKey: 'bookingId' },
            { header: 'Guest / Customer', dataKey: 'guestName' },
            {
                header: 'Amount',
                dataKey: 'amount',
                formatter: formatCurrencyForExport
            },
            { header: 'Payment Method', dataKey: 'paymentMethod' },
            { header: 'Status', dataKey: 'paymentStatus' },
            {
                header: 'Date',
                dataKey: 'createdAt',
                formatter: formatDateTimeForExport
            },
        ];

        if (format === 'csv') {
            exportToCSV(payments, columns, `payment-report-${new Date().toISOString().split('T')[0]}`);
        } else {
            exportToPDF(payments, columns, `payment-report-${new Date().toISOString().split('T')[0]}`, 'Payment Report');
        }
        toast.success(`Payment report exported as ${format.toUpperCase()}`);
    };

    const handleExportRooms = (format: 'csv' | 'pdf') => {
        const columns = [
            { header: 'Room Number', dataKey: 'roomNumber' },
            { header: 'Room Type', dataKey: 'roomType' },
            { header: 'Total Bookings', dataKey: 'totalBookings' },
            {
                header: 'Status',
                dataKey: 'status',
                formatter: formatStatusForExport
            },
        ];

        if (format === 'csv') {
            exportToCSV(rooms, columns, `room-utilization-report-${new Date().toISOString().split('T')[0]}`);
        } else {
            exportToPDF(rooms, columns, `room-utilization-report-${new Date().toISOString().split('T')[0]}`, 'Room Utilization Report');
        }
        toast.success(`Room report exported as ${format.toUpperCase()}`);
    };

    const handleExportServiceRequests = (format: 'csv' | 'pdf') => {
        const columns = [
            { header: 'Request ID', dataKey: '_id' },
            {
                header: 'Service Type',
                dataKey: 'serviceType',
                formatter: formatStatusForExport
            },
            { header: 'Room', dataKey: 'roomNumber' },
            { header: 'Assigned Staff', dataKey: 'assignedStaff' },
            {
                header: 'Status',
                dataKey: 'status',
                formatter: formatStatusForExport
            },
            {
                header: 'Created',
                dataKey: 'createdAt',
                formatter: formatDateTimeForExport
            },
        ];

        const dataWithFormatted = serviceRequests.map(item => ({
            _id: item._id,
            serviceType: item.serviceType,
            roomNumber: item.room?.roomNumber || 'N/A',
            assignedStaff: item.assignedTo?.name || 'Unassigned',
            status: item.status,
            createdAt: item.createdAt,
        }));

        if (format === 'csv') {
            exportToCSV(dataWithFormatted, columns, `service-request-report-${new Date().toISOString().split('T')[0]}`);
        } else {
            exportToPDF(dataWithFormatted, columns, `service-request-report-${new Date().toISOString().split('T')[0]}`, 'Service Request Report');
        }
        toast.success(`Service request report exported as ${format.toUpperCase()}`);
    };

    const handleExportRevenue = (format: 'csv' | 'pdf') => {
        const columns = [
            { header: 'Invoice #', dataKey: 'invoiceNumber' },
            { header: 'Hotel', dataKey: 'hotelName' },
            { header: 'Guest Name', dataKey: 'guestName' },
            { header: 'Room', dataKey: 'roomNumber' },
            { header: 'Room Type', dataKey: 'roomType' },
            {
                header: 'Check-in',
                dataKey: 'checkInDate',
                formatter: formatDateForExport
            },
            {
                header: 'Check-out',
                dataKey: 'checkOutDate',
                formatter: formatDateForExport
            },
            { header: 'Nights', dataKey: 'numberOfNights' },
            {
                header: 'Room Charges',
                dataKey: 'roomChargesTotal',
                formatter: formatCurrencyForExport
            },
            {
                header: 'Service Charges',
                dataKey: 'serviceChargesTotal',
                formatter: formatCurrencyForExport
            },
            {
                header: 'Tax',
                dataKey: 'tax',
                formatter: formatCurrencyForExport
            },
            {
                header: 'Grand Total',
                dataKey: 'grandTotal',
                formatter: formatCurrencyForExport
            },
            {
                header: 'Payment Status',
                dataKey: 'paymentStatus',
                formatter: formatStatusForExport
            },
            {
                header: 'Created',
                dataKey: 'createdAt',
                formatter: formatDateTimeForExport
            },
        ];

        const dataWithFormatted = revenue.map(item => ({
            invoiceNumber: item.invoiceNumber,
            hotelName: item.hotelName,
            guestName: item.guestName,
            roomNumber: item.roomNumber,
            roomType: item.roomType,
            checkInDate: item.checkInDate,
            checkOutDate: item.checkOutDate,
            numberOfNights: item.numberOfNights,
            roomChargesTotal: item.roomChargesTotal,
            serviceChargesTotal: item.serviceChargesTotal,
            tax: item.tax,
            grandTotal: item.grandTotal,
            paymentStatus: item.paymentStatus,
            createdAt: item.createdAt,
        }));

        if (format === 'csv') {
            exportToCSV(dataWithFormatted, columns, `revenue-report-${new Date().toISOString().split('T')[0]}`);
        } else {
            exportToPDF(dataWithFormatted, columns, `revenue-report-${new Date().toISOString().split('T')[0]}`, 'Revenue Report');
        }
        toast.success(`Revenue report exported as ${format.toUpperCase()}`);
    };

    // Calculate active bookings (current date between check-in and check-out)
    const getActiveBookings = () => {
        if (!overview) return 0;
        return overview.bookings.byStatus.checkedin;
    };

    // Calculate total revenue from payment report
    const getTotalRevenue = () => {
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    return (
        <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Bookings"
                    value={overview?.bookings.totalBookings || 0}
                    icon={FileText}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    loading={overviewLoading}
                />
                <StatCard
                    title="Total Revenue"
                    value={`LKR ${getTotalRevenue().toLocaleString()}`}
                    icon={DollarSign}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    loading={paymentsLoading}
                />
                <StatCard
                    title="Active Bookings"
                    value={getActiveBookings()}
                    icon={Calendar}
                    iconColor="text-purple-400"
                    iconBg="bg-purple-500/10"
                    loading={overviewLoading}
                />
                <StatCard
                    title="Cancelled Bookings"
                    value={overview?.bookings.byStatus.cancelled || 0}
                    icon={XCircle}
                    iconColor="text-red-400"
                    iconBg="bg-red-500/10"
                    loading={overviewLoading}
                />
            </div>

            {/* Common Hotel Filter (Admin Only) */}
            {role === "admin" && (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-primary-900/40 bg-linear-to-r from-primary-900/5 to-primary-800/5">
                    <label className="text-sm font-medium whitespace-nowrap">Filter by Hotel:</label>
                    <SelectField
                        name="hotelFilter"
                        options={[
                            { value: "all", label: "All Hotels" },
                            ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
                        ]}
                        value={hotelFilter}
                        onChange={(v) => setHotelFilter(v)}
                        className="w-[300px] h-10! min-h-10! max-h-10! text-xs md:text-sm"
                    />
                </div>
            )}

            {/* Reports Tabs */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
                    <p className="text-sm text-gray-400">View detailed reports and analytics</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-primary-900/20 border border-primary-500/20 p-1">
                        <TabsTrigger 
                            value="bookings" 
                            className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Bookings
                        </TabsTrigger>
                        <TabsTrigger 
                            value="payments"
                            className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Payments
                        </TabsTrigger>
                        <TabsTrigger 
                            value="revenue"
                            className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                        >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Revenue
                        </TabsTrigger>
                        <TabsTrigger 
                            value="rooms"
                            className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Rooms
                        </TabsTrigger>
                        <TabsTrigger 
                            value="service-requests"
                            className="data-[state=active]:bg-primary-600 data-[state=active]:text-white"
                        >
                            <Wrench className="h-4 w-4 mr-2" />
                            Services
                        </TabsTrigger>
                    </TabsList>

                    {/* Booking Report Tab */}
                    <TabsContent value="bookings" className="mt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold mb-1 text-white">Booking Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    Detailed list of all bookings with guest and room information
                                </p>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                                <DateRangePicker
                                    value={bookingsDateRange}
                                    onChange={setBookingsDateRange}
                                    placeholder="Filter by date range"
                                    className="w-[280px] h-10! min-h-10! max-h-10!"
                                />
                                <div>
                                    <SelectField
                                        value={bookingsStatus}
                                        onChange={setBookingsStatus}
                                        placeholder="All statuses"
                                        options={[
                                            { value: "all", label: "All statuses" },
                                            { value: "pending", label: "Pending" },
                                            { value: "confirmed", label: "Confirmed" },
                                            { value: "checkedin", label: "Checked In" },
                                            { value: "completed", label: "Completed" },
                                            { value: "cancelled", label: "Cancelled" },
                                        ]}
                                        className="w-[180px] h-10! min-h-10! max-h-10! search-gradient"
                                    />
                                </div>
                                <ExportActions
                                    onExport={handleExportBookings}
                                    disabled={bookingsLoading || bookings.length === 0}
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={[
                                {
                                    key: 'type',
                                    label: 'Type',
                                    render: (row) => {
                                        const isOnline = row.guest && row.guest._id;
                                        return (
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${isOnline
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-purple-500/10 text-purple-400'
                                                    }`}
                                            >
                                                {isOnline ? 'Online' : 'Walk-in'}
                                            </span>
                                        );
                                    },
                                },
                                {
                                    key: 'guest',
                                    label: 'Guest / Customer',
                                    render: (row) => {
                                        if (row.guest?.name) return row.guest.name;
                                        if (row.customerDetails?.name) return row.customerDetails.name;
                                        return 'N/A';
                                    },
                                },
                                {
                                    key: 'room',
                                    label: 'Room',
                                    render: (row) => row.room?.roomNumber || 'N/A',
                                },
                                {
                                    key: 'checkInDate',
                                    label: 'Check-in',
                                    render: (row) => new Date(row.checkInDate).toLocaleDateString(),
                                },
                                {
                                    key: 'checkOutDate',
                                    label: 'Check-out',
                                    render: (row) => new Date(row.checkOutDate).toLocaleDateString(),
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (row) => (
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'confirmed'
                                                ? 'bg-green-500/10 text-green-400'
                                                : row.status === 'pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400'
                                                    : row.status === 'cancelled'
                                                        ? 'bg-red-500/10 text-red-400'
                                                        : 'bg-blue-500/10 text-blue-400'
                                                }`}
                                        >
                                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'createdAt',
                                    label: 'Created',
                                    render: (row) => new Date(row.createdAt).toLocaleDateString(),
                                },
                            ]}
                            data={bookings}
                            loading={bookingsLoading}
                            emptyMessage="No bookings found"
                            pagination={
                                bookingsPagination
                                    ? {
                                        page: bookingsPagination.currentPage,
                                        totalPages: bookingsPagination.totalPages,
                                        total: bookingsPagination.totalItems,
                                        onPageChange: setBookingsPage,
                                    }
                                    : undefined
                            }
                            selectable={false}
                        />
                    </TabsContent>

                    {/* Payment Report Tab */}
                    <TabsContent value="payments" className="mt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold mb-1 text-white">Payment Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    Payment transactions for confirmed and completed bookings
                                </p>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                                <DateRangePicker
                                    value={paymentsDateRange}
                                    onChange={setPaymentsDateRange}
                                    placeholder="Filter by date range"
                                    className="w-[280px] h-10! min-h-10! max-h-10!"
                                />
                                <div>
                                    <SelectField
                                        value={paymentsStatus}
                                        onChange={setPaymentsStatus}
                                        placeholder="All statuses"
                                        options={[
                                            { value: "all", label: "All statuses" },
                                            { value: "completed", label: "Completed" },
                                        ]}
                                        className="w-[180px] h-10! min-h-10! max-h-10! search-gradient"
                                    />
                                </div>
                                <ExportActions
                                    onExport={handleExportPayments}
                                    disabled={paymentsLoading || payments.length === 0}
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={[
                                { key: 'bookingId', label: 'Booking ID' },
                                { key: 'guestName', label: 'Guest / Customer' },
                                {
                                    key: 'amount',
                                    label: 'Amount',
                                    render: (row) => `LKR ${row.amount.toLocaleString()}`,
                                },
                                { key: 'paymentMethod', label: 'Payment Method' },
                                {
                                    key: 'paymentStatus',
                                    label: 'Status',
                                    render: (row) => (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                            {row.paymentStatus}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'createdAt',
                                    label: 'Date',
                                    render: (row) => new Date(row.createdAt).toLocaleDateString(),
                                },
                            ]}
                            data={payments}
                            loading={paymentsLoading}
                            emptyMessage="No payments found"
                            pagination={
                                paymentsPagination
                                    ? {
                                        page: paymentsPagination?.currentPage || 1,
                                        totalPages: paymentsPagination?.totalPages || 1,
                                        total: paymentsPagination?.totalItems || 0,
                                        onPageChange: setPaymentsPage,
                                    }
                                    : undefined
                            }
                            selectable={false}
                        />
                    </TabsContent>

                    {/* Room Utilization Report Tab */}
                    <TabsContent value="rooms" className="mt-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold mb-1 text-white">Room Utilization Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    Room occupancy status and booking statistics
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <div>
                                    <SelectField
                                        value={roomsStatus}
                                        onChange={setRoomsStatus}
                                        placeholder="All statuses"
                                        options={[
                                            { value: "all", label: "All statuses" },
                                            { value: "available", label: "Available" },
                                            { value: "unavailable", label: "Unavailable" },
                                            { value: "maintenance", label: "Maintenance" },
                                        ]}
                                        className="w-[180px] h-10! min-h-10! max-h-10! search-gradient"
                                    />
                                </div>
                                <ExportActions
                                    onExport={handleExportRooms}
                                    disabled={roomsLoading || rooms.length === 0}
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={[
                                { key: 'roomNumber', label: 'Room Number' },
                                { key: 'roomType', label: 'Room Type' },
                                { key: 'totalBookings', label: 'Total Bookings' },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (row) => (
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'available'
                                                ? 'bg-green-500/10 text-green-400'
                                                : row.status === 'maintenance'
                                                    ? 'bg-yellow-500/10 text-yellow-400'
                                                    : 'bg-red-500/10 text-red-400'
                                                }`}
                                        >
                                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                                        </span>
                                    ),
                                },
                            ]}
                            data={rooms}
                            loading={roomsLoading}
                            emptyMessage="No rooms found"
                            pagination={
                                roomsPagination
                                    ? {
                                        page: roomsPagination?.currentPage || 1,
                                        totalPages: roomsPagination?.totalPages || 1,
                                        total: roomsPagination?.totalItems || 0,
                                        onPageChange: setRoomsPage,
                                    }
                                    : undefined
                            }
                            selectable={false}
                        />
                    </TabsContent>

                    {/* Service Request Report Tab */}
                    <TabsContent value="service-requests" className="mt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold mb-1 text-white">Service Request Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    Service requests with assignment and status information
                                </p>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                                <DateRangePicker
                                    value={serviceRequestsDateRange}
                                    onChange={setServiceRequestsDateRange}
                                    placeholder="Filter by date range"
                                    className="w-[280px] h-10! min-h-10! max-h-10!"
                                />
                                <div>
                                    <SelectField
                                        value={serviceRequestsStatus}
                                        onChange={setServiceRequestsStatus}
                                        placeholder="All statuses"
                                        options={[
                                            { value: "all", label: "All statuses" },
                                            { value: "pending", label: "Pending" },
                                            { value: "in_progress", label: "In Progress" },
                                            { value: "completed", label: "Completed" },
                                        ]}
                                        className="w-[180px] h-10! min-h-10! max-h-10! search-gradient"
                                    />
                                </div>
                                <ExportActions
                                    onExport={handleExportServiceRequests}
                                    disabled={serviceRequestsLoading || serviceRequests.length === 0}
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={[
                                { key: '_id', label: 'Request ID' },
                                {
                                    key: 'serviceType',
                                    label: 'Service Type',
                                    render: (row) =>
                                        row.serviceType
                                            .split('_')
                                            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                            .join(' '),
                                },
                                {
                                    key: 'room',
                                    label: 'Room',
                                    render: (row) => row.room?.roomNumber || 'N/A',
                                },
                                {
                                    key: 'assignedTo',
                                    label: 'Assigned Staff',
                                    render: (row) => row.assignedTo?.name || 'Unassigned',
                                },
                                {
                                    key: 'status',
                                    label: 'Status',
                                    render: (row) => (
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${row.status === 'completed'
                                                ? 'bg-green-500/10 text-green-400'
                                                : row.status === 'in_progress'
                                                    ? 'bg-blue-500/10 text-blue-400'
                                                    : 'bg-yellow-500/10 text-yellow-400'
                                                }`}
                                        >
                                            {row.status
                                                .split('_')
                                                .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(' ')}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'createdAt',
                                    label: 'Created',
                                    render: (row) => new Date(row.createdAt).toLocaleDateString(),
                                },
                            ]}
                            data={serviceRequests}
                            loading={serviceRequestsLoading}
                            emptyMessage="No service requests found"
                            pagination={
                                serviceRequestsPagination
                                    ? {
                                        page: serviceRequestsPagination?.currentPage || 1,
                                        totalPages: serviceRequestsPagination?.totalPages || 1,
                                        total: serviceRequestsPagination?.totalItems || 0,
                                        onPageChange: setServiceRequestsPage,
                                    }
                                    : undefined
                            }
                            selectable={false}
                        />
                    </TabsContent>

                    {/* Revenue Report Tab */}
                    <TabsContent value="revenue" className="mt-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-semibold mb-1 text-white">Revenue Report</h2>
                                <p className="text-sm text-muted-foreground">
                                    Detailed revenue breakdown from invoices with payment status
                                </p>
                            </div>
                            <div className="flex gap-2 items-center flex-wrap justify-end">
                                <DateRangePicker
                                    value={revenueDateRange}
                                    onChange={setRevenueDateRange}
                                    placeholder="Filter by date range"
                                    className="w-[280px] h-10! min-h-10! max-h-10!"
                                />
                                <div>
                                    <SelectField
                                        value={revenuePaymentStatus}
                                        onChange={setRevenuePaymentStatus}
                                        placeholder="All statuses"
                                        options={[
                                            { value: "all", label: "All statuses" },
                                            { value: "pending", label: "Pending" },
                                            { value: "paid", label: "Paid" },
                                            { value: "partially_paid", label: "Partially Paid" },
                                            { value: "refunded", label: "Refunded" },
                                        ]}
                                        className="w-[180px] h-10! min-h-10! max-h-10! search-gradient"
                                    />
                                </div>
                                <ExportActions
                                    onExport={handleExportRevenue}
                                    disabled={revenueLoading || revenue.length === 0}
                                />
                            </div>
                        </div>
                        <DataTable
                            columns={[
                                { 
                                    key: 'invoiceNumber', 
                                    label: 'Invoice #',
                                    render: (row) => (
                                        <span className="font-medium text-white">{row.invoiceNumber}</span>
                                    ),
                                },
                                {
                                    key: 'guestName',
                                    label: 'Guest Name',
                                },
                                {
                                    key: 'roomNumber',
                                    label: 'Room',
                                },
                                {
                                    key: 'checkInDate',
                                    label: 'Check-in',
                                    render: (row) => row.checkInDate ? new Date(row.checkInDate).toLocaleDateString() : 'N/A',
                                },
                                {
                                    key: 'checkOutDate',
                                    label: 'Check-out',
                                    render: (row) => row.checkOutDate ? new Date(row.checkOutDate).toLocaleDateString() : 'N/A',
                                },
                                {
                                    key: 'grandTotal',
                                    label: 'Total Amount',
                                    render: (row) => (
                                        <span className="font-bold text-green-400">
                                            LKR {(row.grandTotal || 0).toLocaleString()}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'paymentStatus',
                                    label: 'Status',
                                    render: (row) => (
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                row.paymentStatus === 'paid'
                                                    ? 'bg-green-500/10 text-green-400'
                                                    : row.paymentStatus === 'pending'
                                                    ? 'bg-yellow-500/10 text-yellow-400'
                                                    : row.paymentStatus === 'partially_paid'
                                                    ? 'bg-orange-500/10 text-orange-400'
                                                    : 'bg-red-500/10 text-red-400'
                                            }`}
                                        >
                                            {row.paymentStatus.replace('_', ' ').charAt(0).toUpperCase() + 
                                             row.paymentStatus.replace('_', ' ').slice(1)}
                                        </span>
                                    ),
                                },
                                {
                                    key: 'createdAt',
                                    label: 'Date',
                                    render: (row) => new Date(row.createdAt).toLocaleDateString(),
                                },
                            ]}
                            data={revenue}
                            loading={revenueLoading}
                            emptyMessage="No revenue data found"
                            pagination={
                                revenuePagination
                                    ? {
                                        page: revenuePagination?.currentPage || 1,
                                        totalPages: revenuePagination?.totalPages || 1,
                                        total: revenuePagination?.totalItems || 0,
                                        onPageChange: setRevenuePage,
                                    }
                                    : undefined
                            }
                            selectable={false}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default ReportsPage;
