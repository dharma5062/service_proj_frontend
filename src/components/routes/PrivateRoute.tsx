import { Navigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { ReactNode } from 'react';

interface PrivateRouteProps {
    children: ReactNode;
}

/**
 * PrivateRoute component - Protects routes that require authentication
 * Redirects to login if user is not authenticated
 */
const PrivateRoute = ({ children }: PrivateRouteProps) => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Render children if authenticated
    return <>{children}</>;
};

export default PrivateRoute;
