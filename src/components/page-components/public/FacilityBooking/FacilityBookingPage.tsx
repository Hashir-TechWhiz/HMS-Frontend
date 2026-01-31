"use client";

import { FC, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Loader2, AlertCircle, Sparkles, DollarSign, ArrowLeft } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { getFacilityById } from "@/services/publicFacilityService";
import { createFacilityBooking } from "@/services/publicFacilityBookingService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";

interface FacilityBookingFormData {
    bookingType: FacilityBookingType;
    bookingDate?: Date;
    startTime?: string;
    endTime?: string;
    startDate?: Date;
    endDate?: Date;
    customerName: string;
    customerEmail?: string;
    customerPhone: string;
}

const FacilityBookingPage: FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, role } = useAuth();
    const facilityId = searchParams.get("facilityId");

    const [facility, setFacility] = useState<IPublicFacility | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Check if user is receptionist or admin
    const isReceptionistOrAdmin = role === "receptionist" || role === "admin";

    const {
        handleSubmit,
        setValue,
        watch,
        register,
        control,
        setError: setFormError,
        formState: { errors },
    } = useForm<FacilityBookingFormData>({
        mode: "onBlur",
        defaultValues: {
            bookingType: "daily",
            bookingDate: undefined,
            startTime: "",
            endTime: "",
            startDate: undefined,
            endDate: undefined,
            customerName: "",
            customerEmail: "",
            customerPhone: "",
        },
    });

    const bookingType = watch("bookingType");
    const bookingDate = watch("bookingDate");
    const startTime = watch("startTime");
    const endTime = watch("endTime");
    const startDate = watch("startDate");
    const endDate = watch("endDate");

    // Fetch facility details
    useEffect(() => {
        const fetchFacility = async () => {
            if (!facilityId) {
                setError("Facility ID is required");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await getFacilityById(facilityId);

                if (response.success && response.data) {
                    setFacility(response.data);
                } else {
                    setError(response.message || "Failed to load facility details");
                }
            } catch (err) {
                console.error("Error fetching facility:", err);
                setError("An unexpected error occurred while loading facility details");
            } finally {
                setLoading(false);
            }
        };

        if (facilityId) {
            fetchFacility();
        }
    }, [facilityId]);

    // Calculate total price
    const calculateTotalPrice = (): number => {
        if (!facility) return 0;

        if (bookingType === "hourly") {
            if (!startTime || !endTime || !facility.pricePerHour) return 0;
            const [startHour] = startTime.split(":").map(Number);
            const [endHour] = endTime.split(":").map(Number);
            const hours = endHour - startHour;
            return hours > 0 ? hours * facility.pricePerHour : 0;
        } else {
            if (!startDate || !endDate || !facility.pricePerDay) return 0;
            const days = differenceInDays(endDate, startDate);
            return days > 0 ? days * facility.pricePerDay : 0;
        }
    };

    const onSubmit = async (data: FacilityBookingFormData) => {
        if (!facilityId || !facility) {
            toast.error("Facility information is missing");
            return;
        }

        // Validate based on booking type
        if (data.bookingType === "hourly") {
            if (!data.bookingDate) {
                setFormError("bookingDate", {
                    type: "manual",
                    message: "Booking date is required",
                });
                return;
            }
            if (!data.startTime || !data.endTime) {
                if (!data.startTime) {
                    setFormError("startTime", {
                        type: "manual",
                        message: "Start time is required",
                    });
                }
                if (!data.endTime) {
                    setFormError("endTime", {
                        type: "manual",
                        message: "End time is required",
                    });
                }
                return;
            }

            // Validate time range
            const [startHour] = data.startTime.split(":").map(Number);
            const [endHour] = data.endTime.split(":").map(Number);
            if (endHour <= startHour) {
                setFormError("endTime", {
                    type: "manual",
                    message: "End time must be after start time",
                });
                return;
            }
        } else {
            if (!data.startDate || !data.endDate) {
                if (!data.startDate) {
                    setFormError("startDate", {
                        type: "manual",
                        message: "Start date is required",
                    });
                }
                if (!data.endDate) {
                    setFormError("endDate", {
                        type: "manual",
                        message: "End date is required",
                    });
                }
                return;
            }

            // Validate date range
            if (data.endDate <= data.startDate) {
                setFormError("endDate", {
                    type: "manual",
                    message: "End date must be after start date",
                });
                return;
            }
        }

        // Validate customer details (required for non-authenticated users or walk-in bookings)
        if (!isAuthenticated || isReceptionistOrAdmin) {
            if (!data.customerName || !data.customerPhone) {
                if (!data.customerName) {
                    setFormError("customerName", {
                        type: "manual",
                        message: "Customer name is required",
                    });
                }
                if (!data.customerPhone) {
                    setFormError("customerPhone", {
                        type: "manual",
                        message: "Customer phone is required",
                    });
                }
                return;
            }
        }

        setSubmitting(true);

        try {
            const bookingData: any = {
                facilityId: facilityId,
                bookingType: data.bookingType,
            };

            // Add customer details if provided or required
            if (!isAuthenticated || isReceptionistOrAdmin) {
                bookingData.customerDetails = {
                    name: data.customerName,
                    phone: data.customerPhone,
                    email: data.customerEmail || undefined,
                };
            }

            // Add booking-specific data
            if (data.bookingType === "hourly") {
                bookingData.bookingDate = data.bookingDate?.toISOString();
                bookingData.startTime = data.startTime;
                bookingData.endTime = data.endTime;
            } else {
                bookingData.startDate = data.startDate?.toISOString();
                bookingData.endDate = data.endDate?.toISOString();
            }

            const response = await createFacilityBooking(bookingData);

            if (response.success) {
                toast.success("Facility booking request submitted successfully!");

                // Redirect based on authentication
                if (isAuthenticated) {
                    router.push("/dashboard/facility-bookings");
                } else {
                    router.push("/facilities");
                }
            } else {
                toast.error(response.message || "Failed to submit booking request");
            }
        } catch (err) {
            console.error("Error submitting booking:", err);
            toast.error("An unexpected error occurred while submitting your request");
        } finally {
            setSubmitting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading facility details...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !facility) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 max-w-md text-center">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <h2 className="text-xl font-semibold">{error || "Facility not found"}</h2>
                    <Button onClick={() => router.push("/facilities")} variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Facilities
                    </Button>
                </div>
            </div>
        );
    }

    const totalPrice = calculateTotalPrice();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="relative py-8 pt-24">
                <Image
                    src="/images/LuxuryRoom.jpg"
                    alt="Facility booking"
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative container mx-auto px-4">
                    <Button
                        onClick={() => router.push("/facilities")}
                        variant="outline"
                        className="mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Facilities
                    </Button>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">
                        Book {facility.name}
                    </h1>
                    <p className="text-gray-200">Submit your booking request</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative min-h-screen">
                <Image
                    src="/images/LuxuryRoomBg.jpg"
                    alt="Background"
                    fill
                    className="object-cover"
                    priority={false}
                />
                <div className="absolute inset-0 bg-black/40" />

                <div className="relative container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Facility Summary */}
                            <div className="lg:col-span-1">
                                <Card className="border-2 border-primary-900/40 bg-primary-500/10 backdrop-blur-sm overflow-hidden">
                                    <div className="relative h-48">
                                        <Image
                                            src={facility.images[0]}
                                            alt={facility.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <CardContent className="p-4 space-y-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{facility.name}</h3>
                                            <p className="text-sm text-gray-400">{facility.facilityType}</p>
                                        </div>

                                        {facility.description && (
                                            <p className="text-sm text-gray-300">{facility.description}</p>
                                        )}

                                        <div className="space-y-2 pt-2 border-t border-white/10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">Capacity</span>
                                                <span className="text-white font-medium">{facility.capacity} people</span>
                                            </div>
                                            {facility.pricePerHour && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Price / Hour</span>
                                                    <span className="text-emerald-400 font-semibold">LKR {facility.pricePerHour.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {facility.pricePerDay && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-400">Price / Day</span>
                                                    <span className="text-emerald-400 font-semibold">LKR {facility.pricePerDay.toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        {totalPrice > 0 && (
                                            <div className="pt-3 border-t border-white/10">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-gray-400">Estimated Total</span>
                                                    <span className="text-xl font-bold text-emerald-400">
                                                        <DollarSign className="inline h-5 w-5" />
                                                        LKR {totalPrice.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Booking Form */}
                            <div className="lg:col-span-2">
                                <Card className="border-2 border-primary-900/40 bg-primary-500/10 backdrop-blur-sm">
                                    <CardContent className="p-6">
                                        <h2 className="text-xl font-bold mb-6">Booking Details</h2>

                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                            {/* Booking Type */}
                                            <div>
                                                <Label className="text-white mb-2 block">Booking Type *</Label>
                                                <SelectField
                                                    name="bookingType"
                                                    control={control}
                                                    options={[
                                                        { value: "hourly", label: "Hourly Booking" },
                                                        { value: "daily", label: "Daily Booking" },
                                                    ]}
                                                    error={errors.bookingType}
                                                />
                                            </div>

                                            {/* Hourly Booking Fields */}
                                            {bookingType === "hourly" && (
                                                <>
                                                    <div>
                                                        <Label className="text-white mb-2 block">Booking Date *</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full justify-start text-left font-normal h-12 bg-white/5 border-white/20 hover:bg-white/10"
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {bookingDate ? format(bookingDate, "PPP") : "Select date"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={bookingDate}
                                                                    onSelect={(date) => setValue("bookingDate", date)}
                                                                    disabled={(date) => date < new Date()}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        {errors.bookingDate && (
                                                            <p className="text-sm text-error-500 mt-1">{errors.bookingDate.message}</p>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label className="text-white mb-2 block">Start Time *</Label>
                                                            <input
                                                                type="time"
                                                                {...register("startTime")}
                                                                className="w-full h-12 px-4 rounded-md bg-white/5 border border-white/20 text-white"
                                                            />
                                                            {errors.startTime && (
                                                                <p className="text-sm text-error-500 mt-1">{errors.startTime.message}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <Label className="text-white mb-2 block">End Time *</Label>
                                                            <input
                                                                type="time"
                                                                {...register("endTime")}
                                                                className="w-full h-12 px-4 rounded-md bg-white/5 border border-white/20 text-white"
                                                            />
                                                            {errors.endTime && (
                                                                <p className="text-sm text-error-500 mt-1">{errors.endTime.message}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Daily Booking Fields */}
                                            {bookingType === "daily" && (
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label className="text-white mb-2 block">Start Date *</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full justify-start text-left font-normal h-12 bg-white/5 border-white/20 hover:bg-white/10"
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {startDate ? format(startDate, "PPP") : "Select date"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={startDate}
                                                                    onSelect={(date) => setValue("startDate", date)}
                                                                    disabled={(date) => date < new Date()}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        {errors.startDate && (
                                                            <p className="text-sm text-error-500 mt-1">{errors.startDate.message}</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <Label className="text-white mb-2 block">End Date *</Label>
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    className="w-full justify-start text-left font-normal h-12 bg-white/5 border-white/20 hover:bg-white/10"
                                                                >
                                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                                    {endDate ? format(endDate, "PPP") : "Select date"}
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto p-0">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={endDate}
                                                                    onSelect={(date) => setValue("endDate", date)}
                                                                    disabled={(date) => date < new Date() || (startDate ? date <= startDate : false)}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        {errors.endDate && (
                                                            <p className="text-sm text-error-500 mt-1">{errors.endDate.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Customer Details (for non-authenticated or walk-in) */}
                                            {(!isAuthenticated || isReceptionistOrAdmin) && (
                                                <>
                                                    <div className="border-t border-white/10 pt-6">
                                                        <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
                                                    </div>

                                                    <InputField
                                                        name="customerName"
                                                        label="Full Name *"
                                                        placeholder="Enter customer name"
                                                        register={register}
                                                        error={errors.customerName}
                                                        validation={{ required: "Name is required" }}
                                                    />

                                                    <InputField
                                                        name="customerPhone"
                                                        label="Phone Number *"
                                                        placeholder="Enter phone number"
                                                        register={register}
                                                        error={errors.customerPhone}
                                                        validation={{ required: "Phone number is required" }}
                                                    />

                                                    <InputField
                                                        name="customerEmail"
                                                        label="Email (Optional)"
                                                        placeholder="Enter email address"
                                                        type="email"
                                                        register={register}
                                                        error={errors.customerEmail}
                                                    />
                                                </>
                                            )}

                                            {/* Submit Button */}
                                            <div className="pt-4">
                                                <Button
                                                    type="submit"
                                                    disabled={submitting}
                                                    className="w-full main-button-gradient"
                                                >
                                                    {submitting ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Submitting Request...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            Submit Booking Request
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacilityBookingPage;
