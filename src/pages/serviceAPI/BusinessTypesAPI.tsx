import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// ─── Business Type Interfaces ──────────────────────────────────────────────────

export interface BusinessTypeCategory {
    id: number;
    name: string;
    description: string;
    active: boolean;
    image: string;
    parent_id: number | null;
    user_id: number;
    created_at: string;
    updated_at: string;
    image_url: string;
    children: any[];
}

export interface BusinessType {
    id: number;
    name: string;
    active: boolean;
    category_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    category?: BusinessTypeCategory;
}

// Request payload for creating a business type
export interface CreateBusinessTypePayload {
    name: string;
    category_id: number;
}

// Request payload for updating a business type
export interface UpdateBusinessTypePayload {
    name: string;
    category_id: number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * Fetches all business types from the backend API.
 * @returns Promise<BusinessType[]> - Array of business types
 */
export const fetchBusinessTypes = async (): Promise<BusinessType[]> => {
    try {

        // changed the allow for sa , { params: { per_page: 1000 } }
        const response = await axiosInstance.get<any>('/business-types-index', { params: { per_page: 1000 } });

        const responseData = response.data;
        console.log('Business Types Index Response:', responseData);

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
            const possibleData = Object.values(responseData.data).find(v => Array.isArray(v));
            if (possibleData) return possibleData as BusinessType[];
        }

        console.warn('Unexpected response format from /business-types-index:', responseData);
        return [];
    } catch (error) {
        console.error('Error fetching business types:', error);
        return [];
    }
};

/**
 * Fetches a specific business type by ID
 * @param id - Business Type ID
 * @returns Promise<BusinessType> - Single business type
 * @throws Error if the API request fails
 */
export const fetchBusinessTypeById = async (id: number): Promise<BusinessType> => {
    try {
        const response = await axiosInstance.get<any>(`/business-types-show/${id}`);

        const responseData = response.data;
        console.log(`Business Type Show Response (${id}):`, responseData);

        // 1. { data: { data: { ... } } } - Double nested
        if (responseData?.data?.data && typeof responseData.data.data === 'object') {
            return responseData.data.data as BusinessType;
        }
        // 2. { data: { ... } }
        if (responseData?.data && typeof responseData.data === 'object') {
            return responseData.data as BusinessType;
        }
        // 3. { ... } - Direct object
        else if (responseData && typeof responseData === 'object' && responseData.id) {
            return responseData as BusinessType;
        }

        throw new Error('Unexpected response format from /business-types-show');
    } catch (error) {
        console.error(`Error fetching business type ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch business type: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new business type
 * @param payload - Business type data
 * @returns Promise<ApiResponse<BusinessType>> - API response with created business type
 * @throws Error if the API request fails
 */
export const createBusinessType = async (
    payload: CreateBusinessTypePayload
): Promise<ApiResponse<BusinessType>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<BusinessType>>(
            '/business-types-store',
            payload
        );

        return response.data;
    } catch (error) {
        console.error('Error creating business type:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create business type: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing business type
 * @param id - Business type ID to update
 * @param payload - Updated business type data
 * @returns Promise<ApiResponse<BusinessType>> - API response with updated business type
 * @throws Error if the API request fails
 */
export const updateBusinessType = async (
    id: number,
    payload: UpdateBusinessTypePayload
): Promise<ApiResponse<BusinessType>> => {
    try {
        const response = await axiosInstance.put<ApiResponse<BusinessType>>(
            `/business-types-update/${id}`,
            payload
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating business type ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update business type: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a business type
 * @param id - Business type ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteBusinessType = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/business-types-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting business type ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete business type: ${error.message}`
            );
        }

        throw error;
    }
};

// ─── TanStack Query Hooks ──────────────────────────────────────────────────────

export const useBusinessTypesApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    // ── Queries ───────────────────────────────────────────────────────────────

    const useGetBusinessTypes = () =>
        useQuery<BusinessType[], Error>({
            queryKey: ['business-types', shopId],
            queryFn: fetchBusinessTypes,
            staleTime: 30000,
            refetchOnWindowFocus: false,
            retry: 2,
            refetchOnMount: true,
            //enabled: !!shopId,

        });

    const useGetBusinessTypeById = (id: number | null) =>
        useQuery<BusinessType, Error>({
            queryKey: ['business-types', id],
            queryFn: () => fetchBusinessTypeById(id!),
            enabled: !!id && !!shopId,
            staleTime: 30000,
            refetchOnWindowFocus: false,
            retry: 2,
        });

    // ── Mutations ─────────────────────────────────────────────────────────────

    const useCreateBusinessType = () =>
        useMutation<ApiResponse<BusinessType>, Error, CreateBusinessTypePayload>({
            mutationFn: createBusinessType,
            onSuccess: (response) => {
                queryClient.invalidateQueries({ queryKey: ['business-types', shopId], exact: false });

                const newType = response?.data;
                if (newType) {
                    queryClient.setQueryData<BusinessType[]>(['business-types', shopId], (old) => {
                        if (!old) return [newType];
                        return [newType, ...old];
                    });
                }
            },
            onError: (error) => {
                console.error('Create business type mutation failed:', error);
            },
        });

    const useUpdateBusinessType = () =>
        useMutation<ApiResponse<BusinessType>, Error, { id: number; payload: UpdateBusinessTypePayload }>({
            mutationFn: ({ id, payload }) => updateBusinessType(id, payload),
            onSuccess: (response, { id }) => {
                queryClient.invalidateQueries({ queryKey: ['business-types', shopId], exact: false });

                const updatedType = response?.data;
                if (updatedType) {
                    queryClient.setQueryData<BusinessType[]>(['business-types', shopId], (old) => {
                        if (!old) return old;
                        return old.map((t) => (t.id === id ? updatedType : t));
                    });
                }
            },
            onError: (error) => {
                console.error('Update business type mutation failed:', error);
            },
        });

    const useDeleteBusinessType = () =>
        useMutation<ApiResponse<void>, Error, number>({
            mutationFn: deleteBusinessType,
            onSuccess: (_data, deletedId) => {
                queryClient.invalidateQueries({ queryKey: ['business-types', shopId], exact: false });

                queryClient.setQueryData<BusinessType[]>(['business-types', shopId], (old) => {
                    if (!old) return old;
                    return old.filter((t) => t.id !== deletedId);
                });
            },
            onError: (error) => {
                console.error('Delete business type mutation failed:', error);
            },
        });

    return {
        useGetBusinessTypes,
        useGetBusinessTypeById,
        useCreateBusinessType,
        useUpdateBusinessType,
        useDeleteBusinessType,
    };
};
