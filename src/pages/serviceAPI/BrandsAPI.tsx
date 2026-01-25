import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';

// Brand API Interfaces
export interface Brand {
    id: number;
    name: string;
    brand_logo?: string | null;
    is_active: boolean | number;
    created_at?: string;
    updated_at?: string;
}

// Request payload for creating a brand
export interface CreateBrandPayload {
    name: string;
    brand_logo?: File | null;
    is_active: boolean | number;
}

// Request payload for updating a brand
export interface UpdateBrandPayload {
    name: string;
    brand_logo?: File | null;
    is_active: boolean | number;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Fetches all brands from the backend API
 * @returns Promise<Brand[]> - Array of brands
 * @throws Error if the API request fails
 */
export const fetchBrands = async (): Promise<Brand[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/brand-index'
        );

        // The API returns paginated data with structure:
        // { status, message, data: { current_page, data: [...], ... } }
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
            console.warn('Unexpected response format from /brand-index:', responseData);
            return [];
        }
    } catch (error) {
        console.error('Error fetching brands:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch brands: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches a specific brand by ID
 * @param id - Brand ID
 * @returns Promise<Brand> - Single brand
 * @throws Error if the API request fails
 */
export const fetchBrandById = async (id: number): Promise<Brand> => {
    try {
        const response = await axiosInstance.get<any>(
            `/brand-show/${id}`
        );

        const responseData = response.data;

        // Handle nested response { status, message, data: { brand object } }
        if (responseData && responseData.data && typeof responseData.data === 'object') {
            // Check if it's wrapped in another data property
            if ('data' in responseData.data && responseData.data.data) {
                return responseData.data.data as Brand;
            }
            // Direct data object
            else if ('id' in responseData.data) {
                return responseData.data as Brand;
            }
        }
        // Handle direct object response
        else if (responseData && 'id' in responseData) {
            return responseData as Brand;
        }

        throw new Error('Unexpected response format from /brand-show');
    } catch (error) {
        console.error(`Error fetching brand ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch brand: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new brand
 * @param payload - Brand data including name, brand_logo, and is_active
 * @returns Promise<ApiResponse<Brand>> - API response with created brand
 * @throws Error if the API request fails
 */
export const createBrand = async (
    payload: CreateBrandPayload
): Promise<ApiResponse<Brand>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);
        formData.append('is_active', payload.is_active ? '1' : '0');

        if (payload.brand_logo) {
            formData.append('brand_logo', payload.brand_logo);
        }

        const response = await axiosInstance.post<ApiResponse<Brand>>(
            '/brand-create',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error creating brand:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create brand: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Updates an existing brand
 * @param id - Brand ID to update
 * @param payload - Updated brand data
 * @returns Promise<ApiResponse<Brand>> - API response with updated brand
 * @throws Error if the API request fails
 */
export const updateBrand = async (
    id: number,
    payload: UpdateBrandPayload
): Promise<ApiResponse<Brand>> => {
    try {
        const formData = new FormData();
        formData.append('name', payload.name);
        formData.append('is_active', payload.is_active ? '1' : '0');

        if (payload.brand_logo) {
            formData.append('brand_logo', payload.brand_logo);
        }

        const response = await axiosInstance.post<ApiResponse<Brand>>(
            `/brand-update/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating brand ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update brand: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes a brand
 * @param id - Brand ID to delete
 * @returns Promise<ApiResponse<void>> - API response confirming deletion
 * @throws Error if the API request fails
 */
export const deleteBrand = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/brand-delete/${id}`
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting brand ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete brand: ${error.message}`
            );
        }

        throw error;
    }
};
