import { Link } from 'react-router-dom';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useDashboard, useDashboardCharts, usePermissions, useInView, useEvents } from '@/hooks';
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

// Corner bracket — 14×14px, using hw-br utilities from index.css
function CornerBrackets({ tlColor, trColor, blColor, brColor }: {
  tlColor?: string; trColor?: string; blColor?: string; brColor?: string;
}) {
  return (
    <>
      <span className="hw-br hw-br-tl" style={tlColor ? { borderColor: tlColor } : undefined} />
      <span className="hw-br hw-br-tr" style={trColor ? { borderColor: trColor } : undefined} />
      <span className="hw-br hw-br-bl" style={blColor ? { borderColor: blColor } : undefined} />
      <span className="hw-br hw-br-br" style={brColor ? { borderColor: brColor } : undefined} />
    </>
  );
}

export function DashboardPage() {
  const { lastActivity, lastActivityExploration, recentActivities, weeklySummary, monthlySummary, explorationStats, isLoading, error, isSyncing, syncData } = useDashboard();
  const { nextEvent, createEvent } = useEvents();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const { isDemo, canSync } = usePermissions();

  // Trail profile — fetch léger en background, non bloquant
  const [trailProfile, setTrailProfile] = useState<TrailProfile | null>(null);
  useEffect(() => {
    trailApi.getProfile().then(setTrailProfile).catch(() => null);
  }, []);

  // Trail records — fetch en background
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

  if (isLoading) {
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

  const currentMonth = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="flex flex-col gap-3 max-w-[1200px]">
      {isDemo && <DemoBanner />}

      {/* ── ROW 0 : Score Trail + Carte ── */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '280px 1fr', minHeight: '280px' }}>

        {/* Score Trail */}
        <div
          className="relative overflow-hidden flex flex-col"
          style={{
            background: '#0B0C10',
            border: '1px solid rgba(58,63,71,0.3)',
            borderRadius: '8px',
            padding: '20px',
            minHeight: '280px',
          }}
        >
          {/* Radial amber glow at top-left */}
          <span className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(232,131,42,0.06) 0%, transparent 65%)' }} />
          <CornerBrackets tlColor="rgba(232,131,42,0.45)" trColor="rgba(232,131,42,0.45)" blColor="rgba(232,131,42,0.45)" brColor="rgba(232,131,42,0.45)" />

          {/* Eyebrow */}
          <div className="flex items-center justify-between mb-1.5">
            <p className="hw-score-eyebrow">Trail Score</p>
            <Link to="/profile" className="hw-link" style={{ color: 'rgba(232,131,42,0.5)' }}>Profil →</Link>
          </div>

          {/* Big score */}
          {trailProfile ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                <p
                  className="tabular-nums"
                  style={{ fontSize: '84px', fontWeight: 800, lineHeight: 0.95, color: '#E8832A', fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}
                >
                  {Math.round(trailProfile.trail_score_final)}
                </p>
                <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(232,131,42,0.4)', fontFamily: 'JetBrains Mono, monospace', paddingBottom: '10px' }}>/100</span>
              </div>
              <div className="hw-grad-sep" />
            </>
          ) : (
            <>
              <p
                className="tabular-nums"
                style={{ fontSize: '84px', fontWeight: 800, lineHeight: 0.95, color: 'rgba(58,63,71,0.4)', fontFamily: 'JetBrains Mono, monospace' }}
              >
                --
              </p>
              <div className="hw-grad-sep" />
            </>
          )}

          {/* Profil dominant — bas droite, comme le mockup */}
          <div className="absolute" style={{ bottom: '20px', right: '20px', textAlign: 'right' }}>
            {trailProfile ? (
              <>
                <p style={{ fontSize: '13px', color: '#6DAA75', letterSpacing: '0.5px', fontWeight: 600 }}>{trailProfile.dominant_profile}</p>
                <p style={{ fontSize: '9px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>Profil dominant</p>
              </>
            ) : null}
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
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: weeklySummary.prevWeekComparison >= 0 ? '#6DAA75' : '#fc8181' }}>
                {weeklySummary.prevWeekComparison >= 0 ? '↑' : '↓'} {Math.abs(weeklySummary.prevWeekComparison).toFixed(0)}%
              </span>
            )}
          </div>

          {weeklySummary ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p className="hw-label">Distance</p>
                <p className="hw-value" style={{ color: '#E8832A' }}>{weeklySummary.totalDistance.toFixed(1)} <span style={{ fontSize: '10px', color: 'rgba(232,131,42,0.6)' }}>km</span></p>
              </div>
              <div>
                <p className="hw-label">Temps</p>
                <p className="hw-value" style={{ color: '#F2F2F2' }}>{formatTime(weeklySummary.totalTime)}</p>
              </div>
              <div>
                <p className="hw-label">Dénivelé</p>
                <p className="hw-value" style={{ color: '#3DB2E0' }}>{Math.round(weeklySummary.totalElevation)} <span style={{ fontSize: '10px', color: 'rgba(61,178,224,0.6)' }}>m</span></p>
              </div>
              <div>
                <p className="hw-label">Sessions</p>
                <p className="hw-value" style={{ color: '#6DAA75' }}>{weeklySummary.sessionCount}</p>
              </div>
            </div>
          ) : (
            <p style={{ color: 'rgba(242,242,242,0.3)', fontSize: '12px' }}>Pas de données</p>
          )}
        </div>

        {/* Ce mois */}
        <div className="hw-card-monthly">

          <div className="flex items-center justify-between mb-3">
            <span className="hw-card-title">{currentMonth}</span>
            {monthlySummary && (
              <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono, monospace', color: monthlySummary.trend >= 0 ? '#6DAA75' : '#fc8181' }}>
                {monthlySummary.trend >= 0 ? '↑' : '↓'} {Math.abs(monthlySummary.trend).toFixed(0)}%
              </span>
            )}
          </div>

          {monthlySummary ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <p className="hw-label">Distance</p>
                  <p className="hw-value" style={{ color: '#E8832A' }}>{monthlySummary.totalDistance.toFixed(1)} <span style={{ fontSize: '10px', color: 'rgba(232,131,42,0.6)' }}>km</span></p>
                </div>
                <div>
                  <p className="hw-label">D+</p>
                  <p className="hw-value" style={{ color: '#3DB2E0' }}>{Math.round(monthlySummary.totalElevation)} <span style={{ fontSize: '10px', color: 'rgba(61,178,224,0.6)' }}>m</span></p>
                </div>
                <div>
                  <p className="hw-label">Sessions</p>
                  <p className="hw-value" style={{ color: '#6DAA75' }}>{monthlySummary.sessionCount}</p>
                </div>
              </div>
              <div>
                <div className="hw-pb-bg">
                  <div className="hw-pb-fill" style={{ width: `${monthlySummary.monthProgress}%` }} />
                </div>
                <div className="flex justify-between" style={{ marginTop: '5px' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.25)' }}>Progression</span>
                  <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.25)' }}>{monthlySummary.daysPassed}/{monthlySummary.daysInMonth}j</span>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: 'rgba(242,242,242,0.3)', fontSize: '12px' }}>Pas de données</p>
          )}
        </div>

        {/* Prochain événement */}
        <div className="hw-card" style={{ border: '1px solid rgba(61,178,224,0.25)' }}>
          {/* Top stripe amber→glacier */}
          <span className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, #E8832A, #3DB2E0, transparent)' }} />

          <div className="flex items-center justify-between mb-2.5">
            <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(61,178,224,0.7)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Prochain Événement
            </p>
            {nextEvent && (
              <span className="hw-ev-badge">J-{getDaysUntil(nextEvent.date)}</span>
            )}
          </div>

          {nextEvent ? (
            <>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#F2F2F2', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextEvent.name}</p>
              {(nextEvent.location || nextEvent.date) && (
                <p style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {[nextEvent.location, new Date(nextEvent.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()].filter(Boolean).join(' · ')}
                </p>
              )}
              <div style={{ display: 'flex', gap: '18px', marginBottom: '14px' }}>
                {nextEvent.distance_km && (
                  <div>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: '#3DB2E0', fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{nextEvent.distance_km}</p>
                    <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>km</p>
                  </div>
                )}
                {nextEvent.elevation_m && (
                  <div>
                    <p style={{ fontSize: '22px', fontWeight: 700, color: '#3DB2E0', fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{nextEvent.elevation_m.toLocaleString('fr-FR')}</p>
                    <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>m D+</p>
                  </div>
                )}
              </div>
              <Link to="/calendar" className="hw-link">Calendrier →</Link>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <p style={{ color: 'rgba(242,242,242,0.25)', fontSize: '12px' }}>Aucun événement planifié</p>
              <button onClick={() => setEventModalOpen(true)} style={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', color: '#E8832A', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                + Ajouter un événement
              </button>
              <Link to="/calendar" className="hw-link" style={{ marginTop: '4px' }}>Calendrier →</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 2 : Activités récentes + Records Trail ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Activités récentes */}
        <div className="hw-card" style={{ border: '1px solid rgba(232,131,42,0.25)', maxHeight: '320px', overflow: 'hidden' }}>
          <CornerBrackets
            tlColor="rgba(232,131,42,0.45)" trColor="rgba(232,131,42,0.45)"
            blColor="rgba(232,131,42,0.45)" brColor="rgba(232,131,42,0.45)"
          />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="hw-card-title">Activités récentes</span>
              <button
                onClick={syncData}
                disabled={isSyncing || !canSync}
                className="flex items-center"
                style={{
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(58,63,71,0.3)',
                  border: '1px solid rgba(58,63,71,0.5)',
                  color: isSyncing ? '#3DB2E0' : 'rgba(242,242,242,0.4)',
                  cursor: isSyncing || !canSync ? 'not-allowed' : 'pointer',
                  opacity: !canSync ? 0.4 : 1,
                  transition: 'all 0.15s',
                }}
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
            <Link
              to={`/activity/${lastActivity.id}`}
              className="hw-act-featured block"
              style={{ display: 'block' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: sportBarColor(lastActivity.type ?? ''), flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(232,131,42,0.7)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '2px' }}>
                    Dernière activité · {lastActivity.type}
                    {lastActivity.denivele_m ? ` · +${lastActivity.denivele_m}m D+` : ''}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#F2F2F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastActivity.name}</p>
                  <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47' }}>{formatActivityDate(lastActivity.date)}</p>
                </div>
                {lastActivity.race && (
                  <span style={{ flexShrink: 0, fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(123,107,200,0.15)', color: '#A89BE8', border: '1px solid rgba(123,107,200,0.3)' }}>
                    🏁 {lastActivity.race.name}
                  </span>
                )}
              </div>
              {/* Featured stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                <div>
                  <p style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', marginBottom: '2px', textTransform: 'uppercase' }}>Distance</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#E8832A' }}>{lastActivity.distance_km.toFixed(1)}<span style={{ fontSize: '8px', color: 'rgba(232,131,42,0.5)', marginLeft: '2px' }}>km</span></p>
                </div>
                <div>
                  <p style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', marginBottom: '2px', textTransform: 'uppercase' }}>Temps</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#F2F2F2' }}>{lastActivity.duree_hms}</p>
                </div>
                <div>
                  <p style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', marginBottom: '2px', textTransform: 'uppercase' }}>D+</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#3DB2E0' }}>{lastActivity.denivele_m}<span style={{ fontSize: '8px', color: 'rgba(61,178,224,0.5)', marginLeft: '2px' }}>m</span></p>
                </div>
                <div>
                  <p style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', marginBottom: '2px', textTransform: 'uppercase' }}>{lastActivity.type === 'Bike' ? 'Vitesse' : 'Allure'}</p>
                  <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#6DAA75' }}>
                    {lastActivity.type === 'Bike' ? `${lastActivity.vitesse_kmh?.toFixed(1) ?? '--'}` : formatPace(lastActivity.allure_min_per_km)}
                  </p>
                </div>
              </div>
              {lastActivityExploration && lastActivityExploration.total_cells > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(61,178,224,0.05)', border: '1px solid rgba(61,178,224,0.15)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                  <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(61,178,224,0.7)' }}>{lastActivityExploration.label}</span>
                  {lastActivityExploration.exploration_rate !== null && (
                    <span style={{ marginLeft: 'auto', fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3DB2E0', fontWeight: 700 }}>{lastActivityExploration.exploration_rate.toFixed(0)}%</span>
                  )}
                </div>
              )}
            </Link>
          )}

          {/* Autres activités récentes */}
          <div>
            {[...recentActivities].reverse().slice(1, 3).map((activity) => {
              const color = sportBarColor(activity.type ?? '');
              const isBike = activity.type === 'Bike';
              const pace = isBike ? (activity.vitesse_kmh ? activity.vitesse_kmh.toFixed(1) : '--') : formatPace(activity.allure_min_per_km);
              return (
                <Link
                  key={activity.id}
                  to={`/activity/${activity.id}`}
                  className="hw-act-row"
                >
                  <div style={{ width: '3px', height: '28px', borderRadius: '2px', flexShrink: 0, background: color }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#F2F2F2', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activity.name}</p>
                    <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', marginTop: '1px' }}>{activity.type?.toUpperCase()} · {formatActivityDate(activity.date)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '14px', marginLeft: 'auto', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: 'rgba(242,242,242,0.6)' }}>{activity.distance_km.toFixed(1)} km</p>
                      <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47' }}>{pace}{isBike ? ' km/h' : '/km'}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Records Trail */}
        <div className="hw-card-records" style={{ maxHeight: '320px', overflow: 'hidden' }}>
          {/* TL/TR amber, BL/BR amber-dark */}
          <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(232,131,42,0.5)' }} />
          <span className="hw-br hw-br-tr" style={{ borderColor: 'rgba(232,131,42,0.5)' }} />
          <span className="hw-br hw-br-bl" style={{ borderColor: 'rgba(200,106,26,0.35)' }} />
          <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(200,106,26,0.35)' }} />

          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
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
              return <p style={{ color: 'rgba(242,242,242,0.25)', fontSize: '12px' }}>Pas de records disponibles</p>;
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
                        <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>{label}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#E8832A', display: 'inline' }}>{display}</p>
                        {unit && <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(232,131,42,0.55)', marginLeft: '2px' }}>{unit}</span>}
                        {rec.date && <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', marginTop: '2px' }}>{new Date(rec.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
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
