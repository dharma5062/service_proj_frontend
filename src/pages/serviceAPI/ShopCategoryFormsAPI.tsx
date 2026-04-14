import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// Defect Form Field Types
export type FieldType = 'text' | 'dropdown' | 'toggle' | 'checkbox' | 'textarea' | 'date' | 'device-photos' | 'pattern-lock' | 'separator' | 'title' | 'description';

export interface DefectFormField {
    id: string;
    type: FieldType;
    label: string;
    required: boolean;
    showOnReceipt?: boolean;
    options?: string[]; // for dropdown
    defaultValue?: string | boolean | string[];
    placeholder?: string;
    conditionalFields?: DefectFormField[]; // child fields shown when toggle is enabled
}

export interface DefectFormData {
    deviceType: 'smartphone' | 'tablet' | 'laptop' | 'agnostic';
    fields: DefectFormField[];
}

// Category Forms API Interfaces
export interface CategoryFormCategory {
    id: number;
    name: string;
    description?: string | null;
    active: boolean;
    image?: string;
    parent_id?: number | null;
    user_id?: number;
    image_url?: string;
    pivot?: {
        category_form_id: number;
        category_id: number;
        created_at?: string;
        updated_at?: string;
    };
}

export interface CategoryForm {
    id: number;
    name: string;
    category_type?: string; // Optional or removed in backend, keeping optional for now if needed for legacy
    active: boolean | number;
    description?: string | DefectFormField[] | null; // Can be plain text, array of fields, or null
    category_id?: number | null; // Legacy single category reference
    user_id?: number;
    shop_id?: number;
    categories?: CategoryFormCategory[]; // Array of associated categories from API
    category?: {
        id: number;
        name: string;
        description?: string;
        active: boolean | number;
    };
    created_at?: string;
    updated_at?: string;
}

// Request payload for creating a category form
export interface CreateCategoryFormPayload {
    name: string;
    category_type: string;
    active: boolean | number;
    description?: DefectFormField[]; // Array of form fields
    shop_id?: number;
    category_ids?: number[]; // All selected categories
}

// Request payload for updating a category form
export interface UpdateCategoryFormPayload {
    name: string;
    category_type: string;
    active: boolean | number;
    description?: DefectFormField[]; // Array of form fields
    shop_id?: number;
    category_ids?: number[]; // All selected categories
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

// Helper functions for defect form data
/**
 * Converts description field (can be array or JSON string) to DefectFormData
 * @param description - Description field from API (array or JSON string)
 * @returns DefectFormData object or null if invalid
 */
export const deserializeDefectFormData = (description: string | DefectFormField[] | undefined | null): DefectFormData | null => {
    if (!description) return null;

    // If it's already an array, use it directly
    if (Array.isArray(description)) {
        return {
            deviceType: 'agnostic', // Default device type
            fields: description
        };
    }

    // If it's a string, try to parse as JSON (backward compatibility)
    if (typeof description === 'string') {
        try {
            const parsed = JSON.parse(description);
            // Check if it's the old format with deviceType and fields
            if (parsed && typeof parsed === 'object' && 'fields' in parsed && Array.isArray(parsed.fields)) {
                return parsed as DefectFormData;
            }
            // Check if it's just an array of fields
            if (Array.isArray(parsed)) {
                return {
                    deviceType: 'agnostic',
                    fields: parsed
                };
            }
            return null;
        } catch (error) {
            console.error('Error parsing defect form data:', error);
            return null;
        }
    }

    return null;
};

/**
 * Checks if description contains form data (array or JSON)
 * @param description - Description field value
 * @returns true if it's form data, false otherwise
 */
export const isJsonFormData = (description: string | DefectFormField[] | undefined | null): boolean => {
    if (!description) return false;

    // If it's an array, it's form data
    if (Array.isArray(description)) return true;

    // If it's a string, check if it's valid JSON
    if (typeof description === 'string') {
        try {
            const parsed = JSON.parse(description);
            return parsed && (typeof parsed === 'object' && ('fields' in parsed || Array.isArray(parsed)));
        } catch {
            return false;
        }
    }

    return false;
};

/**
 * Fetches all shop category forms from the backend API
 * @returns Promise<CategoryForm[]> - Array of category forms
 * @throws Error if the API request fails
 */
export const fetchCategoryForms = async (): Promise<CategoryForm[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/shop-category-forms-index'
        );

