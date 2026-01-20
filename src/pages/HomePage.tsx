import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

// Feature icons as SVGs
const ChartIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const MapIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Logo size={120} />
        </div>

        {/* Title */}
        <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-mist mb-4">
          Bienvenue sur <span className="text-mist">HawkSight</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg text-mist/70 mb-8 leading-relaxed">
          Analysez vos performances sportives avec precision.
          Visualisez vos activites, suivez vos KPIs et atteignez vos objectifs.
        </p>

        {/* CTA */}
        {isAuthenticated ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-amber text-charcoal font-semibold rounded-lg text-lg transition-all duration-300 hover:bg-amber-light hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(232,131,42,0.4)]"
          >
            Acceder au Dashboard
            <span>→</span>
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-8 py-3 bg-amber text-charcoal font-semibold rounded-lg text-lg transition-all duration-300 hover:bg-amber-light hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(232,131,42,0.4)]"
          >
            Se connecter
            <span>→</span>
          </Link>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="card-glass p-6 group">
            <div className="w-12 h-12 rounded-lg bg-glacier/10 border border-glacier/30 flex items-center justify-center text-glacier mb-4 group-hover:bg-glacier/20 transition-colors">
              <ChartIcon />
            </div>
            <h3 className="font-heading font-semibold text-mist mb-2">Analytics</h3>
            <p className="text-sm text-mist/60">
              Visualisez vos performances avec des graphiques detailles
            </p>
          </div>
          <div className="card-glass p-6 group">
            <div className="w-12 h-12 rounded-lg bg-amber/10 border border-amber/30 flex items-center justify-center text-amber mb-4 group-hover:bg-amber/20 transition-colors">
              <MapIcon />
            </div>
            <h3 className="font-heading font-semibold text-mist mb-2">Cartes GPS</h3>
            <p className="text-sm text-mist/60">
              Revivez vos parcours avec des cartes interactives
            </p>
          </div>
          <div className="card-glass p-6 group">
            <div className="w-12 h-12 rounded-lg bg-moss/10 border border-moss/30 flex items-center justify-center text-moss mb-4 group-hover:bg-moss/20 transition-colors">
              <TrophyIcon />
            </div>
            <h3 className="font-heading font-semibold text-mist mb-2">Records</h3>
            <p className="text-sm text-mist/60">
              Suivez vos records personnels et vos progressions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
