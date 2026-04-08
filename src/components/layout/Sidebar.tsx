import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

// Icons — 15×15 comme le mockup
const DashboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
  </svg>
);

const ActivityIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const TrailIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17l4-8 4 4 3-6 4 10"/>
    <path d="M3 21h18"/>
  </svg>
);

// Sections de navigation — exactement comme le mockup
const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
      { path: '/activities', label: 'Activités', icon: <ActivityIcon /> },
      { path: '/exploration', label: 'Exploration', icon: <GlobeIcon /> },
    ],
  },
  {
    label: 'Objectifs',
    items: [
      { path: '/calendar', label: 'Calendrier', icon: <CalendarIcon /> },
      { path: '/performance', label: 'Trails', icon: <TrailIcon /> },
    ],
  },
];

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

// SVG hexagone pointy-top R=13 — réutilisé via <use>
// Grille exacte du mockup : xs pairs [11,34,57,79,102,124,147,169,192], xs impairs [0,22,45,68,90,113,135,158,181]
// 11 rangées, opacité dégradante de bas (0.28) vers haut (0.02)
const HEX_ROWS: { y: number; xs: number[]; opacity: number }[] = [
  { y: 407, xs: [11, 34, 57, 79, 102, 124, 147, 169, 192], opacity: 0.28 },
  { y: 387, xs: [0, 22, 45, 68, 90, 113, 135, 158, 181],  opacity: 0.25 },
  { y: 367, xs: [11, 34, 57, 79, 102, 124, 147, 169, 192], opacity: 0.22 },
  { y: 347, xs: [0, 22, 45, 68, 90, 113, 135, 158, 181],  opacity: 0.19 },
  { y: 327, xs: [11, 34, 57, 79, 102, 124, 147, 169, 192], opacity: 0.16 },
  { y: 307, xs: [0, 22, 45, 68, 90, 113, 135, 158, 181],  opacity: 0.13 },
  { y: 287, xs: [11, 34, 57, 79, 102, 124, 147, 169, 192], opacity: 0.10 },
  { y: 267, xs: [0, 22, 45, 68, 90, 113, 135, 158, 181],  opacity: 0.08 },
  { y: 247, xs: [11, 57, 102, 147, 192],                  opacity: 0.06 },
  { y: 227, xs: [0, 68, 135],                              opacity: 0.04 },
  { y: 207, xs: [34, 113],                                 opacity: 0.02 },
];

function HexGrid() {
  return (
    <svg
      viewBox="0 0 196 420"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '420px', width: '100%', pointerEvents: 'none', zIndex: 0, maskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 90%)', WebkitMaskImage: 'linear-gradient(to top, black 0%, black 50%, transparent 90%)' }}
    >
      <defs>
        <polygon id="hw-hex" points="0,-13 11.3,-6.5 11.3,6.5 0,13 -11.3,6.5 -11.3,-6.5"/>
      </defs>
      {HEX_ROWS.map(({ y, xs, opacity }) =>
        xs.map(x => (
          <use
            key={`${x}-${y}`}
            href="#hw-hex"
            transform={`translate(${x},${y})`}
            stroke={`rgba(180,190,200,${opacity})`}
            strokeWidth="0.6"
            fill="none"
          />
        ))
      )}
    </svg>
  );
}

export function Sidebar() {
  const { currentUser } = useAuth();
  const location = useLocation();

  return (
    <aside
      style={{
        width: '196px',
        minHeight: '100vh',
        background: '#080910',
        borderRight: '1px solid rgba(58,63,71,0.4)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        gap: '3px',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      <HexGrid />

      {/* All nav content above hex grid */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, gap: '3px' }}>

        {/* Brand */}
        <Link
          to="/dashboard"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', padding: '0 6px', textDecoration: 'none' }}
        >
          <Logo size={28} />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#F2F2F2', letterSpacing: '1px', fontFamily: 'JetBrains Mono, monospace' }}>
            HAWKSIGHT
          </span>
        </Link>

        {/* Nav sections */}
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {/* Section label */}
            <p style={{ fontSize: '9px', color: 'rgba(58,63,71,0.8)', textTransform: 'uppercase', letterSpacing: '2px', padding: '12px 6px 5px', fontFamily: 'JetBrains Mono, monospace' }}>
              {section.label}
            </p>
            {/* Items */}
            {section.items.map(item => {
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
                    marginBottom: '1px',
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
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = 'rgba(58,63,71,0.2)';
                      el.style.color = 'rgba(242,242,242,0.6)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = 'transparent';
                      el.style.color = '#3A3F47';
                    }
                  }}
                >
                  <span style={{ width: '18px', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Divider + Profil — juste après Trails, sans spacer */}
        <div style={{ height: '1px', background: 'rgba(58,63,71,0.25)', margin: '8px 6px' }} />

        <Link
          to="/profile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '9px',
            padding: '9px 10px',
            borderRadius: '6px',
            textDecoration: 'none',
            cursor: 'pointer',
            border: '1px solid transparent',
            transition: 'all 0.15s',
            color: location.pathname === '/profile' ? '#E8832A' : '#3A3F47',
            background: location.pathname === '/profile' ? 'rgba(232,131,42,0.08)' : 'transparent',
          }}
          onMouseEnter={e => {
            if (location.pathname !== '/profile') {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = 'rgba(58,63,71,0.2)';
              el.style.color = 'rgba(242,242,242,0.6)';
            }
          }}
          onMouseLeave={e => {
            if (location.pathname !== '/profile') {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.background = 'transparent';
              el.style.color = '#3A3F47';
            }
          }}
        >
          <span style={{ width: '18px', textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserIcon />
          </span>
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(242,242,242,0.7)', fontWeight: 500, lineHeight: 1.2 }}>
              {currentUser?.username ?? 'Utilisateur'}
            </p>
            <p style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Trail Runner
            </p>
          </div>
        </Link>

        {/* Spacer pour pousser la grille hex vers le bas */}
        <div style={{ flex: 1 }} />

      </div>
    </aside>
  );
}
