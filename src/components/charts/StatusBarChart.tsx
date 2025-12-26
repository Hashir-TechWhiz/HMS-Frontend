"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    LabelList,
    Cell
} from "recharts";

import ChartCard from "@/components/charts/ChartCard";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartConfig
} from "@/components/ui/chart";

interface StatusBarChartProps {
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
                            <span className="text-sm">{name}</span>
                        </div>
                    );
                })}
        </div>
    );
};

export const StatusBarChart = ({ title, data, config, description }: StatusBarChartProps) => {
    const hasData = data.some(item => item.value > 0);

    return (
        <ChartCard
            title={title}
            description={description}
            centeredHeader={false}
        >
            {!hasData ? (
                <div className="h-full w-full min-h-[250px] max-h-[250px] flex items-center justify-center text-muted-foreground">
                    No data available
                </div>
            ) : (
                <ChartContainer config={config} className="h-full w-full min-h-[250px] max-h-[300px]">
                    <BarChart
                        data={data}
                        layout="vertical"
                        key={JSON.stringify(data)}
                    >
                        <CartesianGrid horizontal={false} />

                        <XAxis
                            type="number"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                        />

                        <YAxis
                            dataKey="name"
                            type="category"
                            hide
                        />

                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                        />

                        <Bar
                            dataKey="value"
                            radius={[10, 10, 10, 10]}
                            isAnimationActive={true}
                            animationDuration={1200}
                            animationBegin={100}
                            barSize={40}
                            animationEasing="ease-in"
                        >
                            {/* Labels inside the bar */}
                            <LabelList
                                dataKey="name"
                                position="insideLeft"
                                offset={10}
                                className="fill-white"
                                fontSize={12}
                            />

                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>

                        <ChartLegend content={<CustomLegendContent nameKey="name" />} />
                    </BarChart>
                </ChartContainer>
            )}
        </ChartCard>
    );
};

