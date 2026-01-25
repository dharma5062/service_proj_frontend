import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';

// Category Forms API Interfaces
export interface CategoryForm {
    id: number;
    name: string;
    category_type: string;
    active: boolean | number;
    description?: string;
    category_id?: number | null;
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
    description?: string;
    category_id?: number | null;
}

// Request payload for updating a category form
export interface UpdateCategoryFormPayload {
    name: string;
    category_type: string;
    active: boolean | number;
    description?: string;
    category_id?: number | null;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Fetches all category forms from the backend API
 * @returns Promise<CategoryForm[]> - Array of category forms
 * @throws Error if the API request fails
 */
export const fetchCategoryForms = async (): Promise<CategoryForm[]> => {
    try {
        const response = await axiosInstance.get<CategoryForm[]>(
            '/category-forms-index'
        );

        return response.data;
    } catch (error) {
        console.error('Error fetching category forms:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch category forms: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches a specific category form by ID
 * @param id - Category Form ID
 * @returns Promise<CategoryForm> - Single category form
 * @throws Error if the API request fails
 */
export const fetchCategoryFormById = async (id: number): Promise<CategoryForm> => {
    try {
        const response = await axiosInstance.get<CategoryForm>(
            `/category-forms-show/${id}`
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
 * Creates a new category form
 * @param payload - Category form data including name, category_type, active, description, and category_id
 * @returns Promise<ApiResponse<CategoryForm>> - API response with created category form
 * @throws Error if the API request fails
 */
export const createCategoryForm = async (
    payload: CreateCategoryFormPayload
): Promise<ApiResponse<CategoryForm>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<CategoryForm>>(
            '/category-forms-store',
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
 * Updates an existing category form
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
            `/category-forms-update/${id}`,
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
 * Deletes a category form
 * @param id - Category Form ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteCategoryForm = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/category-forms-delete/${id}`
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
