import { Link } from 'react-router-dom';
import { useRef, useEffect, type ReactNode } from 'react';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useDashboard, useDashboardCharts, usePermissions } from '@/hooks';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { DemoBanner } from '@/components/ui/DemoBanner';
import type { ChartDataset } from '@/services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];

const SPORT_COLORS: Record<string, string> = {
  Run: '#3DB2E0',
  Trail: '#1E6A8F',
  Bike: '#7B6BC8',
  Swim: '#8B92A0',
  WeightTraining: '#9ca3af',
  Hike: '#5A5F6C',
};

// Couleurs pour la répartition des activités par distance
const REPARTITION_COLORS: Record<string, string> = {
  long: '#B85A1F',    // Orange foncé
  moyen: '#E8832A',   // Orange clair (amber)
  court: '#3DB2E0',   // Bleu (glacier)
};

// Fonction pour obtenir la couleur de répartition basée sur le label
function getRepartitionColor(label: string): string {
  const lowerLabel = label.toLowerCase();
  for (const [key, color] of Object.entries(REPARTITION_COLORS)) {
    if (lowerLabel.includes(key)) {
      return color;
    }
  }
  return '#E8832A'; // Couleur par défaut
}

// Convert polyline coordinates to SVG path
function polylineToSvgPath(coords: [number, number][]): string {
  if (coords.length === 0) return '';

  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const rangeLat = maxLat - minLat || 0.001;
  const rangeLng = maxLng - minLng || 0.001;

  const scale = Math.max(rangeLat, rangeLng);
  const pad = 10;
  const w = 100 - 2 * pad;

  const points = coords.map(([lat, lng]) => {
    const x = pad + ((lng - minLng) / scale) * w;
    const y = pad + ((maxLat - lat) / scale) * w;
    return `${x.toFixed(1)} ${y.toFixed(1)}`;
  });

  return `M ${points.join(' L ')}`;
}

// SVG Icons
const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

function ScrollToEndContainer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollLeft = ref.current.scrollWidth;
  }, []);
  return (
    <div ref={ref} className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide">
      {children}
    </div>
  );
}

