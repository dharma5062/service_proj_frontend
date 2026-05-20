import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// Product API Interfaces
export interface Product {
    id: number;
    name: string;
    description?: string;
    price?: number;
    tax_name?: string;
    tax_percentage?: number;
    tax_type?: 'inclusive' | 'exclusive' | string;
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
    tax_name?: string;
    tax_percentage?: number;
    tax_type?: 'inclusive' | 'exclusive' | string;
    active: boolean | number;
    image?: File | null;
    remove_image?: boolean | number;
    category_id?: number | null;
    brand_id?: number | null;
}

// Request payload for updating a product
export interface UpdateProductPayload {
    name: string;
    description?: string;
    price?: number;
    tax_name?: string;
    tax_percentage?: number;
    tax_type?: 'inclusive' | 'exclusive' | string;
    active: boolean | number;
    image?: File | null;
    remove_image?: boolean | number;
    category_id?: number | null;
    brand_id?: number | null;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginatedProductsResponse {
    data: Product[];
    total: number;
    current_page: number;
    per_page: number;
    last_page: number;
}

/**
 * Fetches products from the backend API with pagination support
 */
export const fetchProducts = async (params?: { page?: number; per_page?: number }): Promise<PaginatedProductsResponse> => {
    try {
        const response = await axiosInstance.get<any>(
            '/products-index',
            { params: { page: params?.page ?? 1, per_page: params?.per_page ?? 10 } }
        );

        const responseData = response.data;

        // Paginated response: { status, message, data: { data: [], total, current_page, per_page, last_page } }
        if (responseData?.data && Array.isArray(responseData.data.data)) {
            return {
                data: responseData.data.data as Product[],
                total: responseData.data.total ?? responseData.data.data.length,
                current_page: responseData.data.current_page ?? 1,
                per_page: responseData.data.per_page ?? 10,
                last_page: responseData.data.last_page ?? 1,
            };
        }
        // Direct array fallback
        if (Array.isArray(responseData)) {
            return { data: responseData, total: responseData.length, current_page: 1, per_page: responseData.length, last_page: 1 };
        }
        console.warn('Unexpected response format from /products-index:', responseData);
        return { data: [], total: 0, current_page: 1, per_page: 10, last_page: 1 };
    } catch (error) {
        console.error('Error fetching products:', error);
        if (error instanceof AxiosError) {
            throw new Error(error.response?.data?.message || `Failed to fetch products: ${error.message}`);
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

        if (payload.remove_image) {
            formData.append('remove_image', '1');
        }

        if (payload.category_id !== undefined && payload.category_id !== null) {
            formData.append('category_id', payload.category_id.toString());
        }

        if (payload.brand_id !== undefined && payload.brand_id !== null) {
            formData.append('brand_id', payload.brand_id.toString());
        }

        if (payload.tax_name) {
            formData.append('tax_name', payload.tax_name);
        }

        if (payload.tax_percentage !== undefined && payload.tax_percentage !== null) {
            formData.append('tax_percentage', payload.tax_percentage.toString());
        }

        if (payload.tax_type) {
            formData.append('tax_type', payload.tax_type);
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

        if (payload.remove_image) {
            formData.append('remove_image', '1');
        }

        if (payload.category_id !== undefined && payload.category_id !== null) {
            formData.append('category_id', payload.category_id.toString());
        }

        if (payload.brand_id !== undefined && payload.brand_id !== null) {
            formData.append('brand_id', payload.brand_id.toString());
        }

        if (payload.tax_name) {
            formData.append('tax_name', payload.tax_name);
        }

        if (payload.tax_percentage !== undefined && payload.tax_percentage !== null) {
            formData.append('tax_percentage', payload.tax_percentage.toString());
        }

        if (payload.tax_type) {
            formData.append('tax_type', payload.tax_type);
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

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useProductsApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    const useGetProducts = (options?: { enabled?: boolean; page?: number; per_page?: number }) =>
        useQuery<PaginatedProductsResponse, Error>({
            queryKey: ['products', shopId, options?.page ?? 1, options?.per_page ?? 10],
            queryFn: () => fetchProducts({ page: options?.page ?? 1, per_page: options?.per_page ?? 10 }),
            enabled: options?.enabled !== undefined ? options.enabled && !!shopId : !!shopId,
        });

    const useGetProductById = (id: number | undefined) =>
        useQuery<Product, Error>({
            queryKey: ['products', id],
            queryFn: () => fetchProductById(id!),
            enabled: !!id,
        });

    const useCreateProduct = () =>
        useMutation<ApiResponse<Product>, Error, CreateProductPayload>({
            mutationFn: (payload) => createProduct(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['products'] });
            },
        });

    const useUpdateProduct = () =>
        useMutation<ApiResponse<Product>, Error, { id: number; payload: UpdateProductPayload }>({
            mutationFn: ({ id, payload }) => updateProduct(id, payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['products'] });
            },
        });

    const useDeleteProduct = () =>
        useMutation<ApiResponse<void>, Error, number>({
            mutationFn: (id) => deleteProduct(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['products'], exact: false });
            },
        });

    return {
        useGetProducts,
        useGetProductById,
        useCreateProduct,
        useUpdateProduct,
        useDeleteProduct,
    };
};
