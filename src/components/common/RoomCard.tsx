"use client";

import { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export type UserRole = "public" | "guest" | "receptionist" | "admin";

export interface RoomCardProps {
  id: string;
  name: string;
  image: string;
  description?: string;
  features: string[];
  capacity: number;
  beds: number;
  pricePerNight: number;
  userRole?: UserRole;
  onAction?: (roomId: string) => void;
}

const RoomCard: FC<RoomCardProps> = ({
  id,
  name,
  image,
  description,
  capacity,
  beds,
  pricePerNight,
  userRole = "public",
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

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

  const handleBookingClick = () => {
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

  return (
    <Card className="overflow-hidden transition-all duration-500 group p-0 bg-primary-500/10 border border-white/20 relative h-full flex flex-col">
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

        {description && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-1 leading-relaxed">
            {description}
          </p>
        )}

        {/* Capacity and Beds - Compact */}
        <div className="flex items-center gap-3">
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

