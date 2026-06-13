import axiosInstance, { createFormDataAxios } from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';
import { ShopEmployee } from '@/pages/serviceAPI/ShopEmployeesAPI';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ServiceRequestCustomer {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company_name?: string;
    gstin?: string;
    customer_approved?: boolean;
}

export interface ServiceRequestBrand {
    id: number;
    name: string;
    brand_logo?: string;
}

export interface ServiceRequestProduct {
    id: number;
    name: string;
    price?: number;
    category?: {
        id: number;
        name: string;
    };
}

export interface ServiceRequestForm {
    id: number;
    name: string;
    description?: any;
}

export interface ServiceRequest {
    id: number;
    shop_id?: number;
    form_id?: number;
    form?: ServiceRequestForm | null;
    customer_id?: number;
    customer?: ServiceRequestCustomer | null;
    brand_id?: number;
    brand?: ServiceRequestBrand | null;
    product_id?: number;
    product?: ServiceRequestProduct | null;
    service_details?: any; // JSON
    data?: any; // JSON — dynamic form data + images
    admin_note?: string;
    status?: string;
    service_status?: string; // Backend field: pending, in_progress, completed, cancelled
    assigned_technician?: ShopEmployee | null;
    created_at?: string;
    updated_at?: string;
}

export interface ServiceRequestActivity {
    id: number;
    service_id: number;
    user_id: number;
    activity_type: string;
    from_status?: string | null;
    to_status?: string | null;
    title: string;
    description?: string | null;
    meta_data?: any;
    created_at: string;
    updated_at: string;
    user?: {
        id: number;
        name: string;
        email?: string;
        user_type: string;
    } | null;
}

export interface CreateServicePayload {
    shop_id?: number;
    form_id?: number;
    form?: boolean;
    customer_id: number;
    brand_id?: number;
    product_id?: number;
    service_details?: string; // JSON string
    data?: string; // JSON string of dynamic form data
    admin_note?: string;
    service_status?: string; // pending, in_progress, completed, cancelled
    images?: File[];
}

export interface UpdateServicePayload extends CreateServicePayload { }

export interface AssignTechnicianPayload {
    service_id: number;
    user_id: number;
    admin_note?: string;
}

export interface ServiceApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetches all service requests scoped to the given shop.
 * shop_id is sent as a query param so the backend can scope results
 * to only the requesting user's shop/branch.
 */
