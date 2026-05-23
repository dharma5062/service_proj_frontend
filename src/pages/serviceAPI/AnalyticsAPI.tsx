import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';

export interface AnalyticsStat {
    title: string;
    value: string;
    change: string;
    color: string;
}

export interface AnalyticsTopService {
    name: string;
    count: number;
    percentage: number;
}

export interface AnalyticsChartData {
    name: string;
    revenue: number;
    bookings: number;
}

export interface AnalyticsData {
    stats: AnalyticsStat[];
    topServices: AnalyticsTopService[];
    topProducts: AnalyticsTopService[];
    chartData: AnalyticsChartData[];
}

export interface AnalyticsResponse {
    status: boolean;
    data: AnalyticsData;
    message?: string;
}

export const fetchAnalytics = async (period: string = 'last30days'): Promise<AnalyticsResponse> => {
    try {
        const response = await axiosInstance.get<AnalyticsResponse>('/analytics', {
            params: { period }
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to fetch analytics');
        }
        throw new Error('An unexpected error occurred while fetching analytics');
    }
};
