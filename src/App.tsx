import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from '@/context';
import { Sidebar, Footer, AppHeader } from '@/components/layout';
import { Spinner } from '@/components/ui/Spinner';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { RequireAuth, RequireOnboarding } from '@/router/guards';

// ── Marketing pages ────────────────────────────────────────────────────────────
const HomePage       = lazy(() => import('@/pages/marketing/HomePage').then(m => ({ default: m.HomePage })));
const TerrainPage    = lazy(() => import('@/pages/marketing/TerrainPage').then(m => ({ default: m.TerrainPage })));
const PlateformePage = lazy(() => import('@/pages/marketing/PlateformePage').then(m => ({ default: m.PlateformePage })));
const AnalyticsPage  = lazy(() => import('@/pages/marketing/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const MethodePage    = lazy(() => import('@/pages/marketing/MethodePage').then(m => ({ default: m.MethodePage })));

// ── Auth / misc public pages ───────────────────────────────────────────────────
const LoginPage        = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage     = lazy(() => import('@/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })));
const InviteOnlyPage   = lazy(() => import('@/pages/InviteOnlyPage').then(m => ({ default: m.InviteOnlyPage })));

// ── App pages ──────────────────────────────────────────────────────────────────
const DashboardPage     = lazy(() => import('@/pages/app/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ActivitiesPage    = lazy(() => import('@/pages/app/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const ActivityDetailPage = lazy(() => import('@/pages/app/ActivityDetailPage').then(m => ({ default: m.ActivityDetailPage })));
const KPIPage           = lazy(() => import('@/pages/app/KPIPage').then(m => ({ default: m.KPIPage })));
const CalendarPage      = lazy(() => import('@/pages/app/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ProfilePage       = lazy(() => import('@/pages/app/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PerformancePage   = lazy(() => import('@/pages/app/PerformancePage').then(m => ({ default: m.PerformancePage })));
const ExplorationPage   = lazy(() => import('@/pages/app/ExplorationPage').then(m => ({ default: m.ExplorationPage })));

// ── Misc ───────────────────────────────────────────────────────────────────────
function StravaInviteRedirect() {
  const [searchParams] = useSearchParams();
  const invite = searchParams.get('invite');
  return <Navigate to={invite ? `/login?invite=${invite}` : '/login'} replace />;
}

function AppShell() {
  return (
    <div className="h-screen bg-charcoal text-mist font-body flex overflow-hidden">
      <Sidebar />
      <div className="ml-[196px] flex flex-col flex-1 h-screen overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-y-auto flex flex-col">
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"    element={<div className="px-6 py-6"><DashboardPage /><Footer /></div>} />
              <Route path="activities"   element={<div className="px-6 py-6"><ActivitiesPage /><Footer /></div>} />
              <Route path="activity/:id" element={<div className="px-6 py-6"><ActivityDetailPage /><Footer /></div>} />
              <Route path="kpi"          element={<div className="px-6 py-6"><KPIPage /><Footer /></div>} />
              <Route path="calendar"     element={<div className="px-6 py-6"><CalendarPage /><Footer /></div>} />
              <Route path="profile"      element={<div className="px-6 py-6"><ProfilePage /><Footer /></div>} />
              <Route path="performance"  element={<div className="px-6 py-6"><PerformancePage /><Footer /></div>} />
              <Route path="exploration"  element={<><ExplorationPage /><Footer /></>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Spinner />}>
          <Routes>

            {/* ── Marketing — navbar + footer vitrine ── */}
            <Route element={<MarketingLayout />}>
              <Route path="/"            element={<HomePage />} />
              <Route path="/terrain"     element={<TerrainPage />} />
              <Route path="/plateforme"  element={<PlateformePage />} />
              <Route path="/analytics"   element={<AnalyticsPage />} />
              <Route path="/methode"     element={<MethodePage />} />
            </Route>

            {/* ── Auth / public fullscreen ── */}
            <Route path="/login"              element={<div className="min-h-screen bg-charcoal text-mist font-body"><LoginPage /></div>} />
            <Route path="/register"           element={<div className="min-h-screen bg-charcoal text-mist font-body"><RegisterPage /></div>} />
            <Route path="/auth/callback"      element={<div className="min-h-screen bg-charcoal text-mist font-body"><AuthCallbackPage /></div>} />
            <Route path="/auth/strava/login"  element={<StravaInviteRedirect />} />
            <Route path="/invite-only"        element={<div className="min-h-screen bg-charcoal text-mist font-body"><InviteOnlyPage /></div>} />

            {/* ── App SaaS — auth requis ── */}
            <Route element={<RequireAuth />}>
              <Route element={<RequireOnboarding />}>
                <Route path="/*" element={<AppShell />} />
              </Route>
            </Route>

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
