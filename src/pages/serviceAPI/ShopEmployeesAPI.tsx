import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface ShopEmployee {
    id: number;
    shop_id: number;
    name: string;
    email: string;
    phone: string;
    role: string;
    address?: string | null;
    status: 'Active' | 'Inactive';
    created_at?: string;
    updated_at?: string;
}

export interface ShopEmployeePayload {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: string;
    address?: string | null;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

// ─── API Functions ───────────────────────────────────────────────────────────

/**
 * Fetches all shop employees with search and pagination
 */
export const fetchShopEmployees = async (
    params: { search?: string; page?: number; per_page?: number; shop_id?: number } = {}
): Promise<PaginatedResponse<ShopEmployee>> => {
    try {
        const response = await axiosInstance.get('/shop-employees-index', { params });
        const raw = response.data;

        // Handle custom Laravel response format: { status: true, data: { current_page: 1, data: [...] } }
        if (raw?.status && raw?.data) {
            if (raw.data.data && Array.isArray(raw.data.data)) {
                return raw.data; // Return the paginated object directly
            }
            if (Array.isArray(raw.data)) {
                return {
                    data: raw.data,
                    current_page: 1,
                    last_page: 1,
                    per_page: raw.data.length,
                    total: raw.data.length,
                };
            }
        }

        // Handle standard Laravel pagination (if not wrapped in custom response)
        if (raw?.data && Array.isArray(raw.data)) {
            return raw;
        }

        // Fallback for non-paginated flat array response
        if (Array.isArray(raw)) {
            return {
                data: raw,
                current_page: 1,
                last_page: 1,
                per_page: raw.length,
                total: raw.length,
            };
        }

        return {
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: 10,
            total: 0,
        };
    } catch (error) {
        console.error('Error fetching shop employees:', error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch employees: ${error.message}`);
        }
        throw error;
    }
};

/**
 * Creates a new shop employee
 */
export const createShopEmployee = async (
    payload: ShopEmployeePayload
): Promise<ApiResponse<ShopEmployee>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<ShopEmployee>>(
            '/shop-employees-create',
            payload
        );
        return response.data;
    } catch (error) {
        console.error('Error creating shop employee:', error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to create employee: ${error.message}`);
        }
        throw error;
    }
};

/**
 * Fetches a single shop employee by ID
 */
export const fetchShopEmployeeById = async (
    id: number | string
): Promise<ApiResponse<ShopEmployee>> => {
    try {
        const response = await axiosInstance.get<ApiResponse<ShopEmployee>>(
            `/shop-employees-show/${id}`
        );
        return response.data;
    } catch (error) {
        console.error(`Error fetching shop employee ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch employee: ${error.message}`);
        }
        throw error;
    }
};

/**
 * Updates an existing shop employee
 */
export const updateShopEmployee = async (
    id: number | string,
    payload: ShopEmployeePayload
): Promise<ApiResponse<ShopEmployee>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<ShopEmployee>>(
            `/shop-employees-update/${id}`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating shop employee ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to update employee: ${error.message}`);
        }
        throw error;
    }
};

/**
 * Deletes a shop employee
 */
export const deleteShopEmployee = async (
    id: number | string
): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/shop-employees-delete/${id}`
        );
        return response.data;
    } catch (error) {
        console.error(`Error deleting shop employee ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to delete employee: ${error.message}`);
        }
        throw error;
    }
};

export const useShopEmployeesApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    const useGetShopEmployees = (params: { search?: string; page?: number; per_page?: number } = {}) =>
        useQuery<PaginatedResponse<ShopEmployee>, Error>({
            queryKey: ['shop-employees', shopId, params],
            // Include shop_id in params so the backend scopes employees to this shop
            queryFn: () => fetchShopEmployees({ ...params, shop_id: shopId ?? undefined }),
            enabled: !!shopId,
        });

    const useCreateShopEmployee = () =>
        useMutation<ApiResponse<ShopEmployee>, Error, ShopEmployeePayload>({
            mutationFn: (payload) => createShopEmployee(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['shop-employees'] });
            },
        });

    const useGetShopEmployeeById = (id: number | string | undefined) =>
        useQuery<ApiResponse<ShopEmployee>, Error>({
            queryKey: ['shop-employee', id],
            queryFn: () => fetchShopEmployeeById(id!),
            enabled: !!id,
        });

    const useUpdateShopEmployee = () =>
        useMutation<ApiResponse<ShopEmployee>, Error, { id: number | string; payload: ShopEmployeePayload }>({
            mutationFn: ({ id, payload }) => updateShopEmployee(id, payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['shop-employees'] });
            },
        });

    const useDeleteShopEmployee = () =>
        useMutation<ApiResponse<void>, Error, number | string>({
            mutationFn: (id) => deleteShopEmployee(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['shop-employees'] });
            },
        });

    return {
        useGetShopEmployees,
        useCreateShopEmployee,
        useGetShopEmployeeById,
        useUpdateShopEmployee,
        useDeleteShopEmployee,
    };
};
