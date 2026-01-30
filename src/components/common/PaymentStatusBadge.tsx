"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface PaymentStatusBadgeProps {
    status: PaymentStatus;
    className?: string;
}

const PaymentStatusBadge = ({ status, className = "" }: PaymentStatusBadgeProps) => {
    const getStatusConfig = (status: PaymentStatus) => {
        switch (status) {
            case "paid":
                return {
                    label: "Paid",
                    className: "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
                    icon: CheckCircle2,
                };
            case "partially_paid":
                return {
                    label: "Partially Paid",
                    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
                    icon: Clock,
                };
            case "unpaid":
                return {
                    label: "Unpaid",
                    className: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
                    icon: AlertCircle,
                };
            default:
                return {
                    label: "Unknown",
                    className: "bg-gray-500/10 text-gray-500 border-gray-500/20 hover:bg-gray-500/20",
                    icon: AlertCircle,
                };
        }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
        <Badge className={`${config.className} ${className} flex items-center gap-1.5 px-2.5 py-1`}>
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium">{config.label}</span>
        </Badge>
    );
};

export default PaymentStatusBadge;
