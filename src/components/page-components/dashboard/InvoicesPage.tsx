"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAllInvoices, IInvoice, downloadInvoicePDF } from "@/services/invoiceService";
import { getActiveHotels } from "@/services/hotelService";
import DataTable from "@/components/common/DataTable";
import StatCard from "@/components/common/StatCard";
import SelectField from "@/components/forms/SelectField";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import DialogBox from "@/components/common/DialogBox";
import InvoicePreviewContent from "./InvoicePreviewContent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Eye, FileText, Building2, Calendar, DollarSign, Receipt, Printer, X } from "lucide-react";
import { formatDateTime, normalizeDateRange } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const InvoicesPage = () => {
    const { role, loading: authLoading, user } = useAuth();

    const [invoices, setInvoices] = useState<IInvoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
    const [hotelFilter, setHotelFilter] = useState<string>("all");
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    // Dialog states
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<IInvoice | null>(null);
    const [downloading, setDownloading] = useState(false);

    const itemsPerPage = 10;

    // Fetch available hotels (for admin)
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

    // Fetch invoices based on role and filters
    const fetchInvoices = useCallback(
        async (page: number = 1) => {
            if (!role || authLoading) return;

            // Only admin and receptionist can access invoices
            if (role !== "admin" && role !== "receptionist") {
                toast.error("You do not have permission to view invoices");
                return;
            }

            try {
                setLoading(true);

                // Normalize date range for API
                const { from, to } = normalizeDateRange(dateRange);

                // Build query parameters
                const params: any = {
                    page,
                    limit: itemsPerPage,
                };

                // Add date filters if provided
                if (from) params.from = from;
                if (to) params.to = to;

                // Add payment status filter if not "all"
                if (paymentStatusFilter !== "all") {
                    params.paymentStatus = paymentStatusFilter;
                }

                // Add hotel filter for admin
                if (role === "admin" && hotelFilter !== "all") {
                    params.hotelId = hotelFilter;
                } else if (role === "receptionist" && user?.hotelId) {
                    // Receptionist can only see invoices for their hotel
                    const hotelId = typeof user.hotelId === "string" ? user.hotelId : user.hotelId._id;
                    params.hotelId = hotelId;
                }

                const response = await getAllInvoices(params);

                if (response.success && response.data) {
                    setInvoices(response.data.invoices || []);
                    setTotalPages(response.data.pagination?.pages || 1);
                    setTotalItems(response.data.pagination?.total || 0);
                    setCurrentPage(response.data.pagination?.page || 1);
                } else {
                    toast.error(response.message || "Failed to fetch invoices");
                    setInvoices([]);
                }
            } catch {
                toast.error("An error occurred while fetching invoices");
                setInvoices([]);
            } finally {
                setLoading(false);
            }
        },
        [role, authLoading, user, dateRange, paymentStatusFilter, hotelFilter]
    );

    // Fetch invoices on component mount and when filters change
    useEffect(() => {
        fetchInvoices(1);
    }, [fetchInvoices]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        fetchInvoices(newPage);
    };

    // Handle view invoice
    const handleViewInvoice = (invoice: IInvoice) => {
        setSelectedInvoice(invoice);
        setPreviewDialogOpen(true);
    };

    // Handle print invoice
    const handlePrintInvoice = async () => {
        if (!selectedInvoice) return;

        try {
            setDownloading(true);
            await downloadInvoicePDF(selectedInvoice._id, selectedInvoice.invoiceNumber);
            toast.success("Invoice PDF downloaded successfully!");
        } catch {
            toast.error("Failed to download invoice PDF");
        } finally {
            setDownloading(false);
        }
    };

    // Get payment status badge color
    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case "partially_paid":
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "pending":
                return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            case "refunded":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const formatPaymentStatus = (status: string) => {
        return status
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (role !== "admin" && role !== "receptionist") {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">
                    You do not have permission to view invoices
                </p>
            </div>
        );
    }

    // Table columns
    const columns = [
        {
            key: "invoiceNumber",
            label: "Invoice Number",
            render: (invoice: IInvoice) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary-300" />
                    <span className="font-medium text-white">{invoice.invoiceNumber}</span>
                </div>
            ),
        },
        {
            key: "booking",
            label: "Booking Ref",
            render: (invoice: IInvoice) => (
                <span className="text-gray-400 font-mono text-xs">
                    {invoice.booking.slice(-8).toUpperCase()}
                </span>
            ),
        },
        {
            key: "guestDetails.name",
            label: "Guest Name",
            render: (invoice: IInvoice) => (
                <span className="font-medium text-white">{invoice.guestDetails.name}</span>
            ),
        },
        {
            key: "hotelDetails.name",
            label: "Hotel",
            render: (invoice: IInvoice) => (
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-300">{invoice.hotelDetails.name}</span>
                </div>
            ),
        },
        {
            key: "createdAt",
            label: "Invoice Date",
            render: (invoice: IInvoice) => (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{formatDateTime(invoice.createdAt)}</span>
                </div>
            ),
        },
        {
            key: "summary.grandTotal",
            label: "Total Amount",
            render: (invoice: IInvoice) => (
                <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="font-semibold text-green-400">
                        LKR {invoice.summary.grandTotal.toLocaleString()}
                    </span>
                </div>
            ),
        },
        {
            key: "paymentStatus",
            label: "Status",
            render: (invoice: IInvoice) => (
                <Badge className={getPaymentStatusColor(invoice.paymentStatus)}>
                    {formatPaymentStatus(invoice.paymentStatus)}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (invoice: IInvoice) => (
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewInvoice(invoice)}
                                    className="h-8 w-8 p-0 hover:bg-primary-900/20"
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>View Invoice</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            ),
        },
    ];

    // Filter options
    const paymentStatusOptions = [
        { value: "all", label: "All Payments" },
        { value: "paid", label: "Paid" },
        { value: "partially_paid", label: "Partially Paid" },
        { value: "pending", label: "Pending" },
        { value: "refunded", label: "Refunded" },
    ];

    const hotelOptions = [
        { value: "all", label: "All Hotels" },
        ...(availableHotels || []).map((hotel) => ({
            value: hotel._id,
            label: hotel.name,
        })),
    ];

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Total Invoices"
                    value={totalItems}
                    icon={Receipt}
                    iconColor="text-blue-400"
                    iconBg="bg-blue-500/10"
                    subtitle="All invoices"
                />
                <StatCard
                    title="Paid Invoices"
                    value={invoices?.filter((inv) => inv.paymentStatus === "paid").length || 0}
                    icon={DollarSign}
                    iconColor="text-green-400"
                    iconBg="bg-green-500/10"
                    subtitle="Fully paid"
                />
                <StatCard
                    title="Pending Payment"
                    value={
                        invoices?.filter(
                            (inv) =>
                                inv.paymentStatus === "pending" ||
                                inv.paymentStatus === "partially_paid"
                        ).length || 0
                    }
                    icon={FileText}
                    iconColor="text-orange-400"
                    iconBg="bg-orange-500/10"
                    subtitle="Awaiting payment"
                />
            </div>

            {/* Main Content Container */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="flex md:flex-row flex-col gap-5 md:items-center justify-between w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Invoices</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {role === "admin"
                                ? "View and manage all invoices across hotels"
                                : "View and manage invoices for your hotel"}
                        </p>
                    </div>

                    <div className="flex lg:flex-row flex-col gap-5 w-full justify-end md:w-auto">
                        {role === "admin" && (
                            <SelectField
                                name="hotelFilter"
                                options={hotelOptions}
                                value={hotelFilter}
                                onChange={(v) => {
                                    setHotelFilter(v);
                                    setCurrentPage(1);
                                }}
                                width="md:w-[260px]"
                                className="text-xs md:text-sm h-11!"
                            />
                        )}
                        <SelectField
                            name="paymentStatusFilter"
                            options={paymentStatusOptions}
                            value={paymentStatusFilter}
                            onChange={(v) => {
                                setPaymentStatusFilter(v);
                                setCurrentPage(1);
                            }}
                            width="md:w-[250px]"
                            className="text-xs md:text-sm h-11!"
                        />
                        <DateRangePicker
                            value={dateRange}
                            onChange={(v) => {
                                setDateRange(v);
                                setCurrentPage(1);
                            }}
                            className="w-full md:max-w-xs"
                        />
                    </div>
                </div>

                <DataTable
                    columns={columns}
                    data={invoices || []}
                    loading={loading}
                    emptyMessage="No invoices found."
                    selectable={false}
                    pagination={{
                        page: currentPage,
                        totalPages,
                        total: totalItems,
                        onPageChange: handlePageChange,
                    }}
                />
            </div>

            {/* Invoice Preview Dialog */}
            <DialogBox
                open={previewDialogOpen}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setPreviewDialogOpen(false);
                        setSelectedInvoice(null);
                    }
                }}
                title="Invoice Preview"
                widthClass="max-w-3xl"
                showFooter={false}
            >
                {selectedInvoice && (
                    <>
                        <InvoicePreviewContent invoice={selectedInvoice} />

                        {/* Custom action buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setPreviewDialogOpen(false);
                                    setSelectedInvoice(null);
                                }}
                                className="flex items-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Close
                            </Button>
                            <Button
                                onClick={handlePrintInvoice}
                                disabled={downloading}
                                className="flex items-center gap-2"
                            >
                                <Printer className="h-4 w-4" />
                                {downloading ? "Downloading..." : "Print Invoice"}
                            </Button>
                        </div>
                    </>
                )}
            </DialogBox>
        </div>
    );
};

export default InvoicesPage;
