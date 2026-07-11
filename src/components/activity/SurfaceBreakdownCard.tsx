import type { SurfaceClassification } from '@/types';

interface Props { surfaceClassification: SurfaceClassification; sportColor: string; }

const GLACIER = '#3DB2E0';
const STEEL = '#3A3F47';
// Sous ce seuil, le km "inconnu" est du bruit de mesure plutôt qu'un vrai
// segment non classifié — on masque le libellé pour ne pas afficher un
// segment de largeur ~0 dans la barre.
const UNKNOWN_NOISE_THRESHOLD_KM = 0.2;

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="hw-text-label text-steel">{label}</span>
      <span className="hw-text-value leading-tight" style={{ color: color ?? '#F2F2F2' }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="flex-1 h-px bg-steel/20" />
      <span className="hw-text-label text-steel/70 whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-steel/20" />
    </div>
  );
}

export function SurfaceBreakdownCard({ surfaceClassification: s, sportColor }: Props) {
  const total = s.trail_km + s.road_km + s.unknown_km;
  if (total <= 0) return null;

  const trailPct = (s.trail_km / total) * 100;
  const roadPct = (s.road_km / total) * 100;
  const unknownPct = (s.unknown_km / total) * 100;
  const showUnknown = s.unknown_km >= UNKNOWN_NOISE_THRESHOLD_KM;

  return (
    <div className="hw-card-dark-lg flex flex-col gap-4">
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[40px] pointer-events-none"
        style={{ background: `${sportColor}0D` }}
      />

      {/* Header */}
      <div className="pb-3.5 border-b border-steel/25">
        <div className="text-sm font-semibold text-mist">Surface</div>
        <div className="hw-text-caption text-steel mt-0.5">
          {total.toFixed(1)} km analysés · via OpenStreetMap
        </div>
      </div>

      <div>
        <SectionLabel>Sentiers · Route{showUnknown ? ' · Inconnu' : ''}</SectionLabel>
        <div className="h-1.5 rounded-full bg-steel/30 overflow-hidden my-1.5 flex">
          <div className="h-full transition-all duration-500" style={{ width: `${trailPct}%`, background: sportColor }} />
          <div className="h-full transition-all duration-500" style={{ width: `${roadPct}%`, background: GLACIER }} />
          {showUnknown && (
            <div className="h-full transition-all duration-500" style={{ width: `${unknownPct}%`, background: STEEL }} />
          )}
        </div>
        <div className={`grid ${showUnknown ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
          <Kpi label={`Sentiers ${trailPct.toFixed(0)}%`} value={`${s.trail_km.toFixed(1)} km`} color={sportColor} />
          <Kpi label={`Route ${roadPct.toFixed(0)}%`} value={`${s.road_km.toFixed(1)} km`} color={GLACIER} />
          {showUnknown && (
            <Kpi label={`Inconnu ${unknownPct.toFixed(0)}%`} value={`${s.unknown_km.toFixed(1)} km`} color="#8B95A1" />
          )}
        </div>
      </div>
    </div>
  );
}