export const fetchServiceRequests = async (shopId?: number | null): Promise<ServiceRequest[]> => {
    try {
        const params: Record<string, any> = { per_page: 1000 };
        if (shopId) {
            params.shop_id = shopId;
        }

        const response = await axiosInstance.get('/service-index', { params });

        // Handle all possible Laravel response shapes
        const raw = response.data;

        // Shape 1: direct array
        if (Array.isArray(raw)) {
            return raw;
        }
        // Shape 2: { data: [...] }  (resource collection)
        if (raw?.data && Array.isArray(raw.data)) {
            return raw.data;
        }
        // Shape 3: { data: { data: [...] } }  (paginated inside wrapper)
        if (raw?.data?.data && Array.isArray(raw.data.data)) {
            return raw.data.data;
        }
        // Shape 4: object with any key that is an array (last-resort)
        if (raw && typeof raw === 'object') {
            const firstArray = Object.values(raw).find(v => Array.isArray(v));
            if (firstArray) return firstArray as ServiceRequest[];
        }

        // Fallback — always return an array
        return [];
    } catch (error) {
        console.error('Error fetching service requests:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch service requests: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches a single service request by ID
 */
export const fetchServiceRequestById = async (id: number | string): Promise<ServiceRequest> => {
    try {
        const response = await axiosInstance.get(`/service-show/${id}`);

        // Handle wrapped response
        return response.data?.data ?? response.data;
    } catch (error) {
        console.error(`Error fetching service request ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch service request: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new service request (multipart — supports images)
 */
export const createServiceRequest = async (
    payload: CreateServicePayload
): Promise<ServiceApiResponse<ServiceRequest>> => {
    try {
        const formData = buildFormData(payload);
        const formDataAxios = createFormDataAxios();

        const response = await formDataAxios.post<ServiceApiResponse<ServiceRequest>>(
            '/service-create',
            formData
        );

        return response.data;
    } catch (error) {
        console.error('Error creating service request:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create service request: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing service request (multipart — supports images)
 */
export const updateServiceRequest = async (
    id: number | string,
    payload: UpdateServicePayload
): Promise<ServiceApiResponse<ServiceRequest>> => {
    try {
        const formData = buildFormData(payload);
        const formDataAxios = createFormDataAxios();

        const response = await formDataAxios.post<ServiceApiResponse<ServiceRequest>>(
            `/service-update/${id}`,
            formData
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating service request ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update service request: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a service request
 */
export const deleteServiceRequest = async (
    id: number | string
): Promise<ServiceApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ServiceApiResponse<void>>(
            `/service-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting service request ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete service request: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Assigns a technician to a service request
 */
export const assignTechnician = async (
    payload: AssignTechnicianPayload
): Promise<ServiceApiResponse<void>> => {
    try {
        const response = await axiosInstance.post<ServiceApiResponse<void>>(
            '/service-assign-technician',
            payload
        );

        return response.data;
    } catch (error) {
        console.error('Error assigning technician:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to assign technician: ${error.message}`
            );
        }

        throw error;
    }
};

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Builds a FormData object from the payload.
 * Handles `images[]` as an array of File objects or base64 strings.
 */
const buildFormData = (payload: CreateServicePayload | UpdateServicePayload): FormData => {
    const formData = new FormData();

    if (payload.shop_id !== undefined) formData.append('shop_id', String(payload.shop_id));
    if (payload.form_id !== undefined) formData.append('form_id', String(payload.form_id));
    if (payload.form !== undefined) formData.append('form', payload.form ? '1' : '0');
    if (payload.customer_id !== undefined) formData.append('customer_id', String(payload.customer_id));
    if (payload.brand_id !== undefined) formData.append('brand_id', String(payload.brand_id));
    if (payload.product_id !== undefined) formData.append('product_id', String(payload.product_id));
    if (payload.service_details !== undefined) formData.append('service_details', payload.service_details);
    if (payload.data !== undefined) formData.append('data', payload.data);
    if (payload.admin_note !== undefined) formData.append('admin_note', payload.admin_note);
    if (payload.service_status !== undefined) formData.append('service_status', payload.service_status);

    // Append images — only actual File objects
    if (payload.images && payload.images.length > 0) {
        payload.images.forEach((image) => {
            if (image instanceof File) {
                formData.append('images[]', image);
            }
        });
    }

    // Debug: log all FormData entries
    console.log('buildFormData entries:');
    for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
            console.log(`  ${key}: [File] ${value.name} (${value.size} bytes, ${value.type})`);
        } else {
            console.log(`  ${key}: ${value}`);
        }
    }

    return formData;
};

/**
 * Fetches all activity logs for a service request
 */
export const fetchServiceRequestActivities = async (id: number | string): Promise<ServiceRequestActivity[]> => {
    try {
        const response = await axiosInstance.get(`/service-requests/${id}/activities`);
        return response.data?.data ?? [];
    } catch (error) {
        console.error(`Error fetching service request activities ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch service request activities: ${error.message}`
            );
        }
        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useServiceRequestsApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    const useGetServiceRequests = () =>
        useQuery<ServiceRequest[], Error>({
            queryKey: ['service-requests', shopId],
            queryFn: () => fetchServiceRequests(shopId),
            enabled: !!shopId,
        });

    const useGetServiceRequestById = (id: number | string | undefined) =>
        useQuery<ServiceRequest, Error>({
            queryKey: ['service-requests', id, shopId],
            queryFn: () => fetchServiceRequestById(id!),
            enabled: !!id && !!shopId,
        });

    const useCreateServiceRequest = () =>
        useMutation<ServiceApiResponse<ServiceRequest>, Error, CreateServicePayload>({
            mutationFn: (payload) => createServiceRequest(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
            },
        });

    const useUpdateServiceRequest = () =>
        useMutation<ServiceApiResponse<ServiceRequest>, Error, { id: number | string; payload: UpdateServicePayload }>({
            mutationFn: ({ id, payload }) => updateServiceRequest(id, payload),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['service-requests', variables.id], exact: false });
                queryClient.invalidateQueries({ queryKey: ['service-request-activities', variables.id], exact: false });
            },
        });

    const useDeleteServiceRequest = () =>
        useMutation<ServiceApiResponse<void>, Error, number | string>({
            mutationFn: (id) => deleteServiceRequest(id),
            onSuccess: (_data, id) => {
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['service-requests', id], exact: false });
            },
        });

    const useAssignTechnician = () =>
        useMutation<ServiceApiResponse<void>, Error, AssignTechnicianPayload>({
            mutationFn: (payload) => assignTechnician(payload),
            onSuccess: (_data, variables) => {
                queryClient.invalidateQueries({ queryKey: ['service-requests', variables.service_id], exact: false });
                queryClient.invalidateQueries({ queryKey: ['service-requests'], exact: false });
                queryClient.invalidateQueries({ queryKey: ['service-request-activities', variables.service_id], exact: false });
            },
        });

    const useGetServiceRequestActivities = (id: number | string | undefined) =>
        useQuery<ServiceRequestActivity[], Error>({
            queryKey: ['service-request-activities', id, shopId],
            queryFn: () => fetchServiceRequestActivities(id!),
            enabled: !!id && !!shopId,
        });

    return {
        useGetServiceRequests,
        useGetServiceRequestById,
        useCreateServiceRequest,
        useUpdateServiceRequest,
        useDeleteServiceRequest,
        useAssignTechnician,
        useGetServiceRequestActivities,
    };
};
