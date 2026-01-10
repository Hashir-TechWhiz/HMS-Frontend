"use client";

import { useState } from "react";
import DialogBox from "@/components/common/DialogBox";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface CancellationPenaltyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    booking: IBooking | null;
    penaltyAmount: number;
    penaltyMessage: string;
    onConfirm: (reason?: string) => void;
    loading?: boolean;
}

const CancellationPenaltyDialog = ({
    open,
    onOpenChange,
    booking,
    penaltyAmount,
    penaltyMessage,
    onConfirm,
    loading = false,
}: CancellationPenaltyDialogProps) => {
    const [cancellationReason, setCancellationReason] = useState("");

    const handleConfirm = () => {
        onConfirm(cancellationReason.trim() || undefined);
        setCancellationReason("");
    };

    const handleCancel = () => {
        setCancellationReason("");
        onOpenChange(false);
    };

    if (!booking) return null;

    const room = typeof booking.room === "string" ? null : booking.room;
    const roomNumber = room?.roomNumber || "N/A";
    const roomType = room?.roomType || "N/A";

    return (
        <DialogBox
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) handleCancel();
            }}
            title="Confirm Booking Cancellation"
            description="Review the cancellation penalty before proceeding"
            showFooter={true}
            confirmText="Confirm Cancellation"
            cancelText="Go Back"
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            disableConfirm={loading}
            confirmLoading={loading}
            variant="danger"
            widthClass="max-w-lg"
        >
            <div className="space-y-5 py-4">
                {/* Penalty Warning Banner */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-200">
                                Cancellation Penalty Applies
                            </p>
                            <p className="text-xs text-yellow-300/80 mt-1">
                                {penaltyMessage}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-200">
                        Booking Details
                    </h4>
                    <div className="bg-gray-800/50 rounded-lg p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Booking ID:</span>
                            <span className="text-gray-200 font-mono">
                                {booking._id.slice(-8).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Room:</span>
                            <span className="text-gray-200">
                                {roomNumber} - {roomType}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Check-in:</span>
                            <span className="text-gray-200">
                                {formatDateTime(booking.checkInDate).split(",")[0]}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Check-out:</span>
                            <span className="text-gray-200">
                                {formatDateTime(booking.checkOutDate).split(",")[0]}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <span className="text-yellow-400 capitalize font-medium">
                                {booking.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Penalty Amount */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-200">
                        Penalty Amount
                    </h4>
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                        <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">
                                Cancellation Penalty
                            </p>
                            <p className="text-2xl font-bold text-red-400">
                                LKR {penaltyAmount.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Optional Cancellation Reason */}
                <div className="space-y-2">
                    <label
                        htmlFor="cancellation-reason"
                        className="text-sm font-medium text-gray-200"
                    >
                        Cancellation Reason (Optional)
                    </label>
                    <textarea
                        id="cancellation-reason"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        placeholder="Enter reason for cancellation..."
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={500}
                        disabled={loading}
                    />
                    <p className="text-xs text-gray-500">
                        {cancellationReason.length}/500 characters
                    </p>
                </div>
            </div>
        </DialogBox>
    );
};

export default CancellationPenaltyDialog;

