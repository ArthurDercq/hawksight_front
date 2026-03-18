import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

// SVG Icons for navigation
const ActivityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ChartIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);


export function Navbar() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  const navItems = [
    { path: '/activities', label: 'Activités', icon: <ActivityIcon /> },
    { path: '/kpi', label: 'Chiffres cles', icon: <ChartIcon /> },
    { path: '/performance', label: 'Performance', icon: <TrendingUpIcon /> },
    { path: '/exploration', label: 'Exploration', icon: <GlobeIcon /> },
    { path: '/calendar', label: 'Calendrier', icon: <CalendarIcon /> },
  ];

  return (
    <nav className={`${isLanding ? 'fixed top-0 w-full z-50 bg-transparent border-transparent' : 'sticky top-0 z-50 bg-charcoal border-b border-steel/30'} transition-colors duration-300`}>
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <Logo size={32} />
            <span className="font-heading font-normal text-lg text-mist tracking-tight hidden sm:block">
              HawkSight
            </span>
          </Link>

          {/* Navigation Items */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2 ${
                      isActive
                        ? 'text-amber'
                        : 'text-mist/60 hover:text-mist hover:bg-steel/20'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {/* Active underline */}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-mist/60 hover:text-mist hover:bg-steel/20 transition-all duration-200"
              >
                <UserIcon />
                <span className="hidden sm:block text-sm">Profil</span>
              </Link>
            ) : !isLanding && !isLogin && (
              <Link
                to="/login"
                className="px-4 py-2 bg-amber hover:bg-amber-light text-charcoal font-medium rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(232,131,42,0.4)]"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
