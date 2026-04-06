import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

const HomeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ChartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: <HomeIcon /> },
  { path: '/activities', label: 'Activités', icon: <ActivityIcon /> },
  { path: '/kpi', label: 'Chiffres clés', icon: <ChartIcon /> },
  { path: '/performance', label: 'Performance', icon: <TrendingUpIcon /> },
  { path: '/exploration', label: 'Exploration', icon: <GlobeIcon /> },
  { path: '/calendar', label: 'Calendrier', icon: <CalendarIcon /> },
];

export function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  return (
    <aside
      className="fixed top-0 left-0 z-40 flex flex-col"
      style={{
        width: '196px',
        minHeight: '100vh',
        background: '#080910',
        borderRight: '1px solid rgba(58,63,71,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* Topo SVG background decoration */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none select-none"
        style={{
          height: '420px',
          zIndex: 0,
          maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 90%)',
          WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 90%)',
        }}
      >
        <svg width="196" height="420" viewBox="0 0 196 420" fill="none" preserveAspectRatio="xMidYMid slice">
          <path d="M0 380 Q30 320 60 355 Q90 290 120 320 Q150 270 180 295 Q190 285 196 290" stroke="#E8832A" strokeWidth="1" fill="none" opacity="0.15"/>
          <path d="M0 400 Q40 360 80 375 Q110 340 140 360 Q170 330 196 345" stroke="#3DB2E0" strokeWidth="1" fill="none" opacity="0.1"/>
          <path d="M0 395 Q50 370 90 382 Q120 355 155 370 Q175 358 196 365" stroke="#6DAA75" strokeWidth="1" fill="none" opacity="0.08"/>
          <path d="M0 360 Q25 310 55 340 Q85 300 115 315 Q145 275 175 295 Q188 285 196 290" stroke="#E8832A" strokeWidth="0.5" fill="none" opacity="0.08"/>
        </svg>
      </div>

      {/* All content above topo */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Brand */}
        <div style={{ padding: '20px 14px', marginBottom: '28px' }}>
          <Link to="/dashboard" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity" style={{ paddingLeft: '6px' }}>
            <Logo size={24} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#F2F2F2', letterSpacing: '1px', fontFamily: 'JetBrains Mono, monospace' }}>
              HawkSight
            </span>
          </Link>
        </div>

        {/* Nav section label */}
        <p style={{ fontSize: '9px', color: 'rgba(58,63,71,0.8)', textTransform: 'uppercase', letterSpacing: '2px', padding: '0 6px 5px 20px', fontFamily: 'JetBrains Mono, monospace' }}>
          Navigation
        </p>

        {/* Nav items */}
        <nav style={{ padding: '0 14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '9px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'all 0.15s',
                  textDecoration: 'none',
                  position: 'relative',
                  ...(isActive
                    ? {
                        background: 'rgba(232,131,42,0.08)',
                        color: '#E8832A',
                        border: '1px solid rgba(232,131,42,0.15)',
                      }
                    : {
                        color: '#3A3F47',
                        background: 'transparent',
                        border: '1px solid transparent',
                      }),
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(58,63,71,0.2)';
                    (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(242,242,242,0.6)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    (e.currentTarget as HTMLAnchorElement).style.color = '#3A3F47';
                  }
                }}
              >
                <span style={{ fontSize: '14px', width: '18px', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* User */}
        <div style={{ padding: '10px 14px', marginTop: '8px' }}>
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '10px',
              textDecoration: 'none',
              borderRadius: '6px',
              transition: 'background 0.15s',
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #E8832A, #A020F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 700,
              flexShrink: 0,
              color: '#fff',
            }}>
              {currentUser?.username?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '11px', color: 'rgba(242,242,242,0.7)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser?.username ?? 'Profil'}
              </p>
              <p style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>Athlète</p>
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
}
