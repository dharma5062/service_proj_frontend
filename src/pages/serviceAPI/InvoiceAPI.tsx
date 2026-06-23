import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
    type: 'part' | 'charge';
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    is_warranty_covered?: boolean; // True if item is covered by warranty
}

export interface Invoice {
    [x: string]: any;
    id: number;
    service_id: number;
    shop_id: number;
    customer_id: number;
    generated_by: number;
    reopen_request_id?: number | null; // Linking rework invoice to reopen cycle
    is_warranty_invoice?: boolean;     // True if ₹0 warranty rework invoice
    invoice_number: string;
    line_items: InvoiceLineItem[] | null;
    subtotal: string | number;
    tax_amount: string | number;
    discount_amount: string | number;
    total_amount: string | number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'cancelled';
    notes: string | null;
    pay_token: string | null;
    pay_token_expires_at: string | null;
    sent_at: string | null;
    warranty_days: number | null;
    warranty_expiry_date: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
    // Relationships
    service?: {
        id: number;
        service_status: string;
        product?: { id: number; name: string };
        brand?: { id: number; name: string };
        customer?: { id: number; name: string; email?: string };
        assigned_technician?: { id: number; name: string };
    };
    shop?: { id: number; name: string };
    customer?: { id: number; name: string; email?: string; phone?: string };
    generated_by_user?: { id: number; name: string };
    generatedBy?: { id: number; name: string };
}

export interface GenerateInvoicePayload {
    tax_amount?: number;
    discount_amount?: number;
    notes?: string;
    currency?: string;
    warranty_days?: number;
}

export interface InvoiceApiResponse<T = any> {
    status: boolean;
    message: string;
    data?: T;
    pay_url?: string;
    email_sent?: boolean;
    email_error?: string | null;
}

export interface PaginatedInvoices {
    data: Invoice[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/** Generate an invoice for a completed service and email the customer */
export const generateInvoice = async (
    serviceId: number | string,
    payload: GenerateInvoicePayload
): Promise<InvoiceApiResponse<Invoice>> => {
    try {
        const response = await axiosInstance.post<InvoiceApiResponse<Invoice>>(
            `/invoice-generate/${serviceId}`,
            payload
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to generate invoice: ${error.message}`
            );
        }
        throw error;
    }
};

/** Re-send invoice email to customer */
export const resendInvoice = async (
    invoiceId: number | string
): Promise<InvoiceApiResponse<Invoice>> => {
    try {
        const response = await axiosInstance.post<InvoiceApiResponse<Invoice>>(
            `/invoice-resend/${invoiceId}`
        );
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to resend invoice: ${error.message}`
            );
        }
        throw error;
    }
};

/** Fetch paginated invoice list (role-scoped by backend) */
export const fetchInvoices = async (params?: {
    service_id?: number;
    shop_id?: number;
    status?: string;
    per_page?: number;
    page?: number;
}): Promise<PaginatedInvoices> => {
    try {
        const response = await axiosInstance.get('/invoice-index', { 
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
            throw new Error(error.response?.data?.message || `Failed to fetch invoices: ${error.message}`);
        }
        throw error;
    }
};

/** Fetch single invoice by ID */
export const fetchInvoiceById = async (id: number | string): Promise<Invoice> => {
    if (!id || id === 'undefined') {
        throw new Error('Invalid invoice ID');
    }
    try {
        const response = await axiosInstance.get(`/invoice-show/${id}`);
        return response.data?.data ?? response.data;
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch invoice: ${error.message}`);
        }
        throw error;
    }
};

/** Fetch current customer's own invoices */
export const fetchMyInvoices = async (params?: {
    per_page?: number;
    page?: number;
}): Promise<PaginatedInvoices> => {
    try {
        const response = await axiosInstance.get('/my-invoices', { 
            params: { per_page: 1000, ...params }
        });
        const raw = response.data;
        if (raw?.data?.data && Array.isArray(raw.data.data)) return raw.data;
        if (raw?.data && Array.isArray(raw.data)) {
            return { data: raw.data, current_page: 1, last_page: 1, per_page: 10, total: raw.data.length };
        }
        return { data: [], current_page: 1, last_page: 1, per_page: 10, total: 0 };
    } catch (error) {
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch my invoices: ${error.message}`);
        }
        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useInvoiceApi = () => {
    const queryClient = useQueryClient();
    const { isCustomer } = useAuth();

    /** List invoices — auto routes to /my-invoices for customers */
    const useGetInvoices = (params?: {
        service_id?: number;
        shop_id?: number;
        status?: string;
        per_page?: number;
        page?: number;
    }) =>
        useQuery<PaginatedInvoices, Error>({
            queryKey: ['invoices', params],
            queryFn: () => isCustomer ? fetchMyInvoices(params) : fetchInvoices(params),
        });

    /** My invoices — for customer portal */
    const useGetMyInvoices = (params?: { per_page?: number; page?: number }) =>
        useQuery<PaginatedInvoices, Error>({
            queryKey: ['my-invoices', params],
            queryFn: () => fetchMyInvoices(params),
        });

    /** Single invoice */
    const useGetInvoiceById = (id: number | string | undefined) =>
        useQuery<Invoice, Error>({
            queryKey: ['invoice', id],
            queryFn: () => fetchInvoiceById(id!),
            enabled: !!id && id !== 'undefined',
        });

    /** Generate invoice mutation */
    const useGenerateInvoice = () =>
        useMutation<InvoiceApiResponse<Invoice>, Error, { serviceId: number | string; payload: GenerateInvoicePayload }>({
            mutationFn: ({ serviceId, payload }) => generateInvoice(serviceId, payload),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
                queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
                queryClient.invalidateQueries({ queryKey: ['service-requests', variables.serviceId], exact: false });
                queryClient.invalidateQueries({ queryKey: ['service-request-activities', variables.serviceId], exact: false });
            },
        });

    /** Resend invoice email mutation */
    const useResendInvoice = () =>
        useMutation<InvoiceApiResponse<Invoice>, Error, number | string>({
            mutationFn: (invoiceId) => resendInvoice(invoiceId),
            onSuccess: (_data, invoiceId) => {
                queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
                queryClient.invalidateQueries({ queryKey: ['invoices'] });
            },
        });

    return {
        useGetInvoices,
        useGetMyInvoices,
        useGetInvoiceById,
        useGenerateInvoice,
        useResendInvoice,
    };
};

// ─── Standalone Approval OTP Hooks ────────────────────────────────────────────

export interface SendApprovalOtpResponse {
    status: boolean;
    message: string;
    otp?: string;        // returned for in-app display
    expires_at?: string;
}

export interface VerifyApprovalOtpResponse {
    status: boolean;
    message: string;
}

const sendApprovalOtpFn = async (invoiceId: number): Promise<SendApprovalOtpResponse> => {
    const response = await axiosInstance.post(`/invoice/${invoiceId}/send-approval-otp`);
    return response.data;
};

const verifyApprovalOtpFn = async ({ invoiceId, otp }: { invoiceId: number; otp: string }): Promise<VerifyApprovalOtpResponse> => {
    const response = await axiosInstance.post(`/invoice/${invoiceId}/verify-approval-otp`, { otp });
    return response.data;
};

/** Hook to request the approval OTP (staff clicks "Send OTP") */
export const useSendApprovalOtp = (invoiceId?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => sendApprovalOtpFn(invoiceId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
        },
    });
};

/** Hook to verify the approval OTP (staff enters code) */
export const useVerifyApprovalOtp = (invoiceId?: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (otp: string) => verifyApprovalOtpFn({ invoiceId: invoiceId!, otp }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['my-invoices'] });
        },
    });
};


