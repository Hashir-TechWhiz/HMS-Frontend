"use client";

import { FC, useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import SearchSummary from "./SearchSummary";
import RoomsFilters from "./RoomsFilters";
import RoomsList from "./RoomsList";
import RoomSearchForm from "@/components/common/RoomSearchForm";
import { UserRole } from "@/components/common/RoomCard";
import { getRooms, GetRoomsParams } from "@/services/roomService";

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

    // Read search parameters from URL (UI display only - not sent to backend)
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const guestsParam = searchParams.get("guests");

    // Format dates for display (UI only)
    const checkInDate = checkInParam ? new Date(checkInParam) : null;
    const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;
    const guests = guestsParam ? parseInt(guestsParam) : null;

    // Fetch rooms from API
    useEffect(() => {
        const fetchRooms = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await getRooms(filters);

                if (response.success && response.data) {
                    setRooms(response.data);
                } else {
                    setError(response.message || "Failed to load rooms");
                    setRooms([]);
                }
            } catch (err) {
                console.error("Error fetching rooms:", err);
                setError("An unexpected error occurred while loading rooms");
                setRooms([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [filters]);

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
    };

    const handleRoomSelect = (roomId: string) => {
        // Navigation will be implemented later based on user role
        console.log("Room selected:", roomId);
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
                            resultsCount={filteredRoomsCount}
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
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomsPage;

