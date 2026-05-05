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
    <div
      className="flex items-center gap-2.5 px-6 py-3 border-b border-steel/10"
      style={{ background: 'rgba(8,9,16,0.6)', backdropFilter: 'blur(8px)' }}
    >
      <span className="font-mono text-[10px] text-steel/40 uppercase tracking-[2px]">HAWKSIGHT</span>
      <span className="font-mono text-[10px] text-steel/25">/</span>
      {parent && (
        <>
          <span className="font-mono text-[10px] text-steel/40 uppercase tracking-[2px]">{parent}</span>
          <span className="font-mono text-[10px] text-steel/25">/</span>
        </>
      )}
      <span className="font-mono text-[10px] text-mist/80 uppercase tracking-[2px] font-semibold">{label}</span>
    </div>
  );
}
