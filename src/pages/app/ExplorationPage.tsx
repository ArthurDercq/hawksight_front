import { useMemo } from 'react';
import { useExploration, useTerritories } from '@/hooks';
import { ExplorationMap } from '@/components/maps';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Spinner } from '@/components/ui/Spinner';
import type { SportFilter, TerritoryLargest, TerritoryUnexplored } from '@/types';

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SPORT_FILTERS: { value: SportFilter; label: string }[] = [
  { value: 'all',   label: 'Tout' },
  { value: 'run',   label: 'Course' },
  { value: 'trail', label: 'Trail' },
  { value: 'bike',  label: 'Vélo' },
  { value: 'other', label: 'Autres' },
];

const formatNumber = (num: number): string =>
  new Intl.NumberFormat('fr-FR').format(Math.round(num));

export function ExplorationPage() {
  const {
    data, stats, isLoading, isFetching, error,
    sportFilter, setSportFilter,
    selectedYear, setSelectedYear,
  } = useExploration();

  const { largest, unexplored, isLoading: territoriesLoading, isComputing } = useTerritories();

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <SectionTitle icon={<GlobeIcon />} title="Exploration du Territoire" />
        <div className="flex items-center justify-center py-24">
          <Spinner message="Chargement de la carte..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle icon={<GlobeIcon />} title="Exploration du Territoire" />
        </div>
        <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-mono text-[11px] text-steel/60 uppercase tracking-wider">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <SectionTitle icon={<GlobeIcon />} title="Exploration du Territoire" />

        <div className="flex items-center gap-3">
          {isFetching && <Spinner size="sm" fullPage={false} />}

          {/* Sport filters */}
          <div className="hw-btn-group">
            {SPORT_FILTERS.map((filter, i) => (
              <button
                key={filter.value}
                onClick={() => setSportFilter(filter.value)}
                className={`hw-btn-group-item ${i > 0 ? 'border-l border-steel/30' : ''} ${
                  sportFilter === filter.value ? 'text-mist border-glacier/60 bg-glacier/10' : ''
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Year filter */}
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
            className="px-3 py-1.5 bg-charcoal border border-steel/30 rounded-lg text-mist font-mono text-xs focus:border-glacier focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">Toutes les années</option>
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard label="Surface explorée"      value={formatNumber(stats.surface_km2)}              unit="km²" color="#3DB2E0" />
          <StatCard label="Zones explorées"        value={formatNumber(stats.total_cells)}              unit="zones" color="#3DB2E0" />
          <StatCard label="Nouvelles cette année"  value={formatNumber(stats.new_this_year)}            unit="zones" color="#3DB2E0" />
          <StatCard label="Taux de nouveauté"      value={stats.novelty_percent.toFixed(1)}            unit="%" color="#6DAA75" />
          <StatCard label="Score exploration"      value={(stats.exploration_score * 1000).toFixed(1)} unit="m²/km" color="#E8832A" />
        </div>
      )}

      {/* Map */}
      {data && (
        <div className="relative bg-charcoal border border-steel/30 rounded-lg overflow-hidden">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <span className="hw-br hw-br-br hw-br-glacier-dim" />
          <ExplorationMap data={data} className="h-[600px]" />
          {data.features.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="font-mono text-xs text-steel">Aucune zone explorée trouvée</p>
                <p className="font-mono text-[10px] text-steel/50 mt-1">Lancez le script de backfill pour peupler les données</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Territories */}
      {isComputing && (
        <div className="flex items-center gap-3">
          <Spinner size="sm" fullPage={false} />
          <span className="font-mono text-[10px] text-steel uppercase tracking-[2px]">Calcul des territoires...</span>
        </div>
      )}

      {!territoriesLoading && !isComputing && (largest.length > 0 || unexplored.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {largest.length > 0 && (
            <div>
              <div className="hw-section-sep mb-4" style={{ position: 'relative' }}>
                <span className="font-mono text-[9px] text-steel uppercase tracking-[2px]">Tes plus grands territoires</span>
              </div>
              <div className="flex flex-col gap-2">
                {largest.map((t) => <LargestTerritoryCard key={t.rank} territory={t} />)}
              </div>
            </div>
          )}

          {unexplored.length > 0 && (
            <div>
              <div className="hw-section-sep mb-4" style={{ position: 'relative' }}>
                <span className="font-mono text-[9px] text-steel uppercase tracking-[2px]">Zones à conquérir</span>
              </div>
              <div className="flex flex-col gap-2">
                {unexplored.map((t) => <UnexploredTerritoryCard key={t.rank} territory={t} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LargestTerritoryCard({ territory: t }: { territory: TerritoryLargest }) {
  const location = [t.city, t.region, t.country].filter(Boolean).join(', ');
  return (
    <div className="hw-card-dark flex items-center justify-between gap-4">
      <span className="hw-br hw-br-tl hw-br-glacier" />
      <div className="flex items-center gap-3">
        <span className="font-mono text-xl font-bold text-steel/30">#{t.rank}</span>
        <div>
          <p className="text-sm font-medium text-mist">{location || 'Zone inconnue'}</p>
          <p className="font-mono text-[9px] text-steel uppercase tracking-[1.5px] mt-0.5">{formatNumber(t.cells_count)} zones</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-lg font-bold text-glacier tabular-nums">{formatNumber(t.surface_km2)}</p>
        <p className="font-mono text-[9px] text-steel">km²</p>
      </div>
    </div>
  );
}

function UnexploredTerritoryCard({ territory: t }: { territory: TerritoryUnexplored }) {
  const location = [t.city, t.region, t.country].filter(Boolean).join(', ');
  return (
    <div className="hw-card-dark flex items-center justify-between gap-4 border-amber/20">
      <span className="hw-br hw-br-tl hw-br-amber" />
      <div className="flex items-center gap-3">
        <span className="font-mono text-xl font-bold text-steel/30">#{t.rank}</span>
        <div>
          <p className="text-sm font-medium text-mist">{location || 'Zone inconnue'}</p>
          <p className="font-mono text-[9px] text-steel uppercase tracking-[1.5px] mt-0.5">{formatNumber(t.cells_count)} zones · {formatNumber(t.surface_km2)} km²</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-mono text-lg font-bold text-amber tabular-nums">{t.distance_from_home_km.toFixed(1)}</p>
        <p className="font-mono text-[9px] text-steel">km de chez toi</p>
      </div>
    </div>
  );
}

interface StatCardProps { label: string; value: string; unit: string; color: string; }

function StatCard({ label, value, unit, color }: StatCardProps) {
  return (
    <div className="hw-card-dark p-4">
      <div className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none rounded-full blur-xl"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }} />
      <p className="font-mono text-[9px] text-steel uppercase tracking-[2px] mb-1.5">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
        <span className="font-mono text-[10px] text-mist/40">{unit}</span>
      </div>
    </div>
  );
}
