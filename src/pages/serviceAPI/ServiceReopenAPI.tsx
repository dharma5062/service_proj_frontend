import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice } from './InvoiceAPI';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReopenStatus =
    | 'reopen_requested'
    | 'reopen_rejected'
    | 'reopen_approved'
    | 'reopen_assigned'
    | 'reopen_in_progress'
    | 'reopen_completed'
    | 'reopen_pending_invoice'
    | 'reopen_payment_pending'
    | 'reopen_payment_completed'
    | 'reopen_closed'
    | 'service_closed';

export interface ServiceReopenRequest {
    id: number;
    service_id: number;
    invoice_id: number | null;
    customer_id: number;
    reopen_number: number;
    issue_type?: string;
    reason: string;
    images: string[] | null;
    status: 'pending' | 'approved' | 'rejected';       // Simple shop-owner decision
    reopen_status: ReopenStatus;                         // Full 8-phase lifecycle
    shop_owner_note: string | null;
    admin_note?: string | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    assigned_technician_id: number | null;
    technician_notes: string | null;
    created_at: string;
    updated_at: string;
    // Relationships
    service?: any;
    customer?: any;
    invoice?: Invoice;
    reviewedBy?: any;
    newInvoice?: Invoice;
    assignedTechnician?: any;
    original_data?: any; // Snapshot of service.data at approval
}

export interface ReworkDetails {
    reopen_request: ServiceReopenRequest;
    original_data: { parts?: any[]; selectedServiceCharges?: any[] };
    current_data: { parts?: any[]; selectedServiceCharges?: any[] };
    delta: {
        new_parts: any[];
        new_charges: any[];
        new_total: number;
        is_warranty_only: boolean;
    };
    original_invoice?: Invoice;
    rework_invoice?: Invoice;
    warranty_info: {
        warranty_days?: number | null;
        warranty_expiry_date?: string | null;
        paid_at?: string | null;
    };
}

export interface EmployeeHistory {
    previous_employee: any | null;
    previous_parts: Array<{ name: string; quantity: number; price: number; total: number }>;
    previous_charges: Array<{ name: string; amount: number }>;
    original_invoice: Invoice | null;
    original_data: any;
    service_notes: string | null;
    technician_assignments: any[];
    all_invoices: Invoice[];
}

export interface ReopenApiResponse<T = any> {
    status: boolean;
    message: string;
    data?: T;
    delta?: ReworkDetails['delta'];
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
    reopen_status?: string;
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
    note: string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-reject/${id}`, { shop_owner_note: note });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to reject reopen request');
        }
        throw new Error('An unexpected error occurred while rejecting');
    }
};

/** Assign employee to reopen cycle (Shop Owner / Admin) */
export const assignReopenEmployee = async (
    reopenId: number | string,
    employeeId: number,
    note?: string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-assign/${reopenId}`, {
            employee_id: employeeId,
            note,
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to assign employee');
        }
        throw new Error('An unexpected error occurred while assigning employee');
    }
};

/** Fetch previous employee history for a reopen request */
export const fetchEmployeeHistory = async (
    reopenId: number | string
): Promise<ReopenApiResponse<EmployeeHistory>> => {
    try {
        const response = await axiosInstance.get(`/service-reopen-request/${reopenId}/employee-history`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to fetch employee history');
        }
        throw new Error('An unexpected error occurred');
    }
};

/** Employee starts rework */
export const startReopenWork = async (
    reopenId: number | string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-start/${reopenId}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to start rework');
        }
        throw new Error('An unexpected error occurred');
    }
};

/** Employee adds parts / labor to rework */
export const addReopenParts = async (
    reopenId: number | string,
    payload: {
        parts?: Array<{ name: string; quantity: number; price: number }>;
        labor_charge?: number;
        labor_charge_name?: string;
    }
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-add-parts/${reopenId}`, payload);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to add parts');
        }
        throw new Error('An unexpected error occurred');
    }
};

/** Employee completes rework inspection */
export const completeReopenWork = async (
    reopenId: number | string,
    technicianNotes?: string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-complete/${reopenId}`, {
            technician_notes: technicianNotes,
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to complete rework');
        }
        throw new Error('An unexpected error occurred');
    }
};

