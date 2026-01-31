"use client";

import {
    useState,
    useEffect,
    useCallback,
    useMemo,
} from "react";

import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";

import {
    getRosters,
    createRoster,
    updateRoster,
    deleteRoster,
    CreateRosterData,
} from "@/services/rosterService";
import { getActiveHotels } from "@/services/hotelService";
import { getUsers } from "@/services/adminUserService";

import { useForm } from "react-hook-form";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DialogBox from "@/components/common/DialogBox";
import SelectField from "@/components/forms/SelectField";
import InputField from "@/components/forms/InputField";
import TextAreaField from "@/components/forms/TextAreaField";

import { ChevronLeft, ChevronRight, CalendarDays, UserCircle, Trash2, Edit2, Info, Plus, Clock } from "lucide-react";

// Predefined shift templates
const SHIFT_TEMPLATES = {
    morning: { start: "06:00", end: "14:00", label: "Morning (6am-2pm)" },
    afternoon: { start: "14:00", end: "22:00", label: "Afternoon (2pm-10pm)" },
    night: { start: "22:00", end: "06:00", label: "Night (10pm-6am)" },
};

interface CellData {
    date: Date;
    staff: IUser;
    existingRoster?: IRoster;
}

const RosterPage = () => {
    const { role, loading: authLoading } = useAuth();
    const { selectedHotel: contextHotel } = useHotel();

    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);
    const [staffMembers, setStaffMembers] = useState<IUser[]>([]);
    const [allRosters, setAllRosters] = useState<IRoster[]>([]);
    const [loading, setLoading] = useState(true);

    // Week navigation
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedHotelId, setSelectedHotelId] = useState<string>("");

    // Dialog states
    const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [quickAssignOpen, setQuickAssignOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState<CellData | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
        watch,
        setValue,
    } = useForm<{
        shiftType: ShiftType;
        shiftStartTime: string;
        shiftEndTime: string;
        notes: string;
    }>();

    // Form for quick assign
    const {
        register: registerQuick,
        handleSubmit: handleSubmitQuick,
        formState: { errors: errorsQuick },
        reset: resetQuick,
        control: controlQuick,
        watch: watchQuick,
        setValue: setValueQuick,
    } = useForm<{
        staffId: string;
        date: string;
        shiftType: ShiftType;
        shiftStartTime: string;
        shiftEndTime: string;
        notes: string;
    }>();

    const selectedShiftType = watch("shiftType");
    const quickShiftType = watchQuick("shiftType");

    // Auto-fill times when shift type changes
    useEffect(() => {
        if (selectedShiftType && SHIFT_TEMPLATES[selectedShiftType]) {
            setValue("shiftStartTime", SHIFT_TEMPLATES[selectedShiftType].start);
            setValue("shiftEndTime", SHIFT_TEMPLATES[selectedShiftType].end);
        }
    }, [selectedShiftType, setValue]);

    // Auto-fill times for quick assign
    useEffect(() => {
        if (quickShiftType && SHIFT_TEMPLATES[quickShiftType]) {
            setValueQuick("shiftStartTime", SHIFT_TEMPLATES[quickShiftType].start);
            setValueQuick("shiftEndTime", SHIFT_TEMPLATES[quickShiftType].end);
        }
    }, [quickShiftType, setValueQuick]);

    // Get week range
    const getWeekRange = useCallback((date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    }, []);

    // Get week days
    const weekDays = useMemo(() => {
        const { start } = getWeekRange(currentDate);
        const days = [];

        for (let i = 0; i < 7; i++) {
            const day = new Date(start);
            day.setDate(start.getDate() + i);
            days.push(day);
        }

        return days;
    }, [currentDate, getWeekRange]);

    // Fetch hotels
    const fetchHotels = useCallback(async () => {
        try {
            const response = await getActiveHotels();
            if (response.success) {
                const hotelsData = Array.isArray(response.data) ? response.data : [];
                setAvailableHotels(hotelsData);

                // Set default hotel
                if (!selectedHotelId && hotelsData.length > 0) {
                    setSelectedHotelId(contextHotel?._id || hotelsData[0]._id);
                }
            }
        } catch {
            toast.error("Failed to fetch hotels");
        }
    }, [contextHotel, selectedHotelId]);

    // Fetch staff members
    const fetchStaff = useCallback(async () => {
        try {
            const response = await getUsers();
            if (response.success) {
                const usersData: any = response.data;
                const usersArray = Array.isArray(usersData) ? usersData : (usersData?.items || []);

                // Filter to only include receptionist and housekeeping
                const staff = usersArray.filter((user: IUser) =>
                    (user.role === "receptionist" || user.role === "housekeeping") && user.isActive
                );

                setStaffMembers(staff);
            }
        } catch {
            toast.error("Failed to fetch staff members");
        }
    }, []);

    // Fetch rosters for current week
    const fetchRosters = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setLoading(true);

            const { start, end } = getWeekRange(currentDate);

            const params: any = {
                from: start.toISOString(),
                to: end.toISOString(),
            };

            if (selectedHotelId) {
                params.hotelId = selectedHotelId;
            }

            const response = await getRosters(params);

            if (response.success) {
                const rostersArray = Array.isArray(response.data) ? response.data : [];
                setAllRosters(rostersArray);
            } else {
                toast.error(response.message || "Failed to fetch rosters");
            }
        } catch {
            toast.error("An error occurred while fetching rosters");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading, currentDate, selectedHotelId, getWeekRange]);

    useEffect(() => {
        fetchHotels();
        fetchStaff();
    }, [fetchHotels, fetchStaff]);

    useEffect(() => {
        if (selectedHotelId) {
            fetchRosters();
        }
    }, [fetchRosters, selectedHotelId]);

    // Filter staff by selected hotel
    const filteredStaff = useMemo(() => {
        if (!selectedHotelId) return [];
        return staffMembers.filter(staff => {
            // Handle both string ID and populated hotel object
            const staffHotelId = typeof staff.hotelId === 'string'
                ? staff.hotelId
                : staff.hotelId?._id;
            return staffHotelId === selectedHotelId;
        });
    }, [staffMembers, selectedHotelId]);

    // Get roster for specific staff and date
    const getRosterForCell = useCallback((staffId: string, date: Date) => {
        return allRosters.find(roster => {
            const rosterStaffId = typeof roster.staffId === 'string' ? roster.staffId : roster.staffId._id;

            // Normalize both dates to YYYY-MM-DD for accurate comparison
            // This handles both Date objects and ISO strings from the backend
            let rosterDateStr: string;
            const rosterDateValue = roster.date;

            if (typeof rosterDateValue === 'string') {
                rosterDateStr = rosterDateValue.split('T')[0];
            } else {
                const d = new Date(rosterDateValue);
                const year = d.getUTCFullYear();
                const month = String(d.getUTCMonth() + 1).padStart(2, '0');
                const day = String(d.getUTCDate()).padStart(2, '0');
                rosterDateStr = `${year}-${month}-${day}`;
            }

            const compareDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            return rosterStaffId === staffId && rosterDateStr === compareDateStr;
        });
    }, [allRosters]);

    // Week navigation
    const previousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Format week range display
    const formatWeekRange = () => {
        const { start, end } = getWeekRange(currentDate);
        const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
    };

    // Handle cell click
    const handleCellClick = (staff: IUser, date: Date) => {
        const existingRoster = getRosterForCell(staff._id, date);

        setSelectedCell({
            date,
            staff,
            existingRoster,
        });

        if (existingRoster) {
            // View existing roster
            setViewDialogOpen(true);
        } else {
            // Create new roster
            reset({
                shiftType: "morning",
                shiftStartTime: SHIFT_TEMPLATES.morning.start,
                shiftEndTime: SHIFT_TEMPLATES.morning.end,
                notes: "",
            });
            setShiftDialogOpen(true);
        }
    };

    // Handle quick assign button click
    const handleQuickAssignClick = () => {
        setSelectedCell(null);
        setQuickAssignOpen(true);
    };

    // Handle edit shift
    const handleEditShift = () => {
        if (!selectedCell?.existingRoster) return;

        const roster = selectedCell.existingRoster;
        reset({
            shiftType: roster.shiftType,
            shiftStartTime: roster.shiftStartTime,
            shiftEndTime: roster.shiftEndTime,
            notes: roster.notes || "",
        });

        setViewDialogOpen(false);
        setShiftDialogOpen(true);
    };

    // Handle delete shift
    const handleDeleteShift = () => {
        setViewDialogOpen(false);
        setDeleteDialogOpen(true);
    };

    // Submit shift assignment
    const onSubmitShift = async (data: any) => {
        if (!selectedCell) return;

        try {
            setFormLoading(true);

            // Format date as YYYY-MM-DD using local date components (no UTC conversion)
            const year = selectedCell.date.getFullYear();
            const month = String(selectedCell.date.getMonth() + 1).padStart(2, '0');
            const day = String(selectedCell.date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const shiftData: CreateRosterData = {
                hotelId: selectedHotelId,
                staffId: selectedCell.staff._id,
                date: dateStr,
                shiftType: data.shiftType,
                shiftStartTime: data.shiftStartTime,
                shiftEndTime: data.shiftEndTime,
                role: selectedCell.staff.role as RosterRole,
                notes: data.notes,
            };

            let response;
            if (selectedCell.existingRoster) {
                // Update existing
                response = await updateRoster(selectedCell.existingRoster._id, shiftData);
            } else {
                // Create new
                response = await createRoster(shiftData);
            }

            if (response.success) {
                toast.success(selectedCell.existingRoster ? "Shift updated successfully" : "Shift assigned successfully");
                setShiftDialogOpen(false);
                setSelectedCell(null);
                fetchRosters();
            } else {
                toast.error(response.message || "Failed to save shift");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    // Submit quick assign
    const onSubmitQuickAssign = async (data: any) => {
        if (!selectedHotelId) return;

        const staff = filteredStaff.find(s => s._id === data.staffId);
        if (!staff) return;

        try {
            setFormLoading(true);

            // Check if roster already exists for this staff/date/shift
            const dateObj = new Date(data.date);
            const existingRoster = getRosterForCell(data.staffId, dateObj);

            if (existingRoster && existingRoster.shiftType === data.shiftType) {
                toast.error(`This staff member already has a ${data.shiftType} shift on this date. Please edit the existing shift or choose a different shift type.`);
                setFormLoading(false);
                return;
            }

            const shiftData: CreateRosterData = {
                hotelId: selectedHotelId,
                staffId: data.staffId,
                date: data.date,
                shiftType: data.shiftType,
                shiftStartTime: data.shiftStartTime,
                shiftEndTime: data.shiftEndTime,
                role: staff.role as RosterRole,
                notes: data.notes,
            };

            const response = await createRoster(shiftData);

            if (response.success) {
                toast.success("Shift assigned successfully");
                setQuickAssignOpen(false);
                resetQuick();
                fetchRosters();
            } else {
                toast.error(response.message || "Failed to assign shift");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle delete
    const handleDelete = async () => {
        if (!selectedCell?.existingRoster) return;

        try {
            setDeleteLoading(true);
            const response = await deleteRoster(selectedCell.existingRoster._id);

            if (response.success) {
                toast.success("Shift removed successfully");
                setDeleteDialogOpen(false);
                setSelectedCell(null);
                fetchRosters();
            } else {
                toast.error(response.message || "Failed to remove shift");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setDeleteLoading(false);
        }
    };

    // Get shift color
    const getShiftColor = (shiftType: ShiftType) => {
        switch (shiftType) {
            case "morning":
                return "bg-amber-500/20 text-amber-300 border-amber-500/40";
            case "afternoon":
                return "bg-blue-500/20 text-blue-300 border-blue-500/40";
            case "night":
                return "bg-indigo-500/20 text-indigo-300 border-indigo-500/40";
            default:
                return "bg-gray-500/20 text-gray-300 border-gray-500/40";
        }
    };

    // Hotel options
    const hotelOptions: Option[] = availableHotels.map((hotel) => ({
        value: hotel._id,
        label: hotel.name,
    }));

    // Shift type options
    const shiftTypeOptions: Option[] = [
        { value: "morning", label: SHIFT_TEMPLATES.morning.label },
        { value: "afternoon", label: SHIFT_TEMPLATES.afternoon.label },
        { value: "night", label: SHIFT_TEMPLATES.night.label },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Staff Roster Management</h1>
                    <p className="text-primary-300 mt-1">
                        Weekly shift planning and scheduling
                    </p>
                </div>
                {/* <Button
                    onClick={handleQuickAssignClick}
                    className="flex items-center gap-2"
                    disabled={!selectedHotelId || filteredStaff.length === 0}
                >
                    <Plus className="h-4 w-4" />
                    Assign Shift
                </Button> */}
            </div>

            {/* Controls */}
            <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Hotel Selector */}
                    <div className="flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-primary-400" />
                        <SelectField
                            placeholder="Select hotel"
                            options={hotelOptions}
                            value={selectedHotelId}
                            onChange={setSelectedHotelId}
                            className="min-w-[200px]"
                        />
                    </div>

                    {/* Week Navigation */}
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={previousWeek}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>

                        <div className="text-center px-4">
                            <p className="text-sm font-semibold text-primary-100">
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

                        <Button
                            onClick={nextWeek}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Roster Grid */}
            <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-400"></div>
                    </div>
                ) : !selectedHotelId ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <CalendarDays className="h-12 w-12 text-primary-400 mb-3" />
                        <h3 className="text-lg font-semibold text-primary-100 mb-1">
                            Select a Hotel
                        </h3>
                        <p className="text-primary-300">
                            Choose a hotel to view and manage staff rosters
                        </p>
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <UserCircle className="h-12 w-12 text-primary-400 mb-3" />
                        <h3 className="text-lg font-semibold text-primary-100 mb-1">
                            No Staff Members
                        </h3>
                        <p className="text-primary-300 mb-1">
                            No active staff members found for this hotel
                        </p>
                        <p className="text-xs text-primary-500">
                            Add staff members to this hotel to create roster entries
                        </p>
                    </div>
                ) : (
                    <div>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                {/* Header Row */}
                                <thead>
                                    <tr>
                                        <th className="sticky left-0 z-10 bg-black-600/80 backdrop-blur-sm border-b-2 border-primary-800/50 p-3 text-left">
                                            <div className="flex items-center gap-2 min-w-[180px]">
                                                <UserCircle className="h-4 w-4 text-primary-400" />
                                                <span className="text-sm font-semibold text-primary-200">Staff Member</span>
                                            </div>
                                        </th>
                                        {weekDays.map((day, index) => {
                                            const isToday = day.toDateString() === new Date().toDateString();
                                            return (
                                                <th
                                                    key={index}
                                                    className={`border-b-2 border-primary-800/50 p-3 text-center min-w-[140px] ${isToday ? 'bg-primary-900/30' : ''
                                                        }`}
                                                >
                                                    <div className="text-xs font-medium text-primary-400 uppercase">
                                                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                    </div>
                                                    <div className={`text-lg font-semibold ${isToday ? 'text-primary-300' : 'text-primary-100'}`}>
                                                        {day.getDate()}
                                                    </div>
                                                    <div className="text-xs text-primary-500">
                                                        {day.toLocaleDateString('en-US', { month: 'short' })}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                {/* Body Rows */}
                                <tbody>
                                    {filteredStaff.map((staff) => (
                                        <tr key={staff._id} className="border-b border-primary-900/20 hover:bg-primary-900/10 transition-colors">
                                            {/* Staff Name Cell */}
                                            <td className="sticky left-0 z-10 bg-black-600/80 backdrop-blur-sm border-r border-primary-800/30 p-3">
                                                <div className="min-w-[180px]">
                                                    <div className="font-medium text-primary-100 text-sm">
                                                        {staff.name}
                                                    </div>
                                                    <div className="text-xs text-primary-400 capitalize mt-0.5">
                                                        {staff.role}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Day Cells */}
                                            {weekDays.map((day, index) => {
                                                const roster = getRosterForCell(staff._id, day);
                                                const isPast = day < new Date() && day.toDateString() !== new Date().toDateString();

                                                return (
                                                    <td
                                                        key={index}
                                                        className={`p-2 border-r border-primary-900/20 transition-all ${isPast ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-primary-900/20'
                                                            } ${!roster && !isPast ? 'hover:border-primary-600/40' : ''}`}
                                                        onClick={() => !isPast && handleCellClick(staff, day)}
                                                        title={roster ? "Click to view/edit shift" : isPast ? "Past date" : "Click to assign shift"}
                                                    >
                                                        {roster ? (
                                                            <div className={`p-2 rounded-md border text-center hover:shadow-md transition-shadow ${getShiftColor(roster.shiftType)}`}>
                                                                <div className="text-xs font-semibold capitalize mb-1">
                                                                    {roster.shiftType}
                                                                </div>
                                                                <div className="text-xs opacity-90">
                                                                    {roster.shiftStartTime} - {roster.shiftEndTime}
                                                                </div>
                                                                {roster.notes && (
                                                                    <div className="mt-1 flex items-center justify-center">
                                                                        <Info className="h-3 w-3 opacity-70" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className={`h-16 flex flex-col items-center justify-center rounded-md border-2 border-dashed transition-all ${isPast
                                                                ? 'border-primary-900/20 text-primary-700'
                                                                : 'border-primary-800/30 text-primary-200 hover:border-primary-600/50 hover:bg-primary-900/10'
                                                                }`}>
                                                                {!isPast && (
                                                                    <>
                                                                        <Plus className="h-4 w-4 mb-1" />
                                                                        <span className="text-xs font-medium">Add Shift</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="p-6 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/10">
                <div className="flex items-center gap-2 mb-5">
                    <Clock className="h-5 w-5 text-primary-400" />
                    <h3 className="text-base font-semibold text-primary-100">Shift Types Legend</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(SHIFT_TEMPLATES).map(([key, template]) => (
                        <div
                            key={key}
                            className={`p-4 rounded-lg border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${getShiftColor(key as ShiftType)}`}
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-4 h-4 rounded border-2 ${getShiftColor(key as ShiftType)}`}></div>
                                <span className="text-sm font-semibold capitalize tracking-wide">{key} Shift</span>
                            </div>
                            <div className="flex items-center gap-2 pl-7">
                                <Clock className="h-3.5 w-3.5 opacity-80" />
                                <span className="text-xs font-medium opacity-90">{template.start} - {template.end}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* View Shift Dialog */}
            <DialogBox
                open={viewDialogOpen}
                onOpenChange={setViewDialogOpen}
                title="Shift Details"
                description="View and manage shift assignment"
            >
                {selectedCell?.existingRoster && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-primary-400">Staff Member</p>
                                <p className="text-primary-100">{selectedCell.staff.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary-400">Role</p>
                                <p className="text-primary-100 capitalize">{selectedCell.staff.role}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary-400">Date</p>
                                <p className="text-primary-100">
                                    {selectedCell.date.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-primary-400">Shift Type</p>
                                <p className="text-primary-100 capitalize">{selectedCell.existingRoster.shiftType}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium text-primary-400">Shift Time</p>
                                <p className="text-primary-100">
                                    {selectedCell.existingRoster.shiftStartTime} - {selectedCell.existingRoster.shiftEndTime}
                                </p>
                            </div>
                            {selectedCell.existingRoster.notes && (
                                <div className="col-span-2">
                                    <p className="text-sm font-medium text-primary-400">Notes</p>
                                    <p className="text-primary-100">{selectedCell.existingRoster.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 py-4 border-t border-primary-800/50">
                            <Button
                                variant="outline"
                                onClick={handleDeleteShift}
                                className="flex-1 text-red-400 hover:text-red-300 h-10"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Shift
                            </Button>
                            <Button onClick={handleEditShift} className="flex-1 main-button-gradient">
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Shift
                            </Button>
                        </div>
                    </div>
                )}
            </DialogBox>

            {/* Assign/Edit Shift Dialog */}
            <DialogBox
                open={shiftDialogOpen}
                onOpenChange={setShiftDialogOpen}
                title={selectedCell?.existingRoster ? "Edit Shift" : "Assign Shift"}
                description={`${selectedCell?.staff.name} - ${selectedCell?.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`}
            >
                <form onSubmit={handleSubmit(onSubmitShift)} className="space-y-4">
                    <SelectField
                        name="shiftType"
                        label="Shift Type"
                        placeholder="Select shift type"
                        options={shiftTypeOptions}
                        control={control}
                        error={errors.shiftType}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            name="shiftStartTime"
                            label="Start Time"
                            placeholder="09:00"
                            type="time"
                            register={register}
                            error={errors.shiftStartTime}
                            validation={{ required: "Start time is required" }}
                        />

                        <InputField
                            name="shiftEndTime"
                            label="End Time"
                            placeholder="17:00"
                            type="time"
                            register={register}
                            error={errors.shiftEndTime}
                            validation={{ required: "End time is required" }}
                        />
                    </div>

                    <TextAreaField
                        name="notes"
                        label="Notes (Optional)"
                        placeholder="Additional notes or instructions..."
                        register={register}
                        error={errors.notes}
                        rows={3}
                    />

                    <div className="flex gap-3 py-4 w-full border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShiftDialogOpen(false)}
                            disabled={formLoading}
                            className="flex-1 h-10"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading} className="flex-1 main-button-gradient">
                            {formLoading ? "Saving..." : selectedCell?.existingRoster ? "Update Shift" : "Assign Shift"}
                        </Button>
                    </div>
                </form>
            </DialogBox>

            {/* Delete Confirmation Dialog */}
            <DialogBox
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Remove Shift"
                description="Are you sure you want to remove this shift assignment? This action cannot be undone."
            >
                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={deleteLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {deleteLoading ? "Removing..." : "Remove Shift"}
                    </Button>
                </div>
            </DialogBox>

            {/* Quick Assign Dialog */}
            <DialogBox
                open={quickAssignOpen}
                onOpenChange={setQuickAssignOpen}
                title="Assign Shift"
                description="Quickly assign a shift to a staff member"
            >
                <form onSubmit={handleSubmitQuick(onSubmitQuickAssign)} className="space-y-4">
                    <SelectField
                        name="staffId"
                        label="Staff Member"
                        placeholder="Select staff member"
                        options={filteredStaff.map((staff) => ({
                            value: staff._id,
                            label: `${staff.name} (${staff.role})`,
                        }))}
                        control={controlQuick}
                        error={errorsQuick.staffId}
                        required
                    />

                    <InputField
                        name="date"
                        label="Date"
                        placeholder="Select date"
                        type="date"
                        register={registerQuick}
                        error={errorsQuick.date}
                        validation={{ required: "Date is required" }}
                    />

                    <SelectField
                        name="shiftType"
                        label="Shift Type"
                        placeholder="Select shift type"
                        options={shiftTypeOptions}
                        control={controlQuick}
                        error={errorsQuick.shiftType}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <InputField
                            name="shiftStartTime"
                            label="Start Time"
                            placeholder="09:00"
                            type="time"
                            register={registerQuick}
                            error={errorsQuick.shiftStartTime}
                            validation={{ required: "Start time is required" }}
                        />

                        <InputField
                            name="shiftEndTime"
                            label="End Time"
                            placeholder="17:00"
                            type="time"
                            register={registerQuick}
                            error={errorsQuick.shiftEndTime}
                            validation={{ required: "End time is required" }}
                        />
                    </div>

                    <TextAreaField
                        name="notes"
                        label="Notes (Optional)"
                        placeholder="Additional notes or instructions..."
                        register={registerQuick}
                        error={errorsQuick.notes}
                        rows={3}
                    />

                    <div className="flex gap-3 pt-4 w-full">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setQuickAssignOpen(false)}
                            disabled={formLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                            {formLoading ? "Assigning..." : "Assign Shift"}
                        </Button>
                    </div>
                </form>
            </DialogBox>
        </div>
    );
};

export default RosterPage;
