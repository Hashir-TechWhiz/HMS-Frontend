"use client";

import { FC, useEffect } from "react";
import RoomCard, { RoomCardProps, UserRole } from "@/components/common/RoomCard";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface RoomsListProps {
  rooms: IRoom[];
  loading?: boolean;
  error?: string | null;
  userRole?: UserRole;
  onRoomSelect?: (roomId: string) => void;
  clientRoomTypeFilter?: RoomType[];
  guestsFilter?: number | null;
  onFilteredCountChange?: (count: number) => void;
}

/**
 * Map backend IRoom data to RoomCard props
 */
const mapRoomToCardProps = (room: IRoom): Omit<RoomCardProps, "userRole" | "onAction"> => {
  // Generate a user-friendly name from room number and type
  const name = `${room.roomType} Room ${room.roomNumber}`;

  // Use first image from images array, fallback to default only if array is empty
  const image = room.images && room.images.length > 0
    ? room.images[0]
    : "/images/SampleHotel.jpg";

  return {
    id: room._id,
    name: name,
    image: image,
    description: room.description || `${room.roomType} room with comfortable accommodations`,
    features: [], // Backend doesn't have amenities field, keep empty for now
    capacity: room.capacity,
    beds: Math.ceil(room.capacity / 2), // Estimate beds based on capacity
    pricePerNight: room.pricePerNight,
  };
};

const RoomsList: FC<RoomsListProps> = ({
  rooms,
  loading = false,
  error = null,
  userRole = "public",
  onRoomSelect,
  clientRoomTypeFilter,
  guestsFilter,
  onFilteredCountChange
}) => {
  // Apply client-side filtering
  let filteredRooms = rooms;

  // Filter by room type if multiple types selected
  if (clientRoomTypeFilter && clientRoomTypeFilter.length > 0) {
    filteredRooms = filteredRooms.filter(room =>
      clientRoomTypeFilter.includes(room.roomType)
    );
  }

  // Filter by guest capacity (only show rooms with capacity exactly matching guests)
  if (guestsFilter && guestsFilter > 0) {
    filteredRooms = filteredRooms.filter(room =>
      room.capacity === guestsFilter
    );
  }

  // Update filtered count whenever it changes
  useEffect(() => {
    onFilteredCountChange?.(filteredRooms.length);
  }, [filteredRooms.length, onFilteredCountChange]);
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
          Unable to Load Rooms
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          {error}
        </p>
      </div>
    );
  }

  // Empty state
  if (filteredRooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-6xl mb-4">🏨</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No Rooms Found
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn&apos;t find any rooms matching your criteria. Try adjusting your filters or search parameters.
        </p>
      </div>
    );
  }

  // Rooms list
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {filteredRooms.map((room) => (
        <RoomCard
          key={room._id}
          {...mapRoomToCardProps(room)}
          userRole={userRole}
          onAction={onRoomSelect}
        />
      ))}
    </div>
  );
};

export default RoomsList;

