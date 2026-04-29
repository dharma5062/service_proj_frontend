import axiosInstance from '@/lib/axiosInstance';
import { AxiosError } from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/AuthContext';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface Permission {
    id: number;
    name: string;
    display_name: string;
    module: string;
    created_at?: string;
    updated_at?: string;
}

/**
 * Permissions are returned from the API grouped by module name.
 * e.g. { "Products": [Permission, ...], "Roles": [...] }
 */
export type PermissionsGrouped = Record<string, Permission[]>;

export interface Role {
    id: number;
    name: string;
    description: string | null;
    shop_id: number | null;
    permissions: Permission[];
    created_at?: string;
    updated_at?: string;
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface CreateRolePayload {
    shop_id: number;
    name: string;
    description?: string | null;
    permissions: number[]; // required array of permission IDs
}

export interface UpdateRolePayload {
    name?: string;
    description?: string | null;
    permissions?: number[]; // optional array of permission IDs on update
}

export interface AssignRolePayload {
    user_id: number;
    role_id: number;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
    status: 'success' | 'error';
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
}

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Determines if a response represents a success,
 * handling both { status: 'success' } and { success: true } shapes.
 */
const isSuccess = (data: any): boolean =>
    data?.status === 'success' || data?.success === true;

// ─── API Functions ─────────────────────────────────────────────────────────────

/**
 * GET /permissions
 * Returns all permissions grouped by module.
 */
export const fetchPermissions = async (): Promise<PermissionsGrouped> => {
    try {
        const response = await axiosInstance.get<ApiResponse<PermissionsGrouped>>('/permissions');
        const raw = response.data;

        if (isSuccess(raw) && raw.data && typeof raw.data === 'object') {
            return raw.data as PermissionsGrouped;
        }

        // Fallback: raw response is the grouped object directly
        if (typeof raw === 'object' && !Array.isArray(raw) && !('status' in raw)) {
            return raw as PermissionsGrouped;
        }

        console.warn('Unexpected response format from /permissions:', raw);
        return {};
    } catch (error) {
        console.error('Error fetching permissions:', error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch permissions: ${error.message}`
            );
        }
        throw error;
    }
};

/**
 * GET /roles?shop_id={shopId}
 * Returns system roles (shop_id = null) + shop-specific custom roles.
 * The axiosInstance interceptor automatically appends shop_id from localStorage.
 */
export const fetchRoles = async (): Promise<Role[]> => {
    try {
        const response = await axiosInstance.get<ApiResponse<Role[]>>('/roles');
        const raw = response.data;

        if (isSuccess(raw)) {
            if (Array.isArray(raw.data)) return raw.data;
        }

        // Fallback: raw response is the array directly
        if (Array.isArray(raw)) return raw;

        console.warn('Unexpected response format from /roles:', raw);
        return [];
    } catch (error) {
        console.error('Error fetching roles:', error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to fetch roles: ${error.message}`
            );
        }
        throw error;
    }
};

/**
 * GET /roles — fetch a single role by id from the roles list.
 * There is no dedicated show endpoint, so we fetch all and filter.
 */
export const fetchRoleById = async (id: number): Promise<Role> => {
    const roles = await fetchRoles();
    const role = roles.find((r) => r.id === id);
    if (!role) throw new Error(`Role with id ${id} not found`);
    return role;
};

/**
 * POST /roles-store
 * Creates a new custom role for a shop.
 * Payload: { shop_id, name, description?, permissions: number[] }
 */
export const createRole = async (
    payload: CreateRolePayload
): Promise<ApiResponse<Role>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<Role>>(
            '/roles-store',
            payload
        );
        return response.data;
    } catch (error) {
        console.error('Error creating role:', error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to create role: ${error.message}`
            );
        }
        throw error;
    }
};

/**
 * POST /roles-update/{id}
 * Updates an existing custom role.
 * Payload: { name?, description?, permissions?: number[] }
 */
export const updateRole = async (
    id: number,
    payload: UpdateRolePayload
): Promise<ApiResponse<Role>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<Role>>(
            `/roles-update/${id}`,
            payload
        );
        return response.data;
    } catch (error) {
        console.error(`Error updating role ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to update role: ${error.message}`
            );
        }
        throw error;
    }
};

/**
 * DELETE /roles-delete/{id}
 * Deletes a custom role. System roles (shop_id = null) will be rejected by the backend.
 */
export const deleteRole = async (id: number): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.delete<ApiResponse<void>>(
            `/roles-delete/${id}`
        );
        return response.data;
    } catch (error) {
        console.error(`Error deleting role ${id}:`, error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to delete role: ${error.message}`
            );
        }
        throw error;
    }
};

