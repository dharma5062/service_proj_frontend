import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// Customer API Interfaces
export interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    address?: string;
    company_name?: string | null;
    gstin?: string | null;
    customer_approved?: boolean;
    invite_token?: string | null;
    invite_token_expires_at?: string | null;
    invited_at?: string | null;
    created_at?: string;
    updated_at?: string;
    
    // New flags added for multi-branch logic
    in_same_shop?: boolean;
    in_current_branch?: boolean;
    requires_invite?: boolean;
}

// Request payload for creating a customer
export interface CreateCustomerPayload {
    name: string;
    email: string;
    phone: string;
    address?: string;
    company_name?: string;
    gstin?: string;
    shop_id?: number | null;
    business_type_id?: number | null;
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
 * @param shop_id - Shop ID
 * @param approvedOnly - If true, only return approved customers
 * @returns Promise<Customer[]> - Array of matching customers
 * @throws Error if the API request fails
 */
export const searchCustomersByPhone = async (phone: string, shop_id?: number | null, approvedOnly?: boolean): Promise<Customer[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/customers-index',
            {
                params: {
                    phone,
                    ...(shop_id !== undefined && shop_id !== null && { shop_id }),
                    ...(approvedOnly !== undefined && { approved_only: approvedOnly })
                }
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
 * @param shop_id - Shop ID
 * @param approvedOnly - If true, only return approved customers
 * @returns Promise<Customer[]> - Array of customers
 * @throws Error if the API request fails
 */
export const fetchCustomers = async (shop_id?: number | null, approvedOnly?: boolean): Promise<Customer[]> => {
    try {
        const response = await axiosInstance.get<any>(
            '/customers-index',
            {
                params: {
                    ...(shop_id !== undefined && shop_id !== null && { shop_id }),
                    ...(approvedOnly !== undefined && { approved_only: approvedOnly })
                }
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
        const response = await axiosInstance.post<any>(
            '/customers-create',
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const responseData = response.data;
        
        // Handle case where backend returns customer instead of data
        if (responseData && responseData.customer) {
            return {
                ...responseData,
                success: responseData.success ?? true,
                data: responseData.customer
            };
        }

        return responseData;
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
export const fetchCustomerById = async (id: number, shopId?: number | null): Promise<Customer> => {
    try {
        const response = await axiosInstance.get<any>(
            `/customers-show/${id}`,
            {
                params: {
                    ...(shopId !== undefined && shopId !== null && { shop_id: shopId })
                }
            }
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
        // Handle direct response fields
        else if (responseData && responseData.success && responseData.customer) {
            return responseData.customer as Customer;
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

/**
 * Send invite to an existing customer by phone number
 * @param phone - Phone number of the customer
 * @param shop_id - Shop ID
 * @param business_type_id - Business type ID
 * @returns Promise<ApiResponse<Customer>> - API response with updated customer
 * @throws Error if the API request fails
 */
export const sendInvite = async (phone: string, shop_id?: number | null, business_type_id?: number | null): Promise<ApiResponse<Customer>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<Customer>>(
            '/customers-send-invite',
            { phone, shop_id, business_type_id },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error sending invite:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to send invite: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Approve a customer using their invite token
 * @param token - The invite token from the email link
 * @returns Promise<ApiResponse<Customer>> - API response with approved customer
 * @throws Error if the API request fails
 */
export const approveInvite = async (token: string): Promise<ApiResponse<Customer>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<Customer>>(
            '/customers-approve-invite',
            { token },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error('Error approving invite:', error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to approve invite: ${error.message}`
            );
        }

        throw error;
    }
};

export interface UpdateCustomerPayload {
    name: string;
    email: string;
    phone: string;
    address?: string;
    company_name?: string;
    gstin?: string;
}

/**
 * Updates an existing customer's details
 */
export const updateCustomer = async (
    id: number,
    payload: UpdateCustomerPayload
): Promise<ApiResponse<Customer>> => {
    try {
        const response = await axiosInstance.put<ApiResponse<Customer>>(
            `/customers-update/${id}`,
            payload
        );

        return response.data;
    } catch (error) {
        console.error(`Error updating customer ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update customer: ${error.message}`
            );
        }

        throw error;
    }
};

/**
 * Deletes/detaches a customer from the shop
 */
export const deleteCustomer = async (id: number, shopId: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/customers-delete/${id}`,
            {
                params: { shop_id: shopId }
            }
        );

        return response.data;
    } catch (error) {
        console.error(`Error deleting customer ${id}:`, error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete customer: ${error.message}`
            );
        }

        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useCustomersApi = () => {
    const queryClient = useQueryClient();
    const { shopId } = useAuth();

    const useGetCustomers = (providedShopId?: number | null, approvedOnly?: boolean) => {
        const effectiveShopId = providedShopId !== undefined ? providedShopId : shopId;
        return useQuery<Customer[], Error>({
            queryKey: ['customers', effectiveShopId, approvedOnly],
            queryFn: () => fetchCustomers(effectiveShopId, approvedOnly),
            enabled: !!effectiveShopId,
        });
    };

    const useGetCustomerById = (id: number | undefined) =>
        useQuery<Customer, Error>({
            queryKey: ['customers', id, shopId],
            queryFn: () => fetchCustomerById(id!, shopId),
            enabled: !!id && !!shopId,
        });

    const useSearchCustomers = (phone: string, providedShopId?: number | null, approvedOnly?: boolean) => {
        const effectiveShopId = providedShopId !== undefined ? providedShopId : shopId;
        return useQuery<Customer[], Error>({
            queryKey: ['customers', 'search', phone, effectiveShopId, approvedOnly],
            queryFn: () => searchCustomersByPhone(phone, effectiveShopId, approvedOnly),
            enabled: phone.length >= 3 && !!effectiveShopId,
        });
    };

    const useCreateCustomer = () =>
        useMutation<ApiResponse<Customer>, Error, CreateCustomerPayload>({
            mutationFn: (payload) => createCustomer(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
            },
        });

    const useUpdateCustomer = () =>
        useMutation<ApiResponse<Customer>, Error, { id: number; payload: UpdateCustomerPayload }>({
            mutationFn: ({ id, payload }) => updateCustomer(id, payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
            },
        });

    const useDeleteCustomer = () =>
        useMutation<ApiResponse<void>, Error, number>({
            mutationFn: (id) => deleteCustomer(id, shopId!),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
            },
        });

    const useSendInvite = () =>
        useMutation<ApiResponse<Customer>, Error, { phone: string; shop_id?: number | null; business_type_id?: number | null }>({
            mutationFn: ({ phone, shop_id, business_type_id }) => sendInvite(phone, shop_id, business_type_id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
            },
        });

    const useApproveInvite = () =>
        useMutation<ApiResponse<Customer>, Error, string>({
            mutationFn: (token) => approveInvite(token),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['customers', shopId] });
            },
        });

    return {
        useGetCustomers,
        useGetCustomerById,
        useSearchCustomers,
        useCreateCustomer,
        useUpdateCustomer,
        useDeleteCustomer,
        useSendInvite,
        useApproveInvite,
    };
};
