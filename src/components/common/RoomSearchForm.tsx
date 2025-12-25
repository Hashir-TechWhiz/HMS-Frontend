"use client";

import { FC, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Search } from "lucide-react";
import { format } from "date-fns";

interface RoomSearchFormProps {
    variant?: "hero" | "compact";
    onSearch?: (data: {
        checkIn?: Date;
        checkOut?: Date;
        guests?: number;
    }) => void;
}

const RoomSearchForm: FC<RoomSearchFormProps> = ({
    variant = "hero",
    onSearch,
}) => {
    const [checkIn, setCheckIn] = useState<Date>();
    const [checkOut, setCheckOut] = useState<Date>();
    const [guests, setGuests] = useState<number>(1);

    const handleSearch = () => {
        if (onSearch) {
            onSearch({ checkIn, checkOut, guests });
        }
    };

    const isHero = variant === "hero";

    return (
        <div
            className={`${isHero
                ? "bg-black/30 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8"
                : "bg-card rounded-lg shadow-md border border-border p-4"
                } w-full max-w-4xl`}
        >
            <div
                className={`grid gap-4 ${isHero
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    }`}
            >

                {/* Check-in Date */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">Check-in</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-11 justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {checkIn ? (
                                    format(checkIn, "MMM dd, yyyy")
                                ) : (
                                    <span className="text-muted-foreground">Select date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={checkIn}
                                onSelect={setCheckIn}
                                disabled={(date) => date < new Date()}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Check-out Date */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground">
                        Check-out
                    </Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full h-11 justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                {checkOut ? (
                                    format(checkOut, "MMM dd, yyyy")
                                ) : (
                                    <span className="text-muted-foreground">Select date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={checkOut}
                                onSelect={setCheckOut}
                                disabled={(date) => date < (checkIn || new Date())}
                                autoFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Guests Count */}
                <div className="space-y-2">
                    <Label htmlFor="guests" className="text-sm font-medium">
                        Guests
                    </Label>
                    <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="guests"
                            type="number"
                            min="1"
                            max="10"
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                            className="pl-10 h-11"
                        />
                    </div>
                </div>

                {/* Search Button */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium text-transparent">Search</Label>
                    <Button
                        onClick={handleSearch}
                        className="w-full h-11 main-button-gradient font-medium"
                    >
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RoomSearchForm;

