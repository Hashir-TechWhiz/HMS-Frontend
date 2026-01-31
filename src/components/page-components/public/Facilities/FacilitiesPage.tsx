"use client";

import { FC, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import FacilitiesFilters from "./FacilitiesFilters";
import FacilitiesList from "./FacilitiesList";
import DialogBox from "@/components/common/DialogBox";
import ViewFacilityDetails from "@/components/common/ViewFacilityDetails";
import { UserRole } from "@/components/common/FacilityCard";
import { getFacilities, GetFacilitiesParams } from "@/services/publicFacilityService";
import { getPublicActiveHotels } from "@/services/hotelService";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface FacilitiesPageProps {
    userRole?: UserRole;
}

const FacilitiesPage: FC<FacilitiesPageProps> = ({ userRole = "public" }) => {
    const [facilities, setFacilities] = useState<IPublicFacility[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [clientFacilityTypes, setClientFacilityTypes] = useState<FacilityType[] | undefined>();
    const [filteredFacilitiesCount, setFilteredFacilitiesCount] = useState<number>(0);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const ITEMS_PER_PAGE = 6;

    // View facility dialog state
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [selectedFacility, setSelectedFacility] = useState<IPublicFacility | null>(null);

    // Hotel state
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);

    // Initialize filters
    const [filters, setFilters] = useState<GetFacilitiesParams>({ status: "available" });

    // Check if client-side filters are active
    const hasClientSideFilters = clientFacilityTypes && clientFacilityTypes.length > 0;

    // Fetch hotels (public endpoint - no auth required)
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const response = await getPublicActiveHotels();
                if (response.success && response.data) {
                    setAvailableHotels(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch hotels:', error);
                setAvailableHotels([]);
            }
        };

        fetchHotels();
    }, []);

    // Fetch facilities from API with pagination
    const fetchFacilities = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Prepare params
            const params: GetFacilitiesParams = {
                ...filters,
            };

            // Only paginate when NO client-side filters are active
            if (!hasClientSideFilters) {
                params.page = currentPage;
                params.limit = ITEMS_PER_PAGE;
            }

            const response = await getFacilities(params);

            if (response.success && response.data) {
                const data: any = response.data;

                // Handle paginated response
                if (data.pagination && !hasClientSideFilters) {
                    setFacilities(data.facilities || []);
                    setTotalPages(data.pagination.totalPages || 1);
                    setTotalItems(data.pagination.totalFacilities || 0);
                } else {
                    // Non-paginated or client-side filtered response
                    let facilitiesArray: IPublicFacility[] = [];
                    if (Array.isArray(data)) {
                        facilitiesArray = data;
                    } else if (data.facilities && Array.isArray(data.facilities)) {
                        facilitiesArray = data.facilities;
                    }
                    setFacilities(facilitiesArray);
                    setTotalPages(1);
                    setTotalItems(facilitiesArray.length);
                }
            } else {
                setError(response.message || "Failed to load facilities");
                setFacilities([]);
                setTotalPages(1);
                setTotalItems(0);
            }
        } catch (err) {
            console.error("Error fetching facilities:", err);
            setError("An unexpected error occurred while loading facilities");
            setFacilities([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setLoading(false);
        }
    }, [filters, currentPage, ITEMS_PER_PAGE, hasClientSideFilters]);

    useEffect(() => {
        fetchFacilities();
    }, [fetchFacilities]);

    const handleFilterChange = (newFilters: GetFacilitiesParams, selectedFacilityTypes?: FacilityType[]) => {
        // Update filters which will trigger useEffect to fetch new data
        setFilters(newFilters);
        // Store facility types for client-side filtering if multiple selected
        setClientFacilityTypes(selectedFacilityTypes);
        // Reset to page 1 when filters change
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Scroll to top of results
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    const handleFacilitySelect = (facilityId: string) => {
        // Find the facility by ID and open the view dialog
        const facility = facilities.find((f) => f._id === facilityId);
        if (facility) {
            setSelectedFacility(facility);
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
                    alt="Public facilities"
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
                            Explore Our Facilities
                        </h1>
                        <p className="text-gray-200 text-lg">
                            Discover premium amenities and services for your perfect stay
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
                        {/* Results Summary */}
                        <div className="mb-6">
                            <p className="text-gray-200 text-sm">
                                {loading ? (
                                    "Loading facilities..."
                                ) : (
                                    <>
                                        Showing <span className="font-semibold text-white">{hasClientSideFilters ? filteredFacilitiesCount : totalItems}</span> {hasClientSideFilters ? filteredFacilitiesCount === 1 ? 'facility' : 'facilities' : totalItems === 1 ? 'facility' : 'facilities'}
                                    </>
                                )}
                            </p>
                        </div>

                        {/* Filters and Results Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {/* Filters Sidebar */}
                            <div className="lg:col-span-1">
                                <div className="sticky top-24">
                                    <FacilitiesFilters
                                        onFilterChange={handleFilterChange}
                                        availableHotels={availableHotels}
                                    />
                                </div>
                            </div>

                            {/* Facilities List */}
                            <div className="lg:col-span-3">
                                <FacilitiesList
                                    facilities={facilities}
                                    loading={loading}
                                    error={error}
                                    userRole={userRole}
                                    onFacilitySelect={handleFacilitySelect}
                                    clientFacilityTypeFilter={clientFacilityTypes}
                                    onFilteredCountChange={setFilteredFacilitiesCount}
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

            {/* View Facility Details Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Facility Details"
                widthClass="md:min-w-3xl!"
            >
                <ViewFacilityDetails facility={selectedFacility} userRole={userRole} />
            </DialogBox>
        </div>
    );
};

export default FacilitiesPage;
