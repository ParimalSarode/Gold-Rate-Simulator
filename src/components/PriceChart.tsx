'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { TimeRange, fetchHistory, Currency } from "@/lib/api"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"

interface PriceChartProps {
    metal: 'XAU' | 'XAG';
    currency: Currency;
    range: TimeRange;
    currentPrice?: number;
}

export default function PriceChart({ metal, currency, range, currentPrice }: PriceChartProps) {
    const { data: tempHistory, isLoading, isError } = useQuery({
        queryKey: ['history', metal, currency, range],
        queryFn: () => fetchHistory(metal, currency, range, 'National'), // Chart always shows National trend for now unless we pass city
        // refetchInterval: range === '1D' ? 1000 : undefined, // Disabled as per user request
    });

    const isGold = metal === 'XAU';
    const color = isGold ? '#fbbf24' : '#94a3b8'; // Amber-400 vs Slate-400
    const gradientId = isGold ? "colorGold" : "colorSilver";

    if (isLoading) {
        return <Skeleton className="h-[300px] w-full rounded-xl" />;
    }

    // Sort data just in case
    const history = tempHistory?.slice().reverse() || [];

    // Sync latest point with currentPrice if in Live (1D) mode
    if (range === '1D' && currentPrice && history.length > 0) {
        // Replace the last point (which is "now") with the actual live price from the prop
        // to ensure perfect sync with the dashboard card and real-time feel.
        const lastPoint = history[history.length - 1];
        history[history.length - 1] = {
            ...lastPoint,
            price: currentPrice,
            // Update time to now to ensure x-axis is fresh
            date: new Date().toISOString()
        };
    }

    if (isError || !history) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Unable to load chart data
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full shadow-md border-0 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                    <span>{metal === 'XAU' ? 'Gold' : 'Silver'} Price Trend</span>
                    {range === '1D' && (
                        <span className="flex items-center gap-1 text-xs text-green-500 animate-pulse">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            LIVE
                        </span>
                    )}
                </CardTitle>
                <CardDescription>
                    Price movement in {currency} ({range === '1D' ? 'Last 24h' : range === '1W' ? 'Last 7 Days' : 'Last 30 Days'})
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={history}>
                            <defs>
                                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const d = new Date(str);
                                    if (range === '1D') {
                                        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                    }
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                fontSize={12}
                                minTickGap={30}
                            />
                            <YAxis
                                hide={false}
                                domain={['auto', 'auto']}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                                fontSize={12}
                                tickFormatter={(val) => `${val / 1000}k`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                labelFormatter={(label) => {
                                    const d = new Date(label);
                                    return range === '1D'
                                        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : d.toLocaleDateString();
                                }}
                                formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Price']}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke={color}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#${gradientId})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
