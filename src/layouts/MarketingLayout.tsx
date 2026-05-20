import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

const NAV_LINKS = [
  { label: 'Plateforme', href: '/plateforme' },
  { label: 'Analytics',  href: '/analytics' },
  { label: 'Terrain',    href: '/terrain' },
  { label: 'Méthode',    href: '/methode' },
];

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export function MarketingLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="bg-charcoal text-mist min-h-screen">

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
          <Logo size={26} />
          <span className="font-mono text-sm font-bold text-mist tracking-[1px]">HAWKSIGHT</span>
        </div>

        <nav className="hidden md:flex items-center gap-10">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive = href === pathname || (href.startsWith('/#') && pathname === '/');
            return (
              <a
                key={label}
                href={href}
                className={`font-mono text-[10px] uppercase tracking-[2px] transition-colors ${
                  isActive ? 'text-amber' : 'text-mist/70 hover:text-mist'
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        <button
          onClick={handleCTA}
          className="hw-btn-amber px-6 py-3.5 text-sm"
          style={{ color: '#F2F2F2', background: 'rgba(242,242,242,0.05)', borderColor: 'rgba(242,242,242,0.2)' }}
        >
          {isAuthenticated ? 'Accéder' : 'Connexion'} <ArrowRightIcon />
        </button>
      </header>

      {/* ── Page content ── */}
      <Outlet />

      {/* ── Footer ── */}
      <footer className="relative border-t border-steel/10 px-12 py-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,131,42,0.03) 40%, rgba(61,178,224,0.02) 60%, transparent)' }} />
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">

          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => navigate('/')}>
            <Logo size={20} />
            <span className="font-mono text-[11px] font-bold text-mist/60 tracking-[2px]">HAWKSIGHT</span>
          </div>

          <div className="flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`font-mono text-[9px] uppercase tracking-[2px] transition-colors ${
                  href === pathname ? 'text-amber/80' : 'text-mist/50 hover:text-mist/80'
                }`}
              >
                {label}
              </a>
            ))}
            <span className="w-px h-3 bg-steel/20" />
            <span className="font-mono text-[9px] text-steel/80 tracking-[1px]">© 2026 HawkSight</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[9px] text-steel/65 uppercase tracking-[2px]">System</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ boxShadow: '0 0 6px #E8832A' }} />
              <span className="font-mono text-[9px] text-amber/70 uppercase tracking-[2px]">Online</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
}
