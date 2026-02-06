'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHistory, Currency, TimeRange, City } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HistoricalRatesTableProps {
    currency: Currency;
    city: City;
}

export default function HistoricalRatesTable({ currency, city }: HistoricalRatesTableProps) {
    const { data: history, isLoading } = useQuery({
        queryKey: ['history', 'XAU', currency, '1M', city], // Using 1M to get enough daily points
        queryFn: async () => {
            // Fetch gold history with city variance
            const gold = await fetchHistory('XAU', currency, '1M', city);
            return gold.slice(0, 10); // Last 10 days
        }
    });

    // We need a helper to get silver price for the same date if possible, 
    // or just fetch silver history separately.
    const { data: silverHistory } = useQuery({
        queryKey: ['history', 'XAG', currency, '1M', city],
        queryFn: () => fetchHistory('XAG', currency, '1M', city)
    });

    if (isLoading) {
        return <Skeleton className="h-[300px] w-full" />;
    }

    // Zip data
    const rows = history?.map((item, index) => {
        const silverItem = silverHistory ? silverHistory[index] : null;
        return {
            date: item.date,
            gold: item.price,
            silver: silverItem ? silverItem.price : 0
        };
    }) || [];

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="text-lg">Closing Rates (Last 10 Days)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Gold (24k) / 10g</TableHead>
                            <TableHead className="text-right">Silver / kg</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.date}>
                                <TableCell className="font-medium">{new Date(row.date).toLocaleDateString()}</TableCell>
                                {/* Adjusted for common Indian display units: Gold / 10g, Silver / kg */}
                                <TableCell className="text-right">{currency} {((row.gold) * 10).toFixed(0)}</TableCell>
                                <TableCell className="text-right">{currency} {((row.silver) * 1000).toFixed(0)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
