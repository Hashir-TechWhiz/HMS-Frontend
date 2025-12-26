"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    gradient?: string;
    iconBg?: string;
    iconColor?: string;
    className?: string;
}

export const KPICard = ({
    title,
    value,
    description,
    icon: Icon,
    gradient,
    iconBg = "bg-white/10",
    iconColor = "text-white",
    className,
}: KPICardProps) => {
    return (
        <div
            className={cn(
                "flex items-center justify-between px-6 py-5 rounded-2xl border border-white/10 shadow-md transition-all duration-300 hover:shadow-lg hover:border-white/20 backdrop-blur-sm",
                className
            )}
            style={{
                background:
                    gradient ??
                    "linear-gradient(79.74deg, rgba(166,255,0,0.12) 0%, rgba(0,0,0,0.12) 100%)",
            }}
        >
            {/* LEFT */}
            <div className="flex flex-col gap-1.5">
                <p className="text-lg text-gradient">
                    {title}
                </p>

                <h2 className="text-2xl font-semibold text-gradient">
                    {value}
                </h2>

                {description && (
                    <p className="text-xs text-gray-400 mt-0.5">
                        {description}
                    </p>
                )}
            </div>

            {/* RIGHT ICON */}
            {Icon && (
                <div
                    className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl transition-transform hover:scale-110",
                        iconBg
                    )}
                >
                    <Icon className={cn("w-6 h-6", iconColor)} />
                </div>
            )}
        </div>
    );
};
