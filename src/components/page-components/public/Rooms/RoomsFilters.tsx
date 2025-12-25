"use client";

import { FC, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";
import { GetRoomsParams } from "@/services/roomService";

interface RoomsFiltersProps {
  onFilterChange?: (filters: GetRoomsParams, selectedRoomTypes?: RoomType[]) => void;
}

const RoomsFilters: FC<RoomsFiltersProps> = ({ onFilterChange }) => {
  const [priceRange, setPriceRange] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [showFilters, setShowFilters] = useState(true);

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

  const handleClearAll = () => {
    setPriceRange([]);
    setRoomTypes([]);
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

  const hasActiveFilters = priceRange.length > 0 || roomTypes.length > 0;

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters Card */}
      <Card
        className={`${showFilters ? "block" : "hidden lg:block"
          } bg-card border-border`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-foreground">Filters</CardTitle>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-primary hover:text-primary/90"
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Range */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Price per Night
            </Label>
            <div className="space-y-3">
              {priceRanges.map((range) => (
                <div key={range.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`price-${range.id}`}
                    checked={priceRange.includes(range.id)}
                    onCheckedChange={(checked) =>
                      handlePriceChange(range.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`price-${range.id}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {range.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Room Type */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-3 block">
              Room Type
            </Label>
            <div className="space-y-3">
              {roomTypeOptions.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={roomTypes.includes(type.id)}
                    onCheckedChange={(checked) =>
                      handleRoomTypeChange(type.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={`type-${type.id}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

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

