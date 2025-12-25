"use client";

import { FC } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Bed, Wifi, Coffee, Tv, Wind } from "lucide-react";

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
    features,
    capacity,
    beds,
    pricePerNight,
    userRole = "public",
    onAction,
}) => {
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

    const getFeatureIcon = (feature: string) => {
        const lowerFeature = feature.toLowerCase();
        if (lowerFeature.includes("wifi") || lowerFeature.includes("internet")) {
            return <Wifi className="h-4 w-4" />;
        }
        if (lowerFeature.includes("coffee") || lowerFeature.includes("breakfast")) {
            return <Coffee className="h-4 w-4" />;
        }
        if (lowerFeature.includes("tv") || lowerFeature.includes("television")) {
            return <Tv className="h-4 w-4" />;
        }
        if (lowerFeature.includes("ac") || lowerFeature.includes("air")) {
            return <Wind className="h-4 w-4" />;
        }
        return null;
    };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-card border-border">
      {/* Room Image */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-4 right-4">
          <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
            ${pricePerNight}/night
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

        {/* Features */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-foreground uppercase tracking-wide">
            Features
          </p>
          <div className="flex flex-wrap gap-2">
            {features.slice(0, 4).map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-1.5 text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground"
              >
                {getFeatureIcon(feature)}
                <span>{feature}</span>
              </div>
            ))}
            {features.length > 4 && (
              <div className="text-xs bg-muted px-3 py-1.5 rounded-full text-muted-foreground">
                +{features.length - 4} more
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Action Button */}
      <CardFooter className="p-5 pt-0">
        <Button
          onClick={() => onAction?.(id)}
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

