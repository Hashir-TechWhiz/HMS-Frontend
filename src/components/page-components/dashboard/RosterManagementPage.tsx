"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHotel } from "@/contexts/HotelContext";
import {
    getTasksByDate,
    getMyTasks,
    assignTask,
    updateTaskStatus,
    generateDailyTasks,
    getHotelStaffByRole
} from "@/services/housekeepingService";
import { getActiveHotels } from "@/services/hotelService";
import DataTable from "@/components/common/DataTable";
import DialogBox from "@/components/common/DialogBox";
import SelectField from "@/components/forms/SelectField";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    UserPlus,
    CheckCircle2,
    PlayCircle,
    RotateCw,
    Calendar,
    AlertCircle
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

const RosterManagementPage = () => {
    const { role, user } = useAuth();
    const { selectedHotel } = useHotel();

    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [housekeepingStaff, setHousekeepingStaff] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedStaffId, setSelectedStaffId] = useState<string>("");
    const [assignLoading, setAssignLoading] = useState(false);
    const [filterSession, setFilterSession] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [availableHotels, setAvailableHotels] = useState<IHotel[]>([]);
    const [filterHotel, setFilterHotel] = useState<string>("");
    const itemsPerPage = 10;

    // Fetch available hotels for admin
    const fetchAvailableHotels = useCallback(async () => {
        if (role !== "admin") return;
        try {
            const response = await getActiveHotels();
            if (response.success && response.data) {
                setAvailableHotels(response.data);
                // Set default hotel to first available if not already set
                if (!filterHotel && response.data.length > 0) {
                    setFilterHotel(response.data[0]._id);
                }
            }
        } catch (error) {
            console.error("Failed to fetch hotels:", error);
        }
    }, [role, filterHotel]);

    // Initialize hotel filter based on role
    useEffect(() => {
        if (role === "admin") {
            fetchAvailableHotels();
        } else if (role === "receptionist") {
            // For receptionist, set to their hotel
            const hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id);
            if (hotelId) {
                setFilterHotel(hotelId);
            }
        }
    }, [role, selectedHotel, user, fetchAvailableHotels]);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);

            // Housekeepers use getMyTasks endpoint
            if (role === "housekeeping") {
                const response = await getMyTasks({
                    date: new Date().toISOString(),
                    session: filterSession === "all" ? undefined : filterSession,
                    status: filterStatus === "all" ? undefined : filterStatus,
                });

                if (response.success) {
                    setTasks(response.data || []);
                } else {
                    toast.error(response.message || "Failed to fetch tasks");
                }
                return;
            }

            // Admin and receptionist use getTasksByDate endpoint
            let hotelId = filterHotel;
            if (role === "receptionist") {
                hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id) || "";
            }

            if (!hotelId && role !== "admin") return;

            const response = await getTasksByDate({
                hotelId,
                date: new Date().toISOString(),
                session: filterSession === "all" ? undefined : filterSession,
                status: filterStatus === "all" ? undefined : filterStatus,
            });

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
    }, [role, user, selectedHotel, filterSession, filterStatus, filterHotel]);

    const fetchHousekeepingStaff = useCallback(async () => {
        try {
            // Use filterHotel for admin, or user's hotel for receptionist
            let hotelId = filterHotel;
            if (role === "receptionist") {
                hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id) || "";
            }

            if (!hotelId) return;

            const response = await getHotelStaffByRole(hotelId, "housekeeping");
            if (response.success) {
                setHousekeepingStaff(response.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch housekeeping staff:", error);
        }
    }, [selectedHotel, user, role, filterHotel]);

    useEffect(() => {
        if ((role === "admin" || role === "receptionist") && filterHotel) {
            fetchTasks();
            fetchHousekeepingStaff();
        }
    }, [role, filterHotel, fetchTasks, fetchHousekeepingStaff]);

    const handleAssignClick = (task: any) => {
        setSelectedTask(task);
        setSelectedStaffId(task.assignedTo?._id || "");
        setAssignDialogOpen(true);
    };

    const handleAssignConfirm = async () => {
        if (!selectedTask || !selectedStaffId) return;

        try {
            setAssignLoading(true);
            const response = await assignTask(selectedTask._id, selectedStaffId);

            if (response.success) {
                toast.success("Task assigned successfully");
                setAssignDialogOpen(false);
                setSelectedTask(null);
                setSelectedStaffId("");
                fetchTasks();
            } else {
                toast.error(response.message || "Failed to assign task");
            }
        } catch (error) {
            toast.error("An error occurred during assignment");
        } finally {
            setAssignLoading(false);
        }
    };

    const handleGenerateTasks = async () => {
        // Use filterHotel for admin, or user's hotel for receptionist
        let hotelId = filterHotel;
        if (role === "receptionist") {
            hotelId = selectedHotel?._id || (typeof user?.hotelId === 'string' ? user?.hotelId : user?.hotelId?._id) || "";
        }

        if (!hotelId) {
            toast.error("Please select a hotel first");
            return;
        }

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

    const getSessionBadge = (session: string) => {
        const colors: any = {
            MORNING: "bg-orange-500/20 text-orange-400 border-orange-500/50",
            AFTERNOON: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            EVENING: "bg-indigo-500/20 text-indigo-400 border-indigo-500/50",
        };
        return <Badge variant="outline" className={`${colors[session] || ""} border`}>{session}</Badge>;
    };

    const getPriorityBadge = (priority: string) => {
        const colors: any = {
            low: "bg-gray-500/20 text-gray-400 border-gray-500/50",
            normal: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            high: "bg-orange-500/20 text-orange-400 border-orange-500/50",
            urgent: "bg-red-500/20 text-red-400 border-red-500/50",
        };
        return <Badge variant="outline" className={`${colors[priority] || ""} border text-[10px]`}>{priority.toUpperCase()}</Badge>;
    };

    const columns = [
        {
            key: "room",
            label: "Room",
            render: (task: any) => (
                <div>
                    <div className="font-medium text-white">{task.room?.roomNumber || "N/A"}</div>
                    <div className="text-xs text-gray-400">{task.room?.roomType || "N/A"}</div>
                </div>
            ),
        },
        {
            key: "session",
            label: "Session",
            render: (task: any) => getSessionBadge(task.session),
        },
        {
            key: "taskType",
            label: "Type",
            render: (task: any) => (
                <Badge variant="secondary" className="bg-white/5 text-[10px]">
                    {task.taskType === 'checkout_cleaning' ? 'POST-CHECKOUT' : 'ROUTINE'}
                </Badge>
            ),
        },
        {
            key: "priority",
            label: "Priority",
            render: (task: any) => getPriorityBadge(task.priority),
        },
        {
            key: "assignedTo",
            label: "Assigned To",
            render: (task: any) => (
                <div>
                    {task.assignedTo ? (
                        <>
                            <div className="font-medium text-white text-sm">{task.assignedTo.name}</div>
                            <div className="text-xs text-gray-400">{task.assignedTo.email}</div>
                        </>
                    ) : (
                        <span className="text-gray-500 text-sm italic">Unassigned</span>
                    )}
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (task: any) => getStatusBadge(task.status),
        },
        {
            key: "actions",
            label: "Actions",
            render: (task: any) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAssignClick(task)}
                        className="h-8 px-2"
                        title="Assign Staff"
                    >
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    // Paginate tasks
    const paginatedTasks = tasks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const totalPages = Math.ceil(tasks.length / itemsPerPage);

    // Housekeepers see their own tasks
    if (role === "housekeeping") {
        return (
            <div className="flex flex-col gap-6">
                <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                    <div className="flex md:flex-row flex-col gap-5 md:items-center justify-between w-full">
                        <div>
                            <h1 className="text-2xl font-bold text-white">My Cleaning Tasks</h1>
                            <p className="text-sm text-gray-400 mt-1">
                                View and manage your assigned cleaning tasks for today
                            </p>
                        </div>

                        <div className="flex lg:flex-row flex-col gap-3 w-full justify-end md:w-auto">
                            <SelectField
                                name="sessionFilter"
                                options={[
                                    { value: "all", label: "All Sessions" },
                                    { value: "MORNING", label: "Morning" },
                                    { value: "AFTERNOON", label: "Afternoon" },
                                    { value: "EVENING", label: "Evening" },
                                ]}
                                value={filterSession}
                                onChange={setFilterSession}
                                width="md:w-[150px]"
                            />
                            <SelectField
                                name="statusFilter"
                                options={[
                                    { value: "all", label: "All Status" },
                                    { value: "pending", label: "Pending" },
                                    { value: "in_progress", label: "In Progress" },
                                    { value: "completed", label: "Completed" },
                                ]}
                                value={filterStatus}
                                onChange={setFilterStatus}
                                width="md:w-[150px]"
                            />
                        </div>
                    </div>

                    <DataTable
                        columns={columns.filter(col => col.key !== 'actions')} // Remove actions column for housekeepers
                        data={paginatedTasks}
                        loading={loading}
                        emptyMessage="No cleaning tasks assigned to you for today."
                        pagination={{
                            page: currentPage,
                            totalPages: totalPages,
                            total: tasks.length,
                            onPageChange: setCurrentPage,
                        }}
                        selectable={false}
                    />
                </div>
            </div>
        );
    }

    // Admin and receptionist see full roster management
    if (role !== "admin" && role !== "receptionist") {
        return (
            <div className="p-6 text-center">
                <p className="text-gray-400">Access denied. Only admin, receptionist, and housekeeping can view this page.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="flex md:flex-row flex-col gap-5 md:items-center justify-between w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Housekeeping Roster Management</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Manage and assign daily cleaning tasks
                        </p>
                    </div>

                    <div className="flex lg:flex-row flex-col gap-3 w-full justify-end md:w-auto">
                        {role === "admin" && (
                            <SelectField
                                name="hotelFilter"
                                options={[
                                    ...availableHotels.map(h => ({ value: h._id, label: `${h.name} (${h.code})` }))
                                ]}
                                value={filterHotel}
                                onChange={(v) => { setFilterHotel(v); setCurrentPage(1); }}
                                width="md:w-[200px]"
                                className="text-xs md:text-sm h-11!"
                            />
                        )}
                        <SelectField
                            name="sessionFilter"
                            options={[
                                { value: "all", label: "All Sessions" },
                                { value: "MORNING", label: "Morning" },
                                { value: "AFTERNOON", label: "Afternoon" },
                                { value: "EVENING", label: "Evening" },
                            ]}
                            value={filterSession}
                            onChange={setFilterSession}
                            width="md:w-[150px]"
                        />
                        <SelectField
                            name="statusFilter"
                            options={[
                                { value: "all", label: "All Status" },
                                { value: "pending", label: "Pending" },
                                { value: "in_progress", label: "In Progress" },
                                { value: "completed", label: "Completed" },
                            ]}
                            value={filterStatus}
                            onChange={setFilterStatus}
                            width="md:w-[150px]"
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

                <DataTable
                    columns={columns}
                    data={paginatedTasks}
                    loading={loading}
                    emptyMessage="No housekeeping tasks found."
                    pagination={{
                        page: currentPage,
                        totalPages: totalPages,
                        total: tasks.length,
                        onPageChange: setCurrentPage,
                    }}
                    selectable={false}
                />

                {/* Assign Task Dialog */}
                <DialogBox
                    open={assignDialogOpen}
                    onOpenChange={setAssignDialogOpen}
                    title="Assign Housekeeping Task"
                    widthClass="max-w-md"
                >
                    {selectedTask && (
                        <div className="space-y-4 py-4">
                            <div className="bg-primary-900/10 border border-white/10 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">
                                            Room {selectedTask.room?.roomNumber || "N/A"}
                                        </h3>
                                        <p className="text-xs text-gray-400">{selectedTask.room?.roomType || "N/A"}</p>
                                    </div>
                                    {getSessionBadge(selectedTask.session)}
                                </div>
                                <div className="flex gap-2">
                                    {getStatusBadge(selectedTask.status)}
                                    {getPriorityBadge(selectedTask.priority)}
                                </div>
                            </div>

                            <SelectField
                                label="Assign to Housekeeping Staff"
                                name="staffId"
                                placeholder="Select staff member..."
                                options={
                                    housekeepingStaff.map((staff) => ({
                                        value: staff._id,
                                        label: `${staff.name} (${staff.email})`,
                                    }))
                                }
                                value={selectedStaffId}
                                onChange={setSelectedStaffId}
                                required
                            />

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setAssignDialogOpen(false)}
                                    disabled={assignLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAssignConfirm}
                                    className="bg-primary-600 hover:bg-primary-700"
                                    disabled={assignLoading || !selectedStaffId}
                                >
                                    {assignLoading ? "Assigning..." : "Assign Task"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogBox>
            </div>
        </div>
    );
};

export default RosterManagementPage;
