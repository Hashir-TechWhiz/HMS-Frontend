"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import { getTasksByDate, getMyTasks, updateTaskStatus, generateDailyTasks } from "@/services/housekeepingService";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle2, Clock, PlayCircle, AlertCircle, Calendar as CalendarIcon, RotateCw } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import SelectField from "@/components/forms/SelectField";

const HousekeepingRosterPage = () => {
    const { role, user } = useAuth();
    const { selectedHotel } = useHotel();

    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filterShift, setFilterShift] = useState<string>("all");

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            let response;
            if (role === "housekeeping") {
                response = await getMyTasks({
                    shift: filterShift === "all" ? undefined : filterShift
                });
            } else {
                // Admin/Receptionist view
                const hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id);
                if (!hotelId && role !== "admin") return;

                response = await getTasksByDate({
                    hotelId,
                    date: new Date().toISOString(),
                    shift: filterShift === "all" ? undefined : filterShift
                });
            }

            if (response.success) {
                setTasks(response.data || []);
            } else {
                toast.error(response.message || "Failed to fetch tasks");
            }
        } catch (error) {
            toast.error("An error occurred while fetching tasks");
        } finally {
            setLoading(false);
        }
    }, [role, user, selectedHotel, filterShift]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        try {
            setActionLoading(taskId);
            const response = await updateTaskStatus(taskId, newStatus);
            if (response.success) {
                toast.success(`Task marked as ${newStatus.replace("_", " ")}`);
                fetchTasks();
            } else {
                toast.error(response.message || "Failed to update task");
            }
        } catch (error) {
            toast.error("An error occurred during update");
        } finally {
            setActionLoading(null);
        }
    };

    const handleGenerateTasks = async () => {
        const hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id);
        if (!hotelId) return;

        try {
            setLoading(true);
            const response = await generateDailyTasks(hotelId, new Date().toISOString());
            if (response.success) {
                toast.success("Tasks generated successfully!");
                fetchTasks();
            } else {
                toast.error(response.message || "Failed to generate tasks");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: any = {
            pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
            in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            completed: "bg-green-500/20 text-green-400 border-green-500/50",
            skipped: "bg-gray-500/20 text-gray-400 border-gray-500/50",
        };
        return <Badge className={`${colors[status] || ""} border`}>{status.replace("_", " ").toUpperCase()}</Badge>;
    };

    const getShiftBadge = (shift: string) => {
        const colors: any = {
            morning: "bg-orange-500/20 text-orange-400 border-orange-500/50",
            afternoon: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            night: "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
        };
        return <Badge variant="outline" className={`${colors[shift] || ""} border`}>{shift.toUpperCase()}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Housekeeping Roster</h2>
                    <p className="text-gray-400">Daily cleaning tasks and scheduling</p>
                </div>

                <div className="flex items-center gap-3">
                    <SelectField
                        options={[
                            { value: "all", label: "All Shifts" },
                            { value: "morning", label: "Morning" },
                            { value: "afternoon", label: "Afternoon" },
                            { value: "night", label: "Night" },
                        ]}
                        value={filterShift}
                        onChange={setFilterShift}
                        width="w-[150px]"
                    />

                    {role === "admin" && (
                        <Button
                            onClick={handleGenerateTasks}
                            variant="outline"
                            className="border-primary/50 text-primary hover:bg-primary/10"
                        >
                            <RotateCw className="h-4 w-4 mr-2" />
                            Generate Tasks
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))
                ) : tasks.length === 0 ? (
                    <div className="col-span-full py-20 text-center space-y-4 bg-white/5 rounded-2xl border border-white/10">
                        <AlertCircle className="h-12 w-12 text-gray-500 mx-auto opacity-50" />
                        <p className="text-gray-400">No housekeeping tasks found for today.</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div key={task._id} className="bg-primary-900/10 border border-white/10 rounded-xl p-5 hover:border-primary/30 transition-all duration-300 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Room {task.room?.roomNumber || "N/A"}</h3>
                                    <p className="text-xs text-gray-400">{task.room?.roomType || "Routine Cleaning"}</p>
                                </div>
                                {getShiftBadge(task.shift)}
                            </div>

                            <div className="flex items-center gap-2">
                                {getStatusBadge(task.status)}
                                <Badge variant="secondary" className="bg-white/5 text-[10px] font-normal">
                                    {task.taskType === 'checkout_cleaning' ? 'POST-CHECKOUT' : 'ROUTINE'}
                                </Badge>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex gap-2">
                                {task.status === "pending" && (
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2"
                                        onClick={() => handleUpdateStatus(task._id, "in_progress")}
                                        disabled={actionLoading === task._id}
                                    >
                                        <PlayCircle className="h-4 w-4" />
                                        Start
                                    </Button>
                                )}
                                {task.status === "in_progress" && (
                                    <Button
                                        size="sm"
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
                                        onClick={() => handleUpdateStatus(task._id, "completed")}
                                        disabled={actionLoading === task._id}
                                    >
                                        <CheckCircle2 className="h-4 w-4" />
                                        Complete
                                    </Button>
                                )}
                                {task.status === "completed" && (
                                    <p className="text-[10px] text-green-400/70 flex items-center gap-1 italic">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Completed at {formatDateTime(task.completedAt)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HousekeepingRosterPage;
