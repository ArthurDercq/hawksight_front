import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { useProfile, useKPI, useEvents, useTrailProfile } from '@/hooks';
import { Spinner } from '@/components/ui/Spinner';
import { EventModal } from '@/components/ui/EventModal';
import { useAuth } from '@/context';
import type { TrainingEvent, TrailAxisScores, TrailReferenceProfile, TrailProfileHistory } from '@/types';
import { activitiesApi, apiClient } from '@/services/api';
import { formatRelativeTime, formatMembershipDuration } from '@/services/utils/formatters';
import type { JobSyncStatus } from '@/hooks/useSyncStatus';

const SYNC_POLL_INTERVAL_MS = 2000;
const SYNC_POLL_MAX_ATTEMPTS = 15; // ~30s avant d'abandonner le polling

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ─── Icons ────────────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);




const SyncIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    className={spinning ? 'animate-spin' : ''}
    style={spinning ? { animationDirection: 'reverse' } : {}}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StravaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const IdIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

// ─── Sport tags config ─────────────────────────────────────────────────────────

const SPORT_TAGS: Record<string, { label: string; color: string; emoji: string }> = {
  total_km_run:   { label: 'Course',  color: '#E8832A', emoji: '🏃' },
  total_km_trail: { label: 'Trail',   color: '#C96A1A', emoji: '🏔️' },
  total_km_bike:  { label: 'Vélo',    color: '#3DB2E0', emoji: '🚵' },
  total_km_swim:  { label: 'Natation',color: '#6DAA75', emoji: '🏊' },
};


// ─── Trail Score History Chart ────────────────────────────────────────────────

const TRAIL_COLOR = '#C96A1A';

