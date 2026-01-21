import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useKPI } from '@/hooks';
import { SectionTitle } from '@/components/ui/SectionTitle';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// SVG Icons for metrics
const RunIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3" />
    <path d="M6.5 20l3-7 2.5 2 3-5 2.5 5" />
    <path d="M19 20l-2.5-5" />
  </svg>
);

const TrailIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3l4 8 5-5 2 8" />
    <path d="M4 14l3-3 4 4 5-5 4 4" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);

const BikeIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill={color} />
    <path d="M12 17.5l3-6-5-4 3-1" />
  </svg>
);

const SwimIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <path d="M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    <circle cx="8" cy="6" r="2" />
    <path d="M10 6l4 4" />
  </svg>
);

const ClockIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ElevationIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

interface MetricConfig {
  icon: React.ComponentType<{ color: string }>;
  label: string;
  key: keyof MetricValues;
  unit: string;
  color: string;
}

interface MetricValues {
  total_km_run: number;
  total_km_trail: number;
  total_km_bike: number;
  total_km_swim: number;
  total_hours: number;
  total_dplus_run_trail: number;
  total_dplus_bike: number;
}

const METRICS: MetricConfig[] = [
  { icon: RunIcon, label: 'Course a pied', key: 'total_km_run', unit: 'km', color: '#3DB2E0' },
  { icon: TrailIcon, label: 'Trail', key: 'total_km_trail', unit: 'km', color: '#1E6A8F' },
  { icon: BikeIcon, label: 'Velo', key: 'total_km_bike', unit: 'km', color: '#7B6BC8' },
  { icon: SwimIcon, label: 'Natation', key: 'total_km_swim', unit: 'km', color: '#8B92A0' },
  { icon: ClockIcon, label: 'Sport', key: 'total_hours', unit: 'h', color: '#E8832A' },
  { icon: ElevationIcon, label: 'D+ en courant', key: 'total_dplus_run_trail', unit: 'm', color: '#9477D9' },
  { icon: ElevationIcon, label: 'D+ a velo', key: 'total_dplus_bike', unit: 'm', color: '#5A5F6C' },
];

const SPORT_COLORS: Record<string, string> = {
  Run: '#3DB2E0',
  Trail: '#1E6A8F',
  Bike: '#7B6BC8',
  Swim: '#8B92A0',
  WeightTraining: '#9477D9',
  Hike: '#5A5F6C',
};

// Standard record distances like vanilla JS version
const RECORD_DISTANCES = ['5 km', '10 km', 'Semi', '30 km', 'Marathon', '50 km', '75 km', 'Plus longue'];

const formatNumber = (num: number): string => {
  const rounded = Math.ceil(num);
  return new Intl.NumberFormat('fr-FR').format(rounded).replace(/\s/g, '.');
};

