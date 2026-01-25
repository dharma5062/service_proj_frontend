// Centralized Axios Instance with Authentication
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Creates an axios instance with authentication headers
 * This instance automatically includes the Bearer token from localStorage
 */
const createAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        timeout: 30000, // 30 seconds
    });

    // Request Interceptor - Add token to all requests
    instance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const token = localStorage.getItem('token');

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        },
        (error: AxiosError) => {
            return Promise.reject(error);
        }
    );

    // Response Interceptor - Handle errors globally
    instance.interceptors.response.use(
        (response) => response,
        (error: AxiosError) => {
            // Handle 401 Unauthorized - Token expired or invalid
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('usertype');

                // Redirect to login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }

            // Handle 403 Forbidden
            if (error.response?.status === 403) {
                console.error('Access forbidden');
            }

            // Handle 500 Server Error
            if (error.response?.status === 500) {
                console.error('Server error occurred');
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

// Export the axios instance
export const axiosInstance = createAxiosInstance();

// Export API_BASE_URL for cases where direct fetch is needed
export { API_BASE_URL };

// Helper function to handle multipart/form-data requests
export const createFormDataAxios = (): AxiosInstance => {
    const instance = createAxiosInstance();

    // Override default Content-Type for multipart/form-data
    instance.defaults.headers.common['Content-Type'] = 'multipart/form-data';

    return instance;
};

export default axiosInstance;
