import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    loading?: boolean;
    subtitle?: string;
    trend?: {
        value: string;
        positive?: boolean;
    };
}

const StatCard = ({
    title,
    value,
    icon: Icon,
    iconColor = "text-blue-400",
    iconBg = "bg-blue-500/10",
    loading = false,
    subtitle,
    trend,
}: KPICardProps) => {
    if (loading) {
        return (
            <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15 hover:border-primary-800/60 transition-colors">
            <div className="flex items-center gap-4">

                <div className="flex-1">
                    <p className="text-sm mb-1 text-gradient">{title}</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-2xl font-semibold">{value}</h3>
                        {trend && (
                            <span
                                className={cn(
                                    "text-xs font-medium",
                                    trend.positive
                                        ? "text-green-400"
                                        : "text-red-400"
                                )}
                            >
                                {trend.value}
                            </span>
                        )}
                    </div>
                </div>

                <div className={cn("p-3 rounded-lg", iconBg)}>
                    <Icon className={cn("h-6 w-6", iconColor)} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;

