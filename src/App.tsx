import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from '@/context';
import { Sidebar, Footer } from '@/components/layout';
import { Spinner } from '@/components/ui/Spinner';

const HomePage = lazy(() => import('@/pages/HomePage').then(m => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ActivitiesPage = lazy(() => import('@/pages/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const ActivityDetailPage = lazy(() => import('@/pages/ActivityDetailPage').then(m => ({ default: m.ActivityDetailPage })));
const KPIPage = lazy(() => import('@/pages/KPIPage').then(m => ({ default: m.KPIPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PerformancePage = lazy(() => import('@/pages/PerformancePage').then(m => ({ default: m.PerformancePage })));
const ExplorationPage = lazy(() => import('@/pages/ExplorationPage').then(m => ({ default: m.ExplorationPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <Spinner message="Chargement..." />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activities"
        element={
          <ProtectedRoute>
            <ActivitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity/:id"
        element={
          <ProtectedRoute>
            <ActivityDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kpi"
        element={
          <ProtectedRoute>
            <KPIPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute>
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute>
            <PerformancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/exploration"
        element={
          <ProtectedRoute>
            <ExplorationPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

function AppLayout() {
  const { pathname } = useLocation();
  const isLanding = pathname === '/';
  const isLogin = pathname === '/login';

  if (isLanding) {
    return <AppRoutes />;
  }

  if (isLogin) {
    return (
      <div className="min-h-screen bg-charcoal text-mist font-body">
        <AppRoutes />
      </div>
    );
  }

  // Authenticated app layout: fixed sidebar + scrollable main
  return (
    <div className="min-h-screen bg-charcoal text-mist font-body flex">
      <Sidebar />
      {/* Offset for fixed sidebar */}
      <div className="ml-[196px] flex flex-col flex-1 min-h-screen">
        <main className="flex-1 px-6 py-6">
          <AppRoutes />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
