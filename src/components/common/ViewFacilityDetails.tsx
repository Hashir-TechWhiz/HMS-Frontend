"use client";

import { formatDateTime } from "@/lib/utils";
import ThumbSlider from "../sliders/ThumbSlider";

interface FacilityDetailsProps {
    facility: IPublicFacility | null;
    userRole?: "public" | "guest" | "receptionist" | "admin";
}

const FacilityDetails = ({ facility, userRole = "public" }: FacilityDetailsProps) => {
    if (!facility) return null;

    return (
        <div className="flex flex-col space-y-4 w-full min-w-0 pb-5">

            {/* Top section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full lg:h-64">

                {/* Image slider */}
                <div className="lg:col-span-7">
                    <ThumbSlider images={facility.images} name={facility.name} />
                </div>

                {/* Facility details */}
                <div className="lg:col-span-5 h-full flex flex-col justify-between text-sm border-gradient-2 rounded-lg px-3 pt-3">

                    {/* Header */}
                    <div className="pb-2 border-b border-gray-500">
                        <p className="text-base font-semibold">
                            {facility.name}
                        </p>
                        <p className="text-gray-400">
                            {facility.facilityType}
                        </p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col my-2 gap-1 justify-evenly">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-gray-400">Status</span>
                            <StatusBadge status={facility.status} />
                        </div>

                        <Field label="Capacity" value={`${facility.capacity} people`} />
                        
                        {facility.pricePerHour && (
                            <Field
                                label="Price / Hour"
                                value={`LKR ${facility.pricePerHour.toLocaleString()}`}
                                accent
                            />
                        )}
                        
                        {facility.pricePerDay && (
                            <Field
                                label="Price / Day"
                                value={`LKR ${facility.pricePerDay.toLocaleString()}`}
                                accent
                            />
                        )}

                        {facility.operatingHours && (
                            <Field 
                                label="Operating Hours" 
                                value={`${facility.operatingHours.open} - ${facility.operatingHours.close}`} 
                            />
                        )}

                        {userRole === "admin" && (
                            <>
                                <Field label="Created At" value={formatDateTime(facility.createdAt)} />
                                <Field label="Updated At" value={formatDateTime(facility.updatedAt)} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Amenities */}
            {facility.amenities && facility.amenities.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="font-semibold">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                        {facility.amenities.map((amenity) => (
                            <span
                                key={amenity}
                                className="px-3 py-1 rounded-md text-xs font-medium bg-primary-500/20 text-primary-300 border border-primary-500/50"
                            >
                                {amenity}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Description */}
            {facility.description && (
                <div className="flex flex-col gap-2">
                    <p className="font-semibold">Description</p>
                    <p className="text-sm text-justify text-gray-300">
                        {facility.description}
                    </p>
                </div>
            )}
        </div>
    );
};

export default FacilityDetails;

function Field({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string | number;
    accent?: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-gray-400">{label}</span>
            <span className={accent ? "text-emerald-300 font-semibold" : "text-white"}>
                {value}
            </span>
        </div>
    );
};


// Status badge
const StatusBadge = ({ status }: { status: FacilityStatus }) => {
    const colors = {
        available: "bg-green-500/20 text-green-400 border-green-500/50",
        unavailable: "bg-red-500/20 text-red-400 border-red-500/50",
        maintenance: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    };

    return (
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
};
