import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';

// Customer API Interfaces
export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    created_at?: string;
    updated_at?: string;
}

// Request payload for creating a customer
export interface CreateCustomerPayload {
    name: string;
    email: string;
    phone: string;
    address?: string;
}

// API Response types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

/**
 * Search customers by phone number
 * @param phone - Phone number to search for
 * @returns Promise<Customer[]> - Array of matching customers
 * @throws Error if the API request fails
 */
export const searchCustomersByPhone = async (phone: string): Promise<Customer[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/customers-index',
            {
                params: { phone }
            }
        );

        const responseData = response.data;



        // Handle response with explicit 'customers' property
        if (responseData && Array.isArray(responseData.customers)) {
            return responseData.customers;
        }

        // Handle different response formats
        if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
            return responseData.data.data;
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
            return responseData;
        }
        // Handle direct data array
        else if (responseData && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        else {
            console.warn('Unexpected response format from /customers-index:', responseData);
            return [];
        }
    } catch (error) {
        console.error('Error searching customers:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to search customers: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches all customers
 * @returns Promise<Customer[]> - Array of customers
 * @throws Error if the API request fails
 */
export const fetchCustomers = async (): Promise<Customer[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/customers-index'
        );

        const responseData = response.data;

        // Handle response with explicit 'customers' property
        if (responseData && Array.isArray(responseData.customers)) {
            return responseData.customers;
        }

        // Handle different response formats
        if (responseData && responseData.data && Array.isArray(responseData.data.data)) {
            return responseData.data.data;
        }
        // Handle direct array response
        else if (Array.isArray(responseData)) {
            return responseData;
        }
        // Handle direct data array
        else if (responseData && Array.isArray(responseData.data)) {
            return responseData.data;
        }
        else {
            console.warn('Unexpected response format from /customers-index:', responseData);
            return [];
        }
    } catch (error) {
        console.error('Error fetching customers:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch customers: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Creates a new customer and sends email link
 * @param payload - Customer data including name, email, phone, and optional address
 * @returns Promise<ApiResponse<Customer>> - API response with created customer
 * @throws Error if the API request fails
 */
export const createCustomer = async (
    payload: CreateCustomerPayload
): Promise<ApiResponse<Customer>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<Customer>>(
            '/customers-create',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error creating customer:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create customer: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Fetches a specific customer by ID
 * @param id - Customer ID
 * @returns Promise<Customer> - Single customer
 * @throws Error if the API request fails
 */
export const fetchCustomerById = async (id: number): Promise<Customer> => {
    try {
        const response = await axiosInstance.get<any>(
            `/customers-show/${id}`
        );

        const responseData = response.data;

        // Handle nested response
        if (responseData && responseData.data && typeof responseData.data === 'object') {
            if ('data' in responseData.data && responseData.data.data) {
                return responseData.data.data as Customer;
            }
            else if ('id' in responseData.data) {
                return responseData.data as Customer;
            }
        }
        // Handle direct object response
        else if (responseData && 'id' in responseData) {
            return responseData as Customer;
        }

        throw new Error('Unexpected response format from /customers-show');
    } catch (error) {
        console.error(`Error fetching customer ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch customer: ${error.message}`
            );
        }

        throw error;
    }
};
