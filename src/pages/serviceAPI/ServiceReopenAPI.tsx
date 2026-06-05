import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice } from './InvoiceAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ServiceReopenRequest {
    id: number;
    service_id: number;
    invoice_id: number | null;
    customer_id: number;
    reopen_number: number;
    reason: string;
    images: string[] | null;
    status: 'pending' | 'approved' | 'rejected';
    shop_owner_note: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
    // Relationships
    service?: any;
    customer?: any;
    invoice?: Invoice;
    reviewedBy?: any;
    newInvoice?: Invoice;
}

export interface ReopenApiResponse<T = any> {
    status: boolean;
    message: string;
    data?: T;
}

export interface PaginatedReopenRequests {
    data: ServiceReopenRequest[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** Submit a reopen request (Customer only) */
export const submitReopenRequest = async (
    serviceId: number | string,
    formData: FormData
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post<ReopenApiResponse<ServiceReopenRequest>>(
            `/service-reopen-request/${serviceId}`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to submit reopen request: ${error.message}`);
        }
        throw error;
    }
};

/** Fetch paginated list of reopen requests */
export const fetchReopenRequests = async (params?: {
    status?: string;
    service_id?: number | string;
    per_page?: number;
    page?: number;
}): Promise<PaginatedReopenRequests> => {
    try {
        const response = await axiosInstance.get('/service-reopen-requests', { 
            params: { per_page: 1000, ...params } 
        });
        const raw = response.data;
        if (raw?.data?.data && Array.isArray(raw.data.data)) {
            return raw.data;
        }
        if (raw?.data && Array.isArray(raw.data)) {
            return { data: raw.data, current_page: 1, last_page: 1, per_page: 10, total: raw.data.length };
        }
        return { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 };
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch reopen requests: ${error.message}`);
        }
        throw error;
    }
};

/** Fetch single reopen request */
export const fetchReopenRequestById = async (id: number | string): Promise<ServiceReopenRequest> => {
    try {
        const response = await axiosInstance.get(`/service-reopen-request/${id}`);
        return response.data?.data ?? response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch reopen request: ${error.message}`);
        }
        throw error;
    }
};

/** Approve a reopen request (Shop Owner / Admin) */
export const approveReopenRequest = async (
    id: number | string,
    shopOwnerNote?: string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post<ReopenApiResponse<ServiceReopenRequest>>(
            `/service-reopen-approve/${id}`,
            { shop_owner_note: shopOwnerNote }
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to approve reopen request: ${error.message}`);
        }
        throw error;
    }
};

/** Reject a reopen request (Shop Owner / Admin) */
export const rejectReopenRequest = async (
    id: number | string,
    shopOwnerNote: string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post<ReopenApiResponse<ServiceReopenRequest>>(
            `/service-reopen-reject/${id}`,
            { shop_owner_note: shopOwnerNote }
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to reject reopen request: ${error.message}`);
        }
        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useServiceReopenApi = () => {
    const queryClient = useQueryClient();

    const useGetReopenRequests = (params?: { status?: string; service_id?: number | string; per_page?: number; page?: number }) =>
        useQuery<PaginatedReopenRequests, Error>({
            queryKey: ['reopen-requests', params],
            queryFn: () => fetchReopenRequests(params),
        });

    const useGetReopenRequestById = (id: number | string | undefined) =>
        useQuery<ServiceReopenRequest, Error>({
            queryKey: ['reopen-request', id],
            queryFn: () => fetchReopenRequestById(id!),
            enabled: !!id && id !== 'undefined',
        });

    const useSubmitReopenRequest = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, { serviceId: number | string; formData: FormData }>({
            mutationFn: ({ serviceId, formData }) => submitReopenRequest(serviceId, formData),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['reopen-requests'] });
                queryClient.invalidateQueries({ queryKey: ['service-requests', variables.serviceId], exact: false });
            },
        });

    const useApproveReopenRequest = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, { id: number | string; note?: string }>({
            mutationFn: ({ id, note }) => approveReopenRequest(id, note),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['reopen-requests'] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables.id] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false }); // to update list
            },
        });

    const useRejectReopenRequest = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, { id: number | string; note: string }>({
            mutationFn: ({ id, note }) => rejectReopenRequest(id, note),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['reopen-requests'] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables.id] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    return {
        useGetReopenRequests,
        useGetReopenRequestById,
        useSubmitReopenRequest,
        useApproveReopenRequest,
        useRejectReopenRequest,
    };
};
