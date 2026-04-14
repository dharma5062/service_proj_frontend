// AuthContext.tsx
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import axios, { type AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
    id: number;
    name: string;
    email: string;
    user_type: 'sa' | 'so' | 'se' | 'us' | 'cu';
    is_first_login?: boolean;
}

export interface Shop {
    id: number;
    name: string;
    description: string | Record<string, any>;
    active: boolean;
    shop_owner_id: number | null;
    business_type_id?: number | null;
    image: string | null;
    image_url: string | null;
    created_at?: string;
    updated_at?: string;
    shop_owner?: {
        id: number;
        name: string;
        company_name?: string;
        email?: string;
        phone?: string;
    };
}

export interface RegisterFormData {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
    user_type: string;
}

export interface OTPVerificationData {
    email: string;
    email_otp: string;
    otp_send?: string;
}

export interface OTPResponse {
    otp_send: string;
    expires_at: string;
    message?: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: Record<string, string[]>;
}

export interface ValidationErrors {
    [key: string]: string;
}

// ─── Context Type ─────────────────────────────────────────────────────────────

interface AuthContextType {
    // Token management
    token: string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
    isAuthenticated: boolean;

    // Auth actions
    login: (token: string) => void;
    logout: () => void;

    // Axios
    axiosInstance: AxiosInstance;

    // User state
    user: User | null;
    fetchUser: () => void;
    loading: boolean;

    // Shop state
    shops: Shop[];
    shop: Shop | null;
    shopId: number | null;
    shopLoading: boolean;
    fetchShop: () => void;
    setShop: (shop: Shop) => void;

    // Role helpers
    isSuperAdmin: boolean;
    isShopOwner: boolean;
    isShopEmployee: boolean;
    isUser: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [userLoaded, setUserLoaded] = useState<boolean>(false);

    const [shops, setShops] = useState<Shop[]>([]);
    const [shop, setShopState] = useState<Shop | null>(null);
    const [shopLoading, setShopLoading] = useState<boolean>(false);
    const [shopLoaded, setShopLoaded] = useState<boolean>(false);

    const setShop = useCallback((newShop: Shop | null) => {
        setShopState(newShop);
        if (newShop) {
            localStorage.setItem('selected_shop_id', newShop.id.toString());
        } else {
            localStorage.removeItem('selected_shop_id');
        }
    }, []);

    const isAuthenticated = Boolean(token);

    // ── Role helpers ──────────────────────────────────────────────────────────
    const isSuperAdmin = useMemo(() => user?.user_type === 'sa', [user?.user_type]);
    const isShopOwner = useMemo(() => user?.user_type === 'so', [user?.user_type]);
    const isShopEmployee = useMemo(() => user?.user_type === 'se', [user?.user_type]);
    const isUser = useMemo(() => user?.user_type === 'us', [user?.user_type]);

    // ── Computed shopId ───────────────────────────────────────────────────────
    const shopId = useMemo(() => shop?.id ?? null, [shop]);

    // ── Token management ──────────────────────────────────────────────────────

    const resetUserAndShop = useCallback(() => {
        setUser(null);
        setUserLoaded(false);
        setShops([]);
        setShopState(null);
        setShopLoaded(false);
        localStorage.removeItem('selected_shop_id');
    }, []);

    const setToken = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setTokenState(newToken);
        resetUserAndShop();
    }, [resetUserAndShop]);

    const clearToken = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usertype');
        setTokenState(null);
        resetUserAndShop();
    }, [resetUserAndShop]);

    const login = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setTokenState(newToken);
        resetUserAndShop();
    }, [resetUserAndShop]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usertype');
        setTokenState(null);
        resetUserAndShop();
    }, [resetUserAndShop]);

    // ── Axios instance ────────────────────────────────────────────────────────

    const axiosInstance = useMemo(() => {
        const instance = axios.create({
            baseURL: 'http://127.0.0.1:8000/api',
            headers: { 'Content-Type': 'application/json' },
        });

        instance.interceptors.request.use((config) => {
            const currentToken = localStorage.getItem('token');
            if (currentToken) {
                config.headers['Authorization'] = `Bearer ${currentToken}`;
            }
            return config;
        });

        instance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    clearToken();
                }
                return Promise.reject(error);
            }
        );

        return instance;
    }, [clearToken]);

    // ── Fetch authenticated user ───────────────────────────────────────────────

    const fetchUser = useCallback(async () => {
        if (!token) {
            setUserLoaded(true);
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.get<{ user: User }>('/user');
            setUser(response.data.user);
            setUserLoaded(true);
        } catch (err) {
            console.error('Failed to fetch user:', err);
            setUser(null);
            setUserLoaded(true);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, token]);

    // ── Fetch authenticated user's shop ───────────────────────────────────────

    const fetchShop = useCallback(async () => {
        if (!token) {
            setShopLoaded(true);
            return;
        }

        setShopLoading(true);
        try {
            const response = await axiosInstance.get('/shops-index');
            const raw = response.data;

            let shops: Shop[] = [];

            if (Array.isArray(raw)) {
                shops = raw;
            } else if (raw?.data && Array.isArray(raw.data)) {
                shops = raw.data;
            } else if (raw?.data?.data && Array.isArray(raw.data.data)) {
                shops = raw.data.data;
            } else if (raw?.id) {
                shops = [raw as Shop];
            } else if (raw && typeof raw === 'object') {
                const firstArray = Object.values(raw).find(v => Array.isArray(v));
                if (firstArray) shops = firstArray as Shop[];
            }

            const storedShopId = localStorage.getItem('selected_shop_id');
            const parsedStoredShopId = storedShopId ? parseInt(storedShopId, 10) : null;
            let userShop: Shop | null = null;

            if (shops.length > 0) {
                if (parsedStoredShopId) {
                    userShop = shops.find(s => s.id === parsedStoredShopId) || shops[0];
                } else {
                    userShop = shops[0];
                }
            }

            setShops(shops);
            setShop(userShop);
            setShopLoaded(true);
        } catch (err) {
            console.error('Failed to fetch shop:', err);
            setShops([]);
            setShop(null);
            setShopLoaded(true);
        } finally {
            setShopLoading(false);
        }
    }, [axiosInstance, token]);

    // ── Auto-fetch user when authenticated ────────────────────────────────────

    useEffect(() => {
        if (isAuthenticated && !userLoaded) {
            fetchUser();
        } else if (!isAuthenticated) {
            setUser(null);
            setUserLoaded(false);
        }
    }, [isAuthenticated, userLoaded, fetchUser]);

    // ── Auto-fetch shop once user is loaded ───────────────────────────────────

    useEffect(() => {
        if (isAuthenticated && userLoaded && !shopLoaded) {
            fetchShop();
        } else if (!isAuthenticated) {
            setShops([]);
            setShop(null);
            setShopLoaded(false);
        }
    }, [isAuthenticated, userLoaded, shopLoaded, fetchShop]);

    // ── Context value ─────────────────────────────────────────────────────────

    const isLoadingState = loading || (isAuthenticated && !userLoaded);

    return (
        <AuthContext.Provider
            value={{
                token,
                setToken,
                clearToken,
                axiosInstance,
                isAuthenticated,
                logout,
                login,
                user,
                fetchUser,
                loading: isLoadingState,

                shops,
                shop,
                shopId,
                shopLoading,
                fetchShop,
                setShop,

                isSuperAdmin,
                isShopOwner,
                isShopEmployee,
                isUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
