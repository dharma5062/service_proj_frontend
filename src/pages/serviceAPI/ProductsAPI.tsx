import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';

// Product API Interfaces
export interface Product {
    id: number;
    name: string;
    description?: string;
    price?: number;
    active: boolean | number;
    image?: string | null;
    image_url?: string;
    category_id?: number | null;
    brand_id?: number | null;
    category?: {
        id: number;
        name: string;
        description?: string;
        active: boolean | number;
        parent_id?: number | null;
        parent?: {
            id: number;
            name: string;
            parent_id?: number | null;
            parent?: {
                id: number;
                name: string;
                parent_id?: number | null;
            } | null;
        } | null;
        children?: Array<{
            id: number;
            name: string;
            parent_id?: number | null;
        }>;
    };
    brand?: {
        id: number;
        name: string;
        is_active: boolean | number;
    };
    created_at?: string;
    updated_at?: string;
}

// Request payload for creating a product
export interface CreateProductPayload {
    name: string;
    description?: string;
    price?: number;
    active: boolean | number;
    image?: File | null;
    category_id?: number | null;
    brand_id?: number | null;
}

// Request payload for updating a product
export interface UpdateProductPayload {
    name: string;
    description?: string;
    price?: number;
    active: boolean | number;
    image?: File | null;
    category_id?: number | null;
    brand_id?: number | null;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Fetches all products from the backend API
 * @returns Promise<Product[]> - Array of products
 * @throws Error if the API request fails
 */
export const fetchProducts = async (): Promise<Product[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/products-index'
        );

        const responseData = response.data;

        // Handle paginated response
        if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
            return responseData.data.data;
        }
        // Handle direct array response (fallback)
        else if (Array.isArray(responseData)) {
            return responseData;
        }
        // Handle direct data array
        else if (responseData && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        else {
            console.warn('Unexpected response format from /products-index:', responseData);
            return [];
        }
    } catch (error) {
        console.error('Error fetching products:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch products: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches a specific product by ID
 * @param id - Product ID
 * @returns Promise<Product> - Single product
 * @throws Error if the API request fails
 */
export const fetchProductById = async (id: number): Promise<Product> => {
    try {
        const response = await axiosInstance.get<any>(
            `/products-show/${id}`
        );

        const responseData = response.data;

        // Handle nested response { status, message, data: { product object } }
        if (responseData && responseData.data && typeof responseData.data === 'object') {
            // Check if it's wrapped in another data property
            if ('data' in responseData.data && responseData.data.data) {
                return responseData.data.data as Product;
            }
            // Direct data object
            else if ('id' in responseData.data) {
                return responseData.data as Product;
            }
        }
        // Handle direct object response
        else if (responseData && 'id' in responseData) {
            return responseData as Product;
        }

        throw new Error('Unexpected response format from /products-show');
    } catch (error) {
        console.error(`Error fetching product ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch product: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new product
 * @param payload - Product data including name, description, active, image, category_id, and brand_id
 * @returns Promise<ApiResponse<Product>> - API response with created product
 * @throws Error if the API request fails
 */
export const createProduct = async (
    payload: CreateProductPayload
): Promise<ApiResponse<Product>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        formData.append('active', payload.active ? '1' : '0');

        if (payload.price !== undefined && payload.price !== null) {
            formData.append('price', payload.price.toString());
        }

        if (payload.image) {
            formData.append('image', payload.image);
        }

        if (payload.category_id !== undefined && payload.category_id !== null) {
            formData.append('category_id', payload.category_id.toString());
        }

        if (payload.brand_id !== undefined && payload.brand_id !== null) {
            formData.append('brand_id', payload.brand_id.toString());
        }

        const response = await axiosInstance.post<ApiResponse<Product>>(
            '/products-store',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error creating product:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create product: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing product
 * @param id - Product ID to update
 * @param payload - Updated product data
 * @returns Promise<ApiResponse<Product>> - API response with updated product
 * @throws Error if the API request fails
 */
export const updateProduct = async (
    id: number,
    payload: UpdateProductPayload
): Promise<ApiResponse<Product>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);

        if (payload.description) {
            formData.append('description', payload.description);
        }

        formData.append('active', payload.active ? '1' : '0');

        if (payload.price !== undefined && payload.price !== null) {
            formData.append('price', payload.price.toString());
        }

        if (payload.image) {
            formData.append('image', payload.image);
        }

        if (payload.category_id !== undefined && payload.category_id !== null) {
            formData.append('category_id', payload.category_id.toString());
        }

        if (payload.brand_id !== undefined && payload.brand_id !== null) {
            formData.append('brand_id', payload.brand_id.toString());
        }

        const response = await axiosInstance.post<ApiResponse<Product>>(
            `/products-update/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating product ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update product: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a product
 * @param id - Product ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteProduct = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/products-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting product ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete product: ${error.message}`
            );
        }

        throw error;
    }
};
