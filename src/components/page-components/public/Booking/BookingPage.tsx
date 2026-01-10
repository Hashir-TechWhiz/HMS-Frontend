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
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2, AlertCircle, Sparkles, CalendarDays, Clock, DollarSign, ArrowLeft } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { getRoomById } from "@/services/roomService";
import { createBooking, CreateBookingData, checkAvailability } from "@/services/bookingService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import InputField from "@/components/forms/InputField";
import PaymentDialog from "@/components/page-components/dashboard/PaymentDialog";
import WalkInPaymentDialog from "@/components/page-components/dashboard/WalkInPaymentDialog";

interface BookingFormData {
    checkInDate: Date;
    checkOutDate: Date;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
}

const BookingPage: FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading: authLoading, role } = useAuth();
    const roomId = searchParams.get("roomId");

    const [room, setRoom] = useState<IRoom | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [showWalkInPaymentDialog, setShowWalkInPaymentDialog] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState<BookingFormData | null>(null);

    // Check if user is receptionist or admin (can book for walk-in customers)
    const isReceptionistOrAdmin = role === "receptionist" || role === "admin";

    const {
        handleSubmit,
        setValue,
        watch,
        register,
        setError: setFormError,
        formState: { errors },
    } = useForm<BookingFormData>({
        mode: "onBlur",
        defaultValues: {
            checkInDate: undefined,
            checkOutDate: undefined,
            customerName: undefined,
            customerEmail: undefined,
            customerPhone: undefined,
        },
    });

    const checkInDate = watch("checkInDate");
    const checkOutDate = watch("checkOutDate");

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push(`/login?roomId=${roomId}`);
        }
    }, [isAuthenticated, authLoading, router, roomId]);

    // Fetch room details
    useEffect(() => {
        const fetchRoom = async () => {
            if (!roomId) {
                setError("Room ID is required");
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await getRoomById(roomId);

                if (response.success && response.data) {
                    setRoom(response.data);
                } else {
                    setError(response.message || "Failed to load room details");
                }
            } catch (err) {
                console.error("Error fetching room:", err);
                setError("An unexpected error occurred while loading room details");
            } finally {
                setLoading(false);
            }
        };

        if (roomId && isAuthenticated) {
            fetchRoom();
        }
    }, [roomId, isAuthenticated]);

    // Calculate total price
    const calculateTotalPrice = (): number => {
        if (!checkInDate || !checkOutDate || !room) return 0;
        const nights = differenceInDays(checkOutDate, checkInDate);
        return nights * room.pricePerNight;
    };

    const onSubmit = async (data: BookingFormData) => {
        if (!roomId || !room) {
            toast.error("Room information is missing");
            return;
        }

        if (!data.checkInDate || !data.checkOutDate) {
            if (!data.checkInDate) {
                setFormError("checkInDate", {
                    type: "manual",
                    message: "Check-in date is required",
                });
            }
            if (!data.checkOutDate) {
                setFormError("checkOutDate", {
                    type: "manual",
                    message: "Check-out date is required",
                });
            }
            return;
        }

        // Validate walk-in customer fields for receptionist/admin
        if (isReceptionistOrAdmin) {
            // Name and phone are required, email is optional
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
                        message: "Customer phone number is required",
                    });
                }
                return;
            }

            // Validate email format if provided
            if (data.customerEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.customerEmail)) {
                    setFormError("customerEmail", {
                        type: "manual",
                        message: "Invalid email address",
                    });
                    return;
                }
            }
        }

        // Validate dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const checkIn = new Date(data.checkInDate);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(data.checkOutDate);
        checkOut.setHours(0, 0, 0, 0);

        if (checkIn < today) {
            setFormError("checkInDate", {
                type: "manual",
                message: "Check-in date cannot be in the past",
            });
            return;
        }

        if (checkOut <= checkIn) {
            setFormError("checkOutDate", {
                type: "manual",
                message: "Check-out date must be after check-in date",
            });
            return;
        }

        // Check availability BEFORE showing payment dialog
        // Booking will be created AFTER payment succeeds
        setSubmitting(true);

        try {
            // Check if room is available for selected dates
            const availabilityResponse = await checkAvailability(
                roomId!,
                checkIn.toISOString(),
                checkOut.toISOString()
            );

            if (!availabilityResponse.success) {
                // Availability check failed (validation error)
                toast.error(availabilityResponse.message || "Failed to check availability");
                setSubmitting(false);
                return;
            }

            if (!availabilityResponse.data?.available) {
                // Room is not available for selected dates
                toast.error("Room is not available for the selected dates. Please choose different dates.");
                setSubmitting(false);
                return;
            }

            // Room is available - store the form data for later booking creation
            setPendingBookingData(data);

            // Open appropriate payment dialog based on user role
            // Note: Booking is NOT created yet - it will be created after successful payment
            if (!isReceptionistOrAdmin) {
                setShowPaymentDialog(true);
            } else {
                setShowWalkInPaymentDialog(true);
            }
        } catch (err) {
            console.error("Error checking availability:", err);
            toast.error("An unexpected error occurred while checking availability. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setShowPaymentDialog(false);

        // Payment successful - NOW create the booking
        if (!pendingBookingData || !roomId) {
            toast.error("Booking data not found");
            return;
        }

        try {
            setSubmitting(true);

            // Prepare booking data
            const bookingData: CreateBookingData = {
                roomId,
                checkInDate: new Date(pendingBookingData.checkInDate).toISOString(),
                checkOutDate: new Date(pendingBookingData.checkOutDate).toISOString(),
            };

            // Create the booking (payment already processed)
            const response = await createBooking(bookingData);

            if (response.success && response.data) {
                // Booking created successfully after payment
                const successMessage = "Booking request submitted successfully! Awaiting confirmation.";
                toast.success(successMessage);

                // Clear temporary data
                setPendingBookingData(null);

                router.push("/dashboard");
            } else {
                // Booking creation failed (e.g., room unavailable due to race condition)
                toast.error(response.message || "Failed to create booking. Please contact support as payment was processed.");
                // Note: In production, this would require refund handling
            }
        } catch (err) {
            console.error("Error creating booking after payment:", err);
            toast.error("Failed to create booking. Please contact support as payment was processed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentCancel = () => {
        setShowPaymentDialog(false);

        // Clear temporary booking data
        // Note: No booking was created yet, so nothing to cancel in the database
        setPendingBookingData(null);

        toast.info("Payment cancelled. No booking was created.");
    };

    const handleWalkInPaymentSuccess = async (paymentMethod: "card" | "cash") => {
        setShowWalkInPaymentDialog(false);

        // Payment successful - NOW create the walk-in booking
        if (!pendingBookingData || !roomId) {
            toast.error("Booking data not found");
            return;
        }

        try {
            setSubmitting(true);

            // Prepare booking data for walk-in
            const bookingData: CreateBookingData = {
                roomId,
                checkInDate: new Date(pendingBookingData.checkInDate).toISOString(),
                checkOutDate: new Date(pendingBookingData.checkOutDate).toISOString(),
                customerDetails: {
                    name: pendingBookingData.customerName!,
                    phone: pendingBookingData.customerPhone!,
                    ...(pendingBookingData.customerEmail && { email: pendingBookingData.customerEmail }),
                },
            };

            // Create the walk-in booking (payment already processed)
            const response = await createBooking(bookingData);

            if (response.success && response.data) {
                // Walk-in booking created successfully after payment
                const customerName = pendingBookingData.customerName;
                const successMessage = customerName
                    ? `Walk-in booking created successfully for ${customerName}!`
                    : "Walk-in booking created successfully!";

                toast.success(`${paymentMethod === "card" ? "Card" : "Cash"} payment confirmed. ${successMessage}`);

                // Clear temporary data
                setPendingBookingData(null);

                router.push("/dashboard");
            } else {
                // Booking creation failed
                toast.error(response.message || "Failed to create walk-in booking. Please contact support as payment was processed.");
            }
        } catch (err) {
            console.error("Error creating walk-in booking after payment:", err);
            toast.error("Failed to create booking. Please contact support as payment was processed.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWalkInPaymentCancel = () => {
        setShowWalkInPaymentDialog(false);

        // Clear temporary booking data
        // Note: No booking was created yet, so nothing to cancel in the database
        setPendingBookingData(null);

        toast.info("Payment cancelled. No booking was created.");
    };

    // Loading state
    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Error state
    if (error || !roomId) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                {error || "Room ID is required"}
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                {error
                                    ? "We couldn't load the room details. Please try again."
                                    : "Please select a room to book."}
                            </p>
                            <Button onClick={() => router.push("/rooms")} variant="outline">
                                Browse Rooms
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Room not found
    if (!room) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <Card className="max-w-md w-full">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <h3 className="text-xl font-semibold text-foreground mb-2">
                                Room Not Found
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                The room you&apos;re looking for doesn&apos;t exist or is no longer available.
                            </p>
                            <Button onClick={() => router.push("/rooms")} variant="outline">
                                Browse Rooms
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalPrice = calculateTotalPrice();
    const nights = checkInDate && checkOutDate ? differenceInDays(checkOutDate, checkInDate) : 0;

    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <div className="relative text-white py-12 pt-38">
                <Image
                    src={room.images && room.images.length > 0 ? room.images[0] : "/images/SampleHotel.jpg"}
                    alt={room.roomType}
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative container mx-auto px-4">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            Complete Your Booking
                        </h1>
                        <p className="text-gray-100 text-lg">
                            {room.roomType} Room {room.roomNumber}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative">
                {/* Background Image */}
                <Image
                    src="/images/LuxuryBg.jpg"
                    alt="Luxury background"
                    fill
                    className="object-cover"
                    priority={false}
                />

                {/* Dark overlay for better readability */}
                <div className="absolute inset-0 bg-black/40" />

                {/* Content */}
                <div className="relative container mx-auto px-4 py-8">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Booking Form */}
                            <div className="lg:col-span-2">
                                <Card className="overflow-hidden transition-all duration-500 group p-0 table-bg-gradient border border-white/20 relative">
                                    {/* Glow effect on hover */}
                                    <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 group-hover:to-primary/5 transition-all duration-500 pointer-events-none rounded-lg" />
                                    <CardContent className="p-6 relative z-10">
                                        <div className="flex items-center gap-4 mb-6">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => router.back()}
                                                className="hover:bg-white/10 border border-white/20 hover:border-primary/30 transition-all duration-300"
                                            >
                                                <ArrowLeft className="h-4 w-4 mr-2" />
                                                Back
                                            </Button>
                                        </div>
                                        <h2 className="text-2xl font-semibold text-foreground mb-6 group-hover:text-primary transition-colors duration-300">
                                            Booking Details
                                        </h2>

                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                            {isReceptionistOrAdmin && (
                                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-4">
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-foreground mb-2">
                                                            Walk-In Customer Details
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Enter customer information for this walk-in booking. No user account will be created.
                                                        </p>
                                                    </div>
                                                    <InputField
                                                        name="customerName"
                                                        label="Full Name *"
                                                        placeholder="Enter customer full name"
                                                        register={register}
                                                        error={errors.customerName}
                                                        validation={{
                                                            required: "Full name is required",
                                                            minLength: {
                                                                value: 2,
                                                                message: "Name must be at least 2 characters",
                                                            },
                                                        }}
                                                    />
                                                    <InputField
                                                        name="customerPhone"
                                                        label="Phone Number *"
                                                        placeholder="Enter customer phone number"
                                                        type="tel"
                                                        register={register}
                                                        error={errors.customerPhone}
                                                        validation={{
                                                            required: "Phone number is required",
                                                            minLength: {
                                                                value: 10,
                                                                message: "Phone number must be at least 10 digits",
                                                            },
                                                        }}
                                                    />
                                                    <InputField
                                                        name="customerEmail"
                                                        label="Email Address (Optional)"
                                                        placeholder="Enter customer email"
                                                        type="email"
                                                        register={register}
                                                        error={errors.customerEmail}
                                                        validation={{
                                                            pattern: {
                                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                                message: "Invalid email address",
                                                            },
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {/* Check-in Date */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">
                                                    Check-in Date *
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-start text-left font-normal ${errors.checkInDate ? "border-destructive" : ""
                                                                }`}
                                                            type="button"
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            {checkInDate ? (
                                                                format(checkInDate, "MMM dd, yyyy")
                                                            ) : (
                                                                <span className="text-muted-foreground">Select check-in date</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={checkInDate}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    setValue("checkInDate", date, { shouldValidate: true });
                                                                    // Reset check-out if it's before new check-in
                                                                    if (checkOutDate && checkOutDate <= date) {
                                                                        setValue("checkOutDate", undefined as any, { shouldValidate: true });
                                                                    }
                                                                }
                                                            }}
                                                            disabled={(date) => date < new Date()}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.checkInDate && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.checkInDate.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Check-out Date */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-foreground">
                                                    Check-out Date *
                                                </Label>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={`w-full justify-start text-left font-normal ${errors.checkOutDate ? "border-destructive" : ""
                                                                }`}
                                                            type="button"
                                                            disabled={!checkInDate}
                                                        >
                                                            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            {checkOutDate ? (
                                                                format(checkOutDate, "MMM dd, yyyy")
                                                            ) : (
                                                                <span className="text-muted-foreground">Select check-out date</span>
                                                            )}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={checkOutDate}
                                                            onSelect={(date) => {
                                                                if (date) {
                                                                    setValue("checkOutDate", date, { shouldValidate: true });
                                                                }
                                                            }}
                                                            disabled={(date) =>
                                                                !checkInDate || date <= checkInDate
                                                            }
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                {errors.checkOutDate && (
                                                    <p className="text-sm text-destructive">
                                                        {errors.checkOutDate.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                disabled={
                                                    submitting ||
                                                    !checkInDate ||
                                                    !checkOutDate ||
                                                    (isReceptionistOrAdmin && (!watch("customerName") || !watch("customerPhone")))
                                                }
                                                className="w-full main-button-gradient"
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : isReceptionistOrAdmin ? (
                                                    "Create Booking for Walk-In Customer"
                                                ) : (
                                                    "Confirm Booking"
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Room Summary */}
                            <div className="lg:col-span-1">
                                <Card className="sticky top-24 overflow-hidden transition-all duration-500 group p-0 table-bg-gradient border border-white/20 flex flex-col h-fit">
                                    {/* Glow effect on hover */}
                                    <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:via-primary/0 group-hover:to-primary/5 transition-all duration-500 pointer-events-none rounded-lg" />

                                    {/* Room Image - Enhanced */}
                                    <div className="relative h-48 w-full shrink-0 overflow-hidden">
                                        <Image
                                            src={room.images && room.images.length > 0 ? room.images[0] : "/images/SampleHotel.jpg"}
                                            alt={room.roomType}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                        {/* Enhanced linear overlay */}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95 transition-all duration-500" />

                                        {/* Shimmer effect overlay */}
                                        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                                        {/* Price Badge - Enhanced */}
                                        <div className="absolute top-3 right-3 z-10">
                                            <Badge className="bg-linear-to-r from-white/95 to-white/90 backdrop-blur-sm border border-white/50 text-black-500 hover:bg-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold px-3 py-1 text-xs">
                                                <Sparkles className="h-3 w-3 mr-1 text-primary-500" />
                                                LKR {room.pricePerNight.toLocaleString()}
                                                <span className="text-[10px] ml-1 opacity-70">/night</span>
                                            </Badge>
                                        </div>
                                    </div>

                                    <CardContent className="p-4 flex flex-col">
                                        <h3 className="text-lg font-semibold text-foreground mb-4 group-hover:text-primary transition-colors duration-300">
                                            Booking Summary
                                        </h3>

                                        {/* Room Details */}
                                        <div className="space-y-3 mb-4">
                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
                                                <p className="text-xs text-muted-foreground mb-1">Room</p>
                                                <p className="font-semibold text-foreground text-sm wrap-break-words">
                                                    {room.roomType} Room {room.roomNumber}
                                                </p>
                                            </div>

                                            {checkInDate && checkOutDate && (
                                                <>
                                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 flex items-center gap-2">
                                                        <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground">Check-in</p>
                                                            <p className="font-medium text-foreground text-sm wrao-break-words">
                                                                {format(checkInDate, "MMM dd, yyyy")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 flex items-center gap-2">
                                                        <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground">Check-out</p>
                                                            <p className="font-medium text-foreground text-sm wrap-break-words">
                                                                {format(checkOutDate, "MMM dd, yyyy")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 flex items-center gap-2">
                                                        <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs text-muted-foreground">Duration</p>
                                                            <p className="font-medium text-foreground text-sm">
                                                                {nights} {nights === 1 ? "night" : "nights"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all duration-300 flex items-center gap-2">
                                                <DollarSign className="h-3.5 w-3.5 text-primary shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-muted-foreground">Price per night</p>
                                                    <p className="font-medium text-foreground text-sm">
                                                        LKR {room.pricePerNight.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Total Price */}
                                        {checkInDate && checkOutDate && (
                                            <div className="border-t border-white/10 pt-4">
                                                <div className="flex justify-between items-center p-3 rounded-lg bg-primary/10 border border-primary/20">
                                                    <p className="text-base font-semibold text-foreground">Total</p>
                                                    <p className="text-xl font-bold text-primary whitespace-nowrap">
                                                        LKR {totalPrice.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Dialog - Only for guest users */}
            {!isReceptionistOrAdmin && (
                <PaymentDialog
                    open={showPaymentDialog}
                    onOpenChange={setShowPaymentDialog}
                    totalAmount={calculateTotalPrice()}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentCancel={handlePaymentCancel}
                />
            )}

            {/* Walk-In Payment Dialog - Only for receptionist/admin */}
            {isReceptionistOrAdmin && (
                <WalkInPaymentDialog
                    open={showWalkInPaymentDialog}
                    onOpenChange={setShowWalkInPaymentDialog}
                    totalAmount={calculateTotalPrice()}
                    onPaymentSuccess={handleWalkInPaymentSuccess}
                    onPaymentCancel={handleWalkInPaymentCancel}
                />
            )}
        </div>
    );
};

export default BookingPage;

