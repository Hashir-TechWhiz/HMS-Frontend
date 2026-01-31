"use client";

import { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Clock,
  Sparkles,
  Wifi,
  Wind,
  Tv,
  Dumbbell,
  Waves,
  Utensils,
  MapPin,
  LucideIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "public" | "guest" | "receptionist" | "admin";

export interface FacilityCardProps {
  id: string;
  name: string;
  image: string;
  description?: string;
  facilityType: FacilityType;
  amenities?: string[];
  capacity: number;
  pricePerHour?: number;
  pricePerDay?: number;
  operatingHours?: {
    open: string;
    close: string;
  };
  hotelName?: string;
  hotelCity?: string;
  hotelCountry?: string;
  status: FacilityStatus;
  userRole?: UserRole;
  onAction?: (facilityId: string) => void;
  onCardClick?: (facilityId: string) => void;
}

const FacilityCard: FC<FacilityCardProps> = ({
  id,
  name,
  image,
  description,
  facilityType,
  amenities,
  capacity,
  pricePerHour,
  pricePerDay,
  operatingHours,
  hotelName,
  hotelCity,
  hotelCountry,
  status,
  userRole = "public",
  onCardClick,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Amenity icon and color mapping
  const getAmenityConfig = (amenity: string): { icon: LucideIcon; color: string; bgColor: string } => {
    const configs: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
      "Wi-Fi": { icon: Wifi, color: "text-blue-400", bgColor: "bg-blue-500/20 border-blue-500/30" },
      "Air Conditioning": { icon: Wind, color: "text-cyan-400", bgColor: "bg-cyan-500/20 border-cyan-500/30" },
      "TV": { icon: Tv, color: "text-purple-400", bgColor: "bg-purple-500/20 border-purple-500/30" },
      "Gym Equipment": { icon: Dumbbell, color: "text-orange-400", bgColor: "bg-orange-500/20 border-orange-500/30" },
      "Pool": { icon: Waves, color: "text-teal-400", bgColor: "bg-teal-500/20 border-teal-500/30" },
      "Food Service": { icon: Utensils, color: "text-emerald-400", bgColor: "bg-emerald-500/20 border-emerald-500/30" },
    };
    return configs[amenity] || { icon: Sparkles, color: "text-gray-400", bgColor: "bg-white/5 border-white/10" };
  };

  const getActionButtonLabel = (): string => {
    if (status !== "available") {
      return "Not Available";
    }

    switch (userRole) {
      case "receptionist":
        return "Book for Guest";
      case "admin":
        return "View Only";
      case "guest":
      case "public":
      default:
        return "Book Now";
    }
  };

  const handleBookingClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent card click handler from firing
    e.stopPropagation();

    // Admin users have view-only access (button is disabled)
    if (userRole === "admin" || status !== "available") {
      return;
    }

    // Check authentication for booking actions
    if (!isAuthenticated) {
      // Redirect to login with facilityId to preserve booking intent
      router.push(`/login?facilityId=${id}`);
    } else {
      // User is authenticated, navigate to booking flow
      router.push(`/book-facility?facilityId=${id}`);
    }
  };

  const handleCardClick = () => {
    // Open facility details dialog if handler is provided
    if (onCardClick) {
      onCardClick(id);
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      available: { label: "Available", className: "bg-green-500/20 text-green-400 border-green-500/50" },
      unavailable: { label: "Unavailable", className: "bg-red-500/20 text-red-400 border-red-500/50" },
      maintenance: { label: "Maintenance", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
    };

    const config = statusConfig[status];

    return (
      <Badge className={`${config.className} border backdrop-blur-sm hover:bg-opacity-30 transition-all duration-300 font-semibold px-2 py-1 text-[10px]`}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-500 group p-0 bg-primary-500/10 border border-white/20 relative h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 group-hover:to-primary/5 transition-all duration-500 pointer-events-none rounded-lg" />

      {/* Facility Image */}
      <div className="relative h-48 shrink-0 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {/* Enhanced linear overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all duration-500" />

        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

        {/* Price Badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-linear-to-r from-white/95 to-white/90 backdrop-blur-sm border border-white/50 text-black-500 hover:bg-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 mr-1 text-primary-500" />
            {pricePerDay ? (
              <>
                LKR {pricePerDay.toLocaleString()}
                <span className="text-[10px] ml-1 opacity-70">/day</span>
              </>
            ) : pricePerHour ? (
              <>
                LKR {pricePerHour.toLocaleString()}
                <span className="text-[10px] ml-1 opacity-70">/hour</span>
              </>
            ) : (
              "Contact"
            )}
          </Badge>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          {getStatusBadge()}
        </div>
      </div>

      <CardContent className="flex-1 p-4 space-y-3 relative z-10">
        {/* Facility Name & Type */}
        <div>
          <h3 className="text-lg font-bold text-white leading-tight line-clamp-1 group-hover:text-primary-400 transition-colors duration-300">
            {name}
          </h3>
          <p className="text-xs text-gray-400 mt-1">{facilityType}</p>
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Facility Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Capacity */}
          <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/10">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span className="font-medium">{capacity} people</span>
          </div>

          {/* Operating Hours */}
          {operatingHours && (
            <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 px-2.5 py-1.5 rounded-md border border-white/10">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-medium">{operatingHours.open} - {operatingHours.close}</span>
            </div>
          )}
        </div>

        {/* Location */}
        {(hotelName || hotelCity || hotelCountry) && (
          <div className="flex items-start gap-2 pt-2 border-t border-white/10">
            <MapPin className="h-4 w-4 text-primary-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              {hotelName && <p className="text-white font-medium line-clamp-1">{hotelName}</p>}
              {(hotelCity || hotelCountry) && (
                <p className="text-gray-400 line-clamp-1">
                  {[hotelCity, hotelCountry].filter(Boolean).join(", ")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Amenities */}
        {amenities && amenities.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {amenities.slice(0, 4).map((amenity, idx) => {
                const { icon: Icon, color, bgColor } = getAmenityConfig(amenity);
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${bgColor} transition-all duration-300 hover:scale-105`}
                  >
                    <Icon className={`h-3 w-3 ${color}`} />
                    <span className="text-[10px] text-white font-medium">{amenity}</span>
                  </div>
                );
              })}
              {amenities.length > 4 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-white/5 border-white/10">
                  <span className="text-[10px] text-gray-400 font-medium">
                    +{amenities.length - 4} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 relative z-10">
        <Button
          onClick={handleBookingClick}
          disabled={userRole === "admin" || status !== "available"}
          className="main-button-gradient w-full"
        >
          {getActionButtonLabel()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FacilityCard;
