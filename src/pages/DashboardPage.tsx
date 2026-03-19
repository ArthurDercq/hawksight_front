import { Link } from 'react-router-dom';
import React, { lazy, Suspense, useRef, useEffect, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useDashboard, useDashboardCharts, usePermissions, useInView } from '@/hooks';
import { DemoBanner } from '@/components/ui/DemoBanner';

const DashboardChartsSection = lazy(() =>
  import('./DashboardChartsSection').then(m => ({ default: m.DashboardChartsSection }))
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

// Lazy-mount charts only when scrolled into view
function ChartsPlaceholder(props: React.ComponentProps<typeof DashboardChartsSection>) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref}>
      {inView ? (
        <Suspense fallback={<div className="mt-8 mb-8 h-[500px] flex items-center justify-center"><Spinner message="Chargement des graphiques..." /></div>}>
          <DashboardChartsSection {...props} />
        </Suspense>
      ) : (
        <div className="mt-8 mb-8 h-[500px]" />
      )}
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
    isRefetchingDailyHours,
    isRefetchingWeeklyHours,
    isRefetchingWeeklyDistance,
    isRefetchingRepartition,
    isRefetchingWeeklyPace,
    isRefetchingConquete,
  } = useDashboardCharts();

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-center py-12">
          <Spinner message="Chargement du tableau de bord..." />
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
                <p className="text-xs text-mist/50 mb-1">Belgique</p>
                <p className="text-lg font-mono text-glacier font-semibold">
                  {((explorationStats.total_cells / 41200) * 100).toFixed(2)}%
                </p>
                <p className="text-[10px] text-mist/40">exploré</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-mist/50 mb-1">Nouveauté</p>
                <p className="text-sm font-mono text-moss font-semibold">
                  {explorationStats.novelty_percent.toFixed(1)}% cette année
                </p>
              </div>
            </div>
          ) : (
            <p className="text-mist/60 text-sm">Pas de données</p>
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
                  <p className="text-xs text-mist/50 mb-1">{lastActivity.type === 'Bike' ? 'Vitesse' : 'Allure'}</p>
                  <p className="font-mono text-moss font-semibold">
                    {lastActivity.type === 'Bike'
                      ? `${lastActivity.vitesse_kmh?.toFixed(1) ?? '--'} km/h`
                      : formatPace(lastActivity.allure_min_per_km)}
                  </p>
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
              {[...recentActivities].reverse().map((activity) => {
                const color = SPORT_COLORS[activity.type || ''] || '#3DB2E0';
                const isBikeActivity = activity.type === 'Bike';
                const paceValue = isBikeActivity
                  ? (activity.vitesse_kmh ? activity.vitesse_kmh.toFixed(1) : '--')
                  : formatPace(activity.allure_min_per_km);
                const paceLabel = isBikeActivity ? 'vit.' : 'allure';
                return (
                  <Link
                    key={activity.id}
                    to={`/activity/${activity.id}`}
                    className="flex-shrink-0 w-[220px] snap-start group"
                  >
                    <div
                      className="relative rounded-lg overflow-hidden border transition-all duration-200 hover:-translate-y-0.5"
                      style={{ borderColor: `${color}25`, backgroundColor: '#0B0C10' }}
                    >
                      {/* Polyline background */}
                      <div className="aspect-[4/3] relative">
                        {activity.polyline_coords && activity.polyline_coords.length > 0 ? (
                          <>
                            {/* Glow layer */}
                            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                              <defs>
                                <filter id={`glow-${activity.id}`}>
                                  <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                  <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              <path
                                d={polylineToSvgPath(activity.polyline_coords)}
                                fill="none"
                                stroke={color}
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                opacity="0.9"
                                filter={`url(#glow-${activity.id})`}
                              />
                            </svg>
                            {/* Gradient overlay bottom */}
                            <div
                              className="absolute inset-x-0 bottom-0 h-2/3"
                              style={{ background: 'linear-gradient(to top, #0B0C10 0%, #0B0C1099 50%, transparent 100%)' }}
                            />
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-[10px] text-mist/20 font-mono">NO GPS</span>
                          </div>
                        )}

                        {/* Sport badge top-left */}
                        <div className="absolute top-2 left-2">
                          <span
                            className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}40` }}
                          >
                            {activity.type || 'Sport'}
                          </span>
                        </div>

                        {/* Name + date over gradient */}
                        <div className="absolute bottom-0 inset-x-0 px-3 pb-2">
                          <p className="text-[11px] font-semibold text-[#F2F2F2] truncate leading-tight group-hover:text-white transition-colors">
                            {activity.name}
                          </p>
                          <p className="text-[9px] text-mist/40 font-mono mt-0.5">{formatActivityDate(activity.date)}</p>
                        </div>
                      </div>

                      {/* Metrics row */}
                      <div
                        className="flex items-center justify-between px-3 py-2 border-t gap-2"
                        style={{ borderColor: `${color}15` }}
                      >
                        <div className="flex flex-col items-center flex-1">
                          <span className="font-mono text-[10px] font-semibold" style={{ color }}>{activity.distance_km.toFixed(1)}</span>
                          <span className="text-[8px] text-mist/30 font-mono uppercase tracking-wide">km</span>
                        </div>
                        <div className="w-px h-6 bg-steel/20" />
                        <div className="flex flex-col items-center flex-1">
                          <span className="font-mono text-[10px] font-semibold text-[#F2F2F2]">{activity.duree_hms}</span>
                          <span className="text-[8px] text-mist/30 font-mono uppercase tracking-wide">durée</span>
                        </div>
                        <div className="w-px h-6 bg-steel/20" />
                        <div className="flex flex-col items-center flex-1">
                          <span className="font-mono text-[10px] font-semibold text-[#F2F2F2]">
                            {paceValue}{isBikeActivity && <span className="text-[8px] font-normal text-mist/50 ml-0.5">km/h</span>}
                          </span>
                          <span className="text-[8px] text-mist/30 font-mono uppercase tracking-wide">{paceLabel}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ScrollToEndContainer>
          ) : (
            <p className="text-mist/60 text-center py-4">Aucune trace recente</p>
          )}
        </div>
      </div>

      {/* Analytics Section - lazy loaded when scrolled into view */}
      <ChartsPlaceholder
        dailyHoursData={dailyHoursData} weekOffset={weekOffset} setWeekOffset={setWeekOffset}
        weekLabel={weekLabel} weekStats={weekStats}
        weeklyHoursData={weeklyHoursData} weeklyHoursAverage={weeklyHoursAverage}
        weeklyDistanceData={weeklyDistanceData} distanceSport={distanceSport} setDistanceSport={setDistanceSport}
        weeklyDistanceAverage={weeklyDistanceAverage} weeklyElevationAverage={weeklyElevationAverage}
        repartitionData={repartitionData} repartitionSport={repartitionSport} setRepartitionSport={setRepartitionSport}
        repartitionWeeks={repartitionWeeks} setRepartitionWeeks={setRepartitionWeeks}
        weeklyPaceData={weeklyPaceData} paceSport={paceSport} setPaceSport={setPaceSport}
        weeklyPaceAverage={weeklyPaceAverage}
        conqueteData={conqueteData} conqueteAverage={conqueteAverage}
        globalOffset={globalOffset} setGlobalOffset={setGlobalOffset}
        isRefetchingDailyHours={isRefetchingDailyHours} isRefetchingWeeklyHours={isRefetchingWeeklyHours}
        isRefetchingWeeklyDistance={isRefetchingWeeklyDistance} isRefetchingRepartition={isRefetchingRepartition}
        isRefetchingWeeklyPace={isRefetchingWeeklyPace} isRefetchingConquete={isRefetchingConquete}
      />

    </div>
  );
}


function formatActivityDate(dateString: string): string {
  const date = new Date(dateString);
  const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
  const rest = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${rest}`;
}

// Normalise allure_min_per_km to "X:XX /km" format
// Input can be "5.25" (decimal) or already "5:15" (hms-like)
function formatPace(raw: string): string {
  if (!raw || raw === '--') return '--';
  if (raw.includes(':')) return `${raw}/km`;
  const decimal = parseFloat(raw);
  if (isNaN(decimal)) return raw;
  const min = Math.floor(decimal);
  const sec = Math.round((decimal - min) * 60);
  return `${min}:${sec.toString().padStart(2, '0')}/km`;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h${minutes > 0 ? minutes.toString().padStart(2, '0') : ''}`;
  }
  return `${minutes} min`;
}