/**
 * POST /roles-assign
 * Assigns a role to a shop employee (user).
 * Payload: { user_id, role_id }
 * Note: The backend syncs exactly one role per user.
 */
export const assignRole = async (
    payload: AssignRolePayload
): Promise<ApiResponse<void>> => {
    try {
        const response = await axiosInstance.post<ApiResponse<void>>(
            '/roles-assign',
            payload
        );
        return response.data;
    } catch (error) {
        console.error('Error assigning role:', error);
        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                `Failed to assign role: ${error.message}`
            );
        }
        throw error;
    }
};

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

export const useRolesPermissionsApi = () => {
    const queryClient = useQueryClient();
    const { shopId, isSuperAdmin } = useAuth();

    // ── Permissions ──────────────────────────────────────────────────────────

    /**
     * Fetches all permissions grouped by module.
     * Enabled as soon as the user is authenticated (no shopId needed).
     */
    const useGetPermissions = () =>
        useQuery<PermissionsGrouped, Error>({
            queryKey: ['permissions'],
            queryFn: fetchPermissions,
            staleTime: 1000 * 60 * 10, // permissions rarely change; cache for 10 min
        });

    // ── Roles ────────────────────────────────────────────────────────────────

    /**
     * Fetches all roles (system + custom) relevant to the current shop.
     * The axiosInstance interceptor auto-appends shop_id to the query string.
     * Enabled when shopId is set OR when the user is a super admin.
     */
    const useGetRoles = () =>
        useQuery<Role[], Error>({
            queryKey: ['roles', shopId],
            queryFn: fetchRoles,
            enabled: !!shopId || isSuperAdmin,
            staleTime: 1000 * 60 * 2, // cache for 2 minutes to avoid re-fetching on every render
        });

    /**
     * Fetches a single role by ID.
     * Reads from the cached roles list ONLY if the cache is still fresh (not invalidated).
     * After an update/delete, the cache is invalidated, so this always fetches fresh data.
     */
    const useGetRoleById = (id: number | undefined) =>
        useQuery<Role, Error>({
            queryKey: ['role', id, shopId],
            queryFn: async () => {
                // Only use cached roles list if it is NOT stale/invalidated
                const queryState = queryClient.getQueryState<Role[]>(['roles', shopId]);
                const isCacheFresh =
                    queryState?.status === 'success' &&
                    !queryState.isInvalidated &&
                    queryState.data !== undefined;

                if (isCacheFresh) {
                    const found = queryState.data!.find((r) => r.id === id!);
                    if (found) return found;
                }

                // Cache is cold or stale — fetch fresh from server
                const roles = await fetchRoles();
                // Update the roles list cache with the fresh data
                queryClient.setQueryData(['roles', shopId], roles);
                const role = roles.find((r) => r.id === id!);
                if (!role) throw new Error(`Role with id ${id} not found`);
                return role;
            },
            enabled: !!id && (!!shopId || isSuperAdmin),
            // No staleTime here — always re-fetch when invalidated
        });

    // ── Mutations ────────────────────────────────────────────────────────────

    const useCreateRole = () =>
        useMutation<ApiResponse<Role>, Error, CreateRolePayload>({
            mutationFn: (payload) => createRole(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['roles'] });
            },
        });

    const useUpdateRole = () =>
        useMutation<
            ApiResponse<Role>,
            Error,
            { id: number; payload: UpdateRolePayload }
        >({
            mutationFn: ({ id, payload }) => updateRole(id, payload),
            onSuccess: (_, variables) => {
                // Remove the roles list cache entirely so next access re-fetches fresh
                queryClient.removeQueries({ queryKey: ['roles', shopId] });
                // Remove the specific role cache so edit form always loads fresh data
                queryClient.removeQueries({ queryKey: ['role', variables.id, shopId] });
            },
        });

    const useDeleteRole = () =>
        useMutation<ApiResponse<void>, Error, number>({
            mutationFn: (id) => deleteRole(id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['roles'] });
            },
        });

    /**
     * Assigns a single role to an employee.
     * After success, invalidates both 'roles' and 'shop-employees' queries
     * so any employee list that displays role info refreshes automatically.
     */
    const useAssignRole = () =>
        useMutation<ApiResponse<void>, Error, AssignRolePayload>({
            mutationFn: (payload) => assignRole(payload),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['roles'] });
                queryClient.invalidateQueries({ queryKey: ['shop-employees'] });
            },
        });

    return {
        // Permission queries
        useGetPermissions,
        // Role queries
        useGetRoles,
        useGetRoleById,
        // Role mutations
        useCreateRole,
        useUpdateRole,
        useDeleteRole,
        // Assign role mutation
        useAssignRole,
    };
};
