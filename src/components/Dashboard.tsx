'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLiveRate, fetchHistory, Currency, MetalRate, TimeRange, City, SUPPORTED_CITIES } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import PriceChart from './PriceChart';
import PredictionCard from './PredictionCard';
import CityRatesTable from './CityRatesTable';
import HistoricalRatesTable from './HistoricalRatesTable';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';

export default function Dashboard() {
    const [currency, setCurrency] = useState<Currency>('INR');
    const [city, setCity] = useState<City>('National');
    const [timeRange, setTimeRange] = useState<TimeRange>('1D');
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const { data: goldData, isLoading: isGoldLoading, refetch: refetchGold } = useQuery({
        queryKey: ['liveRate', 'XAU', currency, city],
        queryFn: async () => {
            const data = await fetchLiveRate('XAU', currency, city);
            setLastUpdated(new Date());
            return data;
        },
        refetchInterval: 60000,
    });

    const { data: silverData, isLoading: isSilverLoading, refetch: refetchSilver } = useQuery({
        queryKey: ['liveRate', 'XAG', currency, city],
        queryFn: () => fetchLiveRate('XAG', currency, city),
        refetchInterval: 60000,
    });

    // Calculate trends (Simple mock logic based on current price vs prev close if history not fully ready)
    // Or fetch history here to determine SMA trend.
    // For this v1, let's use the 'ch' (change) field for immediate trend, 
    // or fetches history for proper SMA calculation. Let's do simple change-based for now to save API calls.
    // Actually plan said SMA. Let's fetch history for Gold to compute SMA.
    const { data: goldHistory } = useQuery({
        queryKey: ['history', 'XAU', currency, '1W'], // Use 1W for trend calculation as fallback
        queryFn: () => fetchHistory('XAU', currency, '1W')
    });

    const goldTrend: 'up' | 'down' | 'neutral' = useMemo(() => {
        if (!goldHistory || goldHistory.length < 7 || !goldData) return 'neutral';
        // Simple SMA
        const last7 = goldHistory.slice(0, 7);
        const sma = last7.reduce((acc, curr) => acc + curr.price, 0) / 7;
        return goldData.price > sma ? 'up' : 'down';
    }, [goldHistory, goldData]);

    const silverTrend: 'up' | 'down' | 'neutral' = useMemo(() => {
        // Simplifying silver to follow daily change
        if (!silverData) return 'neutral';
        return silverData.ch >= 0 ? 'up' : 'down';
    }, [silverData]);

    const handleRefresh = () => {
        refetchGold();
        refetchSilver();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Metal Rates</h1>
                    <p className="text-muted-foreground text-sm">Live market data for Gold & Silver</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={city} onValueChange={(v) => setCity(v as City)}>
                        <SelectTrigger className="w-[140px] bg-background">
                            <SelectValue placeholder="City" />
                        </SelectTrigger>
                        <SelectContent>
                            {SUPPORTED_CITIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
                        <SelectTrigger className="w-[100px] bg-background">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                            <SelectItem value="INR">INR (₹)</SelectItem>
                            <SelectItem value="AUD">AUD (A$)</SelectItem>
                            <SelectItem value="CAD">CAD (C$)</SelectItem>
                        </SelectContent>
                    </Select>
                    <ModeToggle />
                    <Button variant="outline" size="icon" onClick={handleRefresh}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="gold" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="gold">Gold (XAU)</TabsTrigger>
                    <TabsTrigger value="silver">Silver (XAG)</TabsTrigger>
                </TabsList>

                <TabsContent value="gold" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetalPriceCard
                            title="24k Gold"
                            price={goldData?.price_gram_24k}
                            currency={currency}
                            loading={isGoldLoading}
                            change={goldData?.chp}
                            unit="/g"
                        />
                        <MetalPriceCard
                            title="22k Gold"
                            price={goldData?.price_gram_22k}
                            currency={currency}
                            loading={isGoldLoading}
                            change={goldData?.chp}
                            unit="/g"
                        />
                        <MetalPriceCard
                            title="18k Gold"
                            price={goldData?.price_gram_18k}
                            currency={currency}
                            loading={isGoldLoading}
                            change={goldData?.chp}
                            unit="/g"
                        />
                        <PredictionCard trend={goldTrend} metal="Gold" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-7">
                        <div className="col-span-4 md:col-span-5 relative">
                            <div className="absolute top-4 right-4 z-10">
                                <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className="w-auto">
                                    <TabsList className="grid w-full grid-cols-3 h-8">
                                        <TabsTrigger value="1D" className="text-xs">1D</TabsTrigger>
                                        <TabsTrigger value="1W" className="text-xs">1W</TabsTrigger>
                                        <TabsTrigger value="1M" className="text-xs">1M</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <PriceChart
                                metal="XAU"
                                currency={currency}
                                range={timeRange}
                                currentPrice={goldData?.price_gram_24k} // Pass per-gram price
                            />
                            {/* Moved here to fill empty space below graph */}
                            <HistoricalRatesTable currency={currency} city={city} />
                        </div>
                        <div className="col-span-3 md:col-span-2 space-y-4">
                            {/* Additional Details Side Panel */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Market Stats ({city})</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bid</span>
                                        <span className="font-medium">{goldData?.bid?.toFixed(2) ?? '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ask</span>
                                        <span className="font-medium">{goldData?.ask?.toFixed(2) ?? '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Day High</span>
                                        <span className="font-medium text-green-600">{goldData?.high_price?.toFixed(2) ?? '-'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Day Low</span>
                                        <span className="font-medium text-red-600">{goldData?.low_price?.toFixed(2) ?? '-'}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* City Comparison Table */}
                            <CityRatesTable currency={currency} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="silver" className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetalPriceCard
                            title="Silver"
                            // API might not give gram price directly for silver in same fields sometimes, 
                            // but our mock/interface has price (usually per oz). 
                            // Let's assume price is per oz, so / 31.1035 for gram
                            price={silverData ? silverData.price / 31.1035 : undefined}
                            currency={currency}
                            loading={isSilverLoading}
                            change={silverData?.chp}
                            unit="/g"
                        />
                        <MetalPriceCard
                            title="Silver (oz)"
                            price={silverData?.price}
                            currency={currency}
                            loading={isSilverLoading}
                            change={silverData?.chp}
                            unit="/oz"
                        />
                        <div className="hidden lg:block lg:col-span-1"></div>
                        <PredictionCard trend={silverTrend} metal="Silver" />
                    </div>
                    <div className="grid gap-4 relative">
                        <div className="absolute top-4 right-4 z-10">
                            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)} className="w-auto">
                                <TabsList className="grid w-full grid-cols-3 h-8">
                                    <TabsTrigger value="1D" className="text-xs">1D</TabsTrigger>
                                    <TabsTrigger value="1W" className="text-xs">1W</TabsTrigger>
                                    <TabsTrigger value="1M" className="text-xs">1M</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                        <PriceChart
                            metal="XAG"
                            currency={currency}
                            range={timeRange}
                            currentPrice={silverData ? silverData.price / 31.1035 : undefined} // Pass per-gram price
                        />
                        <HistoricalRatesTable currency={currency} city={city} />
                    </div>
                </TabsContent>
            </Tabs>

            <div className="text-center text-xs text-muted-foreground pt-10">
                Last updated: {lastUpdated?.toLocaleTimeString()}
            </div>
        </div>
    );
}

function MetalPriceCard({ title, price, currency, loading, change, unit }: { title: string, price?: number, currency: string, loading: boolean, change?: number, unit: string }) {
    if (loading) {
        return <Skeleton className="h-[120px] w-full rounded-xl" />;
    }

    const isPositive = (change || 0) >= 0;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {change !== undefined && (
                    <Badge variant={isPositive ? "default" : "destructive"} className={`text-[10px] px-1 py-0 ${isPositive ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                        {isPositive ? '+' : ''}{change}%
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {currency === 'USD' ? '$' : currency} {price?.toFixed(2) ?? 'N/A'} {unit && <span className="text-sm font-normal text-muted-foreground">{unit}</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Live Rate
                </p>
            </CardContent>
        </Card>
    )
}
