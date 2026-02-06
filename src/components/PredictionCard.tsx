'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface PredictionCardProps {
    trend: 'up' | 'down' | 'neutral';
    metal: string;
}

export default function PredictionCard({ trend, metal }: PredictionCardProps) {
    let color = "bg-gray-100 text-gray-800";
    let Icon = Minus;
    let label = "Neutral";

    if (trend === 'up') {
        color = "bg-green-100 text-green-800 border-green-200";
        Icon = TrendingUp;
        label = "Bullish Trend";
    } else if (trend === 'down') {
        color = "bg-red-100 text-red-800 border-red-200";
        Icon = TrendingDown;
        label = "Bearish Trend";
    }

    return (
        <Card className="border-0 shadow-sm bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metal} Forecast
                </CardTitle>
                <Icon className={`h-4 w-4 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`} />
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className={`${color} px-2 py-1 text-xs font-semibold uppercase tracking-wider`}>
                        {label}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                    Based on 7-day Simple Moving Average (SMA).
                </p>
            </CardContent>
        </Card>
    );
}