export function KPIPage() {
  const { kpis, records, selectedYear, setSelectedYear, isLoading, error } = useKPI();

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const chartData = useMemo(() => {
    if (!kpis?.["nombre d'activités par sport"]) return null;

    const sportData = kpis["nombre d'activités par sport"];
    const total = Object.values(sportData).reduce((sum, val) => sum + val, 0);

    // Separate sports into main (>1%) and others (<=1%)
    const mainSports: { label: string; value: number }[] = [];
    let othersTotal = 0;

    for (const [sport, value] of Object.entries(sportData)) {
      const percentage = (value / total) * 100;
      if (percentage > 1) {
        mainSports.push({ label: sport, value });
      } else {
        othersTotal += value;
      }
    }

    // Add "Autres" category if there are small sports
    if (othersTotal > 0) {
      mainSports.push({ label: 'Autres', value: othersTotal });
    }

    const labels = mainSports.map(s => s.label);
    const data = mainSports.map(s => s.value);
    const colors = labels.map((sport) => SPORT_COLORS[sport] || '#6B7280'); // Gray for "Autres"

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderColor: '#0B0C10',
          borderWidth: 2,
        },
      ],
    };
  }, [kpis]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle
            icon={<ChartIcon />}
            title="Mes chiffres clefs"
          />
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <SectionTitle
            icon={<ChartIcon />}
            title="Mes chiffres clefs"
          />
        </div>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Build records map from API data
  const recordsMap = records?.records || {};

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Two-column asymmetric layout like vanilla JS */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        {/* Left Column: Title + Filters + KPIs + Chart */}
        <div>
          {/* Header with SectionTitle and Year Filter */}
          <div className="flex items-start justify-between mb-6">
            <SectionTitle
              icon={<ChartIcon />}
              title="Mes chiffres clefs"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-steel font-mono text-xs">Annee</span>
              <select
                value={selectedYear || ''}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-1.5 bg-charcoal border border-steel/30 rounded-lg text-mist font-mono text-sm focus:border-glacier focus:outline-none transition-colors cursor-pointer"
              >
                <option value="">Toutes</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics Grid */}
          {kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {METRICS.map((metric) => (
                <MetricCard
                  key={metric.key}
                  icon={metric.icon}
                  label={metric.label}
                  value={formatNumber(kpis[metric.key] || 0)}
                  unit={metric.unit}
                  color={metric.color}
                />
              ))}
            </div>
          )}

          {/* Activity Distribution Chart */}
          {chartData && (
            <div className="card-glass rounded-lg overflow-hidden">
              {/* Header like dashboard charts */}
              <div className="flex items-center justify-between p-4 border-b border-steel/20">
                <h3 className="font-heading font-semibold text-mist">
                  Nombre d'activites par sport
                </h3>
              </div>
              <div className="h-[220px] flex items-center justify-center p-4">
                <Doughnut
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '60%',
                    plugins: {
                      legend: {
                        position: 'right',
                        labels: {
                          color: '#F2F2F2',
                          font: { size: 11, family: 'JetBrains Mono' },
                          padding: 12,
                          usePointStyle: true,
                          pointStyle: 'circle',
                        },
                      },
                      tooltip: {
                        backgroundColor: 'rgba(11, 12, 16, 0.95)',
                        titleColor: '#F2F2F2',
                        bodyColor: '#F2F2F2',
                        titleFont: { family: 'Poppins' },
                        bodyFont: { family: 'JetBrains Mono' },
                        borderColor: 'rgba(61, 178, 224, 0.3)',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                          label: (context) => {
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return ` ${context.label}: ${context.parsed} activites (${percentage}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Records Card */}
        <div className="records-card-wrapper">
          <div className="relative rounded-lg overflow-hidden border border-amber/30">
            {/* Full card background with grid pattern and orange gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber/20 via-charcoal to-amber/10" />
            <div className="absolute inset-0 records-grid-pattern pointer-events-none" />

            {/* Records Header */}
            <div className="relative p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative p-2 rounded-lg bg-amber/20 border border-amber/40">
                    <div className="absolute inset-0 bg-amber/30 blur-[8px] rounded-lg" />
                    <svg className="relative" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8832A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6" />
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                    </svg>
                  </div>
                  <h3 className="font-heading font-semibold text-mist">Records</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-amber/20 border border-amber/40 rounded text-amber text-xs font-mono">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                  <span>PR</span>
                </div>
              </div>
              <div className="mt-3 h-px bg-gradient-to-r from-amber via-glacier to-transparent" />
            </div>

            {/* Records List */}
            <div className="relative">
              {RECORD_DISTANCES.map((distance) => {
                const record = recordsMap[distance];
                return (
                  <RecordItem
                    key={distance}
                    distance={distance}
                    time={record?.time || '--:--'}
                    date={record?.date || '--/--/--'}
                    activityId={record?.activity_id}
                  />
                );
              })}
            </div>

            {/* Records Footer */}
            <div className="relative p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  <span className="w-1.5 h-1.5 rounded-full bg-glacier" />
                </div>
                <div className="w-8 h-px bg-gradient-to-r from-amber/50 to-transparent" />
              </div>
              <span className="text-amber/60 font-mono text-xs">8 records</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecordItemProps {
  distance: string;
  time: string;
  date: string;
  activityId?: number;
}

function RecordItem({ distance, time, date, activityId }: RecordItemProps) {
  const content = (
    <div className="relative px-4 py-3 group hover:bg-amber/10 transition-all">
      {/* Left accent bar on hover */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber to-glacier opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center justify-between pl-2">
        <span className="text-mist font-medium text-sm">{distance}</span>
        <div className="text-right">
          <p className="text-glacier font-mono font-semibold text-sm">{time}</p>
          <p className="text-xs text-steel">{date}</p>
        </div>
      </div>
    </div>
  );

  if (activityId) {
    return (
      <Link to={`/activity/${activityId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

interface MetricCardProps {
  icon: React.ComponentType<{ color: string }>;
  label: string;
  value: string;
  unit: string;
  color: string;
}

function MetricCard({ icon: Icon, label, value, unit, color }: MetricCardProps) {
  return (
    <div
      className="relative group min-h-[120px]"
      style={{ ['--metric-color' as string]: color }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${color}40, transparent)` }}
      />

      {/* Card inner */}
      <div className="relative h-full bg-charcoal border border-steel/30 rounded-lg p-3 overflow-hidden transition-all duration-300 group-hover:border-opacity-100 flex flex-col" style={{ borderColor: `${color}30` }}>
        {/* Grid pattern background */}
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

        {/* Corner glow */}
        <div
          className="absolute top-0 right-0 w-12 h-12 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }}
        />

        {/* Content */}
        <div className="relative flex flex-col gap-2 flex-1">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-lg border"
              style={{ backgroundColor: `${color}15`, borderColor: `${color}30` }}
            >
              <Icon color={color} />
            </div>
            <span className="text-xs text-mist/60 truncate">{label}</span>
          </div>

          {/* Value row */}
          <div className="flex items-baseline gap-1 mt-auto">
            <span className="text-lg font-semibold font-mono" style={{ color }}>
              {value}
            </span>
            <span className="text-xs text-mist/40 font-mono">{unit}</span>
          </div>
        </div>

        {/* Decorative dots */}
        <div className="absolute bottom-3 right-3 flex gap-0.5">
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${color}60` }} />
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${color}40` }} />
          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `${color}20` }} />
        </div>
      </div>
    </div>
  );
}