        const responseData = response.data;

        // The API might return paginated data: { status, message, data: { data: [...], ... } }
        // or a direct data wrap: { status, message, data: [...] }
        if (responseData && responseData.data) {
            if (Array.isArray(responseData.data.data)) {
                return responseData.data.data;
            }
            if (Array.isArray(responseData.data)) {
                return responseData.data;
            }
        }

        // Handle direct array response
        if (Array.isArray(responseData)) {
            return responseData;
        }

        return [];
    } catch (error) {
        console.error('Error fetching category forms:', error);
        return []; // Return empty array on error to prevent crash
    }
};

/**
 * Fetches a specific shop category form by ID
 * @param id - Category Form ID
 * @returns Promise<CategoryForm> - Single category form
 * @throws Error if the API request fails
 */
export const fetchCategoryFormById = async (id: number): Promise<CategoryForm> => {
    try {
        const response = await axiosInstance.get<CategoryForm>(
            `/shop-category-forms-show/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error fetching category form ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch category form: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new shop category form
 * @param payload - Category form data including name, category_type, active, description, shop_id, and category_ids
 * @returns Promise<ApiResponse<CategoryForm>> - API response with created category form
 * @throws Error if the API request fails
 */
export const createCategoryForm = async (
    payload: CreateCategoryFormPayload
): Promise<ApiResponse<CategoryForm>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<CategoryForm>>(
            '/shop-category-forms-store',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error creating category form:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create category form: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing shop category form
 * @param id - Category Form ID to update
 * @param payload - Updated category form data
 * @returns Promise<ApiResponse<CategoryForm>> - API response with updated category form
 * @throws Error if the API request fails
 */
export const updateCategoryForm = async (
    id: number,
    payload: UpdateCategoryFormPayload
): Promise<ApiResponse<CategoryForm>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<CategoryForm>>(
            `/shop-category-forms-update/${id}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating category form ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update category form: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a shop category form
 * @param id - Category Form ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteCategoryForm = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/shop-category-forms-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting category form ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete category form: ${error.message}`
            );
        }

        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useShopCategoryFormsApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    const useGetCategoryForms = () => {
        return useQuery<CategoryForm[], Error>({
            queryKey: ['category-forms', shopId],
            queryFn: () => fetchCategoryForms(),
            enabled: !!shopId,
        });
    };

    const useGetCategoryFormById = (id: number | undefined) =>
        useQuery<CategoryForm, Error>({
            queryKey: ['category-forms', id],
            queryFn: () => fetchCategoryFormById(id!),
            enabled: !!id,
        });

    const useCreateCategoryForm = () =>
        useMutation<ApiResponse<CategoryForm>, Error, CreateCategoryFormPayload>({
            mutationFn: (payload) => createCategoryForm(payload),
            onSuccess: () => {
                // Invalidates all branch-scoped category-form caches
                queryClient.invalidateQueries({ queryKey: ['category-forms'], exact: false });
            },
        });

    const useUpdateCategoryForm = () =>
        useMutation<ApiResponse<CategoryForm>, Error, { id: number; payload: UpdateCategoryFormPayload }>({
            mutationFn: ({ id, payload }) => updateCategoryForm(id, payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['category-forms'], exact: false });
            },
        });

    const useDeleteCategoryForm = () =>
        useMutation<ApiResponse<void>, Error, number>({
            mutationFn: (id) => deleteCategoryForm(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['category-forms'], exact: false });
            },
        });

    return {
        useGetCategoryForms,
        useGetCategoryFormById,
        useCreateCategoryForm,
        useUpdateCategoryForm,
        useDeleteCategoryForm,
    };
};
