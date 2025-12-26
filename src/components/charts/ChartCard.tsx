"use client";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";

interface ChartCardProps {
    title: string;
    description?: string;
    footer?: React.ReactNode;
    children: React.ReactNode;
    centeredHeader?: boolean;
    headerRight?: React.ReactNode;
}

export default function ChartCard({
    title,
    description,
    footer,
    children,
    centeredHeader = true,
    headerRight,
}: ChartCardProps) {
    const headerClasses = centeredHeader
        ? "items-center pb-0"
        : "flex md:flex-row flex-col items-start md:items-center md:justify-between gap-2 pb-0";

    return (
        <Card className="flex flex-col rounded-xl border-2 border-gradient border-primary-900/40 table-bg-gradient shadow-lg shadow-primary-900/15 h-full">

            {/* HEADER */}
            <CardHeader className={headerClasses}>

                {/* LEFT SIDE */}
                <div className="grid flex-1 gap-1">
                    <CardTitle className="text-gradient">{title}</CardTitle>
                    {description && (
                        <CardDescription>{description}</CardDescription>
                    )}
                </div>

                {/* RIGHT SIDE (only if passed) */}
                {headerRight && (
                    <div className="shrink-0 flex items-center">
                        {headerRight}
                    </div>
                )}
            </CardHeader>

            {/* BODY */}
            <CardContent className="flex-1 pb-0 overflow-hidden">
                {children}
            </CardContent>

            {/* FOOTER */}
            {footer && (
                <CardFooter className="flex-col gap-2 text-sm">
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
}
