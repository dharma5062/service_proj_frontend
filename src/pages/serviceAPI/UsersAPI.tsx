import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface UserUpdatePayload {
    name?: string;
    company_name?: string;
    address?: string;
    phone?: string;
    image?: File | null;
}

export const useUsersApi = () => {
    const queryClient = useQueryClient();

    const updateUser = useMutation({
        mutationFn: async ({ id, payload }: { id: number; payload: UserUpdatePayload }) => {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            
            if (payload.name) formData.append('name', payload.name);
            if (payload.company_name) formData.append('company_name', payload.company_name);
            if (payload.address) formData.append('address', payload.address);
            if (payload.phone) formData.append('phone', payload.phone);
            if (payload.image) formData.append('image', payload.image);

            const response = await axios.post(`${API_BASE_URL}/users-update/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Company updated successfully');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to update company';
            toast.error(message);
        },
    });

    const deleteUser = useMutation({
        mutationFn: async (id: number) => {
            const token = localStorage.getItem('token');
            const response = await axios.delete(`${API_BASE_URL}/users-delete/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shops'] });
            toast.success('Company deleted successfully');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Failed to delete company';
            toast.error(message);
        },
    });

    return {
        updateUser,
        deleteUser,
    };
};
