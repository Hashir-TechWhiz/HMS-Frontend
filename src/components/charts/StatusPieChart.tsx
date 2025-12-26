"use client";

import { Pie, PieChart as RechartsPieChart, Cell } from "recharts";
import ChartCard from "@/components/charts/ChartCard";
import {
    ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend,
} from "@/components/ui/chart";

interface StatusPieChartProps {
    title: string;
    data: Array<{
        name: string;
        value: number;
        fill: string;
    }>;
    config: ChartConfig;
    description?: string;
}

// Custom legend content that uses the name field from data
const CustomLegendContent = ({
    payload,
    nameKey = "name",
}: {
    payload?: Array<{
        value?: any;
        dataKey?: string;
        color?: string;
        payload?: { name?: string;[key: string]: any };
        [key: string]: any;
    }>;
    nameKey?: string;
}) => {
    if (!payload?.length) {
        return null;
    }

    return (
        <div className="flex items-center justify-center gap-4 pt-3">
            {payload
                .filter((item) => item.type !== "none")
                .map((item, index) => {
                    // Get the name from the payload
                    const name = item.payload?.[nameKey] || item.dataKey || `Item ${index + 1}`;

                    return (
                        <div
                            key={item.value ?? index}
                            className="flex items-center gap-1.5"
                        >
                            <div
                                className="h-2 w-2 shrink-0 rounded-[2px]"
                                style={{
                                    backgroundColor: item.color,
                                }}
                            />
                            <span className="text-xs">{name}</span>
                        </div>
                    );
                })}
        </div>
    );
};

export const StatusPieChart = ({ title, data, config, description }: StatusPieChartProps) => {
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <ChartCard
            title={title}
            description={description}
            centeredHeader={false}
        >
            {totalValue === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </div>
            ) : (
                <div className="w-full overflow-hidden">
                    <ChartContainer config={config} className="h-[300px] w-full max-w-full [&>div]:max-w-full">
                        <RechartsPieChart>
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                innerRadius={50}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <ChartLegend content={<CustomLegendContent nameKey="name" />} />
                        </RechartsPieChart>
                    </ChartContainer>
                </div>
            )}
        </ChartCard>
    );
};

