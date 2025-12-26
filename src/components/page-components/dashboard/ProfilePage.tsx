"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "@/services/authService";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import DialogBox from "@/components/common/DialogBox";
import InputField from "@/components/forms/InputField";
import { formatDateTime, formatUserRole } from "@/lib/utils";
import { User, Mail, Shield, Calendar, BadgeCheck, Key, AlertCircle} from "lucide-react";

const ProfilePage = () => {
    const { user, loading: authLoading, refreshUser } = useAuth();

    const [updateLoading, setUpdateLoading] = useState(false);
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<{
        name: string;
    }>();

    // Reset form when user data loads
    useEffect(() => {
        if (user) {
            reset({
                name: user.name,
            });
        }
    }, [user, reset]);

    // Handle profile update
    const onSubmit = async (data: { name: string }) => {
        if (!user) return;

        try {
            setUpdateLoading(true);

            const response = await updateProfile({
                name: data.name,
            });

            if (response.success) {
                toast.success("Profile updated successfully");
                await refreshUser();
            } else {
                toast.error(response.message || "Failed to update profile");
            }
        } catch (error: any) {
            toast.error(error?.message || "An error occurred while updating profile");
        } finally {
            setUpdateLoading(false);
        }
    };

    // Handle password change redirect
    const handlePasswordChange = () => {
        setPasswordDialogOpen(false);
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">User not found</p>
            </div>
        );
    }

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

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Profile Information Section */}
                <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                            <User className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                            <p className="text-sm text-gray-400">Update your personal details</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <InputField
                                name="name"
                                label="Full Name *"
                                placeholder="Enter your full name"
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
                                label="Email Address"
                                placeholder={user.email}
                                type="email"
                                register={register}
                                disabled={true}
                                readonly={true}
                                value={user.email}
                            />
                        </div>

                        <div className="flex w-full">
                            <Button
                                type="submit"
                                disabled={updateLoading}
                                className="w-full"
                            >
                                {updateLoading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </form>
                </div>


                {/* Account Details Section */}
                {/* Account Details Section */}
                <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                            <BadgeCheck className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Account Details</h2>
                            <p className="text-sm text-gray-400">View your account information</p>
                        </div>
                    </div>

                    {/* DETAILS */}
                    <div className="space-y-4">
                        {/* Role */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Shield className="h-4 w-4" />
                                <span className="text-sm">Role</span>
                            </div>
                            <p className="text-base font-medium text-white">
                                {formatUserRole(user.role)}
                            </p>
                        </div>

                        {/* Account Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Mail className="h-4 w-4" />
                                <span className="text-sm">Account Status</span>
                            </div>
                            <StatusBadge isActive={user.isActive} />
                        </div>

                        {/* Member Since */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Member Since</span>
                            </div>
                            <p className="text-base font-medium text-white">
                                {formatDateTime(user.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* Security Section */}
            <div className="space-y-6 p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/10">
                        <Shield className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                        <p className="text-sm text-gray-400">Manage your password and security settings</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 rounded-lg bg-gray-800/30 border border-gray-700/50">
                        <div className="flex items-start gap-3">
                            <Key className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-white">Password</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Last updated: {formatDateTime(user.updatedAt)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPasswordDialogOpen(true)}
                            className="flex items-center gap-2"
                        >
                            Change Password
                        </Button>
                    </div>
                </div>
            </div>

            {/* Password Change Dialog */}
            <DialogBox
                open={passwordDialogOpen}
                onOpenChange={setPasswordDialogOpen}
                title="Change Password"
                widthClass="max-w-md"
            >
                <div className="space-y-4 py-4">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
                        <div className="text-sm text-gray-300">
                            <p className="font-medium text-blue-400 mb-1">Password Reset Required</p>
                            <p>
                                To change your password, please log out and proceed to the password reset page,
                                where you can securely update your password using email verification.
                            </p>

                        </div>
                    </div>

                    <div className="flex gap-3 pt-2 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setPasswordDialogOpen(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button onClick={handlePasswordChange} className="flex-1">
                            Ok Got it!
                        </Button>
                    </div>
                </div>
            </DialogBox>
        </div>
    );
};

export default ProfilePage;

