import { Navigate } from 'react-router-dom';
import { useAuth } from '@/AuthContext';
import { ReactNode } from 'react';

interface PublicRouteProps {
    children: ReactNode;
    redirectTo?: string;
}

/**
 * PublicRoute component - Handles public routes like login, register
 * Redirects authenticated users to dashboard
 */
const PublicRoute = ({ children, redirectTo = '/dashboard' }: PublicRouteProps) => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Redirect to dashboard if already authenticated
    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    // Render children if not authenticated
    return <>{children}</>;
};

export default PublicRoute;
