import axiosInstance from '@/lib/axiosInstance';
import { useQuery } from '@tanstack/react-query';

// Business Type Interface
export interface BusinessType {
    id: number;
    name: string;
    active: boolean;
    category_id: number;
    user_id: number;
    created_at: string;
    updated_at: string;
    category: {
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
    };
}

// API Response Interface
export interface BusinessTypesResponse {
    status: boolean;
    message: string;
    data: {
        current_page: number;
        data: BusinessType[];
        [key: string]: any;
    };
}

/**
 * Fetch business types from the API
 * @returns Promise with business types array
 */
export const fetchBusinessTypes = async (): Promise<BusinessType[]> => {
    try {
        const response = await axiosInstance.get<BusinessTypesResponse>('/business-types-index?active=1');
        return response.data.data.data;
    } catch (error) {
        console.error('Error fetching business types:', error);
        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useBusinessTypesApi = () => {
    const useGetBusinessTypes = () =>
        useQuery<BusinessType[], Error>({
            queryKey: ['business-types'],
            queryFn: () => fetchBusinessTypes(),
            staleTime: 5 * 60 * 1000, // 5 minutes – business types rarely change
        });

    return { useGetBusinessTypes };
};
