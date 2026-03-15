'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLiveRate, SUPPORTED_CITIES, City, Currency, CITY_VARIANCE } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CityRatesTableProps {
    currency: Currency;
}

export default function CityRatesTable({ currency }: CityRatesTableProps) {
    const { data: cityRates, isLoading } = useQuery({
        queryKey: ['cityRates', currency],
        queryFn: async () => {
            // Fetch base rates ONCE to avoid API rate limits (429)
            const [baseGold, baseSilver] = await Promise.all([
                fetchLiveRate('XAU', currency, 'National'),
                fetchLiveRate('XAG', currency, 'National')
            ]);

            return SUPPORTED_CITIES
                .filter(city => city !== 'National')
                .map((city) => {
                    const variance = CITY_VARIANCE[city] || 0;

                    // Apply variance locally
                    const goldPrice = baseGold.price * (1 + variance);
                    const silverPrice = baseSilver.price * (1 + variance);

                    // Calculate gram rates
                    const gold24k = goldPrice / 31.1035;
                    const silverGram = silverPrice / 31.1035;

                    return {
                        city,
                        gold24k: gold24k,
                        gold22k: gold24k * 0.916,
                        silver: silverGram
                    };
                });
        },
        refetchInterval: false, // Strict "once per reload" as requested
        staleTime: Infinity,
    });

    if (isLoading) {
        return <Skeleton className="h-[400px] w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">City-wise Rates (Today)</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>City</TableHead>
                            <TableHead className="text-right">Gold 24k /g</TableHead>
                            <TableHead className="text-right">Gold 22k /g</TableHead>
                            <TableHead className="text-right">Silver /g</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cityRates?.map((rate) => (
                            <TableRow key={rate.city}>
                                <TableCell className="font-medium">{rate.city}</TableCell>
                                <TableCell className="text-right">{currency} {rate.gold24k.toFixed(0)}</TableCell>
                                <TableCell className="text-right">{currency} {rate.gold22k.toFixed(0)}</TableCell>
                                <TableCell className="text-right">{currency} {rate.silver.toFixed(1)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
