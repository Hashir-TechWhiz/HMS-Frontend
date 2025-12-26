"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface ActionCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    gradient?: string;
    onClick?: () => void;
    className?: string;
}

export const ActionCard = ({
    title,
    description,
    icon: Icon,
    iconColor = "text-blue-400",
    iconBg = "bg-blue-500/10",
    gradient = "linear-gradient(79.74deg, rgba(0, 128, 255, 0.08) 0%, rgba(0, 0, 0, 0.08) 100%)",
    onClick,
    className,
}: ActionCardProps) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex items-center justify-between px-6 py-5 rounded-2xl border border-white/10 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-[0.98]",
                className
            )}
            style={{
                background: gradient,
            }}
        >
            {/* LEFT: Icon and Content */}
            <div className="flex items-center gap-4">
                <div
                    className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl transition-transform group-hover:scale-110",
                        iconBg
                    )}
                >
                    <Icon className={cn("w-6 h-6", iconColor)} />
                </div>

                <div className="text-left">
                    <p className="text-sm font-semibold text-white mb-1">
                        {title}
                    </p>
                    <p className="text-xs text-gray-400">
                        {description}
                    </p>
                </div>
            </div>

            {/* RIGHT: Arrow */}
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
        </button>
    );
};

