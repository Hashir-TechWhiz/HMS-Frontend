"use client";

import Image from "next/image";
import { FC } from "react";
import { useRouter } from "next/navigation";
import RoomSearchForm from "@/components/common/RoomSearchForm";

const HomeHeroSection: FC = () => {
    const router = useRouter();

    const handleSearch = (data: {
        checkIn?: Date;
        checkOut?: Date;
        guests?: number;
    }) => {
        // Build query parameters from search data
        const params = new URLSearchParams();

        if (data.checkIn) {
            params.set("checkIn", data.checkIn.toISOString());
        }

        if (data.checkOut) {
            params.set("checkOut", data.checkOut.toISOString());
        }

        if (data.guests) {
            params.set("guests", data.guests.toString());
        }

        // Navigate to rooms page with query parameters
        router.push(`/rooms?${params.toString()}`);
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center">
            <Image
                src="/images/SampleHotel.jpg"
                alt="Hotel background"
                fill
                priority
                className="object-cover"
            />

            <div className="absolute inset-0 bg-black/60" />

            <div className="relative z-10 text-center text-white px-4 w-full max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-lg md:text-xl text-gray-200">
                        Discover luxury accommodations for your next getaway
                    </p>
                </div>

                <div className="flex justify-center">
                    <RoomSearchForm variant="hero" onSearch={handleSearch} />
                </div>
            </div>
        </section>
    );
};

export default HomeHeroSection;
