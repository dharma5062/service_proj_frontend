import axiosInstance, { createFormDataAxios } from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Interface for Shop
export interface Shop {
    id: number;
    name: string;
    description: string | Record<string, any>; // Can be string or JSON object with metadata
    active: boolean;
    shop_owner_id: any | null;
    business_type_id?: number | null;
    image: string | null;
    image_url: string | null;
    upi_id?: string | null;
    upi_name?: string | null;
    created_at?: string;
    updated_at?: string;
    shop_owner?: {
        id: number;
        name: string;
        email: string;
        email_verified_at: string;
        company_id: number;
        active: number;
        deleted_at: string | null;
        created_at: string;
        updated_at: string;
        company_name: string;
        phone: string | null;
        address: string | null;
        profile_photo_url: any
    };
}

// Payload for creating a shop
export interface CreateShopPayload {
    name: string;
    description: string | Record<string, any>; // Support JSON object for metadata (working hours, etc.)
    active: boolean;
    image?: File | null;
    shop_owner_id?: number | null;
    business_type_id?: number;
    category_ids?: number[]; // Selected category IDs (will be stored in description JSON)
    upi_id?: string | null;
    upi_name?: string | null;
}

// Payload for updating a shop
export interface UpdateShopPayload {
    name?: string;
    description?: string | Record<string, any>;
    active?: boolean;
    image?: File | null;
    shop_owner_id?: number | null;
    category_ids?: number[];
    upi_id?: string | null;
    upi_name?: string | null;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// Fetch all shops with pagination and filters
export const fetchShops = async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    active?: number; // 1 for active, 0 for inactive
}) => {
    try {
        const response = await axiosInstance.get('/shops-index', { params });
        return response.data; // Expecting { data: Shop[], meta: ... } or similar structure depending on backend
    } catch (error) {
        console.error('Error fetching shops:', error);
        throw error;
    }
};

// Fetch a single shop by ID
export const fetchShopById = async (id: number): Promise<Shop> => {
    try {
        const response = await axiosInstance.get<ApiResponse<Shop>>(`/shops-show/${id}`);
        return response.data.data;
    } catch (error) {
        console.error(`Error fetching shop with ID ${id}:`, error);
        throw error;
    }
};

// Create a new shop
export const createShop = async (payload: CreateShopPayload): Promise<ApiResponse<Shop>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);

        // Handle description - stringify if object, otherwise use as is
        const descriptionValue = typeof payload.description === 'object'
            ? JSON.stringify(payload.description)
            : payload.description;
        formData.append('description', descriptionValue);

        formData.append('active', payload.active ? '1' : '0');

        if (payload.image && payload.image instanceof File) {
            formData.append('image', payload.image);
        }

        if (payload.shop_owner_id !== undefined && payload.shop_owner_id !== null) {
            console.log('Appending shop_owner_id to FormData:', payload.shop_owner_id);
            formData.append('shop_owner_id', payload.shop_owner_id.toString());
        } else {
            console.warn('shop_owner_id is undefined or null!', payload.shop_owner_id);
        }

        if (payload.business_type_id !== undefined && payload.business_type_id !== null) {
            formData.append('business_type_id', payload.business_type_id.toString());
        }

        if (payload.upi_id !== undefined && payload.upi_id !== null) {
            formData.append('upi_id', payload.upi_id);
        }
        if (payload.upi_name !== undefined && payload.upi_name !== null) {
            formData.append('upi_name', payload.upi_name);
        }

        // Note: category_ids would ideally be sent to backend, but storing in description for now
        // as the current API spec doesn't support it directly

        console.log('FormData entries:');
        for (const pair of formData.entries()) {
            console.log(pair[0], pair[1]);
        }

        const response = await createFormDataAxios().post<ApiResponse<Shop>>('/shops-store', formData);
        return response.data;
    } catch (error) {
        console.error('Error creating shop:', error);
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to create shop');
        }
        throw error;
    }
};

// Update an existing shop
export const updateShop = async (id: number, payload: UpdateShopPayload): Promise<ApiResponse<Shop>> => {
    try {
        const formData = new FormData();

        if (payload.name !== undefined) formData.append('name', payload.name);

        if (payload.description !== undefined) {
            const descriptionValue = typeof payload.description === 'object'
                ? JSON.stringify(payload.description)
                : payload.description;
            formData.append('description', descriptionValue);
        }

        if (payload.active !== undefined) formData.append('active', payload.active ? '1' : '0');

        if (payload.image && payload.image instanceof File) {
            formData.append('image', payload.image);
        }

        if (payload.shop_owner_id !== undefined && payload.shop_owner_id !== null) {
            formData.append('shop_owner_id', payload.shop_owner_id.toString());
        }

        if (payload.upi_id !== undefined && payload.upi_id !== null) {
            formData.append('upi_id', payload.upi_id);
        }
        if (payload.upi_name !== undefined && payload.upi_name !== null) {
            formData.append('upi_name', payload.upi_name);
        }

        const response = await createFormDataAxios().post<ApiResponse<Shop>>(`/shops-update/${id}`, formData);
        return response.data;
    } catch (error) {
        console.error(`Error updating shop with ID ${id}:`, error);
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to update shop');
        }
        throw error;
    }
};

// Delete a shop
export const deleteShop = async (id: number): Promise<void> => {
    try {
        await axiosInstance.delete(`/shops-delete/${id}`);
    } catch (error) {
        console.error(`Error deleting shop with ID ${id}:`, error);
        if (error instanceof AxiosError && error.response) {
            throw new Error(error.response.data.message || 'Failed to delete shop');
        }
        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useShopsApi = () => {
    const queryClient = useQueryClient();

    const useGetShops = (params?: { page?: number; per_page?: number; search?: string; active?: number }) =>
        useQuery<any, Error>({
            queryKey: ['shops', params],
            queryFn: () => fetchShops(params),
        });

    const useGetShopById = (id: number | undefined) =>
        useQuery<Shop, Error>({
            queryKey: ['shops', id],
            queryFn: () => fetchShopById(id!),
            enabled: !!id,
        });

    const useCreateShop = () =>
        useMutation<ApiResponse<Shop>, Error, CreateShopPayload>({
            mutationFn: (payload) => createShop(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['shops'] });
            },
        });

    const useUpdateShop = () =>
        useMutation<ApiResponse<Shop>, Error, { id: number; payload: UpdateShopPayload }>({
            mutationFn: ({ id, payload }) => updateShop(id, payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['shops'] });
            },
        });

    const useDeleteShop = () =>
        useMutation<void, Error, number>({
            mutationFn: (id) => deleteShop(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['shops'] });
            },
        });

    return {
        useGetShops,
        useGetShopById,
        useCreateShop,
        useUpdateShop,
        useDeleteShop,
    };
};
