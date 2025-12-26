"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverTrigger,
    PopoverContent
} from "@/components/ui/popover";

interface DateRangePickerProps {
    value: DateRange | undefined;
    onChange: (value: DateRange | undefined) => void;
    className?: string;
    placeholder?: string;
    align?: "start" | "center" | "end";
}

export function DateRangePicker({
    value,
    onChange,
    placeholder = "Select date range",
    className,
    align,
}: DateRangePickerProps) {

    // Detect Mobile Screen
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Clear
    const hasValue = Boolean(value?.from || value?.to);

    const handleClear = () => onChange(undefined);

    // Label Formatting
    const formattedLabel =
        value?.from && value?.to
            ? `${format(value.from, "LLL dd, y")} - ${format(value.to, "LLL dd, y")}`
            : value?.from
                ? `${format(value.from, "LLL dd, y")} - …`
                : placeholder;

    return (
        <div className={cn("flex flex-col w-full", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            "relative w-full h-11 rounded-md border px-3 search-gradient font-normal flex items-center",
                            !hasValue && "text-muted-foreground"
                        )}
                    >
                        <p className="pr-8 truncate text-sm">{formattedLabel}</p>

                        {/* Icon (Calendar or Clear) */}
                        {!hasValue ? (
                            <CalendarIcon className="absolute right-3 h-4 w-4 opacity-80" />
                        ) : (
                            <X
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleClear();
                                }}
                                className="absolute right-3 h-4 w-4 opacity-80 hover:opacity-100 cursor-pointer"
                            />
                        )}
                    </button>
                </PopoverTrigger>

                <PopoverContent
                    side="bottom"
                    align={align ?? (isMobile ? "center" : "end")}
                    className="p-0 mt-2 w-auto"
                >
                    <Calendar
                        mode="range"
                        selected={value}
                        onSelect={onChange}
                        numberOfMonths={isMobile ? 1 : 2}
                        defaultMonth={value?.from}
                        className="rounded-md border shadow"
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}
