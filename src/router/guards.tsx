import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context';
import { Spinner } from '@/components/ui/Spinner';

export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <Spinner message="Chargement..." />
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

// Stub — brancher quand la logique onboarding est prête
export function RequireOnboarding() {
  return <Outlet />;
}

// Stub — brancher quand la logique subscription est prête
export function RequireSubscription() {
  return <Outlet />;
}
