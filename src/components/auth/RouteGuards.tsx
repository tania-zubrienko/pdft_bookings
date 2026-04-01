import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function FullscreenLoader() {
    return (
        <div className='min-h-screen bg-ui-page flex items-center justify-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
    );
}

export function RequireAuth({ children }: { children: JSX.Element }) {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) return <FullscreenLoader />;
    if (!isAuthenticated) {
        return (
            <Navigate
                to='/login'
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return children;
}

export function RequireAdmin({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isAdmin, loading } = useAuth();
    console.log("isAuthenticated", isAuthenticated, "isAdmin", isAdmin)
    if (loading) return <FullscreenLoader />;
    if (!isAuthenticated) return <Navigate to='/login' replace />;
    if (!isAdmin) return <Navigate to='/classes' replace />;

    return children;
}
