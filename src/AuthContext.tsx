// signal/AuthContext.tsx
import React, { createContext, useState, useContext, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import axios, { type AxiosInstance } from 'axios';

// types/auth.ts
export interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'sa' | 'so' | 'se' | 'us';
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

interface AuthContextType {
    token: string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
    axiosInstance: AxiosInstance;
    isAuthenticated: boolean;
    logout: () => void;
    login: (token: string) => void;
    user: User | null;
    fetchUser: () => void;
    loading: boolean;

    // New roles
    isSuperAdmin: boolean;
    isShopOwner: boolean;
    isShopEmployee: boolean;
    isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [userLoaded, setUserLoaded] = useState<boolean>(false);

    const isAuthenticated = Boolean(token);

    // ============================
    // 🚀 Updated Role Logic
    // ============================
    const isSuperAdmin = useMemo(() => user?.user_type === 'sa', [user?.user_type]);
    const isShopOwner = useMemo(() => user?.user_type === 'so', [user?.user_type]);
    const isShopEmployee = useMemo(() => user?.user_type === 'se', [user?.user_type]);
    const isUser = useMemo(() => user?.user_type === 'us', [user?.user_type]);

    const setToken = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setTokenState(newToken);
        setUser(null);
        setUserLoaded(false);
    }, []);

    const clearToken = useCallback(() => {
        localStorage.removeItem('token');
        setTokenState(null);
        setUser(null);
        setUserLoaded(false);
    }, []);

    const login = useCallback((newToken: string) => {
        localStorage.setItem('token', newToken);
        setTokenState(newToken);
        setUser(null);
        setUserLoaded(false);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem("usertype");
        setTokenState(null);
        setUser(null);
        setUserLoaded(false);
    }, []);

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

    const fetchUser = useCallback(async () => {
        if (!token) {
            setUserLoaded(true);
            return;
        }

        setLoading(true);
        try {
            const response = await axiosInstance.get<User>('/user');
            setUser(response.data);
            setUserLoaded(true);
        } catch (err) {
            console.error('Failed to fetch user:', err);
            setUser(null);
            setUserLoaded(true);
        } finally {
            setLoading(false);
        }
    }, [axiosInstance, token]);

    useEffect(() => {
        if (isAuthenticated && !userLoaded) {
            fetchUser();
        } else if (!isAuthenticated) {
            setUser(null);
            setUserLoaded(false);
        }
    }, [isAuthenticated, userLoaded, fetchUser]);

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
                loading: loading || (isAuthenticated && !userLoaded),

                // Export new role values
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

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
