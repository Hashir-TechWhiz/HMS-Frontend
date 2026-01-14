"use client";

import { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Bed,
  Sparkles,
  Wifi,
  Wind,
  Tv,
  Wine,
  Bell,
  Home,
  Waves,
  Lock,
  MapPin,
  LucideIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "public" | "guest" | "receptionist" | "admin";

export interface RoomCardProps {
  id: string;
  name: string;
  image: string;
  description?: string;
  features: string[];
  amenities?: string[];
  capacity: number;
  beds: number;
  pricePerNight: number;
  hotelName?: string;
  hotelCity?: string;
  hotelCountry?: string;
  userRole?: UserRole;
  onAction?: (roomId: string) => void;
  onCardClick?: (roomId: string) => void;
}

const RoomCard: FC<RoomCardProps> = ({
  id,
  name,
  image,
  description,
  amenities,
  capacity,
  beds,
  pricePerNight,
  hotelName,
  hotelCity,
  hotelCountry,
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
      "Mini Bar": { icon: Wine, color: "text-amber-400", bgColor: "bg-amber-500/20 border-amber-500/30" },
      "Room Service": { icon: Bell, color: "text-emerald-400", bgColor: "bg-emerald-500/20 border-emerald-500/30" },
      "Balcony": { icon: Home, color: "text-orange-400", bgColor: "bg-orange-500/20 border-orange-500/30" },
      "Sea View": { icon: Waves, color: "text-teal-400", bgColor: "bg-teal-500/20 border-teal-500/30" },
      "Safe Locker": { icon: Lock, color: "text-slate-400", bgColor: "bg-slate-500/20 border-slate-500/30" },
    };
    return configs[amenity] || { icon: Sparkles, color: "text-gray-400", bgColor: "bg-white/5 border-white/10" };
  };

  const getActionButtonLabel = (): string => {
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
    if (userRole === "admin") {
      return;
    }

    // Check authentication for booking actions
    if (!isAuthenticated) {
      // Redirect to login with roomId to preserve booking intent
      router.push(`/login?roomId=${id}`);
    } else {
      // User is authenticated, always navigate to booking flow
      // onAction is only used for non-booking actions (e.g., admin view-only)
      router.push(`/book?roomId=${id}`);
    }
  };

  const handleCardClick = () => {
    // Open room details dialog if handler is provided
    if (onCardClick) {
      onCardClick(id);
    }
  };

  return (
    <Card
      className="overflow-hidden transition-all duration-500 group p-0 bg-primary-500/10 border border-white/20 relative h-full flex flex-col cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 group-hover:to-primary/5 transition-all duration-500 pointer-events-none rounded-lg" />

      {/* Room Image - Reduced height */}
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

        {/* Price Badge - Compact */}
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-linear-to-r from-white/95 to-white/90 backdrop-blur-sm border border-white/50 text-black-500 hover:bg-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 mr-1 text-primary-500" />
            LKR {pricePerNight.toLocaleString()}
            <span className="text-[10px] ml-1 opacity-70">/night</span>
          </Badge>
        </div>
      </div>

      {/* Room Details - Compact */}
      <CardContent className="p-4 relative z-10 flex flex-col pt-0">
        <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300 line-clamp-1">
          {name}
        </h3>

        {/* Hotel Information */}
        {hotelName && (
          <div className="flex items-start gap-1.5 mb-2">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">{hotelName}</span>
              {(hotelCity || hotelCountry) && (
                <span className="text-[10px] text-muted-foreground">
                  {[hotelCity, hotelCountry].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>
        )}

        {description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {/* Capacity and Beds - Compact */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group/item">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">{capacity} Guests</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 group/item">
            <Bed className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">
              {beds} {beds === 1 ? "Bed" : "Beds"}
            </span>
          </div>
        </div>

        {/* Amenities - Compact */}
        {amenities && amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {amenities.slice(0, 3).map((amenity) => {
              const { icon: Icon, color, bgColor } = getAmenityConfig(amenity);
              return (
                <span
                  key={amenity}
                  className={`text-[10px] px-2 py-1 rounded-md ${bgColor} border flex items-center gap-1 font-medium transition-all duration-200 hover:scale-105`}
                >
                  <Icon className={`h-3 w-3 ${color}`} />
                  <span className="text-gray-200">{amenity}</span>
                </span>
              );
            })}
            {amenities.length > 3 && (
              <span className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-gray-300 font-medium flex items-center">
                +{amenities.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>

      {/* Action Button - Compact */}
      <CardFooter className="p-4 pt-0 relative z-10 shrink-0">
        <Button
          onClick={handleBookingClick}
          className="w-full main-button-gradient rounded-lg text-sm py-2.5"
          disabled={userRole === "admin"}
        >
          {getActionButtonLabel()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;

