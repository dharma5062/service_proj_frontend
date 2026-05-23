import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/AuthContext';

export interface Notification {
    id: string;
    type: 'service' | 'staff' | 'alert' | 'system';
    title: string;
    description: string;
    time: string;
    isRead: boolean;
}

export const useNotifications = () => {
    const { axiosInstance, isAuthenticated } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(false);

    // Prevent state update if component is unmounted
    const isMounted = useRef(true);

    const fetchNotifications = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get('/notifications?per_page=100');
            if (response.data?.status && isMounted.current) {
                const fetched: Notification[] = response.data.data.data.map((item: any) => ({
                    id: String(item.id),
                    type: item.model as Notification['type'], // reuse model column as type
                    title: item.title,
                    description: item.message,
                    time: item.time_ago,
                    isRead: item.is_read,
                }));
                setNotifications(fetched);

                // calculate unread count locally
                const unread = fetched.filter(n => !n.isRead).length;
                setUnreadCount(unread);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [axiosInstance, isAuthenticated]);


    const markRead = useCallback(async (id: string) => {
        // Optimistic UI update
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await axiosInstance.post(`/notifications/${id}/mark-read`);
        } catch (error) {
            console.error(`Error marking notification ${id} as read:`, error);
            // Revert on error
            fetchNotifications();
        }
    }, [axiosInstance, fetchNotifications]);

    const markAllRead = useCallback(async () => {
        // Optimistic UI update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);

        try {
            await axiosInstance.post('/notifications/mark-all-read');
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            // Revert on error
            fetchNotifications();
        }
    }, [axiosInstance, fetchNotifications]);

    // Initial load
    useEffect(() => {
        isMounted.current = true;
        if (isAuthenticated) {
            fetchNotifications();
        }
        return () => {
            isMounted.current = false;
        };
    }, [isAuthenticated, fetchNotifications]);



    return {
        notifications,
        unreadCount,
        loading,
        markRead,
        markAllRead,
        refresh: fetchNotifications,
    };
};
