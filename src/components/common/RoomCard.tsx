"use client";

import { FC } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bed } from "lucide-react";
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
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-card border-border p-0">
      {/* Room Image */}
      <div className="relative h-50 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
            LKR {pricePerNight.toLocaleString()} / night
          </Badge>
        </div>
      </div>

      {/* Room Details */}
      <CardContent className="p-5">
        <h3 className="text-xl font-semibold text-foreground mb-2">{name}</h3>

        {description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {description}
          </p>
        )}

        {/* Capacity and Beds */}
        <div className="flex items-center gap-4 mb-4 text-sm text-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            <span>{capacity} Guests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bed className="h-4 w-4 text-primary" />
            <span>{beds} {beds === 1 ? "Bed" : "Beds"}</span>
          </div>
        </div>

      </CardContent>

      {/* Action Button */}
      <CardFooter className="p-5 pt-0">
        <Button
          onClick={handleBookingClick}
          className="w-full main-button-gradient"
          disabled={userRole === "admin"}
        >
          {getActionButtonLabel()}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RoomCard;

