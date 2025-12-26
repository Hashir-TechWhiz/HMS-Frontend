"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUsers, updateUserStatus } from "@/services/adminUserService";
import { getAllBookings } from "@/services/bookingService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import KPICard from "@/components/common/KPICard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, UserCheck, UserX, Users } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface GuestWithBookings extends IUser {
    totalBookings?: number;
    activeBookings?: number;
    cancelledBookings?: number;
}

const GuestsPage = () => {
    const { role, loading: authLoading } = useAuth();

    const [guests, setGuests] = useState<GuestWithBookings[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedGuest, setSelectedGuest] = useState<GuestWithBookings | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<boolean>(false);

    // Fetch guests with booking statistics
    const fetchGuests = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setLoading(true);

            // Fetch all users filtered by guest role
            const response = await getUsers({ role: "guest" });

            if (response.success) {
                const usersData: any = response.data;
                const guestsArray: IUser[] = Array.isArray(usersData)
                    ? usersData
                    : (usersData?.items || []);

                // Fetch booking statistics for each guest
                const guestsWithBookings = await Promise.all(
                    guestsArray.map(async (guest) => {
                        try {
                            // Fetch all bookings for this guest (no pagination needed for count)
                            const bookingsResponse = await getAllBookings(1, 1000);

                            if (bookingsResponse.success) {
                                const bookingsData: any = bookingsResponse.data;
                                const allBookings: IBooking[] = Array.isArray(bookingsData)
                                    ? bookingsData
                                    : (bookingsData?.items || bookingsData?.data || []);

                                // Filter bookings for this specific guest
                                // Exclude walk-in bookings (where guest is null)
                                const guestBookings = allBookings.filter((booking: IBooking) => {
                                    if (!booking.guest) return false; // Walk-in booking, skip it
                                    const bookingGuestId = typeof booking.guest === "object"
                                        ? booking.guest._id
                                        : booking.guest;
                                    return bookingGuestId === guest._id;
                                });

                                const totalBookings = guestBookings.length;
                                const activeBookings = guestBookings.filter(
                                    (b: IBooking) => b.status === "confirmed" || b.status === "pending"
                                ).length;
                                const cancelledBookings = guestBookings.filter(
                                    (b: IBooking) => b.status === "cancelled"
                                ).length;

                                return {
                                    ...guest,
                                    totalBookings,
                                    activeBookings,
                                    cancelledBookings,
                                } as GuestWithBookings;
                            }
                        } catch (error) {
                            console.error(`Failed to fetch bookings for guest ${guest._id}:`, error);
                        }

                        return {
                            ...guest,
                            totalBookings: 0,
                            activeBookings: 0,
                            cancelledBookings: 0,
                        } as GuestWithBookings;
                    })
                );

                setGuests(guestsWithBookings);
                setTotalPages(1);
                setTotalItems(guestsWithBookings.length);
            } else {
                toast.error(response.message || "Failed to fetch guests");
            }
        } catch {
            toast.error("An error occurred while fetching guests");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchGuests();
        }
    }, [role, authLoading, fetchGuests]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (guest: GuestWithBookings) => {
        setSelectedGuest(guest);
        setViewDialogOpen(true);
    };

    // Handle status change click (Admin only)
    const handleStatusClick = (guest: GuestWithBookings, newStatus: boolean) => {
        if (role !== "admin") {
            toast.error("Only administrators can change guest status");
            return;
        }

        setSelectedGuest(guest);
        setPendingStatus(newStatus);
        setStatusDialogOpen(true);
    };

    // Handle status update confirmation
    const handleStatusConfirm = async () => {
        if (!selectedGuest) return;

        try {
            setStatusLoading(true);
            const response = await updateUserStatus(selectedGuest._id, pendingStatus);

            if (response.success) {
                toast.success(
                    `Guest ${pendingStatus ? "activated" : "deactivated"} successfully`
                );
                setStatusDialogOpen(false);
                setSelectedGuest(null);
                fetchGuests();
            } else {
                toast.error(response.message || "Failed to update guest status");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred while updating guest status");
        } finally {
            setStatusLoading(false);
        }
    };

    // Status badge
    const StatusBadge = ({ isActive }: { isActive: boolean }) => {
        return (
            <span
                className={`px-2 py-1 rounded-md text-xs font-medium border ${isActive
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-red-500/20 text-red-400 border-red-500/50"
                    }`}
            >
                {isActive ? "Active" : "Inactive"}
            </span>
        );
    };

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (guest: GuestWithBookings) => formatDateTime(guest.createdAt),
        },
        {
            key: "name",
            label: "Name",
            render: (guest: GuestWithBookings) => (
                <span className="font-medium">{guest.name}</span>
            ),
        },
        {
            key: "email",
            label: "Email",
            render: (guest: GuestWithBookings) => (
                <span className="text-sm">{guest.email}</span>
            ),
        },
        {
            key: "totalBookings",
            label: "Total Bookings",
            render: (guest: GuestWithBookings) => (
                <span className="font-medium">{guest.totalBookings || 0}</span>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (guest: GuestWithBookings) => <StatusBadge isActive={guest.isActive} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (guest: GuestWithBookings) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(guest)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {role === "admin" && (
                        <>
                            {guest.isActive ? (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleStatusClick(guest, false)}
                                    className="h-8 px-2"
                                    title="Deactivate Guest"
                                >
                                    <UserX className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleStatusClick(guest, true)}
                                    className="h-8 px-2 bg-green-600 hover:bg-green-700 border-green-700"
                                    title="Activate Guest"
                                >
                                    <UserCheck className="h-4 w-4" />
                                </Button>
                            )}
                        </>
                    )}
                </div>
            ),
        },
    ];

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
            
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Guest Management</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        View and manage registered guest users
                    </p>
                </div>
            </div>

            {/* KPI Card - Show total guests */}
            {totalItems > 0 && !loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-2xl">
                    <KPICard
                        title="Total Guests"
                        value={totalItems}
                        icon={Users}
                        iconColor="text-purple-400"
                        iconBg="bg-purple-500/10"
                        subtitle="Registered guests"
                    />
                </div>
            )}

            <DataTable
                columns={columns}
                data={guests}
                loading={loading}
                emptyMessage="No guests found."
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
                title="Guest Details"
                widthClass="max-w-2xl"
            >
                {selectedGuest && (
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-400">Guest ID</p>
                                <p className="text-sm font-medium">{selectedGuest._id}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Status</p>
                                <StatusBadge isActive={selectedGuest.isActive} />
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Guest Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Name</p>
                                    <p className="text-sm font-medium">{selectedGuest.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Email</p>
                                    <p className="text-sm font-medium">{selectedGuest.email}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Role</p>
                                    <p className="text-sm font-medium capitalize">{selectedGuest.role}</p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <h3 className="text-sm font-semibold mb-3">Booking Summary</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Total Bookings</p>
                                    <p className="text-2xl font-bold text-white">
                                        {selectedGuest.totalBookings || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Active Bookings</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        {selectedGuest.activeBookings || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Cancelled Bookings</p>
                                    <p className="text-2xl font-bold text-red-400">
                                        {selectedGuest.cancelledBookings || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-700 pt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">Member Since</p>
                                    <p className="text-sm font-medium">
                                        {formatDateTime(selectedGuest.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Last Updated</p>
                                    <p className="text-sm font-medium">
                                        {formatDateTime(selectedGuest.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogBox>

            {/* Status Change Confirmation Dialog */}
            <DialogBox
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                title={`${pendingStatus ? "Activate" : "Deactivate"} Guest`}
                description={`Are you sure you want to ${pendingStatus ? "activate" : "deactivate"
                    } ${selectedGuest?.name}? ${!pendingStatus
                        ? "The guest will not be able to log in or access their account."
                        : "The guest will be able to log in and access their account."
                    }`}
                showFooter
                confirmText={pendingStatus ? "Activate Guest" : "Deactivate Guest"}
                cancelText="Cancel"
                onConfirm={handleStatusConfirm}
                onCancel={() => setStatusDialogOpen(false)}
                confirmLoading={statusLoading}
                variant={pendingStatus ? "success" : "danger"}
            />
        </div>
    );
};

export default GuestsPage;

