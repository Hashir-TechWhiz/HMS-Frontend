"use client";

import { FC, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import SearchSummary from "./SearchSummary";
import RoomsFilters from "./RoomsFilters";
import RoomsList from "./RoomsList";
import RoomSearchForm from "@/components/common/RoomSearchForm";
import DialogBox from "@/components/common/DialogBox";
import ViewRoomDetails from "@/components/common/ViewRoomDetails";
import { UserRole } from "@/components/common/RoomCard";
import { getRooms, GetRoomsParams } from "@/services/roomService";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface RoomsPageProps {
    userRole?: UserRole;
}

const RoomsPage: FC<RoomsPageProps> = ({ userRole = "public" }) => {
    const searchParams = useSearchParams();
    const [showSearchForm, setShowSearchForm] = useState(false);
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Default to showing only available rooms on public page
    const [filters, setFilters] = useState<GetRoomsParams>({ status: "available" });
    const [clientRoomTypes, setClientRoomTypes] = useState<RoomType[] | undefined>();
    const [filteredRoomsCount, setFilteredRoomsCount] = useState<number>(0);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 6;

    // View room dialog state
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<IRoom | null>(null);

    // Read search parameters from URL (UI display only - not sent to backend)
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const guestsParam = searchParams.get("guests");

    // Format dates for display (UI only)
    const checkInDate = checkInParam ? new Date(checkInParam) : null;
    const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;
    const guests = guestsParam ? parseInt(guestsParam) : null;

    // Check if client-side filters are active (guest capacity or multiple room types)
    const hasClientSideFilters = (guests !== null && guests > 0) || (clientRoomTypes && clientRoomTypes.length > 0);

    // Fetch rooms from API with pagination
    const fetchRooms = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Prepare params
            const params: GetRoomsParams = {
                ...filters,
            };

            // Only paginate when NO client-side filters are active
            // This prevents the issue where client-side filtering after pagination
            // causes "No rooms found" on page 1 when results exist on later pages
            if (!hasClientSideFilters) {
                params.page = currentPage;
                params.limit = ITEMS_PER_PAGE;
            }

            const response = await getRooms(params);

            if (response.success && response.data) {
                const data: any = response.data;

                // Handle paginated response
                if (data.pagination && !hasClientSideFilters) {
                    setRooms(data.rooms || []);
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalItems(data.pagination.totalRooms || 0);
                } else {
                    // Non-paginated or client-side filtered response
                    let roomsArray: IRoom[] = [];
                    if (Array.isArray(data)) {
                        roomsArray = data;
                    } else if (data.rooms && Array.isArray(data.rooms)) {
                        roomsArray = data.rooms;
                    }
                    setRooms(roomsArray);
                    setTotalPages(1);
                    setTotalItems(roomsArray.length);
                }
            } else {
                setError(response.message || "Failed to load rooms");
                setRooms([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (err) {
            console.error("Error fetching rooms:", err);
            setError("An unexpected error occurred while loading rooms");
            setRooms([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, ITEMS_PER_PAGE, hasClientSideFilters]);

    useEffect(() => {
        fetchRooms();
    }, [fetchRooms]);

    const handleSearch = (data: {
        checkIn?: Date;
        checkOut?: Date;
        guests?: number;
    }) => {
        // Build query parameters from search data
        const params = new URLSearchParams();

        if (data.checkIn) {
            params.set("checkIn", data.checkIn.toISOString());
        }

        if (data.checkOut) {
            params.set("checkOut", data.checkOut.toISOString());
        }

        if (data.guests) {
            params.set("guests", data.guests.toString());
        }

        // Update URL with new search parameters
        window.history.pushState({}, "", `/rooms?${params.toString()}`);

        // Refresh the page to show updated search criteria
        window.location.reload();
    };

    const handleFilterChange = (newFilters: GetRoomsParams, selectedRoomTypes?: RoomType[]) => {
        // Update filters which will trigger useEffect to fetch new data
        setFilters(newFilters);
        // Store room types for client-side filtering if multiple selected
        setClientRoomTypes(selectedRoomTypes);
        // Reset to page 1 when filters change
        setCurrentPage(1);
    };

    // Reset to page 1 when guest filter changes (from URL params)
    useEffect(() => {
        setCurrentPage(1);
    }, [guests]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of results
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleRoomSelect = (roomId: string) => {
        // Find the room by ID and open the view dialog
        const room = rooms.find((r) => r._id === roomId);
        if (room) {
            setSelectedRoom(room);
            setViewDialogOpen(true);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="relative py-12 pt-38">
                {/* Background Image */}
                <Image
                    src="/images/LuxuryRoom.jpg"
                    alt="Luxury room"
                    fill
                    priority
                    className="object-cover"
                />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/20" />

                {/* Content */}
                <div className="relative container mx-auto px-4">
                    <div className="max-w-7xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            Find Your Perfect Room
                        </h1>
                        <p className="text-gray-200 text-lg">
                            Explore our collection of comfortable and luxurious accommodations
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative min-h-screen">
                {/* Background Image */}
                <Image
                    src="/images/LuxuryRoomBg.jpg"
                    alt="Luxury background"
                    fill
                    className="object-cover"
                    priority={false}
                />

                {/* Dark overlay for better readability */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Content */}
                <div className="relative container mx-auto px-4 py-8">
                    <div className="max-w-7xl mx-auto">
                        {/* Search Form Toggle */}
                        <div className="mb-6">
                            <button
                                onClick={() => setShowSearchForm(!showSearchForm)}
                                className="text-primary hover:text-primary/90 font-medium text-sm flex items-center gap-2"
                            >
                                {showSearchForm ? "Hide" : "Modify"} Search
                                <span className="text-xs">
                                    {showSearchForm ? "▲" : "▼"}
                                </span>
                            </button>
                        </div>

                        {/* Collapsible Search Form */}
                        {showSearchForm && (
                            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <RoomSearchForm variant="compact" onSearch={handleSearch} />
                            </div>
                        )}

                        {/* Search Summary */}
                        <SearchSummary
                            checkIn={checkInDate ? format(checkInDate, "MMM dd, yyyy") : null}
                            checkOut={checkOutDate ? format(checkOutDate, "MMM dd, yyyy") : null}
                            guests={guests}
                            resultsCount={hasClientSideFilters ? filteredRoomsCount : totalItems}
                        />

                        {/* Filters and Results Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24">
                                    <RoomsFilters onFilterChange={handleFilterChange} />
                                </div>
                            </div>


                            {/* Rooms List */}
                            <div className="lg:col-span-3">
                                <RoomsList
                                    rooms={rooms}
                                    loading={loading}
                                    error={error}
                                    userRole={userRole}
                                    onRoomSelect={handleRoomSelect}
                                    clientRoomTypeFilter={clientRoomTypes}
                                    guestsFilter={guests}
                                    onFilteredCountChange={setFilteredRoomsCount}
                                />

                                {/* Pagination Controls - Only show when no client-side filters active */}
                                {!loading && !error && totalPages > 1 && !hasClientSideFilters && (
                                    <div className="flex items-center justify-center w-full mt-8 mb-4">
                                        <Pagination>
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <PaginationPrevious
                                                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                                                        className={
                                                            currentPage === 1
                                                                ? "cursor-not-allowed opacity-50"
                                                                : "cursor-pointer hover:bg-white/10"
                                                        }
                                                    />
                                                </PaginationItem>

                                                {[...Array(totalPages)].map((_, i) => {
                                                    const pageNumber = i + 1;
                                                    if (
                                                        totalPages <= 7 ||
                                                        pageNumber === 1 ||
                                                        pageNumber === totalPages ||
                                                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                                    ) {
                                                        return (
                                                            <PaginationItem key={pageNumber}>
                                                                <PaginationLink
                                                                    onClick={() => handlePageChange(pageNumber)}
                                                                    isActive={currentPage === pageNumber}
                                                                    className={
                                                                        currentPage === pageNumber
                                                                            ? "bg-primary text-white"
                                                                            : "cursor-pointer hover:bg-white/10"
                                                                    }
                                                                >
                                                                    {pageNumber}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        );
                                                    } else if (
                                                        pageNumber === currentPage - 2 ||
                                                        pageNumber === currentPage + 2
                                                    ) {
                                                        return (
                                                            <PaginationItem key={pageNumber}>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        );
                                                    }
                                                    return null;
                                                })}

                                                <PaginationItem>
                                                    <PaginationNext
                                                        onClick={() =>
                                                            currentPage < totalPages && handlePageChange(currentPage + 1)
                                                        }
                                                        className={
                                                            currentPage === totalPages
                                                                ? "cursor-not-allowed opacity-50"
                                                                : "cursor-pointer hover:bg-white/10"
                                                        }
                                                    />
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Room Details Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Room Details"
                widthClass="md:min-w-3xl!"
            >
                <ViewRoomDetails room={selectedRoom} userRole={userRole} />
            </DialogBox>
        </div>
    );
};

export default RoomsPage;

