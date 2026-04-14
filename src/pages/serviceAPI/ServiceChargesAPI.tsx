import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// Service Charge API Interfaces
export interface ServiceCharge {
    id: number;
    name: string;
    description: string | null;
    amount: number | string;
    user_id: number;
    shop_id: number;
    created_at?: string;
    updated_at?: string;
}

// Request payload for creating a service charge
export interface CreateServiceChargePayload {
    name: string;
    description?: string | null;
    amount: number | string;
    user_id: number;
    shop_id: number;
}

// Request payload for updating a service charge
export interface UpdateServiceChargePayload {
    name: string;
    description?: string | null;
    amount: number | string;
    user_id: number;
    shop_id: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Fetches all service charges from the backend API
 * @returns Promise<ServiceCharge[]> - Array of service charges
 * @throws Error if the API request fails
 */
export const fetchServiceCharges = async (): Promise<ServiceCharge[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/service-charges-index'
        );

        const responseData = response.data;
        console.log('Service Charges Index Response:', responseData);

        // 1. { data: { data: [...] } } - Standard paginated
        if (responseData?.data?.data && Array.isArray(responseData.data.data)) {
            return responseData.data.data;
        }
        // 2. { data: [...] } - Standard direct
        else if (responseData?.data && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        // 3. [...] - Direct array
        else if (Array.isArray(responseData)) {
            return responseData;
        }
        // 4. { success, data: { ... } } or { message, data: { ... } }
        else if (responseData?.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
            // Fallback for cases where it might be wrapped differently
            const possibleData = Object.values(responseData.data).find(v => Array.isArray(v));
            if (possibleData) return possibleData as ServiceCharge[];
        }

        console.warn('Unexpected response format from /service-charges-index:', responseData);
        return [];
    } catch (error) {
        console.error('Error fetching service charges:', error);
        return [];
    }
};

/**
 * Fetches a specific service charge by ID
 * @param id - Service Charge ID
 * @returns Promise<ServiceCharge> - Single service charge
 * @throws Error if the API request fails
 */
export const fetchServiceChargeById = async (id: number): Promise<ServiceCharge> => {
    try {
        const response = await axiosInstance.get<any>(
            `/service-charges-show/${id}`
        );

        const responseData = response.data;
        console.log(`Service Charge Show Response (${id}):`, responseData);

        // 1. { data: { ... } }
        if (responseData?.data && typeof responseData.data === 'object') {
            // Check for double nesting
            if (responseData.data.data && typeof responseData.data.data === 'object') {
                return responseData.data.data as ServiceCharge;
            }
            return responseData.data as ServiceCharge;
        }
        // 2. { ... } - Direct object
        else if (responseData && typeof responseData === 'object' && responseData.id) {
            return responseData as ServiceCharge;
        }

        throw new Error('Unexpected response format from /service-charges-show');
    } catch (error) {
        console.error(`Error fetching service charge ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch service charge: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new service charge
 * @param payload - Service charge data
 * @returns Promise<ApiResponse<ServiceCharge>> - API response with created charge
 * @throws Error if the API request fails
 */
export const createServiceCharge = async (
    payload: CreateServiceChargePayload
): Promise<ApiResponse<ServiceCharge>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<ServiceCharge>>(
            '/service-charges-store',
            payload
        );

        return response.data;
    } catch (error) {
        console.error('Error creating service charge:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create service charge: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing service charge
 * @param id - Service charge ID to update
 * @param payload - Updated service charge data
 * @returns Promise<ApiResponse<ServiceCharge>> - API response with updated charge
 * @throws Error if the API request fails
 */
export const updateServiceCharge = async (
    id: number,
    payload: UpdateServiceChargePayload
): Promise<ApiResponse<ServiceCharge>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<ServiceCharge>>(
            `/service-charges-update/${id}`,
            payload
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating service charge ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update service charge: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a service charge
 * @param id - Service charge ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteServiceCharge = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/service-charges-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting service charge ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete service charge: ${error.message}`
            );
        }

        throw error;
    }
};

// ─── TanStack Query Hook ───────────────────────────────────────────────────────

export const useServiceChargesApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    // ── Queries ──────────────────────────────────────────────────────────────

    const useGetServiceCharges = () =>
        useQuery<ServiceCharge[], Error>({
            queryKey: ['service-charges', shopId],
            queryFn: fetchServiceCharges,
            staleTime: 30000,
            refetchOnWindowFocus: false,
            retry: 2,
            refetchOnMount: true,
            enabled: !!shopId,
        });

    const useGetServiceChargeById = (id: number | null) =>
        useQuery<ServiceCharge, Error>({
            queryKey: ['service-charges', id],
            queryFn: () => fetchServiceChargeById(id!),
            enabled: !!id,
            staleTime: 30000,
            refetchOnWindowFocus: false,
            retry: 2,
        });

    // ── Mutations ─────────────────────────────────────────────────────────────

    const useCreateServiceCharge = () =>
        useMutation<ApiResponse<ServiceCharge>, Error, CreateServiceChargePayload>({
            mutationFn: createServiceCharge,
            onSuccess: (response) => {
                queryClient.invalidateQueries({ queryKey: ['service-charges'], exact: false });

                const newCharge = response?.data;
                if (newCharge) {
                    queryClient.setQueryData<ServiceCharge[]>(['service-charges', shopId], (old) => {
                        if (!old) return [newCharge];
                        return [newCharge, ...old];
                    });
                }
            },
            onError: (error) => {
                console.error('Create service charge mutation failed:', error);
            },
        });

    const useUpdateServiceCharge = () =>
        useMutation<ApiResponse<ServiceCharge>, Error, { id: number; payload: UpdateServiceChargePayload }>({
            mutationFn: ({ id, payload }) => updateServiceCharge(id, payload),
            onSuccess: (response, { id }) => {
                queryClient.invalidateQueries({ queryKey: ['service-charges'], exact: false });

                const updatedCharge = response?.data;
                if (updatedCharge) {
                    queryClient.setQueryData<ServiceCharge[]>(['service-charges', shopId], (old) => {
                        if (!old) return old;
                        return old.map((c) => (c.id === id ? updatedCharge : c));
                    });
                }
            },
            onError: (error) => {
                console.error('Update service charge mutation failed:', error);
            },
        });

    const useDeleteServiceCharge = () =>
        useMutation<ApiResponse<void>, Error, number>({
            mutationFn: deleteServiceCharge,
            onSuccess: (_data, deletedId) => {
                queryClient.invalidateQueries({ queryKey: ['service-charges'], exact: false });

                queryClient.setQueryData<ServiceCharge[]>(['service-charges', shopId], (old) => {
                    if (!old) return old;
                    return old.filter((c) => c.id !== deletedId);
                });
            },
            onError: (error) => {
                console.error('Delete service charge mutation failed:', error);
            },
        });

    return {
        useGetServiceCharges,
        useGetServiceChargeById,
        useCreateServiceCharge,
        useUpdateServiceCharge,
        useDeleteServiceCharge,
    };
};
