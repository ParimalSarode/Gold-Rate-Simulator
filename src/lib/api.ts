import axios from 'axios';

// Interfaces for API response
export interface MetalRate {
    timestamp: number;
    metal: string;
    currency: string;
    exchange: string;
    symbol: string;
    prev_close_price: number;
    open_price: number;
    low_price: number;
    high_price: number;
    open_time: number;
    price: number;
    ch: number; // change
    chp: number; // change percent
    ask: number;
    bid: number;
    price_gram_24k: number;
    price_gram_22k: number;
    price_gram_21k: number;
    price_gram_20k: number;
    price_gram_18k: number;
    price_gram_16k: number;
    price_gram_14k: number;
    price_gram_10k: number;
}

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AUD' | 'CAD';
export type TimeRange = '1D' | '1W' | '1M';
export type City = 'National' | 'Mumbai' | 'Delhi' | 'Bangalore' | 'Chennai' | 'Kolkata' | 'Hyderabad' | 'Ahmedabad' | 'Pune' | 'Jaipur' | 'Lucknow' | 'Chandigarh' | 'Nagpur';

export const SUPPORTED_CITIES: City[] = [
    'National', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
    'Hyderabad', 'Ahmedabad', 'Pune', 'Jaipur', 'Lucknow', 'Chandigarh', 'Nagpur'
];

// Variance factors (premium/discount) relative to National average
const CITY_VARIANCE: Record<City, number> = {
    'National': 0,
    'Mumbai': 0.002, // +0.2% (Hub)
    'Delhi': 0.003, // +0.3%
    'Chennai': 0.005, // +0.5% (High demand)
    'Kolkata': 0.004,
    'Bangalore': 0.001,
    'Hyderabad': 0.0015,
    'Ahmedabad': -0.001, // Slightly lower
    'Pune': 0.001,
    'Jaipur': 0.002,
    'Lucknow': 0.0025,
    'Chandigarh': 0.003,
    'Nagpur': 0.0015 // Similar to Hyderabad/Pune
};

// Mock data to use when API limit is reached or key is missing
const MOCK_DATA: Record<string, Partial<MetalRate>> = {
    XAU: {
        price: 4920.50, // 2026 approx spot
        ch: 35.5,
        chp: 0.72,
        prev_close_price: 4885.00,
        timestamp: Date.now() / 1000,
    },
    XAG: {
        price: 82.20, // 2026 approx spot
        ch: 0.85,
        chp: 1.05,
        prev_close_price: 81.35,
        timestamp: Date.now() / 1000,
    }
};

const BASE_URL = 'https://www.goldapi.io/api';
// In a real app, this should be in process.env
// For demo purposes, we might need a fallback or instructions to add the key
const API_KEY = process.env.NEXT_PUBLIC_GOLD_API_KEY || '';

export const fetchLiveRate = async (metal: 'XAU' | 'XAG', currency: Currency, city: City = 'National'): Promise<MetalRate> => {
    if (!API_KEY) {
        console.warn('API Key missing, using mock data');
        return getMockRate(metal, currency, city);
    }

    try {
        // Real API might not support city, so we'd fetch global and apply variance here manually
        // For now, ignoring city in real API call path as we don't have a city-api key,
        // but let's assume we would wrap it.
        const response = await axios.get(`${BASE_URL}/${metal}/${currency}`, {
            headers: {
                'x-access-token': API_KEY,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('API call failed, using mock data:', error);
        return getMockRate(metal, currency, city);
    }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const fetchHistory = async (metal: 'XAU' | 'XAG', currency: Currency, range: TimeRange, city: City = 'National') => {
    // Note: GoldAPI free tier might not support range properly or has strict limits. 
    // We will implement a basic version or mock history for charts if live fails.
    if (!API_KEY) {
        return generateMockHistory(metal, currency, range, city);
    }
    // Implementation would go here - simplified for this demo to just return mock history 
    // as GoldAPI historical requires different endpoints/logic (stat).
    return generateMockHistory(metal, currency, range, city);
};

// Simple currency conversion mock (static factors relative to USD)
const CURRENCY_FACTORS: Record<string, number> = {
    USD: 1,
    EUR: 0.90,
    GBP: 0.76,
    INR: 96.50, // Approx 2026 rate including import premiums
    AUD: 1.45,
    CAD: 1.32
};

function getMockRate(metal: 'XAU' | 'XAG', currency: Currency, city: City = 'National'): MetalRate {
    const baseRate = MOCK_DATA[metal];

    // Apply city variance
    const variance = CITY_VARIANCE[city] || 0;

    // Apply random jitter for real-time effect (+/- 0.05%)
    const jitter = (Math.random() - 0.5) * 0.001;

    const cityBasePrice = (baseRate.price || 0) * (1 + variance + jitter);
    const factor = CURRENCY_FACTORS[currency];
    const price = cityBasePrice * factor;

    return {
        ...baseRate,
        metal,
        currency,
        price,
        price_gram_24k: price / 31.1035,
        price_gram_22k: (price / 31.1035) * 0.916,
        price_gram_18k: (price / 31.1035) * 0.75,
        price_gram_16k: (price / 31.1035) * 0.667,
        price_gram_14k: (price / 31.1035) * 0.583,
        price_gram_10k: (price / 31.1035) * 0.417,
        symbol: `${metal}/${currency}`,
    } as MetalRate;
}

function generateMockHistory(metal: 'XAU' | 'XAG', currency: Currency, range: TimeRange) {
    const data = [];
    const now = new Date();

    // Get base price for the metal in valid currency
    const baseUsdPrice = MOCK_DATA[metal].price || 0;
    const factor = CURRENCY_FACTORS[currency];
    let price = baseUsdPrice * factor;

    // Convert to per gram immediately since dashboard displays per gram
    price = price / 31.1035;

    if (range === '1D') {
        // Intraday: every 15 mins for last 24h = ~96 points
        // Let's do every 30 mins to keep it cleaner
        for (let i = 48; i >= 0; i--) {
            const date = new Date(now);
            date.setMinutes(date.getMinutes() - (i * 30));
            // varied Random walk
            price = price + (Math.random() * 5 - 2.5) * (factor / 31.1035); // Scale random walk
            data.push({
                date: date.toISOString(), // Full ISO string for parsing time
                price: parseFloat(price.toFixed(2))
            });
        }
    } else {
        // Daily data
        const days = range === '1M' ? 30 : 7;
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            price = price + (Math.random() * 20 - 10) * (factor / 31.1035); // Scale random walk
            data.push({
                date: date.toISOString().split('T')[0],
                price: parseFloat(price.toFixed(2))
            });
        }
    }
    return data;
}
