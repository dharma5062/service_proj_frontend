import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface EmployeePerformanceSummary {
    total_employees: number;
    total_services: number;
    completed_services: number;
    pending_services: number;
    in_progress_services: number;
    total_revenue_collected: number;
    total_pending_amount: number;
}

export interface EmployeePerformance {
    id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    active: boolean;
    total_services: number;
    completed_services: number;
    in_progress_services: number;
    pending_services: number;
    revenue_collected: number;
    pending_amount: number;
    avg_rating: number | null;
    total_ratings: number;
    last_service_date: string | null;
}

export interface StaffPerformanceResponse {
    summary: EmployeePerformanceSummary;
    employees: EmployeePerformance[];
}

export interface EmployeeServiceRecord {
    id: number;
    sr_number: string;
    customer_name: string;
    customer_phone: string;
    product_name: string;
    brand_name: string;
    shop_name: string;
    service_status: string;
    invoice_status: string | null;
    invoice_amount: number | null;
    paid_at: string | null;
    created_at: string;
}

export interface EmployeeInvoiceRecord {
    id: number;
    invoice_number: string;
    total_amount: number;
    status: string;
    payment_type: string | null;
    paid_at: string | null;
    created_at: string;
    sr_number: string;
    customer_name: string;
}

export interface EmployeeRatingRecord {
    id: number;
    rating: number;
    review: string | null;
    customer_name: string;
    service_id: number;
    product_name: string;
    created_at: string;
}

export interface MyRatingRecord {
    id: number;
    rating: number;
    review: string | null;
    employee_id: number;
    service_id: number;
    created_at: string;
}

export interface EmployeeHistorySummary {
    total_services: number;
    completed_services: number;
    pending_services: number;
    in_progress_services: number;
    revenue_collected: number;
    pending_amount: number;
    avg_rating: number | null;
    total_ratings: number;
}

export interface EmployeeHistoryResponse {
    employee: {
        id: number;
        name: string;
        email: string;
        phone: string;
        role: string;
    };
    summary: EmployeeHistorySummary;
    services: EmployeeServiceRecord[];
    invoices: EmployeeInvoiceRecord[];
    ratings: EmployeeRatingRecord[];
}

export interface CustomerRatingPayload {
    service_id: number;
    employee_id: number;
    rating: number;
    review?: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const fetchStaffPerformance = async (
    shopId?: number | null
): Promise<StaffPerformanceResponse> => {
    try {
        const params: Record<string, any> = {};
        if (shopId) params.shop_id = shopId;

        const response = await axiosInstance.get('/staff-performance', { params });
        const raw = response.data;

        if (raw?.status && raw?.data) return raw.data;
        return raw?.data ?? { summary: { total_employees: 0, total_services: 0, completed_services: 0, pending_services: 0, in_progress_services: 0, total_revenue_collected: 0, total_pending_amount: 0 }, employees: [] };
    } catch (error) {
        console.error('Error fetching staff performance:', error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch staff performance: ${error.message}`);
        }
        throw error;
    }
};

export const fetchEmployeeHistory = async (
    id: number | string,
    shopId?: number | null
): Promise<EmployeeHistoryResponse> => {
    try {
        const params: Record<string, any> = {};
        if (shopId) params.shop_id = shopId;

        const response = await axiosInstance.get(`/staff-performance/${id}`, { params });
        const raw = response.data;

        if (raw?.status && raw?.data) return raw.data;
        return raw?.data;
    } catch (error) {
        console.error(`Error fetching employee history ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch employee history: ${error.message}`);
        }
        throw error;
    }
};

export const submitCustomerRating = async (
    payload: CustomerRatingPayload
): Promise<any> => {
    try {
        const response = await axiosInstance.post('/customer-ratings-store', payload);
        return response.data;
    } catch (error) {
        console.error('Error submitting rating:', error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to submit rating: ${error.message}`);
        }
        throw error;
    }
};

export const fetchMyRatingForService = async (
    serviceId: number,
    employeeId?: number | null
): Promise<MyRatingRecord | null> => {
    try {
        const params: Record<string, any> = { service_id: serviceId };
        if (employeeId) params.employee_id = employeeId;
        const response = await axiosInstance.get('/customer-ratings', { params });
        const data = response.data?.data?.data || response.data?.data || [];
        return Array.isArray(data) ? (data[0] ?? null) : null;
    } catch {
        return null;
    }
};

// ─── React Query Hooks ────────────────────────────────────────────────────────

export const useStaffPerformanceApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    const useGetStaffPerformance = () =>
        useQuery<StaffPerformanceResponse, Error>({
            queryKey: ['staff-performance', shopId],
            queryFn: () => fetchStaffPerformance(shopId),
            enabled: !!shopId,
        });

    const useGetEmployeeHistory = (id: number | string | undefined) =>
        useQuery<EmployeeHistoryResponse, Error>({
            queryKey: ['employee-history', id, shopId],
            queryFn: () => fetchEmployeeHistory(id!, shopId),
            enabled: !!id && !!shopId,
        });

    const useSubmitRating = () =>
        useMutation<any, Error, CustomerRatingPayload>({
            mutationFn: (payload) => submitCustomerRating(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['staff-performance'] });
                queryClient.invalidateQueries({ queryKey: ['employee-history'] });
            },
        });

    const useGetMyRating = (serviceId?: number, employeeId?: number | null, enabled: boolean = true) =>
        useQuery<MyRatingRecord | null, Error>({
            queryKey: ['my-rating', serviceId, employeeId],
            queryFn: () => fetchMyRatingForService(serviceId!, employeeId),
            enabled: !!serviceId && enabled,
            staleTime: 5 * 60 * 1000,
        });

    return {
        useGetStaffPerformance,
        useGetEmployeeHistory,
        useSubmitRating,
        useGetMyRating,
    };
};
