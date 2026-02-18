import { useMemo } from 'react';
import { useExploration } from '@/hooks';
import { ExplorationMap } from '@/components/maps';
import { SectionTitle } from '@/components/ui/SectionTitle';
import type { SportFilter } from '@/types';

// Globe icon
const GlobeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// Sport filter config
const SPORT_FILTERS: { value: SportFilter; label: string; color: string }[] = [
  { value: 'all', label: 'Tout', color: '#A020F0' },
  { value: 'run', label: 'Course', color: '#E8832A' },
  { value: 'bike', label: 'Velo', color: '#3DB2E0' },
];

// Format number with French locale
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(Math.round(num));
};

export function ExplorationPage() {
  const {
    data,
    stats,
    isLoading,
    error,
    sportFilter,
    setSportFilter,
    selectedYear,
    setSelectedYear,
  } = useExploration();

  const currentYear = new Date().getFullYear();
  const years = useMemo(
    () => Array.from({ length: 5 }, (_, i) => currentYear - i),
    [currentYear]
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SectionTitle icon={<GlobeIcon />} title="Exploration du Monde" />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <svg
              className="animate-spin w-12 h-12 text-amber mx-auto mb-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-mist/60">Chargement de la carte...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SectionTitle icon={<GlobeIcon />} title="Exploration du Monde" />
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header with filters */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <SectionTitle icon={<GlobeIcon />} title="Exploration du Monde" />

        <div className="flex items-center gap-4">
          {/* Sport Filter Buttons */}
          <div className="flex items-center gap-2">
            {SPORT_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSportFilter(filter.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  sportFilter === filter.value
                    ? 'text-white shadow-lg'
                    : 'bg-charcoal border border-steel/30 text-steel hover:text-mist hover:border-steel/50'
                }`}
                style={
                  sportFilter === filter.value
                    ? { backgroundColor: filter.color }
                    : {}
                }
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Year Filter Dropdown */}
          <select
            value={selectedYear || ''}
            onChange={(e) =>
              setSelectedYear(e.target.value ? parseInt(e.target.value) : null)
            }
            className="px-3 py-2 bg-charcoal border border-steel/30 rounded-lg text-mist font-mono text-sm focus:border-glacier focus:outline-none transition-colors cursor-pointer"
          >
            <option value="">Toutes les annees</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Surface exploree"
            value={formatNumber(stats.surface_km2)}
            unit="km2"
            color="#3DB2E0"
          />
          <StatCard
            label="Nouvelles cette annee"
            value={formatNumber(stats.new_this_year)}
            unit="cellules"
            color="#A020F0"
          />
          <StatCard
            label="Taux de nouveaute"
            value={stats.novelty_percent.toFixed(1)}
            unit="%"
            color="#6DAA75"
          />
          <StatCard
            label="Score exploration"
            value={(stats.exploration_score * 1000).toFixed(1)}
            unit="m2/km"
            color="#F59E0B"
          />
          <StatCard
            label="Nouvelles / mois"
            value={stats.new_cells_per_month.toFixed(1)}
            unit="cellules"
            color="#EC4899"
          />
        </div>
      )}

      {/* Map */}
      {data && (
        <div className="bg-charcoal border border-steel/30 rounded-lg overflow-hidden">
          <ExplorationMap data={data} className="h-[600px]" />
        </div>
      )}

      {/* Empty state */}
      {data && data.features.length === 0 && (
        <div className="mt-4 text-center text-mist/60">
          <p>Aucune zone exploree trouvee.</p>
          <p className="text-sm mt-1">
            Lancez le script de backfill pour peupler les donnees.
          </p>
        </div>
      )}

      {/* Legend */}
      {data && data.features.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#E8832A' }}
            />
            <span className="text-sm text-steel">Course / Trail</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#3DB2E0' }}
            />
            <span className="text-sm text-steel">Velo</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: '#A020F0' }}
            />
            <span className="text-sm text-steel">Les deux</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Stat card component
interface StatCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
}

function StatCard({ label, value, unit, color }: StatCardProps) {
  return (
    <div
      className="relative bg-charcoal border rounded-lg p-4 overflow-hidden"
      style={{ borderColor: `${color}30` }}
    >
      {/* Subtle glow effect */}
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent)`,
        }}
      />
      <p className="text-xs text-mist/60 mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-semibold font-mono" style={{ color }}>
          {value}
        </span>
        <span className="text-xs text-mist/40 font-mono">{unit}</span>
      </div>
    </div>
  );
}
