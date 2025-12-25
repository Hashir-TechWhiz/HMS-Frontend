"use client";

import { FC } from "react";
import RoomCard, { RoomCardProps, UserRole } from "@/components/common/RoomCard";

interface RoomsListProps {
  userRole?: UserRole;
  onRoomSelect?: (roomId: string) => void;
}

// Mock room data - will be replaced with API data later
const mockRooms: Omit<RoomCardProps, "userRole" | "onAction">[] = [
  {
    id: "1",
    name: "Deluxe Ocean View Suite",
    image: "/images/SampleHotel.jpg",
    description: "Experience luxury with breathtaking ocean views and premium amenities.",
    features: ["Free WiFi", "Ocean View", "King Bed", "Mini Bar", "Air Conditioning", "Smart TV"],
    capacity: 2,
    beds: 1,
    pricePerNight: 299,
  },
  {
    id: "2",
    name: "Standard Double Room",
    image: "/images/SampleHotel.jpg",
    description: "Comfortable and affordable accommodation perfect for couples or solo travelers.",
    features: ["Free WiFi", "Twin Beds", "Air Conditioning", "Flat Screen TV"],
    capacity: 2,
    beds: 2,
    pricePerNight: 149,
  },
  {
    id: "3",
    name: "Family Suite",
    image: "/images/SampleHotel.jpg",
    description: "Spacious suite ideal for families with children, featuring separate living area.",
    features: ["Free WiFi", "2 Bedrooms", "Kitchen", "Living Room", "Air Conditioning", "Smart TV"],
    capacity: 5,
    beds: 3,
    pricePerNight: 399,
  },
  {
    id: "4",
    name: "Executive Business Suite",
    image: "/images/SampleHotel.jpg",
    description: "Perfect for business travelers with work desk and high-speed internet.",
    features: ["Free WiFi", "Work Desk", "Coffee Maker", "Air Conditioning", "Smart TV", "Mini Bar"],
    capacity: 2,
    beds: 1,
    pricePerNight: 249,
  },
  {
    id: "5",
    name: "Luxury Penthouse",
    image: "/images/SampleHotel.jpg",
    description: "Ultimate luxury experience with panoramic city views and premium services.",
    features: ["Free WiFi", "Panoramic View", "Jacuzzi", "King Bed", "Kitchen", "Smart TV", "Balcony"],
    capacity: 4,
    beds: 2,
    pricePerNight: 599,
  },
  {
    id: "6",
    name: "Budget Single Room",
    image: "/images/SampleHotel.jpg",
    description: "Cozy and economical room perfect for solo travelers on a budget.",
    features: ["Free WiFi", "Single Bed", "Air Conditioning", "TV"],
    capacity: 1,
    beds: 1,
    pricePerNight: 89,
  },
  {
    id: "7",
    name: "Garden View Room",
    image: "/images/SampleHotel.jpg",
    description: "Peaceful room overlooking beautiful gardens with modern amenities.",
    features: ["Free WiFi", "Garden View", "Queen Bed", "Air Conditioning", "Smart TV", "Coffee Maker"],
    capacity: 2,
    beds: 1,
    pricePerNight: 179,
  },
  {
    id: "8",
    name: "Presidential Suite",
    image: "/images/SampleHotel.jpg",
    description: "The epitome of luxury with exclusive amenities and personalized service.",
    features: ["Free WiFi", "City View", "Jacuzzi", "King Bed", "Kitchen", "Smart TV", "Butler Service", "Balcony"],
    capacity: 4,
    beds: 2,
    pricePerNight: 899,
  },
];

const RoomsList: FC<RoomsListProps> = ({ userRole = "public", onRoomSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockRooms.map((room) => (
        <RoomCard
          key={room.id}
          {...room}
          userRole={userRole}
          onAction={onRoomSelect}
        />
      ))}
    </div>
  );
};

export default RoomsList;

