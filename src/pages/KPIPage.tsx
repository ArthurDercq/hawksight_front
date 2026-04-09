import { useMemo, useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { useKPI } from '@/hooks';
import { kpiApi } from '@/services/api';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { PageStateWrapper } from '@/components/ui/PageStateWrapper';
import type { TrailRecord } from '@/types';
import { sportBarColor } from '@/services/utils/constants';

const ActivityGridPosters = lazy(() =>
  import('@/components/activity/ActivityGridPosters').then(m => ({ default: m.ActivityGridPosters }))
);
const ElevationGridPosters = lazy(() =>
  import('@/components/activity/ElevationGridPosters').then(m => ({ default: m.ElevationGridPosters }))
);
const HRZonesDoughnut = lazy(() =>
  import('@/components/charts/KPIHRZonesDoughnut').then(m => ({ default: m.KPIHRZonesDoughnut }))
);

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


// Standard record distances
const RECORD_DISTANCES = ['5 km', '10 km', 'Semi', '30 km', 'Marathon', '50 km', 'Plus longue'];

// Trail records config: key → label + unit display
const TRAIL_RECORD_CONFIG: { key: string; label: string; group: string }[] = [
  { key: 'climb_5min',         label: 'D+ en 5 min',         group: 'Montée' },
  { key: 'climb_30min',        label: 'D+ en 30 min',        group: 'Montée' },
  { key: 'climb_60min',        label: 'D+ en 60 min',        group: 'Montée' },
  { key: 'longest_climb',      label: 'Montée continue',     group: 'Montée' },
  { key: 'kv_1000m',           label: 'KV 1000m',            group: 'KV' },
  { key: 'descent_5min',       label: 'D- en 5 min',         group: 'Descente' },
  { key: 'descent_30min',      label: 'D- en 30 min',        group: 'Descente' },
  { key: 'max_dplus_activity', label: 'Max D+ activité',     group: 'Stats' },
  { key: 'best_dplus_ratio',   label: 'Meilleur ratio D+/km',group: 'Stats' },
  { key: 'best_week_dplus',    label: 'Meilleure semaine D+',group: 'Stats' },
];

const formatNumber = (num: number): string => {
  const rounded = Math.ceil(num);
  return new Intl.NumberFormat('fr-FR').format(rounded).replace(/\s/g, '.');
};

export function KPIPage() {
  const { kpis, records, selectedYear, setSelectedYear, isLoading, error, refetch } = useKPI();

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
    const colors = labels.map((sport) => sport === 'Autres' ? '#6B7280' : sportBarColor(sport));

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

  // Build records map from API data
  const recordsMap = records?.records || {};
  const trailRecordsMap = records?.trailRecords || {};
  const [recordsMode, setRecordsMode] = useState<'run' | 'trail'>('trail');
  const [excludedOverrides, setExcludedOverrides] = useState<Record<string, boolean>>({});

  const handleToggleExclude = useCallback(async (id: string, excluded: boolean) => {
    setExcludedOverrides(prev => ({ ...prev, [id]: excluded }));
    try {
      await kpiApi.excludeRecord(id, excluded);
      refetch();
    } catch {
      setExcludedOverrides(prev => ({ ...prev, [id]: !excluded }));
    }
  }, [refetch]);

  return (
    <PageStateWrapper
      isLoading={isLoading}
      error={error}
      icon={<ChartIcon />}
      title="Mes chiffres clefs"
      loadingMessage="Chargement des statistiques..."
    >
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
            <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
              {/* Background effects */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 border rounded" style={{ backgroundColor: '#3DB2E010', borderColor: '#3DB2E030' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
                        <path d="M22 12A10 10 0 0 0 12 2v10z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading text-[#F2F2F2]">Nombre d'activites par sport</h3>
                      <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                        Repartition des activites
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chart with labels */}
                <div className="relative">
                  {/* Chart container */}
                  <div className="h-[220px] flex items-center justify-center">
                    <div className="relative w-[180px] h-[180px]">
                      <Suspense fallback={<div className="w-full h-full rounded-full bg-steel/10 animate-pulse" />}>
                        <HRZonesDoughnut chartData={chartData} />
                      </Suspense>
                      {/* Center total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl font-bold font-mono text-[#F2F2F2]">
                          {chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0)}
                        </span>
                        <span className="text-[10px] text-[#3A3F47] font-mono uppercase tracking-wider">
                          activites
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sport labels grid */}
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {chartData.labels.map((label: string, index: number) => {
                      const value = chartData.datasets[0].data[index];
                      const color = chartData.datasets[0].backgroundColor[index];
                      const total = chartData.datasets[0].data.reduce((a: number, b: number) => a + b, 0);
                      const percentage = ((value / total) * 100).toFixed(0);
                      return (
                        <div
                          key={label}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
                          style={{
                            backgroundColor: `${color}15`,
                            borderColor: `${color}40`,
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[#F2F2F2] font-['Inter'] text-xs">
                            {label}
                          </span>
                          <span
                            className="font-['JetBrains_Mono'] text-xs font-semibold"
                            style={{ color }}
                          >
                            {value}
                          </span>
                          <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                            ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3DB2E0]" />
                    <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                      SPORT_DISTRIBUTION
                    </span>
                  </div>
                  <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                    {selectedYear ? `ANNEE ${selectedYear}` : 'TOUTES ANNEES'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Records Card (unified) */}
        <div className="records-card-wrapper">
          {(() => {
            const isTrail = recordsMode === 'trail';
            const color = isTrail ? '#C96A1A' : '#E8832A';
            const gradFrom = isTrail ? 'from-[#C96A1A]/15' : 'from-amber/20';
            const gradTo = isTrail ? 'to-[#C96A1A]/5' : 'to-amber/10';
            const borderColor = isTrail ? 'border-[#C96A1A]/30' : 'border-amber/30';
            const separatorFrom = isTrail ? 'from-[#C96A1A]' : 'from-amber';
            const footerCount = isTrail ? '10 records trail' : '8 records';

            return (
              <div className={`relative rounded-lg overflow-hidden border ${borderColor}`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${gradFrom} via-charcoal ${gradTo}`} />

                {/* Header */}
                <div className="relative p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative p-2 rounded-lg border" style={{ backgroundColor: `${color}20`, borderColor: `${color}40` }}>
                        <div className="absolute inset-0 blur-[8px] rounded-lg" style={{ backgroundColor: `${color}20` }} />
                        {isTrail ? (
                          <svg className="relative" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m8 3 4 8 5-5 2 8" /><path d="M4 14l3-3 4 4 5-5 4 4" /><line x1="2" y1="21" x2="22" y2="21" />
                          </svg>
                        ) : (
                          <svg className="relative" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                          </svg>
                        )}
                      </div>
                      <h3 className="font-heading font-semibold text-mist">Records</h3>
                    </div>

                    {/* Toggle */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRecordsMode('run')}
                        className={`px-3 py-1.5 border rounded-lg font-mono text-sm transition-colors cursor-pointer ${!isTrail ? 'bg-charcoal border-glacier text-mist' : 'bg-charcoal border-steel/30 text-steel hover:border-steel/50'}`}
                      >
                        Course
                      </button>
                      <button
                        onClick={() => setRecordsMode('trail')}
                        className={`px-3 py-1.5 border rounded-lg font-mono text-sm transition-colors cursor-pointer ${isTrail ? 'bg-charcoal border-glacier text-mist' : 'bg-charcoal border-steel/30 text-steel hover:border-steel/50'}`}
                      >
                        Trail
                      </button>
                    </div>
                  </div>
                  <div className={`mt-3 h-px bg-gradient-to-r ${separatorFrom} via-glacier/30 to-transparent`} />
                </div>

                {/* Content */}
                <div className="relative">
                  {!isTrail ? (
                    RECORD_DISTANCES.map((distance) => {
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
                    })
                  ) : (
                    (['Montée', 'KV', 'Descente', 'Stats'] as const).map((group) => {
                      const groupItems = TRAIL_RECORD_CONFIG.filter(r => r.group === group);
                      return (
                        <div key={group}>
                          <div className="px-4 py-1.5 border-y" style={{ backgroundColor: `${color}10`, borderColor: `${color}15` }}>
                            <span className="font-mono text-[9px] uppercase tracking-widest" style={{ color: `${color}99` }}>{group}</span>
                          </div>
                          {groupItems.map(({ key, label }) => {
                            const raw = trailRecordsMap[key];
                            const candidates = Array.isArray(raw) ? raw : (raw ? [raw as unknown as TrailRecord] : []);
                            const record = candidates.find(r => !(excludedOverrides[r.id] ?? r.is_excluded)) ?? null;
                            const rawFormatted = record?.time_formatted ?? record?.value_formatted ?? (record ? `${Math.round(record.value)}` : null);
                            const displayValue = rawFormatted ? rawFormatted.replace(/[a-zA-Z\/]+$/, '').trim() : '—';
                            const unit = record?.metric_type === 'time' ? '' :
                                         record?.metric_type === 'dplus_per_km' ? 'm/km' : 'm';
                            return (
                              <TrailRecordItem
                                key={key}
                                label={label}
                                value={displayValue}
                                unit={unit}
                                date={record?.date}
                                activityId={record?.activity_id}
                                color={color}
                                recordId={record?.id}
                                onExclude={record ? () => handleToggleExclude(record.id, true) : undefined}
                              />
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="relative p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: `${color}60` }} />
                    </div>
                    <div className="w-8 h-px" style={{ background: `linear-gradient(to right, ${color}50, transparent)` }} />
                  </div>
                  <span className="font-mono text-xs" style={{ color: `${color}99` }}>{footerCount}</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Activity & Elevation Grids - Full width, side by side */}
      <div className="mt-8 grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Suspense fallback={<div className="h-64 animate-pulse bg-charcoal/50 rounded-lg" />}>
          <ActivityGridPosters />
        </Suspense>
        <Suspense fallback={<div className="h-64 animate-pulse bg-charcoal/50 rounded-lg" />}>
          <ElevationGridPosters />
        </Suspense>
      </div>
    </div>
    </PageStateWrapper>
  );
}

interface RecordItemProps {
  distance: string;
  time: string;
  date: string;
  activityId?: number;
}

function formatRecordDate(date: string): string {
  if (!date || date === '--/--/--') return date;
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
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
          <p className="text-xs text-steel">{formatRecordDate(date)}</p>
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

interface TrailRecordItemProps {
  label: string;
  value: string;
  unit: string;
  date?: string;
  activityId?: number;
  color?: string;
  recordId?: string;
  onExclude?: () => void;
}

function TrailRecordItem({ label, value, unit, date, activityId, color = '#C96A1A', recordId, onExclude }: TrailRecordItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const inner = (
    <div className="relative px-4 py-2.5 group hover:bg-white/5 transition-all">
      <div className="absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(to bottom, ${color}, ${color}60)` }} />
      <div className="flex items-center justify-between pl-2">
        <span className="text-sm text-mist/80">{label}</span>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="font-mono font-semibold text-sm" style={{ color }}>
              {value}{unit && value !== '—' ? <span className="text-xs ml-1" style={{ color: `${color}80` }}>{unit}</span> : null}
            </p>
            {date && <p className="text-xs text-steel">{formatRecordDate(date)}</p>}
          </div>
          {recordId && onExclude && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(v => !v); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded text-steel hover:text-mist hover:bg-white/10"
                title="Options"
              >
                <span className="text-xs leading-none tracking-tighter">···</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-[#1A1D23] border border-[#3A3F47]/50 rounded-lg shadow-xl min-w-[160px] py-1">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(false); onExclude(); }}
                    className="w-full text-left px-3 py-2 text-xs text-red-400/50 hover:text-white hover:bg-red-500 transition-colors rounded-lg"
                  >
                    Exclure ce record
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (activityId) {
    return <Link to={`/activity/${activityId}`} className="block">{inner}</Link>;
  }
  return inner;
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
