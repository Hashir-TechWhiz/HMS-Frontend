"use client";

import {
    useState,
    useEffect,
    useCallback
} from "react";

import { useAuth } from "@/contexts/AuthContext";

import {
    getUsers,
    createUser,
    updateUser,
    updateUserStatus,
    getUserStatistics
} from "@/services/adminUserService";

import { useForm } from "react-hook-form";
import { formatDateTime } from "@/lib/utils";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/common/StatCard";
import DialogBox from "@/components/common/DialogBox";
import DataTable from "@/components/common/DataTable";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";

import { Eye, Pencil, UserCheck, UserX, Plus, Users, CheckCircle2, Ban } from "lucide-react";

const UsersPage = () => {
    const { role, loading: authLoading, user: currentUser } = useAuth();

    const [users, setUsers] = useState<IUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // KPI states
    const [kpiLoading, setKpiLoading] = useState(false);
    const [userStats, setUserStats] = useState<{ total: number; active: number; byRole: Record<UserRole, number> } | null>(null);

    // Dialog states
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<boolean>(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        control,
    } = useForm<{
        name: string;
        email: string;
        password: string;
        role: UserRole;
    }>();

    // Fetch users (excluding guests - they are managed separately)
    const fetchUsers = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setLoading(true);
            const response = await getUsers();

            if (response.success) {
                const usersData: any = response.data;
                const usersArray = Array.isArray(usersData) ? usersData : (usersData?.items || []);

                // Filter out guest users - they are managed in a separate guest management page
                const systemUsers = usersArray.filter((user: IUser) => user.role !== "guest");

                setUsers(systemUsers);
                setTotalPages(1);
                setTotalItems(systemUsers.length);
            } else {
                toast.error(response.message || "Failed to fetch users");
            }
        } catch {
            toast.error("An error occurred while fetching users");
        } finally {
            setLoading(false);
        }
    }, [role, authLoading]);

    // Fetch user statistics
    const fetchUserStats = useCallback(async () => {
        if (!role || authLoading) return;

        try {
            setKpiLoading(true);
            const response = await getUserStatistics();
            if (response.success && response.data) {
                setUserStats(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch user statistics:", error);
        } finally {
            setKpiLoading(false);
        }
    }, [role, authLoading]);

    useEffect(() => {
        if (role && !authLoading) {
            fetchUsers();
            fetchUserStats();
        }
    }, [role, authLoading, fetchUsers, fetchUserStats]);

    // Handle page change
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Handle view details
    const handleViewDetails = (user: IUser) => {
        setSelectedUser(user);
        setViewDialogOpen(true);
    };

    // Handle add user
    const handleAddClick = () => {
        setIsEditMode(false);
        setSelectedUser(null);
        reset({
            name: "",
            email: "",
            password: "",
            role: "receptionist",
        });
        setFormDialogOpen(true);
    };

    // Handle edit user
    const handleEditClick = (user: IUser) => {
        setIsEditMode(true);
        setSelectedUser(user);
        reset({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
        });
        setFormDialogOpen(true);
    };

    // Handle status change click
    const handleStatusClick = (user: IUser, newStatus: boolean) => {
        // Prevent deactivating own account
        if (currentUser && user._id === currentUser._id && !newStatus) {
            toast.error("You cannot deactivate your own account");
            return;
        }

        setSelectedUser(user);
        setPendingStatus(newStatus);
        setStatusDialogOpen(true);
    };

    // Handle form submit
    const onSubmit = async (data: {
        name: string;
        email: string;
        password: string;
        role: UserRole;
    }) => {
        // Prevent changing own role
        if (isEditMode && selectedUser && currentUser && selectedUser._id === currentUser._id) {
            if (data.role !== selectedUser.role) {
                toast.error("You cannot change your own role");
                return;
            }
        }

        // Validation for create mode
        if (!isEditMode) {
            if (!data.password || data.password.length < 6) {
                toast.error("Password must be at least 6 characters");
                return;
            }
        }

        try {
            setFormLoading(true);

            let response;
            if (isEditMode && selectedUser) {
                // Update existing user (name and role only)
                response = await updateUser(selectedUser._id, {
                    name: data.name,
                    role: data.role,
                });

                if (response.success) {
                    toast.success("User updated successfully");
                    setFormDialogOpen(false);
                    fetchUsers();
                } else {
                    toast.error(response.message || "Failed to update user");
                }
            } else {
                // Create new user
                response = await createUser({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                });

                if (response.success) {
                    toast.success("User created successfully");
                    setFormDialogOpen(false);
                    fetchUsers();
                } else {
                    toast.error(response.message || "Failed to create user");
                }
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    // Handle status change confirm
    const handleStatusConfirm = async () => {
        if (!selectedUser) return;

        try {
            setStatusLoading(true);

            const response = await updateUserStatus(selectedUser._id, pendingStatus);

            if (response.success) {
                toast.success(
                    `User ${pendingStatus ? "activated" : "deactivated"} successfully`
                );
                setStatusDialogOpen(false);
                setSelectedUser(null);
                fetchUsers();
            } else {
                toast.error(response.message || "Failed to update user status");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred while updating user status");
        } finally {
            setStatusLoading(false);
        }
    };

    // Status badge
    const StatusBadge = ({ isActive }: { isActive: boolean }) => {
        return (
            <span
                className={`px-2 py-1 rounded-md text-xs font-medium border ${isActive
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-red-500/20 text-red-400 border-red-500/50"
                    }`}
            >
                {isActive ? "Active" : "Inactive"}
            </span>
        );
    };

    // Role badge
    const RoleBadge = ({ role }: { role: UserRole }) => {
        const colors: Record<UserRole, string> = {
            admin: "bg-purple-500/20 text-purple-400 border-purple-500/50",
            receptionist: "bg-blue-500/20 text-blue-400 border-blue-500/50",
            housekeeping: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
            guest: "bg-gray-500/20 text-gray-400 border-gray-500/50",
        };

        return (
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[role]}`}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
        );
    };

    // Role options (exclude guest from admin panel)
    const roleOptions: Option[] = [
        { value: "receptionist", label: "Receptionist" },
        { value: "housekeeping", label: "Housekeeping" },
        { value: "admin", label: "Admin" },
    ];

    // Define columns
    const columns = [
        {
            key: "createdAt",
            label: "Created Date",
            render: (user: IUser) => formatDateTime(user.createdAt),
        },
        {
            key: "name",
            label: "Name",
            render: (user: IUser) => (
                <span className="font-medium">{user.name}</span>
            ),
        },
        {
            key: "email",
            label: "Email",
            render: (user: IUser) => <span className="text-sm">{user.email}</span>,
        },
        {
            key: "role",
            label: "Role",
            render: (user: IUser) => <RoleBadge role={user.role} />,
        },
        {
            key: "status",
            label: "Status",
            render: (user: IUser) => <StatusBadge isActive={user.isActive} />,
        },
        {
            key: "actions",
            label: "Actions",
            render: (user: IUser) => (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(user)}
                        className="h-8 px-2"
                        title="View Details"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(user)}
                        className="h-8 px-2"
                        title="Edit User"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    {user.isActive ? (
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusClick(user, false)}
                            className="h-8 px-2"
                            title="Deactivate User"
                            disabled={currentUser?._id === user._id}
                        >
                            <UserX className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusClick(user, true)}
                            className="h-8 px-2 text-green-400 hover:text-green-300"
                            title="Activate User"
                        >
                            <UserCheck className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    if (authLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            {userStats && !loading && (() => {
                const totalSystemUsers = (userStats.byRole.admin || 0) +
                    (userStats.byRole.receptionist || 0) +
                    (userStats.byRole.housekeeping || 0);
                const activeSystemUsers = users.filter(u => u.isActive).length;
                const inactiveSystemUsers = totalSystemUsers - activeSystemUsers;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <StatCard
                            title="Total Staff"
                            value={totalSystemUsers}
                            icon={Users}
                            iconColor="text-blue-400"
                            iconBg="bg-blue-500/10"
                            loading={kpiLoading}
                            subtitle="System users (excl. guests)"
                        />
                        <StatCard
                            title="Active Staff"
                            value={activeSystemUsers}
                            icon={CheckCircle2}
                            iconColor="text-green-400"
                            iconBg="bg-green-500/10"
                            loading={kpiLoading}
                            subtitle="Currently active"
                        />
                        <StatCard
                            title="Inactive Staff"
                            value={inactiveSystemUsers}
                            icon={Ban}
                            iconColor="text-red-400"
                            iconBg="bg-red-500/10"
                            loading={kpiLoading}
                            subtitle="Deactivated accounts"
                        />
                    </div>
                );
            })()}

            {/* Table */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white">User Management</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            View and manage all system users
                        </p>
                    </div>
                    <Button onClick={handleAddClick} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                </div>

                <DataTable
                    columns={columns}
                    data={users}
                    loading={loading}
                    emptyMessage="No users found."
                    pagination={{
                        page: currentPage,
                        totalPages: totalPages,
                        total: totalItems,
                        onPageChange: handlePageChange,
                    }}
                    selectable={false}
                />
                {/* View Details Dialog */}
                <DialogBox
                    open={viewDialogOpen}
                    onOpenChange={setViewDialogOpen}
                    title="User Details"
                    widthClass="max-w-2xl"
                >
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-400">User ID</p>
                                    <p className="text-sm font-medium">{selectedUser._id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Status</p>
                                    <StatusBadge isActive={selectedUser.isActive} />
                                </div>
                            </div>
                            <div className="border-t border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold mb-3">User Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Name</p>
                                        <p className="text-sm font-medium">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Email</p>
                                        <p className="text-sm font-medium">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Role</p>
                                        <RoleBadge role={selectedUser.role} />
                                    </div>
                                </div>
                            </div>
                            <div className="border-t border-gray-700 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-400">Created At</p>
                                        <p className="text-sm font-medium">
                                            {formatDateTime(selectedUser.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Last Updated</p>
                                        <p className="text-sm font-medium">
                                            {formatDateTime(selectedUser.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogBox>
                {/* Add/Edit Form Dialog */}
                <DialogBox
                    open={formDialogOpen}
                    onOpenChange={setFormDialogOpen}
                    title={isEditMode ? "Edit User" : "Add New User"}
                    widthClass="max-w-xl"
                    showFooter
                    confirmText={isEditMode ? "Update User" : "Create User"}
                    cancelText="Cancel"
                    onConfirm={handleSubmit(onSubmit)}
                    onCancel={() => setFormDialogOpen(false)}
                    disableConfirm={formLoading}
                    confirmLoading={formLoading}
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(onSubmit)(e);
                        }}
                        className="space-y-4 py-4"
                    >
                        <InputField
                            name="name"
                            label="Name *"
                            placeholder="Enter user name"
                            register={register}
                            error={errors.name}
                            validation={{
                                required: "Name is required",
                                minLength: {
                                    value: 2,
                                    message: "Name must be at least 2 characters",
                                },
                            }}
                        />
                        <InputField
                            name="email"
                            label="Email *"
                            type="email"
                            placeholder="Enter email address"
                            register={register}
                            error={errors.email}
                            validation={{
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address",
                                },
                            }}
                            disabled={isEditMode}
                            readonly={isEditMode}
                        />
                        {!isEditMode && (
                            <InputField
                                name="password"
                                label="Password *"
                                type="password"
                                placeholder="Enter password (min 6 characters)"
                                register={register}
                                error={errors.password}
                                validation={{
                                    required: "Password is required",
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters",
                                    },
                                }}
                            />
                        )}
                        <SelectField
                            name="role"
                            label="Role *"
                            options={roleOptions}
                            control={control}
                            required
                            error={errors.role}
                            disabled={
                                isEditMode &&
                                !!selectedUser &&
                                !!currentUser &&
                                selectedUser._id === currentUser._id
                            }
                        />
                        {isEditMode &&
                            selectedUser &&
                            currentUser &&
                            selectedUser._id === currentUser._id && (
                                <p className="text-xs text-yellow-500">
                                    Note: You cannot change your own role
                                </p>
                            )}
                    </form>
                </DialogBox>
                {/* Status Change Confirmation Dialog */}
                <DialogBox
                    open={statusDialogOpen}
                    onOpenChange={setStatusDialogOpen}
                    title={`${pendingStatus ? "Activate" : "Deactivate"} User`}
                    description={`Are you sure you want to ${pendingStatus ? "activate" : "deactivate"
                        } ${selectedUser?.name}? ${!pendingStatus
                            ? "This user will no longer be able to access the system."
                            : "This user will regain access to the system."
                        }`}
                    showFooter
                    confirmText={pendingStatus ? "Activate User" : "Deactivate User"}
                    cancelText="Cancel"
                    onConfirm={handleStatusConfirm}
                    onCancel={() => setStatusDialogOpen(false)}
                    confirmLoading={statusLoading}
                    variant={pendingStatus ? "default" : "danger"}
                />
            </div>
        </div>
    );
};

export default UsersPage;