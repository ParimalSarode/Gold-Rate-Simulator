'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLiveRate, SUPPORTED_CITIES, City, Currency } from '@/lib/api';
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
            const promises = SUPPORTED_CITIES
                .filter(city => city !== 'National')
                .map(async (city) => {
                    const gold24k = await fetchLiveRate('XAU', currency, city);
                    return {
                        city,
                        gold24k: gold24k.price_gram_24k,
                        gold22k: gold24k.price_gram_22k,
                        silver: (await fetchLiveRate('XAG', currency, city)).price / 31.1035 // per gram
                    };
                });
            return Promise.all(promises);
        },
        refetchInterval: 60000 * 5, // Refresh every 5 mins
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
