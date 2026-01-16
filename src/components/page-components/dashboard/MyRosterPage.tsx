"use client";

import {
    useState,
    useEffect,
    useCallback,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { getMyRoster } from "@/services/rosterService";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

const MyRosterPage = () => {
    const { user, loading: authLoading } = useAuth();

    const [rosters, setRosters] = useState<IRoster[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Get start and end of current week
    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    // Fetch rosters for current week
    const fetchRosters = useCallback(async () => {
        if (!user || authLoading) return;

        try {
            setLoading(true);
            
            const { start, end } = getWeekRange(currentDate);

            const response = await getMyRoster({
                from: start.toISOString(),
                to: end.toISOString(),
            });

            if (response.success) {
                const rostersArray = Array.isArray(response.data) ? response.data : [];
                setRosters(rostersArray);
            } else {
                toast.error(response.message || "Failed to fetch roster");
            }
        } catch {
            toast.error("An error occurred while fetching roster");
        } finally {
            setLoading(false);
        }
    }, [user, authLoading, currentDate]);

    useEffect(() => {
        fetchRosters();
    }, [fetchRosters]);

    // Navigate to previous week
    const previousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    // Navigate to next week
    const nextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    // Navigate to current week
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Get week days
    const getWeekDays = () => {
        const { start } = getWeekRange(currentDate);
        const days = [];
        
        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }
        
        return days;
    };

    const weekDays = getWeekDays();

    // Get rosters for a specific date
    const getRostersForDate = (date: Date) => {
        return rosters.filter(roster => {
            const rosterDate = new Date(roster.date);
            return rosterDate.toDateString() === date.toDateString();
        });
    };

    // Get shift color
    const getShiftColor = (shiftType: ShiftType) => {
        switch (shiftType) {
            case "morning":
                return "bg-amber-100 text-amber-800 border-amber-300";
            case "afternoon":
                return "bg-blue-100 text-blue-800 border-blue-300";
            case "evening":
                return "bg-purple-100 text-purple-800 border-purple-300";
            case "night":
                return "bg-indigo-100 text-indigo-800 border-indigo-300";
            default:
                return "bg-gray-100 text-gray-800 border-gray-300";
        }
    };

    const formatWeekRange = () => {
        const { start, end } = getWeekRange(currentDate);
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">My Roster</h1>
                    <p className="text-primary-300 mt-1">
                        View your assigned shifts and schedule
                    </p>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient">
                <div className="flex items-center justify-between">
                    <Button
                        onClick={previousWeek}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Previous Week
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="text-center">
                            <p className="text-lg font-semibold text-primary-100">
                                {formatWeekRange()}
                            </p>
                        </div>
                        <Button
                            onClick={goToToday}
                            variant="outline"
                            size="sm"
                        >
                            Today
                        </Button>
                    </div>

                    <Button
                        onClick={nextWeek}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                    >
                        Next Week
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Weekly Calendar View */}
            {loading ? (
                <div className="flex items-center justify-center py-12 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
                </div>
            ) : (
                <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15 overflow-hidden">
                    <div className="grid grid-cols-7 gap-px bg-primary-900/20">
                        {weekDays.map((day, index) => {
                            const dayRosters = getRostersForDate(day);
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isPast = day < new Date() && !isToday;

                            return (
                                <div
                                    key={index}
                                    className={`bg-black-600/30 min-h-[200px] ${isPast ? 'opacity-60' : ''}`}
                                >
                                    {/* Day Header */}
                                    <div className={`p-3 border-b border-primary-800/50 ${isToday ? 'bg-primary-900/30' : ''}`}>
                                        <p className="text-xs font-medium text-primary-300 uppercase">
                                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </p>
                                        <p className={`text-lg font-semibold ${isToday ? 'text-primary-400' : 'text-primary-100'}`}>
                                            {day.getDate()}
                                        </p>
                                    </div>

                                    {/* Day Content */}
                                    <div className="p-2 space-y-2">
                                        {dayRosters.length === 0 ? (
                                            <div className="text-center py-4">
                                                <p className="text-sm text-primary-500">No shifts</p>
                                            </div>
                                        ) : (
                                            dayRosters.map((roster) => {
                                                const hotel = typeof roster.hotelId === 'string' 
                                                    ? null 
                                                    : roster.hotelId;

                                                return (
                                                    <div
                                                        key={roster._id}
                                                        className={`p-3 rounded-md border ${getShiftColor(roster.shiftType)}`}
                                                    >
                                                        <div className="flex items-center gap-1 mb-2">
                                                            <Clock className="h-3 w-3" />
                                                            <span className="text-xs font-semibold">
                                                                {roster.shiftType.charAt(0).toUpperCase() + roster.shiftType.slice(1)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-medium mb-1">
                                                            {roster.shiftStartTime} - {roster.shiftEndTime}
                                                        </p>
                                                        {hotel && (
                                                            <div className="flex items-center gap-1 mt-2">
                                                                <MapPin className="h-3 w-3" />
                                                                <span className="text-xs">
                                                                    {hotel.name}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {roster.notes && (
                                                            <p className="text-xs mt-2 opacity-80">
                                                                {roster.notes}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient">
                <h3 className="text-sm font-semibold text-primary-100 mb-3">Shift Types</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300"></div>
                        <span className="text-sm text-primary-200">Morning</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
                        <span className="text-sm text-primary-200">Afternoon</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300"></div>
                        <span className="text-sm text-primary-200">Evening</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-indigo-100 border border-indigo-300"></div>
                        <span className="text-sm text-primary-200">Night</span>
                    </div>
                </div>
            </div>

            {/* Empty State - if no rosters for the entire week */}
            {!loading && rosters.length === 0 && (
                <div className="p-12 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                    <div className="flex flex-col items-center justify-center text-center">
                        <Calendar className="h-16 w-16 text-primary-400 mb-4" />
                        <h3 className="text-xl font-semibold text-primary-100 mb-2">
                            No Shifts Scheduled
                        </h3>
                        <p className="text-primary-300 max-w-md">
                            You don't have any shifts scheduled for this week. 
                            Please contact your manager if you believe this is an error.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyRosterPage;
