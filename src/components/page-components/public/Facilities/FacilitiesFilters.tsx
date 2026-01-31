"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal, X } from "lucide-react";
import { GetFacilitiesParams } from "@/services/publicFacilityService";
import { getPublicActiveHotels } from "@/services/hotelService";

interface FacilitiesFiltersProps {
  onFilterChange?: (filters: GetFacilitiesParams, selectedFacilityTypes?: FacilityType[]) => void;
  availableHotels?: IHotel[]; // Hotels filtered by location from parent
}

const FacilitiesFilters: FC<FacilitiesFiltersProps> = ({ onFilterChange, availableHotels: passedHotels }) => {
  const [facilityTypes, setFacilityTypes] = useState<FacilityType[]>([]);
  const [selectedHotels, setSelectedHotels] = useState<string[]>([]);
  const [hotels, setHotels] = useState<IHotel[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [loadingHotels, setLoadingHotels] = useState(false);

  // Use passed hotels if available, otherwise fetch all hotels
  useEffect(() => {
    if (passedHotels) {
      setHotels(passedHotels);
      setLoadingHotels(false);
    } else {
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

  // Facility types based on backend enum
  const facilityTypeOptions: Array<{ id: FacilityType; label: string }> = [
    { id: "Event Hall", label: "Event Hall" },
    { id: "Pool", label: "Pool" },
    { id: "Gym", label: "Gym" },
    { id: "Spa", label: "Spa" },
    { id: "Conference Room", label: "Conference Room" },
    { id: "Sports Court", label: "Sports Court" },
    { id: "Game Room", label: "Game Room" },
    { id: "Other", label: "Other" },
  ];

  const handleFacilityTypeChange = (typeId: FacilityType, checked: boolean) => {
    const updated = checked
      ? [...facilityTypes, typeId]
      : facilityTypes.filter((id) => id !== typeId);
    setFacilityTypes(updated);
  };

  const handleHotelChange = (hotelId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedHotels, hotelId]
      : selectedHotels.filter((id) => id !== hotelId);
    setSelectedHotels(updated);
  };

  const handleClearAll = () => {
    setFacilityTypes([]);
    setSelectedHotels([]);
    // Clear user-selected filters but keep status: available for public page
    onFilterChange?.({ status: "available" });
  };

  const handleApplyFilters = () => {
    // Build backend-compatible filter params
    const params: GetFacilitiesParams = {};

    // Handle facility types
    // If only one type selected, send as single filter to backend
    // If multiple types selected, handle client-side (pass array to parent)
    if (facilityTypes.length === 1) {
      params.facilityType = facilityTypes[0];
    }

    // Handle hotels
    // Similar to room types: single hotel goes to backend, multiple are client-side
    if (selectedHotels.length === 1) {
      params.hotelId = selectedHotels[0];
    } else if (selectedHotels.length > 1) {
      // Multiple hotels selected - backend doesn't support OR filters
      // So we'll filter client-side in parent component
      // For now, just pass the first one or handle differently
      params.hotelId = selectedHotels[0];
    }

    // Always include status: available for public page
    params.status = "available";

    // Pass filters and client-side facility types if multiple selected
    onFilterChange?.(params, facilityTypes.length > 1 ? facilityTypes : undefined);
  };

  const activeFilterCount = 
    facilityTypes.length +
    selectedHotels.length;

  return (
    <Card className="border-2 border-primary-900/40 bg-primary-500/10 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary-400" />
            <CardTitle className="text-lg">Filters</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden"
          >
            {showFilters ? <X className="h-4 w-4" /> : <SlidersHorizontal className="h-4 w-4" />}
          </Button>
        </div>
        {activeFilterCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
          </p>
        )}
      </CardHeader>

      <CardContent className={`space-y-5 ${!showFilters ? 'hidden lg:block' : ''}`}>
        {/* Facility Types */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-foreground">Facility Type</Label>
          <div className="space-y-2">
            {facilityTypeOptions.map((type) => (
              <div key={type.id} className="flex items-center space-x-2 group hover:bg-white/5 p-1.5 rounded-md transition-colors">
                <Checkbox
                  id={`type-${type.id}`}
                  checked={facilityTypes.includes(type.id)}
                  onCheckedChange={(checked) => handleFacilityTypeChange(type.id, checked as boolean)}
                  className="data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                />
                <Label
                  htmlFor={`type-${type.id}`}
                  className="text-sm cursor-pointer flex-1 text-muted-foreground group-hover:text-foreground transition-colors"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Hotels */}
        {hotels.length > 0 && (
          <>
            <Separator className="bg-white/10" />
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Hotels</Label>
              {loadingHotels ? (
                <p className="text-xs text-muted-foreground">Loading hotels...</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {hotels.map((hotel) => (
                    <div key={hotel._id} className="flex items-center space-x-2 group hover:bg-white/5 p-1.5 rounded-md transition-colors">
                      <Checkbox
                        id={`hotel-${hotel._id}`}
                        checked={selectedHotels.includes(hotel._id)}
                        onCheckedChange={(checked) => handleHotelChange(hotel._id, checked as boolean)}
                        className="data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600"
                      />
                      <Label
                        htmlFor={`hotel-${hotel._id}`}
                        className="text-sm cursor-pointer flex-1 text-muted-foreground group-hover:text-foreground transition-colors"
                      >
                        {hotel.name}
                        {hotel.city && <span className="text-xs block text-gray-500">{hotel.city}</span>}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
          >
            Apply Filters
          </Button>
          {activeFilterCount > 0 && (
            <Button
              onClick={handleClearAll}
              variant="outline"
              className="w-full"
            >
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FacilitiesFilters;