function TrailScoreHistoryChart({ history }: { history: TrailProfileHistory[] }) {
  if (history.length === 0) {
    return (
      <div className="hw-chart-card mt-6">
        <span className="hw-br hw-br-tl hw-br-amber" />
        <h3 className="hw-chart-title mb-1">Score trail — évolution</h3>
        <p className="hw-chart-subtitle mb-4">Historique hebdomadaire</p>
        <div className="hw-chart-empty">Pas encore assez de données</div>
      </div>
    );
  }

  const sorted = [...history].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );

  const labels = sorted.map((s) => s.week_label);
  const scores = sorted.map((s) => Math.round(s.trail_score_final));
  const latest = scores[scores.length - 1];
  const first  = scores[0];
  const delta  = latest - first;
  const deltaStr = delta > 0 ? `+${delta} pts` : delta < 0 ? `${delta} pts` : 'stable';

  const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } as const };
  const gridStyle = { color: 'rgba(255,255,255,0.03)' };

  const data = {
    labels,
    datasets: [
      {
        data: scores,
        borderColor: TRAIL_COLOR,
        backgroundColor: 'rgba(201,106,26,0.08)',
        fill: true,
        tension: 0,
        pointRadius: sorted.length <= 12 ? 3 : 2,
        pointBackgroundColor: TRAIL_COLOR,
        pointBorderColor: 'transparent',
        borderWidth: 1.5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          ...axisStyle,
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: gridStyle,
        ticks: {
          ...axisStyle,
          stepSize: 25,
          callback: (v: number | string) => `${v}`,
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0B0C10',
        borderColor: 'rgba(58,63,71,0.6)',
        borderWidth: 1,
        titleColor: 'rgba(242,242,242,0.4)',
        bodyColor: '#E8832A',
        titleFont: { size: 10, family: 'JetBrains Mono' } as const,
        bodyFont: { size: 12, family: 'JetBrains Mono' } as const,
        callbacks: {
          title: (items: import('chart.js').TooltipItem<'line'>[]) => items[0]?.label ?? '',
          label: (item: import('chart.js').TooltipItem<'line'>) => `${item.raw} / 100`,
        },
      },
    },
  };

  return (
    <div className="hw-chart-card mt-6">
      <span className="hw-br hw-br-tl hw-br-amber" />
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Score trail — évolution</h3>
          <p className="hw-chart-subtitle">
            {sorted.length} semaines ·{' '}
            <span style={{ color: delta >= 0 ? '#6DAA75' : '#F87171' }}>{deltaStr}</span>
          </p>
        </div>
        <span className="hw-text-value font-bold tabular-nums" style={{ color: TRAIL_COLOR }}>
          {latest}<span className="hw-text-label text-steel/60 ml-0.5">/100</span>
        </span>
      </div>
      <div className="h-[180px]">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}

// ─── Trail Profile Radar ──────────────────────────────────────────────────────

const TRAIL_AXES: { key: keyof TrailAxisScores; label: string; desc: string }[] = [
  { key: 'engine',    label: 'Engine',    desc: 'VAM & vitesse en montée' },
  { key: 'climbing',  label: 'Climbing',  desc: 'Puissance kg sur longues montées' },
  { key: 'endurance', label: 'Endurance', desc: 'Capacité à maintenir l\'effort' },
  { key: 'technical', label: 'Technical', desc: 'Efficacité descente & pente forte' },
  { key: 'volume',    label: 'Volume',    desc: 'D+ accumulé mensuel' },
  { key: 'legacy',    label: 'Legacy',    desc: 'Historique & expérience totale' },
];

function RadarChart({ scores, referenceScores, color = TRAIL_COLOR }: {
  scores: TrailAxisScores;
  referenceScores?: TrailAxisScores | null;
  color?: string;
}) {
  const SIZE = 280;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 95;
  const axes = TRAIL_AXES.filter(ax => scores[ax.key] != null || ax.key !== 'legacy' || scores.legacy != null);
  const n = axes.length;

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, r: number) => ({
    x: CX + r * Math.cos(angleOf(i)),
    y: CY + r * Math.sin(angleOf(i)),
  });

  const gridPolygon = (ratio: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = point(i, R * ratio);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  const dataPolygon = (s: TrailAxisScores) =>
    axes.map((ax, i) => {
      const p = point(i, R * Math.max(0, Math.min(1, (s[ax.key] ?? 0) / 100)));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="radarFillRef" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3DB2E0" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3DB2E0" stopOpacity="0.02" />
        </radialGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {[0.25, 0.5, 0.75, 1].map((ratio) => (
        <polygon key={ratio} points={gridPolygon(ratio)} fill="none"
          stroke="#9CA3AF" strokeWidth={ratio === 1 ? 0.8 : 0.5} opacity={ratio === 1 ? 0.5 : 0.2} />
      ))}

      {axes.map((_, i) => {
        const outer = point(i, R);
        return <line key={i} x1={CX} y1={CY} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
          stroke="#9CA3AF" strokeWidth="0.5" opacity="0.3" />;
      })}

      {referenceScores && (
        <polygon points={dataPolygon(referenceScores)} fill="url(#radarFillRef)"
          stroke="#3DB2E0" strokeWidth="1" strokeLinejoin="round" strokeDasharray="3 2" opacity="0.7" />
      )}

      <polygon points={dataPolygon(scores)} fill="url(#radarFill)"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round"
        filter="url(#radarGlow)" opacity="0.95" />

      {axes.map((ax, i) => {
        const val = Math.max(0, Math.min(1, (scores[ax.key] ?? 0) / 100));
        const p = point(i, R * val);
        return (
          <g key={ax.key}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} opacity="0.9" />
            <circle cx={p.x} cy={p.y} r="2" fill="#F2F2F2" />
          </g>
        );
      })}

      {axes.map((ax, i) => {
        const labelR = R + 20;
        const p = point(i, labelR);
        const anchor = p.x < CX - 5 ? 'end' : p.x > CX + 5 ? 'start' : 'middle';
        return (
          <text key={ax.key} x={p.x.toFixed(1)} y={p.y.toFixed(1)}
            textAnchor={anchor} dominantBaseline="middle"
            fill="#F2F2F2" fontSize="8.5" fontFamily="'JetBrains Mono', monospace" opacity="0.8">
            {ax.label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

function TrailProfileCard() {
  const { profile, history, references, isLoading, isComputing, error, compute } = useTrailProfile();
  const [selectedRef, setSelectedRef] = useState<TrailReferenceProfile | null>(null);

  const color = TRAIL_COLOR;
  const score100 = profile ? Math.round(profile.trail_score_final) : null;

  return (
    <div className="hw-card-dark p-6">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#C96A1A]/5 rounded-full blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-steel/30 mb-6">
          <div className="p-2 border rounded" style={{ backgroundColor: '#C96A1A10', borderColor: '#C96A1A30' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-heading text-mist">Profil Traileur</h3>
            <p className="text-muted font-body text-xs mt-1">Analyse de tes compétences trail</p>
          </div>
          <button
            onClick={compute}
            disabled={isComputing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hw-text-caption border transition-all disabled:opacity-50"
            style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
            title="Recalculer le profil"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className={isComputing ? 'animate-spin' : ''}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isComputing ? 'Calcul...' : 'Recalculer'}
          </button>
        </div>

        {/* Error */}
        {error && !isLoading && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-steel/5 border border-steel/20 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="hw-text-label text-steel/85">{error}</p>
          </div>
        )}

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner message="Chargement du profil trail..." fullPage={false} />
          </div>
        ) : !profile ? (
          <div className="text-center py-10">
            <p className="text-muted text-sm font-mono mb-4">Aucun profil calculé</p>
            <button
              onClick={compute}
              disabled={isComputing}
              className="px-4 py-2 rounded-lg text-sm font-mono border transition-all disabled:opacity-50"
              style={{ color: color, borderColor: `${color}40`, backgroundColor: `${color}10` }}
            >
              {isComputing ? 'Calcul en cours...' : 'Calculer mon profil'}
            </button>
          </div>
        ) : (
          <>
            {/* Score global card */}
            <div className="mb-6 rounded-lg p-4 flex items-center gap-5 relative overflow-hidden"
              style={{ backgroundColor: `${color}08`, border: `1px solid ${color}25` }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent" />
              {/* Gros score */}
              <div className="relative flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 rounded-full border-2"
                style={{ borderColor: `${color}50`, backgroundColor: `${color}10` }}>
                <span className="font-mono font-bold text-3xl leading-none" style={{ color }}>
                  {score100}
                </span>
                <span className="hw-text-label text-muted mt-0.5">/100</span>
              </div>
              {/* Infos droite */}
              <div className="relative flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="hw-text-label text-muted">Profil dominant</span>
                </div>
                <div className="font-heading text-xl font-semibold" style={{ color }}>
                  {profile.dominant_profile}
                </div>
                {/* Barre de score */}
                <div className="mt-2 h-1.5 bg-steel/20 rounded-full overflow-hidden w-full">
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${score100}%`, background: `linear-gradient(to right, ${color}, #E8832A)` }} />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="hw-text-caption">0</span>
                  {profile.data_freshness_factor < 0.7 && (
                    <span className="hw-text-caption text-yellow-500/60">données anciennes</span>
                  )}
                  <span className="hw-text-caption">100</span>
                </div>
              </div>
            </div>

            {/* Reference selector */}
            {references.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="hw-text-label text-muted mr-1">Comparer à</span>
                <button
                  onClick={() => setSelectedRef(null)}
                  className={`px-2 py-0.5 rounded hw-text-caption border transition-all ${!selectedRef ? 'text-mist border-steel/50' : 'text-muted border-steel/20 hover:border-steel/30'}`}
                >
                  Personne
                </button>
                {references.map(ref => (
                  <button
                    key={ref.slug}
                    onClick={() => setSelectedRef(selectedRef?.slug === ref.slug ? null : ref)}
                    className={`px-2 py-0.5 rounded hw-text-caption border transition-all ${selectedRef?.slug === ref.slug ? 'text-glacier border-glacier/50 bg-glacier/10' : 'text-muted border-steel/20 hover:border-glacier/30 hover:text-glacier/70'}`}
                  >
                    {ref.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Radar + bars */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <RadarChart
                  scores={profile.axis_scores}
                  referenceScores={selectedRef?.axis_scores ?? null}
                  color={color}
                />
                {selectedRef && (
                  <div className="flex items-center justify-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-px" style={{ background: color }} />
                      <span className="hw-text-caption">Toi</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-px border-t border-dashed border-glacier" />
                      <span className="hw-text-caption">{selectedRef.name.split(' ')[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full space-y-3">
                {TRAIL_AXES.filter(ax => profile.axis_scores[ax.key] != null).map((ax) => {
                  const score = profile.axis_scores[ax.key] ?? 0;
                  const refScore = selectedRef?.axis_scores[ax.key];
                  return (
                    <div key={ax.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="hw-text-label text-mist tracking-wide">
                          {ax.label}
                        </span>
                        <div className="flex items-center gap-2">
                          {refScore != null && (
                            <span className="hw-text-caption text-glacier">
                              {Math.round(refScore)}
                            </span>
                          )}
                          <span className="hw-text-data font-semibold" style={{ color }}>
                            {Math.round(score)}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-steel/20 rounded-full overflow-hidden relative">
                        {refScore != null && (
                          <div className="absolute h-full rounded-full opacity-40"
                            style={{ width: `${refScore}%`, background: '#3DB2E0' }} />
                        )}
                        <div className="absolute h-full rounded-full transition-all duration-700"
                          style={{ width: `${score}%`, background: `linear-gradient(to right, ${color}, #E8832A)` }} />
                      </div>
                      <p className="hw-text-caption font-body mt-0.5">{ax.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score history chart */}
            <TrailScoreHistoryChart history={history} />

            {/* Footer meta */}
            <div className="mt-4 flex items-center justify-between">
              <span className="hw-text-caption text-muted/40">
                v{profile.model_version} · calculé {profile.computed_at ? new Date(profile.computed_at).toLocaleDateString('fr-FR') : '—'}
              </span>
              {profile.imbalance_penalty > 0.05 && (
                <span className="hw-text-caption text-yellow-500/50">
                  pénalité déséquilibre −{Math.round(profile.imbalance_penalty)}pts
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-steel/10 last:border-0">
      <span className="text-xs text-mist/40 font-mono uppercase tracking-wider">{label}</span>
      <span className="text-sm text-mist font-mono">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { profile, isLoading, error } = useProfile();
  const { kpis } = useKPI();
  const { events, upcomingEvents, pastEvents, createEvent, updateEvent, deleteEvent, markCompleted } = useEvents();
  const [editingEvent, setEditingEvent] = useState<TrainingEvent | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncDone(false);
    setSyncError(null);
    try {
      await activitiesApi.triggerSync();

      // triggerSync ne fait qu'enfiler un job — on poll /sync/status jusqu'à ce
      // qu'il ne soit plus actif, pour savoir si le job a réellement réussi.
      let finalStatus: JobSyncStatus | null = null;
      for (let attempt = 0; attempt < SYNC_POLL_MAX_ATTEMPTS; attempt++) {
        await sleep(SYNC_POLL_INTERVAL_MS);
        const { data } = await apiClient.get<JobSyncStatus>('/sync/status');
        if (!data.is_syncing) {
          finalStatus = data;
          break;
        }
      }

      window.dispatchEvent(new CustomEvent('activities-updated', { detail: { source: 'sync-trigger' } }));

      if (finalStatus?.has_error) {
        setSyncError(finalStatus.last_error || 'La synchronisation a échoué.');
      } else if (!finalStatus) {
        setSyncError('La synchronisation prend plus de temps que prévu — réessayez plus tard.');
      } else {
        setSyncDone(true);
        setTimeout(() => setSyncDone(false), 3000);
      }
    } catch (e) {
      console.error('Sync error', e);
      setSyncError('Erreur lors du déclenchement de la synchronisation.');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-24">
        <Spinner message="Chargement du profil..." />
      </div>
    );
  }

  if ((error || !profile) && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="hw-text-data text-steel/85 uppercase tracking-wider">{error || 'Impossible de charger le profil'}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const fullName = profile.username || 'Utilisateur';

  // Active sports from KPIs
  const activeSports = kpis
    ? Object.entries(SPORT_TAGS).filter(([key]) => (kpis[key as keyof typeof kpis] as number ?? 0) > 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto">

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Hero card */}
          <div className="hw-card-dark p-6">
            <span className="hw-br hw-br-tl hw-br-amber" />
            <span className="hw-br hw-br-br hw-br-amber-dark" />

            {/* Glow behind avatar */}
            <div className="absolute top-4 left-4 w-32 h-32 bg-amber/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber/20 blur-xl" />
                <div className="relative w-20 h-20 rounded-full bg-steel/20 border-2 border-steel/40 flex items-center justify-center text-steel">
                  <UserIcon />
                </div>
                {/* Status dot */}
                <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-charcoal ${profile.is_active ? 'bg-moss animate-pulse' : 'bg-red-400'}`} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="font-heading text-xl font-semibold text-mist">{fullName}</h2>
                </div>

                {/* Gradient separator */}
                <div className="h-px bg-gradient-to-r from-amber via-glacier to-transparent mb-3 w-48" />

                {profile.created_at && (
                  <p className="hw-text-caption text-steel mb-3">
                    MEMBRE DEPUIS {formatMembershipDuration(profile.created_at).toUpperCase()}
                  </p>
                )}

                {/* Sport tags */}
                {activeSports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeSports.map(([key, tag]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md hw-text-label border"
                        style={{ backgroundColor: `${tag.color}12`, borderColor: `${tag.color}30`, color: tag.color }}
                      >
                        {tag.emoji} {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* HAWKSIGHT monogram + logout top right */}
              <div className="hidden sm:flex flex-col items-end gap-3 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1 h-1 rounded-full bg-amber" style={{ opacity: 1 - i * 0.3 }} />
                    ))}
                  </div>
                  <span className="hw-text-caption">HAWKSIGHT</span>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="hw-btn-ghost hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          </div>

          {/* Trail Profile radar */}
          <TrailProfileCard />

          {/* Account details */}
          <div className="hw-card-dark p-6">
                  <div className="relative">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-steel/30">
                <div className="p-1.5 rounded-lg bg-steel/10 border border-steel/20 text-mist/50">
                  <IdIcon />
                </div>
                <h3 className="font-heading font-semibold text-mist text-sm">Informations du compte</h3>
              </div>

              <DetailRow label="Email" value={profile.email_address || <span className="text-mist/30">Non renseigné</span>} />
              <DetailRow label="Strava ID" value={profile.strava_id ? `#${profile.strava_id}` : '—'} />
              <DetailRow
                label="Statut"
                value={
                  <span className={`flex items-center gap-1.5 ${profile.is_active ? 'text-moss' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? 'bg-moss' : 'bg-red-400'}`} />
                    {profile.is_active ? 'Actif' : 'Inactif'}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          {/* Events card */}
          <div className="hw-card-dark p-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7B6BC8]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-steel/30">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#7B6BC8]/10 border border-[#7B6BC8]/30 text-[#A89BE8]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  </div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Mes événements</h3>
                </div>
                <button
                  onClick={() => setEventModalOpen(true)}
                  className="hw-btn-amber"
                >
                  + Ajouter
                </button>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-6">
                  <p className="hw-text-data text-steel/60 mb-3">Aucun événement planifié</p>
                  <button
                    onClick={() => setEventModalOpen(true)}
                    className="hw-btn-amber"
                  >
                    + Ajouter mon premier événement
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map(event => (
                    <EventRow key={event.id} event={event} onDelete={deleteEvent} onComplete={markCompleted} onEdit={setEditingEvent} />
                  ))}
                  {pastEvents.length > 0 && (
                    <>
                      <div className="hw-text-label text-mist/30 pt-2 pb-1">Passés</div>
                      {pastEvents.map(event => (
                        <EventRow key={event.id} event={event} past onDelete={deleteEvent} onComplete={markCompleted} onEdit={setEditingEvent} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sync card */}
          <div className="hw-card-dark p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-moss/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-steel/30">
                <div className="p-1.5 rounded-lg bg-moss/10 border border-moss/30 text-moss">
                  <SyncIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Synchronisation</h3>
                  <p className="hw-text-label text-steel mt-0.5">
                    {profile.last_activity_at
                      ? formatRelativeTime(profile.last_activity_at)
                      : 'Aucune activité'}
                  </p>
                </div>
              </div>

              {/* Dernière activité reçue */}
              {profile.last_activity_at && (
                <div className="mb-4 px-3 py-2 bg-charcoal/60 rounded-lg border border-steel/20">
                  <p className="hw-text-label text-muted mb-0.5">Dernière activité reçue</p>
                  <p className="text-mist/70 text-xs font-mono">
                    {new Date(profile.last_activity_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  syncError ? 'text-amber bg-amber/[0.08] border border-amber/25' : 'text-moss'
                } ${!syncError && syncDone ? 'bg-moss/[0.13] border border-moss/25' : !syncError ? 'bg-moss/[0.08] border border-moss/20' : ''}`}
                title={syncError ?? undefined}
              >
                {syncError ? (
                  <>Échec de la synchronisation</>
                ) : syncDone ? (
                  <><CheckIcon /> Synchronisé !</>
                ) : (
                  <><SyncIcon spinning={isSyncing} /> {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</>
                )}
              </button>
              {syncError && (
                <p className="hw-text-caption text-amber/70 mt-1.5 text-center">{syncError}</p>
              )}

              {/* Compteurs activités / features */}
              {(profile.activities_count !== undefined || profile.features_count !== undefined) && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 bg-charcoal/60 rounded-lg border border-steel/20 text-center">
                    <p className="font-mono text-lg font-bold tabular-nums text-mist">{profile.activities_count ?? '—'}</p>
                    <p className="hw-text-label text-steel mt-0.5">Activités</p>
                  </div>
                  <div className="relative group px-3 py-2 bg-charcoal/60 rounded-lg border border-steel/20 text-center cursor-default">
                    <p className="font-mono text-lg font-bold tabular-nums text-glacier">{profile.features_count ?? '—'}</p>
                    <p className="hw-text-label text-steel mt-0.5">Analysées</p>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 bg-charcoal border border-steel/50 rounded-lg text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-card">
                      <p className="hw-text-caption text-mist/70 leading-relaxed">
                        Activités avec données GPS complètes disponibles (vitesse, FC, altitude par seconde).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FC Max card */}
          <div className="hw-card-dark p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8832A]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-steel/30">
                <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30 text-amber">
                  <HeartIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">FC Max personnelle</h3>
                  <p className="hw-text-label text-steel mt-0.5">Utilisée pour les zones cardiaques</p>
                </div>
              </div>
              <FCMaxInput />
            </div>
          </div>

          {/* Strava connection card */}
          <div className="hw-card-dark p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FC4C02]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-steel/30">
                <div className="p-1.5 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/30 text-[#FC4C02]">
                  <StravaIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Connexion Strava</h3>
                  <p className="hw-text-label text-steel mt-0.5">Compte lié</p>
                </div>
              </div>

              <div className="space-y-2">
                {profile.strava_id ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-charcoal/60 rounded-lg border border-steel/20">
                    <span className="hw-text-label text-muted">Strava ID</span>
                    <span className="text-[#FC4C02] font-mono text-sm">#{profile.strava_id}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-charcoal/60 rounded-lg border border-steel/20">
                    <span className="hw-text-label text-muted">Statut</span>
                    <span className="text-mist/30 text-xs font-mono">Non connecté</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <EventModal
        open={eventModalOpen || editingEvent !== null}
        onClose={() => { setEventModalOpen(false); setEditingEvent(null); }}
        onSubmit={editingEvent ? (data) => updateEvent(editingEvent.id, data) : createEvent}
        editEvent={editingEvent ?? undefined}
      />
    </div>
  );
}

// ─── EventRow sub-component ───────────────────────────────────────────────────

interface EventRowProps {
  event: TrainingEvent;
  past?: boolean;
  onDelete: (id: string) => Promise<boolean>;
  onComplete: (id: string, done: boolean) => Promise<boolean>;
  onEdit: (event: TrainingEvent) => void;
}

function EventRow({ event, past, onDelete, onComplete, onEdit }: EventRowProps) {
  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${past ? 'border-steel/15 bg-charcoal/20 opacity-60' : 'border-steel/30 bg-charcoal/40 hover:border-[#7B6BC8]/30'}`}>
      <button
        onClick={() => onComplete(event.id, !event.is_completed)}
        className={`flex-shrink-0 w-4 h-4 rounded border transition-colors ${event.is_completed ? 'bg-event border-event' : 'border-steel hover:border-event'}`}
        title={event.is_completed ? 'Marquer non complété' : 'Marquer complété'}
      >
        {event.is_completed && (
          <svg className="w-full h-full text-white p-0.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${event.is_completed ? 'line-through text-mist/40' : 'text-mist'}`}>{event.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="hw-text-caption text-mist/30">{dateStr}</span>
          {event.distance_km && <span className="hw-text-caption text-mist/30">· {event.distance_km} km</span>}
        </div>
      </div>
      <span className="hw-event-badge flex-shrink-0 uppercase">
        {event.type}
      </span>
      {event.activity_id && (
        <Link
          to={`/activity/${event.activity_id}`}
          className="flex-shrink-0 text-mist/30 hover:text-amber transition-colors"
          title="Voir l'activité liée"
          onClick={e => e.stopPropagation()}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </Link>
      )}
      <button
        onClick={() => onEdit(event)}
        className="flex-shrink-0 text-mist/20 hover:text-amber transition-colors"
        title="Modifier"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>
      <button
        onClick={() => onDelete(event.id)}
        className="flex-shrink-0 text-mist/20 hover:text-red-400 transition-colors text-sm leading-none"
        title="Supprimer"
      >
        ×
      </button>
    </div>
  );
}

// ─── FC Max sub-component ─────────────────────────────────────────────────────

const FC_MAX_KEY = 'hawksight:fc_max';

function FCMaxInput() {
  const [value, setValue] = useState<string>(() => {
    return localStorage.getItem(FC_MAX_KEY) ?? '';
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 250) {
      localStorage.setItem(FC_MAX_KEY, String(parsed));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={100}
          max={250}
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false); }}
          onKeyDown={handleKeyDown}
          placeholder="ex: 185"
          className="flex-1 px-3 py-2 bg-charcoal/60 border border-steel/40 rounded-lg text-mist font-mono text-sm focus:border-amber focus:outline-none transition-colors placeholder:text-mist/20"
        />
        <span className="text-muted font-mono text-sm">BPM</span>
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={saved
          ? { backgroundColor: '#E8832A20', border: '1px solid #E8832A40', color: '#E8832A' }
          : { backgroundColor: '#E8832A10', border: '1px solid #E8832A25', color: '#E8832A' }
        }
      >
        {saved ? <><CheckIcon /> Sauvegardé</> : 'Enregistrer'}
      </button>

      <p className="hw-text-caption leading-relaxed">
        Valeur stockée localement sur votre appareil. Utilisée pour calculer vos zones cardiaques (Z1–Z5).
      </p>
    </div>
  );
}
