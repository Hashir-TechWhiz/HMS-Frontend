"use client";

import { FC, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";

interface RoomsFiltersProps {
  onFilterChange?: (filters: any) => void;
}

const RoomsFilters: FC<RoomsFiltersProps> = ({ onFilterChange }) => {
  const [priceRange, setPriceRange] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  const priceRanges = [
    { id: "0-100", label: "$0 - $100" },
    { id: "100-200", label: "$100 - $200" },
    { id: "200-300", label: "$200 - $300" },
    { id: "300+", label: "$300+" },
  ];

  const roomTypeOptions = [
    { id: "standard", label: "Standard Room" },
    { id: "deluxe", label: "Deluxe Room" },
    { id: "suite", label: "Suite" },
    { id: "family", label: "Family Room" },
  ];

  const handlePriceChange = (rangeId: string, checked: boolean) => {
    const updated = checked
      ? [...priceRange, rangeId]
      : priceRange.filter((id) => id !== rangeId);
    setPriceRange(updated);
  };

  const handleRoomTypeChange = (typeId: string, checked: boolean) => {
    const updated = checked
      ? [...roomTypes, typeId]
      : roomTypes.filter((id) => id !== typeId);
    setRoomTypes(updated);
  };

  const handleClearAll = () => {
    setPriceRange([]);
    setRoomTypes([]);
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
        className={`${
          showFilters ? "block" : "hidden lg:block"
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
            onClick={() => onFilterChange?.({ priceRange, roomTypes })}
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

