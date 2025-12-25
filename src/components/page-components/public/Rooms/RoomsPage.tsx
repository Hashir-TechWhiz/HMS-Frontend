"use client";

import { FC, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import SearchSummary from "./SearchSummary";
import RoomsFilters from "./RoomsFilters";
import RoomsList from "./RoomsList";
import RoomSearchForm from "@/components/common/RoomSearchForm";
import { UserRole } from "@/components/common/RoomCard";

interface RoomsPageProps {
    userRole?: UserRole;
}

const RoomsPage: FC<RoomsPageProps> = ({ userRole = "public" }) => {
    const searchParams = useSearchParams();
    const [showSearchForm, setShowSearchForm] = useState(false);

    // Read search parameters from URL
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    const guestsParam = searchParams.get("guests");

    // Format dates for display
    const checkInDate = checkInParam ? new Date(checkInParam) : null;
    const checkOutDate = checkOutParam ? new Date(checkOutParam) : null;
    const guests = guestsParam ? parseInt(guestsParam) : null;

    const searchData = {
        checkIn: checkInDate ? format(checkInDate, "MMM dd, yyyy") : null,
        checkOut: checkOutDate ? format(checkOutDate, "MMM dd, yyyy") : null,
        guests: guests,
        resultsCount: 8,
    };

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

    const handleFilterChange = (filters: any) => {
        // This will be implemented with actual filtering later
        console.log("Filters:", filters);
    };

    const handleRoomSelect = (roomId: string) => {
        // Navigation will be implemented later based on user role
        console.log("Room selected:", roomId);
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Page Header */}
            <div className="bg-linear-to-r from-primary-600 to-primary-800 text-white py-12 pt-24">
                <div className="container mx-auto px-4">
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
            <div className="container mx-auto px-4 py-8">
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
                        checkIn={searchData.checkIn}
                        checkOut={searchData.checkOut}
                        guests={searchData.guests}
                        resultsCount={searchData.resultsCount}
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
                            <RoomsList userRole={userRole} onRoomSelect={handleRoomSelect} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomsPage;