/** Shop Owner final close of reopen cycle */
export const closeReopenService = async (
    reopenId: number | string,
    closingNote?: string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-close/${reopenId}`, {
            closing_note: closingNote,
        });
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to close reopen service');
        }
        throw new Error('An unexpected error occurred');
    }
};

/** Get rework details (Technician context) */
export const fetchReworkDetails = async (
    id: number | string
): Promise<ReopenApiResponse<ReworkDetails>> => {
    try {
        const response = await axiosInstance.get(`/service-reopen-request/${id}/rework-details`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to fetch rework details');
        }
        throw new Error('An unexpected error occurred');
    }
};

/** Close warranty rework cycle (₹0 invoice) */
export const closeWarrantyCycle = async (
    id: number | string
): Promise<ReopenApiResponse<ServiceReopenRequest>> => {
    try {
        const response = await axiosInstance.post(`/service-reopen-close-warranty/${id}`);
        return response.data;
    } catch (error) {
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to close warranty');
        }
        throw new Error('An unexpected error occurred while closing warranty');
    }
};

// ─── React Query Hooks ────────────────────────────────────────────────────────

export const useServiceReopenApi = () => {
    const queryClient = useQueryClient();

    const useGetReopenRequests = (params?: { status?: string; reopen_status?: string; service_id?: number | string; per_page?: number; page?: number }) =>
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
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
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

    const useAssignReopenEmployee = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, { reopenId: number | string; employeeId: number; note?: string }>({
            mutationFn: ({ reopenId, employeeId, note }) => assignReopenEmployee(reopenId, employeeId, note),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['reopen-requests'] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables.reopenId] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    const useGetEmployeeHistory = (reopenId: number | string | undefined) =>
        useQuery<EmployeeHistory, Error>({
            queryKey: ['reopen-employee-history', reopenId],
            queryFn: async () => {
                const res = await fetchEmployeeHistory(reopenId!);
                return res.data!;
            },
            enabled: !!reopenId && reopenId !== 'undefined',
        });

    const useStartReopenWork = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, number | string>({
            mutationFn: (id) => startReopenWork(id),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['rework-details', variables] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    const useAddReopenParts = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, {
            reopenId: number | string;
            parts?: Array<{ name: string; quantity: number; price: number }>;
            labor_charge?: number;
            labor_charge_name?: string;
        }>({
            mutationFn: ({ reopenId, ...payload }) => addReopenParts(reopenId, payload),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['rework-details', variables.reopenId] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables.reopenId] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    const useCompleteReopenWork = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, { reopenId: number | string; notes?: string }>({
            mutationFn: ({ reopenId, notes }) => completeReopenWork(reopenId, notes),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['rework-details', variables.reopenId] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables.reopenId] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    const useCloseReopenService = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, { reopenId: number | string; note?: string }>({
            mutationFn: ({ reopenId, note }) => closeReopenService(reopenId, note),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['rework-details', variables.reopenId] });
                queryClient.invalidateQueries({ queryKey: ['reopen-requests'] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    const useGetReworkDetails = (id: number | string | undefined) =>
        useQuery<ReworkDetails, Error>({
            queryKey: ['rework-details', id],
            queryFn: async () => {
                const res = await fetchReworkDetails(id!);
                return res.data!;
            },
            enabled: !!id && id !== 'undefined',
        });

    const useCloseWarrantyCycle = () =>
        useMutation<ReopenApiResponse<ServiceReopenRequest>, Error, number | string>({
            mutationFn: (id) => closeWarrantyCycle(id),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['rework-details', variables] });
                queryClient.invalidateQueries({ queryKey: ['reopen-request', variables] });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    return {
        useGetReopenRequests,
        useGetReopenRequestById,
        useSubmitReopenRequest,
        useApproveReopenRequest,
        useRejectReopenRequest,
        useAssignReopenEmployee,
        useGetEmployeeHistory,
        useStartReopenWork,
        useAddReopenParts,
        useCompleteReopenWork,
        useCloseReopenService,
        useGetReworkDetails,
        useCloseWarrantyCycle,
    };
};
