"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";
import { GetRoomsParams } from "@/services/roomService";
import { getPublicActiveHotels } from "@/services/hotelService";

interface RoomsFiltersProps {
  onFilterChange?: (filters: GetRoomsParams, selectedRoomTypes?: RoomType[]) => void;
  availableHotels?: IHotel[]; // Hotels filtered by location from parent
}

const RoomsFilters: FC<RoomsFiltersProps> = ({ onFilterChange, availableHotels: passedHotels }) => {
  const [priceRange, setPriceRange] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Use passed hotels if available, otherwise fetch all hotels (public endpoint - no auth required)
  useEffect(() => {
    if (passedHotels) {
      // Use hotels filtered by location from parent
      setHotels(passedHotels);
      setLoadingHotels(false);
    } else {
      // Fetch all hotels if not provided (backward compatibility)
      const fetchHotels = async () => {
        try {
          setLoadingHotels(true);
          const response = await getPublicActiveHotels();
          if (response.success && response.data) {
            setHotels(response.data);
          }
        } catch (error) {
          console.error('Failed to fetch hotels:', error);
        } finally {
          setLoadingHotels(false);
        }
      };

      fetchHotels();
    }
  }, [passedHotels]);

  const priceRanges = [
    { id: "0-5000", label: "LKR 0 - 5,000", min: 0, max: 5000 },
    { id: "5000-10000", label: "LKR 5,000 - 10,000", min: 5000, max: 10000 },
    { id: "10000-20000", label: "LKR 10,000 - 20,000", min: 10000, max: 20000 },
    { id: "20000-30000", label: "LKR 20,000 - 30,000", min: 20000, max: 30000 },
    { id: "30000+", label: "LKR 30,000+", min: 30000, max: undefined },
  ];

  // Room types based on backend API specification (exact enum values)
  const roomTypeOptions: Array<{ id: RoomType; label: string }> = [
    { id: "Single", label: "Single Room" },
    { id: "Double", label: "Double Room" },
    { id: "Suite", label: "Suite" },
    { id: "Deluxe", label: "Deluxe Room" },
    { id: "Presidential", label: "Presidential Suite" },
  ];

  const handlePriceChange = (rangeId: string, checked: boolean) => {
    const updated = checked
      ? [...priceRange, rangeId]
      : priceRange.filter((id) => id !== rangeId);
    setPriceRange(updated);
  };

  const handleRoomTypeChange = (typeId: RoomType, checked: boolean) => {
    const updated = checked
      ? [...roomTypes, typeId]
      : roomTypes.filter((id) => id !== typeId);
    setRoomTypes(updated);
  };

  const handleHotelChange = (hotelId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedHotels, hotelId]
      : selectedHotels.filter((id) => id !== hotelId);
    setSelectedHotels(updated);
  };

  const handleClearAll = () => {
    setPriceRange([]);
    setRoomTypes([]);
    setSelectedHotels([]);
    // Clear user-selected filters but keep status: available for public page
    onFilterChange?.({ status: "available" });
  };

  const handleApplyFilters = () => {
    // Build backend-compatible filter params
    const params: GetRoomsParams = {};

    // Convert price ranges to minPrice/maxPrice
    // If multiple ranges selected, use the widest range (min of mins, max of maxes)
    if (priceRange.length > 0) {
      const selectedRanges = priceRanges.filter(r => priceRange.includes(r.id));
      const minPrices = selectedRanges.map(r => r.min);
      const maxPrices = selectedRanges
        .map(r => r.max)
        .filter((m): m is number => m !== undefined);

      if (minPrices.length > 0) {
        params.minPrice = Math.min(...minPrices);
      }
      if (maxPrices.length > 0) {
        params.maxPrice = Math.max(...maxPrices);
      }
      // If any range is open-ended (30000+), don't set maxPrice
      if (selectedRanges.some(r => r.max === undefined)) {
        delete params.maxPrice;
      }
    }

    // Hotel filter:
    // - If exactly 1 hotel selected: send to backend
    // - If multiple or none selected: don't send (show all hotels)
    if (selectedHotels.length === 1) {
      params.hotelId = selectedHotels[0];
    }

    // Room type filter:
    // - If 0 or 1 selected: send to backend normally
    // - If multiple selected: don't send roomType to backend (get all), filter on frontend
    if (roomTypes.length === 1) {
      params.roomType = roomTypes[0];
    }

    // Status filter - only show available rooms on public page
    params.status = "available";

    // Pass both params and selected room types for frontend filtering
    onFilterChange?.(params, roomTypes.length > 1 ? roomTypes : undefined);
  };

  const hasActiveFilters = priceRange.length > 0 || roomTypes.length > 0 || selectedHotels.length > 0;

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full hover:bg-white/10 border-white/20 hover:border-primary/30 transition-all duration-300"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Card */}
      <Card
        className={`${showFilters ? "block" : "hidden lg:block"
          } overflow-hidden transition-all duration-500 group p-0 table-bg-gradient border border-white/20 relative`}
      >

        <CardHeader className="relative z-10 pt-4 pb-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="hover:bg-white/10 border border-white/20 hover:border-primary/30 transition-all duration-300"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10 pb-4 px-4">
          {/* Hotel Filter */}
          {hotels.length > 0 && (
            <>
              <div>
                <Label className="text-sm font-semibold text-foreground mb-3 block">
                  Filter by Hotel
                </Label>
                <div className="space-y-2">
                  {loadingHotels ? (
                    <p className="text-xs text-muted-foreground">Loading hotels...</p>
                  ) : (
                    hotels.map((hotel) => (
                      <div
                        key={hotel._id}
                        className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer group/item"
                      >
                        <Checkbox
                          id={`hotel-${hotel._id}`}
                          checked={selectedHotels.includes(hotel._id)}
                          onCheckedChange={(checked) =>
                            handleHotelChange(hotel._id, checked as boolean)
                          }
                          className="group-hover/item:border-primary/50 mt-0.5"
                        />
                        <label
                          htmlFor={`hotel-${hotel._id}`}
                          className="text-sm text-foreground cursor-pointer flex-1 group-hover/item:text-primary transition-colors duration-200"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{hotel.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {hotel.city}, {hotel.country}
                            </span>
                          </div>
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <Separator className="bg-white/10 my-3" />
            </>
          )}

          {/* Price Range */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Price per Night
            </Label>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <div
                  key={range.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer group/item"
                >
                  <Checkbox
                    id={`price-${range.id}`}
                    checked={priceRange.includes(range.id)}
                    onCheckedChange={(checked) =>
                      handlePriceChange(range.id, checked as boolean)
                    }
                    className="group-hover/item:border-primary/50"
                  />
                  <label
                    htmlFor={`price-${range.id}`}
                    className="text-sm text-foreground cursor-pointer flex-1 group-hover/item:text-primary transition-colors duration-200"
                  >
                    {range.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/10 my-3" />

          {/* Room Type */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Room Type
            </Label>
            <div className="space-y-2">
              {roomTypeOptions.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200 cursor-pointer group/item"
                >
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={roomTypes.includes(type.id)}
                    onCheckedChange={(checked) =>
                      handleRoomTypeChange(type.id, checked as boolean)
                    }
                    className="group-hover/item:border-primary/50"
                  />
                  <label
                    htmlFor={`type-${type.id}`}
                    className="text-sm text-foreground cursor-pointer flex-1 group-hover/item:text-primary transition-colors duration-200"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/10 my-3" />

          {/* Apply Filters Button */}
          <Button
            onClick={handleApplyFilters}
            className="w-full main-button-gradient"
          >
            Apply Filters
          </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default RoomsFilters;

