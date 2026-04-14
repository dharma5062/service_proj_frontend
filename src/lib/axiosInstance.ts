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

            // Automatically inject shop_id if available
            const shopId = localStorage.getItem('selected_shop_id');
            if (shopId) {
                const method = config.method?.toUpperCase();
                
                // For GET requests, append to query params
                if (method === 'GET') {
                    config.params = { ...config.params, shop_id: shopId };
                } 
                // For data-bearing requests, append to body
                else if (['POST', 'PUT', 'PATCH'].includes(method || '')) {
                    if (config.data instanceof FormData) {
                        if (!config.data.has('shop_id')) {
                            config.data.append('shop_id', shopId);
                        }
                    } else {
                        // Parse existing JSON string if it was stringified early, or handle object
                        let dataObj = config.data || {};
                        if (typeof dataObj === 'string') {
                            try {
                                dataObj = JSON.parse(dataObj);
                            } catch (e) {
                                // If it's a string, but not json, leave it alone.
                            }
                        }
                        
                        // Append to JSON object body
                        if (typeof dataObj === 'object' && !Array.isArray(dataObj)) {
                            config.data = { ...dataObj, shop_id: shopId };
                        }
                    }
                }
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

    // Use a request interceptor to remove Content-Type so the browser
    // can set it to multipart/form-data with the correct boundary.
    instance.interceptors.request.use((config) => {
        if (config.data instanceof FormData) {
            // Delete any Content-Type header so axios/browser sets it automatically
            delete config.headers['Content-Type'];
        }
        return config;
    });

    return instance;
};

export default axiosInstance;
