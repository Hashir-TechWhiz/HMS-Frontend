"use client";

import { FC, useEffect } from "react";
import FacilityCard, { FacilityCardProps, UserRole } from "@/components/common/FacilityCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface FacilitiesListProps {
  facilities: IPublicFacility[];
  loading?: boolean;
  error?: string | null;
  userRole?: UserRole;
  onFacilitySelect?: (facilityId: string) => void;
  clientFacilityTypeFilter?: FacilityType[];
  onFilteredCountChange?: (count: number) => void;
}

/**
 * Map backend IPublicFacility data to FacilityCard props
 */
const mapFacilityToCardProps = (facility: IPublicFacility): Omit<FacilityCardProps, "userRole" | "onAction"> => {
  // Use first image from images array, fallback to default only if array is empty
  const image = facility.images && facility.images.length > 0
    ? facility.images[0]
    : "/images/SampleHotel.jpg";

  // Extract hotel information (hotelId can be populated object or string)
  const hotel = typeof facility.hotelId === 'object' ? facility.hotelId : null;

  return {
    id: facility._id,
    name: facility.name,
    image: image,
    description: facility.description,
    facilityType: facility.facilityType,
    amenities: facility.amenities || [],
    capacity: facility.capacity,
    pricePerHour: facility.pricePerHour,
    pricePerDay: facility.pricePerDay,
    operatingHours: facility.operatingHours,
    hotelName: hotel?.name,
    hotelCity: hotel?.city,
    hotelCountry: hotel?.country,
    status: facility.status,
  };
};

const FacilitiesList: FC<FacilitiesListProps> = ({
  facilities,
  loading = false,
  error = null,
  userRole = "public",
  onFacilitySelect,
  clientFacilityTypeFilter,
  onFilteredCountChange
}) => {
  // Apply client-side filtering
  let filteredFacilities = facilities;

  // Filter by facility type if multiple types selected
  if (clientFacilityTypeFilter && clientFacilityTypeFilter.length > 0) {
    filteredFacilities = filteredFacilities.filter(facility =>
      clientFacilityTypeFilter.includes(facility.facilityType)
    );
  }

  // Update filtered count whenever it changes
  useEffect(() => {
    onFilteredCountChange?.(filteredFacilities.length);
  }, [filteredFacilities.length, onFilteredCountChange]);

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Unable to Load Facilities
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  // Empty state
  if (filteredFacilities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-6xl mb-4">🏢</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Facilities Found
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn&apos;t find any facilities matching your criteria. Try adjusting your filters or search parameters.
        </p>
      </div>
    );
  }

  // Facilities list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {filteredFacilities.map((facility) => (
        <FacilityCard
          key={facility._id}
          {...mapFacilityToCardProps(facility)}
          userRole={userRole}
          onCardClick={onFacilitySelect}
        />
      ))}
    </div>
  );
};

export default FacilitiesList;
