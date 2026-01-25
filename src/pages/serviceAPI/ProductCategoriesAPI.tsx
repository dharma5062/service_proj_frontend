import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';

// Product Categories API Interfaces
export interface ProductCategory {
    id: number;
    name: string;
    slug?: string;
    description?: string;
    image?: string;
    image_url?: string; // Full URL provided by backend
    active: boolean | number;
    parent_id?: number | null;
    parent_name?: string;
    parent?: ProductCategory | null;
    subcategories?: ProductSubcategory[];
    children?: ProductCategory[]; // For hierarchical nested categories
    created_at?: string;
    updated_at?: string;
}

export interface ProductSubcategory {
    id: number;
    name: string;
    slug: string;
    category_id: number;
    description?: string;
    image?: string;
    active: boolean | number;
}

// Request payload for creating a category
export interface CreateCategoryPayload {
    name: string;
    description?: string;
    active: boolean | number;
    image?: File | null;
    parent_id?: number | null;
}

// Request payload for updating a category
export interface UpdateCategoryPayload {
    name: string;
    description?: string;
    active: boolean | number;
    image?: File | null;
    parent_id?: number | null;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Fetches all product categories from the backend API
 * @param parentId - Optional parent ID to filter categories
 * @returns Promise<ProductCategory[]> - Array of product categories with their subcategories
 * @throws Error if the API request fails
 */
export const fetchProductCategories = async (
    parentId?: number
): Promise<ProductCategory[]> => {
    try {
        const params = parentId ? { parent_id: parentId } : {};

        const response = await axiosInstance.get<{
            data: ProductCategory[];
            current_page?: number;
            total_pages?: number;
            per_page?: number;
            total_records?: number;
            has_more?: boolean;
        }>(
            '/product-categories-index',
            { params }
        );

        // Handle paginated response - extract the actual data array
        const categories = response.data.data;

        // Map parent.name to parent_name for easier display
        const categoriesWithParentName = categories.map(category => ({
            ...category,
            parent_name: category.parent?.name || undefined
        }));

        return categoriesWithParentName;
    } catch (error) {
        console.error('Error fetching product categories:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch categories: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches a specific product category by ID
 * @param id - Category ID
 * @returns Promise<ProductCategory> - Single product category
 * @throws Error if the API request fails
 */
export const fetchProductCategoryById = async (id: number): Promise<ProductCategory> => {
    try {
        const response = await axiosInstance.get<ProductCategory>(
            `/product-categories-show/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error fetching product category ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch category: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new product category
 * @param payload - Category data including name, description, active status, image, and parent_id
 * @returns Promise<ApiResponse<ProductCategory>> - API response with created category
 * @throws Error if the API request fails
 */
export const createProductCategory = async (
    payload: CreateCategoryPayload
): Promise<ApiResponse<ProductCategory>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        formData.append('active', payload.active.toString());

        if (payload.image) {
            formData.append('image', payload.image);
        }

        if (payload.parent_id !== undefined && payload.parent_id !== null) {
            formData.append('parent_id', payload.parent_id.toString());
        }

        const response = await axiosInstance.post<ApiResponse<ProductCategory>>(
            '/product-categories-store',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error creating product category:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create category: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing product category
 * @param id - Category ID to update
 * @param payload - Updated category data
 * @returns Promise<ApiResponse<ProductCategory>> - API response with updated category
 * @throws Error if the API request fails
 */
export const updateProductCategory = async (
    id: number,
    payload: UpdateCategoryPayload
): Promise<ApiResponse<ProductCategory>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        formData.append('active', payload.active.toString());

        if (payload.image) {
            formData.append('image', payload.image);
        }

        if (payload.parent_id !== undefined && payload.parent_id !== null) {
            formData.append('parent_id', payload.parent_id.toString());
        }

        const response = await axiosInstance.post<ApiResponse<ProductCategory>>(
            `/product-categories-update/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating product category ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update category: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a product category
 * @param id - Category ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteProductCategory = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/product-categories-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting product category ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete category: ${error.message}`
            );
        }

        throw error;
    }
};
