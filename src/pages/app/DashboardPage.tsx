import { Link } from 'react-router-dom';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useDashboard, useDashboardCharts, usePermissions, useInView, useEvents } from '@/hooks';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { OnboardingScreen } from '@/components/ui/OnboardingScreen';
import { DemoBanner } from '@/components/ui/DemoBanner';
import { EventModal } from '@/components/ui/EventModal';
import { DashboardMap } from '@/components/maps';
import { trailApi, kpiApi } from '@/services/api';
import type { TrailProfile, TrailRecord } from '@/types';
import { sportBarColor } from '@/services/utils/constants';

const DashboardChartsSection = lazy(() =>
  import('./DashboardChartsSection').then(m => ({ default: m.DashboardChartsSection }))
);

const MONTH_NAMES = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
];


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

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DashboardPage() {
  const { lastActivity, lastActivityExploration, recentActivities, weeklySummary, monthlySummary, explorationStats, isLoading, error, isSyncing, syncData } = useDashboard();
  const { nextEvent, createEvent } = useEvents();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const { isDemo, canSync } = usePermissions();
  const { status: syncStatus, activitiesCount, hasFetched: syncFetched } = useSyncStatus();

  const [trailProfile, setTrailProfile] = useState<TrailProfile | null>(null);
  useEffect(() => {
    trailApi.getProfile().then(setTrailProfile).catch(() => null);
  }, []);

  const [trailRecords, setTrailRecords] = useState<Record<string, TrailRecord[]>>({});
  useEffect(() => {
    kpiApi.getRecords().then(d => setTrailRecords(d.trailRecords)).catch(() => null);
  }, []);

  const {
    dailyHoursData, weekOffset, setWeekOffset, weekLabel, weekStats,
    weeklyHoursData, weeklyHoursAverage,
    weeklyDistanceData, distanceSport, setDistanceSport, weeklyDistanceAverage,
    repartitionData, repartitionSport, setRepartitionSport, repartitionWeeks, setRepartitionWeeks,
    weeklyPaceData, paceSport, setPaceSport, weeklyPaceAverage,
    conqueteData, conqueteAverage, weeklyElevationAverage,
    globalOffset, setGlobalOffset,
    isRefetchingDailyHours, isRefetchingWeeklyHours, isRefetchingWeeklyDistance,
    isRefetchingRepartition, isRefetchingWeeklyPace, isRefetchingConquete,
  } = useDashboardCharts();

  // Pendant le chargement initial : spinner minimaliste
  if (isLoading && !syncFetched) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner message="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  // Onboarding uniquement si activities_count === 0 (source fiable : /auth/strava/sync-status)
  // Un sync manuel avec données existantes reste sur le dashboard normal
  if (syncFetched && activitiesCount === 0) {
    return <OnboardingScreen status={syncStatus} hasData={false} />;
  }

  const currentMonth = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="flex flex-col gap-3 max-w-[1200px]">
      {isDemo && <DemoBanner />}

      {/* ── ROW 0 : Score Trail + Carte ── */}
      <div className="grid gap-3 min-h-[280px]" style={{ gridTemplateColumns: '280px 1fr' }}>

        {/* Score Trail */}
        <div className="relative overflow-hidden flex flex-col bg-charcoal border border-steel/30 rounded-lg p-5 min-h-[280px]">
          {/* Radial amber glow */}
          <span className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(232,131,42,0.06) 0%, transparent 65%)' }} />
          <span className="hw-br hw-br-tl hw-br-amber" />
          <span className="hw-br hw-br-tr hw-br-amber" />
          <span className="hw-br hw-br-bl hw-br-amber" />
          <span className="hw-br hw-br-br hw-br-amber" />

          {/* Eyebrow */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="hw-score-eyebrow">Trail Score</p>
            <Link to="/profile" className="hw-link" style={{ color: 'rgba(232,131,42,0.5)' }}>Profil →</Link>
          </div>

          {/* Big score */}
          {trailProfile ? (
            <>
              <div className="flex items-end gap-1">
                <p className="font-mono text-[84px] font-black leading-none text-amber tabular-nums">
                  {Math.round(trailProfile.trail_score_final)}
                </p>
                <span className="font-mono text-[13px] text-amber/40 pb-2.5">/100</span>
              </div>
              <div className="hw-grad-sep" />
            </>
          ) : (
            <>
              <p className="font-mono text-[84px] font-black leading-none text-steel/40 tabular-nums">--</p>
              <div className="hw-grad-sep" />
            </>
          )}

          {/* Profil dominant */}
          <div className="absolute bottom-5 right-5 text-right">
            {trailProfile && (
              <>
                <p className="text-[13px] font-semibold text-moss tracking-[0.5px]">{trailProfile.dominant_profile}</p>
                <p className="font-mono text-[9px] text-steel uppercase tracking-[1px] mt-0.5">Profil dominant</p>
              </>
            )}
          </div>
        </div>

        {/* Carte Mapbox */}
        <DashboardMap
          className=""
          style={{ minHeight: '280px', borderRadius: '8px' }}
          explorationStats={explorationStats}
        />
      </div>

      {/* ── ROW 1 : Stats semaine / mois / event ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Cette semaine */}
        <div className="hw-card-weekly">
          <div className="flex items-center justify-between mb-3">
            <span className="hw-card-title">Cette semaine</span>
            {weeklySummary && (
              <span className={`font-mono text-[11px] ${weeklySummary.prevWeekComparison >= 0 ? 'text-moss' : 'text-red-400'}`}>
                {weeklySummary.prevWeekComparison >= 0 ? '↑' : '↓'} {Math.abs(weeklySummary.prevWeekComparison).toFixed(0)}%
              </span>
            )}
          </div>

          {weeklySummary ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="hw-label">Distance</p>
                <p className="hw-value text-amber">{weeklySummary.totalDistance.toFixed(1)} <span className="text-[10px] text-amber/60">km</span></p>
              </div>
              <div>
                <p className="hw-label">Temps</p>
                <p className="hw-value text-mist">{formatTime(weeklySummary.totalTime)}</p>
              </div>
              <div>
                <p className="hw-label">Dénivelé</p>
                <p className="hw-value text-glacier">{formatNumber(weeklySummary.totalElevation)} <span className="text-[10px] text-glacier/60">m</span></p>
              </div>
              <div>
                <p className="hw-label">Sessions</p>
                <p className="hw-value text-moss">{weeklySummary.sessionCount}</p>
              </div>
            </div>
          ) : (
            <p className="text-mist/30 text-xs">Pas de données</p>
          )}
        </div>

        {/* Ce mois */}
        <div className="hw-card-monthly">
          <div className="flex items-center justify-between mb-3">
            <span className="hw-card-title">{currentMonth}</span>
            {monthlySummary && (
              <span className={`font-mono text-[11px] ${monthlySummary.trend >= 0 ? 'text-moss' : 'text-red-400'}`}>
                {monthlySummary.trend >= 0 ? '↑' : '↓'} {Math.abs(monthlySummary.trend).toFixed(0)}%
              </span>
            )}
          </div>

          {monthlySummary ? (
            <>
              <div className="grid grid-cols-3 gap-2.5 mb-3">
                <div>
                  <p className="hw-label">Distance</p>
                  <p className="hw-value text-amber">{monthlySummary.totalDistance.toFixed(1)} <span className="text-[10px] text-amber/60">km</span></p>
                </div>
                <div>
                  <p className="hw-label">D+</p>
                  <p className="hw-value text-glacier">{formatNumber(monthlySummary.totalElevation)} <span className="text-[10px] text-glacier/60">m</span></p>
                </div>
                <div>
                  <p className="hw-label">Sessions</p>
                  <p className="hw-value text-moss">{monthlySummary.sessionCount}</p>
                </div>
              </div>
              <div>
                <div className="hw-pb-bg">
                  <div className="hw-pb-fill" style={{ width: `${monthlySummary.monthProgress}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="font-mono text-[9px] text-mist/25">Progression</span>
                  <span className="font-mono text-[9px] text-mist/25">{monthlySummary.daysPassed}/{monthlySummary.daysInMonth}j</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-mist/30 text-xs">Pas de données</p>
          )}
        </div>

        {/* Prochain événement */}
        <div className="hw-card border-glacier/25">
          {/* Top stripe */}
          <span className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, #E8832A, #3DB2E0, transparent)' }} />

          <div className="flex items-center justify-between mb-2.5">
            <p className="font-mono text-[9px] text-glacier/70 uppercase tracking-[2px]">Prochain Événement</p>
            {nextEvent && <span className="hw-ev-badge">J-{getDaysUntil(nextEvent.date)}</span>}
          </div>

          {nextEvent ? (
            <>
              <p className="text-base font-bold text-mist truncate mb-0.5">{nextEvent.name}</p>
              {(nextEvent.location || nextEvent.date) && (
                <p className="font-mono text-[10px] text-steel mb-3.5 uppercase tracking-[1px]">
                  {[nextEvent.location, new Date(nextEvent.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()].filter(Boolean).join(' · ')}
                </p>
              )}
              <div className="flex gap-[18px] mb-3.5">
                {nextEvent.distance_km && (
                  <div>
                    <p className="font-mono text-[22px] font-bold text-glacier tabular-nums leading-none">{nextEvent.distance_km}</p>
                    <p className="font-mono text-[9px] text-steel uppercase tracking-[1px] mt-0.5">km</p>
                  </div>
                )}
                {nextEvent.elevation_m && (
                  <div>
                    <p className="font-mono text-[22px] font-bold text-glacier tabular-nums leading-none">{nextEvent.elevation_m.toLocaleString('fr-FR')}</p>
                    <p className="font-mono text-[9px] text-steel uppercase tracking-[1px] mt-0.5">m D+</p>
                  </div>
                )}
              </div>
              <Link to="/calendar" className="hw-link">Calendrier →</Link>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-mist/25 text-xs">Aucun événement planifié</p>
              <button
                onClick={() => setEventModalOpen(true)}
                className="font-mono text-[10px] text-amber text-left bg-transparent border-none cursor-pointer p-0"
              >
                + Ajouter un événement
              </button>
              <Link to="/calendar" className="hw-link mt-1">Calendrier →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2 : Activités récentes + Records Trail ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Activités récentes */}
        <div className="hw-card border-amber/25 max-h-[320px] overflow-hidden">
          <span className="hw-br hw-br-tl hw-br-amber" />
          <span className="hw-br hw-br-tr hw-br-amber" />
          <span className="hw-br hw-br-bl hw-br-amber" />
          <span className="hw-br hw-br-br hw-br-amber" />

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="hw-card-title">Activités récentes</span>
              <button
                onClick={syncData}
                disabled={isSyncing || !canSync}
                className={`flex items-center px-1.5 py-0.5 rounded bg-steel/30 border border-steel/50 transition-all ${isSyncing || !canSync ? 'cursor-not-allowed' : 'cursor-pointer'} ${!canSync ? 'opacity-40' : ''}`}
                style={{ color: isSyncing ? '#3DB2E0' : 'rgba(242,242,242,0.4)' }}
                title={canSync ? 'Synchroniser mes données' : 'Indisponible en mode démo'}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isSyncing ? 'animate-spin' : ''}>
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
                </svg>
              </button>
            </div>
            <Link to="/activities" className="hw-link">Voir tout →</Link>
          </div>

          {/* Dernière activité — featured block */}
          {lastActivity && (
            <Link to={`/activity/${lastActivity.id}`} className="hw-act-featured block">
              <div className="flex items-start gap-2 mb-2">
                <div className="w-[3px] h-9 rounded-sm shrink-0" style={{ background: sportBarColor(lastActivity.type ?? '') }} />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[8px] text-amber/70 uppercase tracking-[2px] mb-0.5">
                    Dernière activité · {lastActivity.type}
                    {lastActivity.denivele_m ? ` · +${lastActivity.denivele_m}m D+` : ''}
                  </p>
                  <p className="text-[13px] font-semibold text-mist truncate">{lastActivity.name}</p>
                  <p className="font-mono text-[9px] text-steel">{formatActivityDate(lastActivity.date)}</p>
                </div>
                {lastActivity.race && (
                  <span className="hw-event-badge shrink-0 text-[8px]">
                    🏁 {lastActivity.race.name}
                  </span>
                )}
              </div>
              {/* Featured stats */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <p className="font-mono text-[8px] text-mist/30 uppercase mb-0.5">Distance</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-amber">{lastActivity.distance_km.toFixed(1)}<span className="text-[8px] text-amber/50 ml-0.5">km</span></p>
                </div>
                <div>
                  <p className="font-mono text-[8px] text-mist/30 uppercase mb-0.5">Temps</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-mist">{lastActivity.duree_hms}</p>
                </div>
                <div>
                  <p className="font-mono text-[8px] text-mist/30 uppercase mb-0.5">D+</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-glacier">{formatNumber(lastActivity.denivele_m ?? 0)}<span className="text-[8px] text-glacier/50 ml-0.5">m</span></p>
                </div>
                <div>
                  <p className="font-mono text-[8px] text-mist/30 uppercase mb-0.5">{lastActivity.type === 'Bike' ? 'Vitesse' : 'Allure'}</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-moss">
                    {lastActivity.type === 'Bike' ? `${lastActivity.vitesse_kmh?.toFixed(1) ?? '--'}` : formatPace(lastActivity.allure_min_per_km)}
                  </p>
                </div>
              </div>
              {lastActivityExploration && lastActivityExploration.total_cells > 0 && (
                <div className="mt-2 flex items-center gap-2 px-2 py-1 rounded bg-glacier/5 border border-glacier/15">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                  <span className="font-mono text-[9px] text-glacier/70">{lastActivityExploration.label}</span>
                  {lastActivityExploration.exploration_rate !== null && (
                    <span className="ml-auto font-mono text-[9px] text-glacier font-bold">{lastActivityExploration.exploration_rate.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </Link>
          )}

          {/* Autres activités récentes */}
          <div>
            {recentActivities.filter(a => a.id !== lastActivity?.id).slice(0, 2).map((activity) => {
              const color = sportBarColor(activity.type ?? '');
              const isBike = activity.type === 'Bike';
              const pace = isBike ? (activity.vitesse_kmh ? activity.vitesse_kmh.toFixed(1) : '--') : formatPace(activity.allure_min_per_km);
              return (
                <Link key={activity.id} to={`/activity/${activity.id}`} className="hw-act-row">
                  <div className="w-[3px] h-7 rounded-sm shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-mist truncate">{activity.name}</p>
                    <p className="font-mono text-[9px] text-steel mt-px">{activity.type?.toUpperCase()} · {formatActivityDate(activity.date)}</p>
                  </div>
                  <div className="flex gap-3.5 ml-auto shrink-0 text-right">
                    <div>
                      <p className="font-mono text-[11px] font-semibold tabular-nums text-mist/60">{activity.distance_km.toFixed(1)} km</p>
                      <p className="font-mono text-[9px] text-steel">{pace}{isBike ? ' km/h' : '/km'}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Records Trail */}
        <div className="hw-card-records max-h-[320px] overflow-hidden">
          <span className="hw-br hw-br-tl hw-br-amber" />
          <span className="hw-br hw-br-tr hw-br-amber" />
          <span className="hw-br hw-br-bl hw-br-amber-dark" />
          <span className="hw-br hw-br-br hw-br-amber-dark" />

          <div className="flex items-center justify-between mb-3.5">
            <span className="hw-card-title">Records Trail</span>
            <Link to="/kpi" className="hw-link">Voir tout →</Link>
          </div>

          {(() => {
            const TRAIL_LABELS: [string, string, string][] = [
              ['climb_5min',        'D+ en 5 min',       'm'],
              ['climb_30min',       'D+ en 30 min',      'm'],
              ['climb_60min',       'D+ en 60 min',      'm'],
              ['kv_1000m',          'KV 1000m',          ''],
              ['max_dplus_activity','Max D+ activité',   'm'],
              ['best_week_dplus',   'Meilleure semaine', 'm D+'],
            ];
            const hasAny = TRAIL_LABELS.some(([key]) => (trailRecords[key]?.length ?? 0) > 0);
            if (!hasAny) {
              return <p className="text-mist/25 text-xs">Pas de records disponibles</p>;
            }
            return (
              <div>
                {TRAIL_LABELS.map(([key, label, unit]) => {
                  const rec = trailRecords[key]?.[0];
                  if (!rec) return null;
                  const display = rec.value_formatted ?? rec.time_formatted ?? (rec.value != null ? String(Math.round(rec.value)) : '--');
                  return (
                    <div key={key} className="hw-rec-row">
                      <div>
                        <p className="font-mono text-[9px] text-mist/30 uppercase tracking-[1.5px]">{label}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold tabular-nums text-amber inline">{display}</p>
                        {unit && <span className="font-mono text-[9px] text-amber/55 ml-0.5">{unit}</span>}
                        {rec.date && <p className="font-mono text-[9px] text-steel mt-0.5">{new Date(rec.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Analytiques ── */}
      <div className="hw-section-sep">
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

      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={createEvent}
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

const _numFmt = new Intl.NumberFormat('fr-FR');
function formatNumber(n: number): string {
  return _numFmt.format(Math.round(n));
}
