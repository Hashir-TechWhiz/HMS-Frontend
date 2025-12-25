import Image from "next/image";
import { FC } from "react";

const HomeHeroSection: FC = () => {
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

            <div className="relative z-10 text-center text-white px-4">
                <h1 className="text-4xl font-bold">
                    Smart Hotel Management System
                </h1>
            </div>
        </section>
    );
};

export default HomeHeroSection;