export function DashboardPage() {
  const { streak, lastActivity, lastActivityExploration, recentActivities, weeklySummary, monthlySummary, explorationStats, isLoading, error, isSyncing, syncData } = useDashboard();
  const { isDemo, canSync } = usePermissions();
  const {
    dailyHoursData,
    weekOffset,
    setWeekOffset,
    weekLabel,
    weekStats,
    weeklyHoursData,
    weeklyHoursAverage,
    weeklyDistanceData,
    distanceSport,
    setDistanceSport,
    weeklyDistanceAverage,
    repartitionData,
    repartitionSport,
    setRepartitionSport,
    repartitionWeeks,
    setRepartitionWeeks,
    weeklyPaceData,
    paceSport,
    setPaceSport,
    weeklyPaceAverage,
    conqueteData,
    conqueteAverage,
    weeklyElevationAverage,
    globalOffset,
    setGlobalOffset,
  } = useDashboardCharts();

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  const currentMonth = MONTH_NAMES[new Date().getMonth()];

  // Chart options
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F2F2F2' } },
    },
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { color: '#F2F2F2', font: { size: 10 } } },
    },
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#F2F2F2', stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}` : null } },
    },
    plugins: {
      legend: { display: false },
    },
  };

  const paceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: { dataIndex: number; dataset: { _rawPaces?: number[] }; parsed: { y: number } }) => {
            const raw = context.dataset._rawPaces?.[context.dataIndex] ?? context.parsed.y;
            const min = Math.floor(raw);
            const sec = Math.round((raw - min) * 60);
            return `${min}:${sec.toString().padStart(2, '0')} min/km`;
          },
        },
      },
    },
  };

  const barChartOptionsMinutes = {
    ...barChartOptions,
    scales: {
      ...barChartOptions.scales,
      y: {
        ...barChartOptions.scales.y,
        stacked: true,
        ticks: {
          color: '#F2F2F2',
          stepSize: 1,
          callback: (value: number | string) => Number.isInteger(Number(value)) ? `${Number(value)}` : null,
        },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: '#F2F2F2', font: { size: 11, family: 'JetBrains Mono' }, padding: 12 },
      },
    },
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6">
      {/* Demo mode banner */}
      {isDemo && <DemoBanner />}

      {/* Top Row - Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {/* Weekly Summary */}
        <div className="card-weekly rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-mist">Cette semaine</h2>
            {weeklySummary && (
              <span
                className={`text-sm font-medium ${
                  weeklySummary.prevWeekComparison >= 0 ? 'text-moss' : 'text-red-400'
                }`}
              >
                {weeklySummary.prevWeekComparison >= 0 ? '↑' : '↓'}{' '}
                {Math.abs(weeklySummary.prevWeekComparison).toFixed(0)}%
              </span>
            )}
          </div>
          {weeklySummary ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-mist/50 mb-1">Distance</p>
                <p className="text-lg font-mono text-amber font-semibold">
                  {weeklySummary.totalDistance.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-xs text-mist/50 mb-1">Temps</p>
                <p className="text-lg font-mono text-mist font-semibold">
                  {formatTime(weeklySummary.totalTime)}
                </p>
              </div>
              <div>
                <p className="text-xs text-mist/50 mb-1">Denivele</p>
                <p className="text-lg font-mono text-glacier font-semibold">
                  {Math.round(weeklySummary.totalElevation)} m
                </p>
              </div>
              <div>
                <p className="text-xs text-mist/50 mb-1">Sessions</p>
                <p className="text-lg font-mono text-moss font-semibold">{weeklySummary.sessionCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-mist/60">Pas de donnees</p>
          )}
        </div>

        {/* Monthly Summary */}
        <div className="card-monthly rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold text-mist">{currentMonth}</h2>
            {monthlySummary && (
              <span
                className={`text-sm font-medium ${
                  monthlySummary.trend >= 0 ? 'text-moss' : 'text-red-400'
                }`}
              >
                {monthlySummary.trend >= 0 ? '↑' : '↓'} {Math.abs(monthlySummary.trend).toFixed(0)}%
              </span>
            )}
          </div>
          {monthlySummary ? (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <p className="text-xs text-mist/50 mb-1">Distance</p>
                  <p className="text-lg font-mono text-amber font-semibold">
                    {monthlySummary.totalDistance.toFixed(1)} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mist/50 mb-1">D+</p>
                  <p className="text-lg font-mono text-glacier font-semibold">
                    {Math.round(monthlySummary.totalElevation)} m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-mist/50 mb-1">Sessions</p>
                  <p className="text-lg font-mono text-moss font-semibold">{monthlySummary.sessionCount}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-mist/50 mb-1">
                  <span>Progression du mois</span>
                  <span>
                    {monthlySummary.daysPassed}/{monthlySummary.daysInMonth} jours
                  </span>
                </div>
                <div className="h-2 bg-charcoal/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-glacier to-moss transition-all"
                    style={{ width: `${monthlySummary.monthProgress}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-mist/60">Pas de donnees</p>
          )}
        </div>

        {/* Streak */}
        <div className="card-streak rounded-lg p-4 flex flex-col gap-3">
          <h2 className="font-heading font-semibold text-mist">Série</h2>
          {streak && streak.streak_weeks > 0 ? (
            <>
              <div className="flex-1 flex items-center gap-4 bg-charcoal/30 rounded-lg p-3">
                <span className="text-4xl font-bold text-amber font-mono">{streak.streak_weeks}</span>
                <div>
                  <p className="text-sm font-semibold text-mist">semaines</p>
                  <p className="text-xs text-mist/50">consécutives</p>
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center bg-charcoal/30 rounded-lg p-3">
                <p className="text-xs text-mist/30">— à venir —</p>
              </div>
            </>
          ) : (
            <p className="text-mist/60 text-center">Pas de série en cours</p>
          )}
        </div>

        {/* Conquête */}
        <div className="card-glass rounded-lg p-4">
          <h2 className="font-heading font-semibold text-mist mb-4">Conquête</h2>
          {explorationStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-mist/50 mb-1">Ce mois</p>
                <p className="text-lg font-mono text-amber font-semibold">
                  +{Math.round(explorationStats.new_cells_per_month)}
                </p>
                <p className="text-[10px] text-mist/40">territoires</p>
              </div>
              <div>
                <p className="text-xs text-mist/50 mb-1">Total</p>
                <p className="text-lg font-mono text-glacier font-semibold">
                  {explorationStats.total_cells}
                </p>
                <p className="text-[10px] text-mist/40">cellules</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-mist/50 mb-1">Nouveauté</p>
                <p className="text-sm font-mono text-moss font-semibold">
                  {explorationStats.novelty_percent.toFixed(1)}% cette année
                </p>
              </div>
            </div>
          ) : (
            <p className="text-mist/60 text-sm">Chargement...</p>
          )}
        </div>
      </div>

      {/* Second Row - Last Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Last Activity */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber/10 border border-amber/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8832A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h2 className="font-heading font-semibold text-mist">Dernière activité</h2>
            </div>
            <button
              onClick={syncData}
              disabled={isSyncing || !canSync}
              className="p-2 rounded-lg bg-steel/20 border border-steel/30 hover:bg-steel/40 hover:border-glacier/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title={canSync ? "Synchroniser mes données" : "Indisponible en mode démo"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`text-mist/60 group-hover:text-glacier transition-colors ${isSyncing ? 'animate-spin' : ''}`}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
            </button>
          </div>
          {lastActivity ? (
            <Link
              to={`/activity/${lastActivity.id}`}
              className="block hover:bg-steel/10 -m-2 p-2 rounded-lg transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium text-mist">{lastActivity.name}</p>
                  <p className="text-sm text-mist/60">{formatActivityDate(lastActivity.date)}</p>
                </div>
                <span className="text-amber text-sm font-medium hover:text-amber-light transition-colors">Voir →</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-charcoal/50 rounded-lg p-2">
                  <p className="text-xs text-mist/50 mb-1">Distance</p>
                  <p className="font-mono text-amber font-semibold">{lastActivity.distance_km.toFixed(1)} km</p>
                </div>
                <div className="bg-charcoal/50 rounded-lg p-2">
                  <p className="text-xs text-mist/50 mb-1">Durée</p>
                  <p className="font-mono text-mist font-semibold">{lastActivity.duree_hms}</p>
                </div>
                <div className="bg-charcoal/50 rounded-lg p-2">
                  <p className="text-xs text-mist/50 mb-1">D+</p>
                  <p className="font-mono text-glacier font-semibold">{lastActivity.denivele_m} m</p>
                </div>
                <div className="bg-charcoal/50 rounded-lg p-2">
                  <p className="text-xs text-mist/50 mb-1">Allure</p>
                  <p className="font-mono text-moss font-semibold">{lastActivity.allure_min_per_km}</p>
                </div>
                {lastActivity.bpm_moyen && lastActivity.bpm_moyen > 0 && (
                  <div className="bg-charcoal/50 rounded-lg p-2">
                    <p className="text-xs text-mist/50 mb-1">FC moy.</p>
                    <p className="font-mono text-red-400 font-semibold">{Math.round(lastActivity.bpm_moyen!)} bpm</p>
                  </div>
                )}
              </div>
              {lastActivityExploration && lastActivityExploration.total_cells > 0 && (
                <div className="mt-3 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-glacier/5 border border-glacier/20">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  <span className="text-xs text-glacier/80">{lastActivityExploration.label}</span>
                  {lastActivityExploration.exploration_rate !== null && (
                    <span className="ml-auto text-xs font-mono text-glacier font-semibold">
                      {lastActivityExploration.exploration_rate.toFixed(0)}%
                    </span>
                  )}
                </div>
              )}
            </Link>
          ) : (
            <p className="text-mist/60">Aucune activite recente</p>
          )}
        </div>

        {/* Recent Traces */}
        <div className="card-glass rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-glacier/10 border border-glacier/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <h2 className="font-heading font-semibold text-mist">Mes activités</h2>
            </div>
            <Link to="/activities" className="text-sm text-amber hover:text-amber-light font-medium transition-colors">
              Voir tout →
            </Link>
          </div>
          {recentActivities.length > 0 ? (
            <ScrollToEndContainer>
              {[...recentActivities].reverse().map((activity) => (
                <Link
                  key={activity.id}
                  to={`/activity/${activity.id}`}
                  className="flex-shrink-0 w-[160px] snap-start group"
                >
                  <div className="bg-charcoal/50 rounded-lg border border-steel/20 overflow-hidden hover:border-glacier/40 transition-all hover:-translate-y-0.5">
                    <div className="aspect-square bg-[#0B0C10] relative">
                      {activity.polyline_coords && activity.polyline_coords.length > 0 ? (
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                          <path
                            d={polylineToSvgPath(activity.polyline_coords)}
                            fill="none"
                            stroke={SPORT_COLORS[activity.type || ''] || '#3DB2E0'}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity="0.8"
                          />
                        </svg>
                      ) : (
                        <div className="flex items-center justify-center h-full text-mist/20 text-xs">
                          Pas de trace
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs text-mist truncate group-hover:text-glacier transition-colors">{activity.name}</p>
                      <p className="text-[10px] text-mist/40 font-mono">{formatActivityDate(activity.date)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </ScrollToEndContainer>
          ) : (
            <p className="text-mist/60 text-center py-4">Aucune trace recente</p>
          )}
        </div>
      </div>

      {/* Analytics Section - Graphiques */}
      <div className="mt-8 mb-8">
        <SectionTitle
          icon={<BarChartIcon />}
          title="Analyses hebdomadaires"
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Daily Hours Chart */}
          <div className="card-glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-mist text-sm">Minutes d'activités quotidiennes</h3>
                {weekStats && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-mist/60 font-mono">
                    <span className="text-amber">{weekStats.distance.toFixed(1)} km</span>
                    <span>•</span>
                    <span className="text-glacier">{weekStats.elevation} D+</span>
                    <span>•</span>
                    <span>{weekStats.time}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist"
                >
                  ←
                </button>
                <span className="text-xs text-mist/60 font-mono min-w-[100px] text-center">{weekLabel}</span>
                <button
                  onClick={() => setWeekOffset(weekOffset - 1)}
                  disabled={weekOffset <= 0}
                  className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
            <div className="h-[200px]">
              {dailyHoursData ? (
                <Bar
                  data={{
                    labels: dailyHoursData.labels,
                    datasets: dailyHoursData.datasets?.length > 0
                      ? dailyHoursData.datasets.map((ds: ChartDataset) => ({
                          ...ds,
                          backgroundColor: SPORT_COLORS[ds.label] || '#3DB2E0',
                          borderColor: SPORT_COLORS[ds.label] || '#3DB2E0',
                        }))
                      : [{ label: 'Aucune activité', data: [0, 0, 0, 0, 0, 0, 0], backgroundColor: '#3A3F47' }],
                  }}
                  options={barChartOptionsMinutes}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-mist/40">Chargement...</div>
              )}
            </div>
          </div>

          {/* Weekly Hours Chart */}
          <div className="card-glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-mist text-sm">Heures d'activite par semaine</h3>
                <span className="text-xs text-mist/60 font-mono">{weeklyHoursAverage}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGlobalOffset(globalOffset + 1)}
                  className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist"
                >
                  ←
                </button>
                <span className="text-xs text-mist/60 font-mono">10 semaines</span>
                <button
                  onClick={() => setGlobalOffset(globalOffset - 1)}
                  disabled={globalOffset <= 0}
                  className="p-1 hover:bg-steel/30 rounded transition-colors text-mist/60 hover:text-mist disabled:opacity-30"
                >
                  →
                </button>
              </div>
            </div>
            <div className="h-[200px]">
              {weeklyHoursData && weeklyHoursData.datasets?.length > 0 ? (
                <Line
                  data={{
                    labels: weeklyHoursData.labels,
                    datasets: weeklyHoursData.datasets.map((ds: ChartDataset) => ({
                      ...ds,
                      borderColor: '#3DB2E0',
                      backgroundColor: 'rgba(61, 178, 224, 0.1)',
                      fill: true,
                      tension: 0.4,
                    })),
                  }}
                  options={lineChartOptions}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
              )}
            </div>
          </div>

          {/* Weekly Distance Chart */}
          <div className="card-glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-mist text-sm">Kilometres par semaine</h3>
                <span className="text-xs text-mist/60 font-mono">{weeklyDistanceAverage} · <span style={{color: '#C4561A'}}>{weeklyElevationAverage}</span></span>
              </div>
              <select
                value={distanceSport}
                onChange={(e) => setDistanceSport(e.target.value)}
                className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier"
              >
                <option value="Run">Run</option>
                <option value="Trail">Trail</option>
                <option value="Bike">Bike</option>
                <option value="Swim">Swim</option>
                <option value="Run,Trail">Run & Trail</option>
              </select>
            </div>
            <div className="h-[200px]">
              {weeklyDistanceData && weeklyDistanceData.datasets?.length > 0 ? (
                <Bar
                  data={{
                    labels: weeklyDistanceData.labels,
                    datasets: [
                      {
                        ...weeklyDistanceData.datasets[0],
                        type: 'bar' as const,
                        backgroundColor: 'rgba(232, 131, 42, 0.8)',
                        borderColor: '#E8832A',
                        borderWidth: 1,
                        borderRadius: 3,
                        yAxisID: 'y',
                      },
                      {
                        ...weeklyDistanceData.datasets[1],
                        type: 'line' as const,
                        borderColor: '#C4561A',
                        backgroundColor: 'rgba(196, 86, 26, 0.15)',
                        borderWidth: 2,
                        pointRadius: 2,
                        fill: 'origin',
                        tension: 0.4,
                        yAxisID: 'y1',
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
                      y: {
                        position: 'left' as const,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#F2F2F2', callback: (v: number | string) => `${Number(v).toFixed(0)}` },
                      },
                      y1: {
                        position: 'right' as const,
                        grid: { display: false },
                        ticks: { color: '#C4561A', callback: (v: number | string) => `${Number(v).toFixed(0)}m` },
                      },
                    },
                    plugins: { legend: { display: false } },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
              )}
            </div>
          </div>

          {/* Repartition Chart */}
          <div className="card-glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-mist text-sm">Repartition des activites</h3>
              <div className="flex items-center gap-2">
                <select
                  value={repartitionSport}
                  onChange={(e) => setRepartitionSport(e.target.value)}
                  className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier"
                >
                  <option value="Run,Trail">Run & Trail</option>
                  <option value="Run">Run</option>
                  <option value="Trail">Trail</option>
                  <option value="Bike">Bike</option>
                </select>
                <select
                  value={repartitionWeeks}
                  onChange={(e) => setRepartitionWeeks(parseInt(e.target.value))}
                  className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier"
                >
                  <option value={4}>Ce mois</option>
                  <option value={8}>2 mois</option>
                  <option value={12}>3 mois</option>
                  <option value={24}>6 mois</option>
                </select>
              </div>
            </div>
            <div className="h-[200px]">
              {repartitionData && repartitionData.datasets?.length > 0 ? (
                <Doughnut
                  data={{
                    labels: repartitionData.labels,
                    datasets: repartitionData.datasets.map((ds: ChartDataset) => ({
                      ...ds,
                      backgroundColor: repartitionData.labels.map((label: string) => getRepartitionColor(label)),
                      borderColor: '#0B0C10',
                      borderWidth: 2,
                    })),
                  }}
                  options={doughnutChartOptions}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
              )}
            </div>
          </div>

          {/* Weekly Pace Chart */}
          <div className="card-glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-mist text-sm">Allure moyenne par semaine</h3>
                <span className="text-xs text-mist/60 font-mono">{weeklyPaceAverage}</span>
              </div>
              <select
                value={paceSport}
                onChange={(e) => setPaceSport(e.target.value)}
                className="text-xs bg-steel/20 border border-steel/30 rounded px-2 py-1 text-mist focus:outline-none focus:border-glacier"
              >
                <option value="Run">Run</option>
                <option value="Trail">Trail</option>
                <option value="Bike">Bike</option>
                <option value="Swim">Swim</option>
                <option value="Run,Trail">Run & Trail</option>
              </select>
            </div>
            <div className="h-[200px]">
              {weeklyPaceData && weeklyPaceData.datasets?.length > 0 ? (
                <Bar
                  data={{
                    labels: weeklyPaceData.labels,
                    datasets: weeklyPaceData.datasets.map((ds: ChartDataset) => ({
                      ...ds,
                      backgroundColor: 'rgba(109, 170, 117, 0.7)',
                      borderColor: '#6DAA75',
                      borderWidth: 1,
                      borderRadius: 3,
                    })),
                  }}
                  options={paceChartOptions}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
              )}
            </div>
          </div>

          {/* Conquête Chart */}
          <div className="card-glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-heading font-semibold text-mist text-sm">Taux de conquête</h3>
                <span className="text-xs text-mist/60 font-mono">{conqueteAverage}</span>
              </div>
            </div>
            <div className="h-[200px]">
              {conqueteData && conqueteData.datasets?.length > 0 ? (
                <Bar
                  data={{
                    labels: conqueteData.labels,
                    datasets: conqueteData.datasets.map((ds: ChartDataset) => ({
                      ...ds,
                      backgroundColor: 'rgba(61, 178, 224, 0.7)',
                      borderColor: '#3DB2E0',
                      borderWidth: 1,
                      borderRadius: 3,
                    })),
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { grid: { display: false }, ticks: { color: '#F2F2F2' } },
                      y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#F2F2F2', stepSize: 1, callback: (v: number | string) => Number.isInteger(Number(v)) ? `${v}` : null },
                      },
                    },
                    plugins: { legend: { display: false } },
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-mist/40">Pas de donnees</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


function formatActivityDate(dateString: string): string {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
  const rest = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${rest}`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`;
  }
  return `${minutes} min`;
}
