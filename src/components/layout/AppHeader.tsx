import { useLocation } from 'react-router-dom';

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':   'Dashboard',
  '/activities':  'Activités',
  '/exploration': 'Exploration',
  '/kpi':         'Chiffres clés',
  '/calendar':    'Calendrier',
  '/performance': 'Trails',
  '/profile':     'Profil',
};

export function AppHeader() {
  const { pathname } = useLocation();

  // Pour /activity/:id on affiche "Activités / Détail"
  const isActivityDetail = pathname.startsWith('/activity/');
  const label = isActivityDetail
    ? 'Détail'
    : (ROUTE_LABELS[pathname] ?? '');

  const parent = isActivityDetail ? 'Activités' : null;

  return (
    <div className="flex items-center gap-2.5 px-6 py-3 border-b border-steel/10 bg-[rgba(8,9,16,0.6)] backdrop-blur-sm">
      <span className="hw-text-caption text-steel/65 uppercase tracking-[2px]">HAWKSIGHT</span>
      <span className="hw-text-caption text-steel/75">/</span>
      {parent && (
        <>
          <span className="hw-text-caption text-steel/65 uppercase tracking-[2px]">{parent}</span>
          <span className="hw-text-caption text-steel/75">/</span>
        </>
      )}
      <span className="hw-text-caption text-mist/80 uppercase tracking-[2px] font-semibold">{label}</span>
    </div>
  );
}
