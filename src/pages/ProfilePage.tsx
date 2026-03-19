import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useProfile, useKPI, useEvents } from '@/hooks';
import { Spinner } from '@/components/ui/Spinner';
import { EventModal } from '@/components/ui/EventModal';
import { useAuth } from '@/context';
import type { TrainingEvent } from '@/types';
import { activitiesApi, apiClient } from '@/services/api';
import { formatRelativeTime, formatMembershipDuration } from '@/services/utils/formatters';

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


// ─── Trail Profile Radar ──────────────────────────────────────────────────────

const TRAIL_AXES = [
  { key: 'verticalPower',   label: 'Vertical Power',    desc: 'VAM & puissance en montée' },
  { key: 'enduranceClimb',  label: 'Endurance Climb',   desc: 'Capacité sur les longues montées' },
  { key: 'steepEfficiency', label: 'Steep Efficiency',  desc: 'Efficacité sur pente forte' },
  { key: 'verticalVolume',  label: 'Vertical Volume',   desc: 'Volume de D+ accumulé' },
  { key: 'descentMastery',  label: 'Descent Mastery',   desc: 'Maîtrise technique en descente' },
];

// Placeholder scores 0–1
const MOCK_SCORES: Record<string, number> = {
  verticalPower:   0.72,
  enduranceClimb:  0.58,
  steepEfficiency: 0.45,
  verticalVolume:  0.83,
  descentMastery:  0.61,
};

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const SIZE = 320;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 110;
  const n = TRAIL_AXES.length;
  const color = '#C96A1A';

  const angleOf = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const point = (i: number, r: number) => ({
    x: CX + r * Math.cos(angleOf(i)),
    y: CY + r * Math.sin(angleOf(i)),
  });

  // Gridlines at 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1];

  const gridPolygon = (ratio: number) =>
    Array.from({ length: n }, (_, i) => {
      const p = point(i, R * ratio);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  const dataPolygon = TRAIL_AXES.map((ax, i) => {
    const p = point(i, R * (scores[ax.key] ?? 0));
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </radialGradient>
        <filter id="radarGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Grid */}
      {gridLevels.map((ratio) => (
        <polygon
          key={ratio}
          points={gridPolygon(ratio)}
          fill="none"
          stroke="#3A3F47"
          strokeWidth={ratio === 1 ? 0.8 : 0.5}
          opacity={ratio === 1 ? 0.5 : 0.25}
        />
      ))}

      {/* Axis lines */}
      {TRAIL_AXES.map((_, i) => {
        const outer = point(i, R);
        return (
          <line
            key={i}
            x1={CX} y1={CY}
            x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)}
            stroke="#3A3F47" strokeWidth="0.5" opacity="0.35"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={dataPolygon}
        fill="url(#radarFill)"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#radarGlow)"
        opacity="0.95"
      />

      {/* Data dots */}
      {TRAIL_AXES.map((ax, i) => {
        const p = point(i, R * (scores[ax.key] ?? 0));
        return (
          <g key={ax.key}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} opacity="0.9" />
            <circle cx={p.x} cy={p.y} r="2" fill="#F2F2F2" />
          </g>
        );
      })}

      {/* Axis labels */}
      {TRAIL_AXES.map((ax, i) => {
        const labelR = R + 22;
        const p = point(i, labelR);
        const anchor = p.x < CX - 5 ? 'end' : p.x > CX + 5 ? 'start' : 'middle';
        return (
          <text
            key={ax.key}
            x={p.x.toFixed(1)} y={p.y.toFixed(1)}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill="#F2F2F2"
            fontSize="9"
            fontFamily="'JetBrains Mono', monospace"
            opacity="0.85"
          >
            {ax.label.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

function TrailProfileCard() {
  const scores = MOCK_SCORES;

  return (
    <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#C96A1A]/5 rounded-full blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-[#3A3F47]/30 mb-6">
          <div className="p-2 border rounded" style={{ backgroundColor: '#C96A1A10', borderColor: '#C96A1A30' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C96A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading text-[#F2F2F2]">Profil Traileur</h3>
            <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">Analyse de tes compétences trail</p>
          </div>
          <span className="ml-auto text-[9px] font-mono text-[#3A3F47] border border-[#3A3F47]/30 px-2 py-0.5 rounded">
            BÊTA
          </span>
        </div>

        {/* Content: radar + legend */}
        <div className="flex flex-col sm:flex-row items-center gap-8">
          {/* Radar */}
          <div className="flex-shrink-0">
            <RadarChart scores={scores} />
          </div>

          {/* Legend / scores */}
          <div className="flex-1 space-y-3">
            {TRAIL_AXES.map((ax) => {
              const score = scores[ax.key] ?? 0;
              return (
                <div key={ax.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#F2F2F2] font-['JetBrains_Mono'] text-[10px] uppercase tracking-wide">
                      {ax.label}
                    </span>
                    <span className="text-[#C96A1A] font-['JetBrains_Mono'] text-[11px] font-semibold">
                      {Math.round(score * 100)}
                    </span>
                  </div>
                  <div className="h-1 bg-[#3A3F47]/30 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${score * 100}%`,
                        background: `linear-gradient(to right, #C96A1A, #E8832A)`,
                      }}
                    />
                  </div>
                  <p className="text-[#3A3F47] font-['Inter'] text-[10px] mt-0.5">{ax.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
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
  const { events, upcomingEvents, pastEvents, createEvent, deleteEvent, markCompleted } = useEvents();
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncDone(false);
    try {
      await activitiesApi.syncActivities();
      await activitiesApi.syncStreams();
      apiClient.clearCache();
      window.dispatchEvent(new Event('activities-updated'));
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (e) {
      console.error('Sync error', e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-center py-24">
        <Spinner message="Chargement du profil..." />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 font-mono text-sm">{error || 'Impossible de charger le profil'}</p>
        </div>
      </div>
    );
  }

  const fullName = profile.username || 'Utilisateur';

  // Active sports from KPIs
  const activeSports = kpis
    ? Object.entries(SPORT_TAGS).filter(([key]) => (kpis[key as keyof typeof kpis] as number ?? 0) > 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-[#7B6BC8]/10 border border-[#7B6BC8]/30 text-[#7B6BC8]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold text-mist">Profil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Hero card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-amber/30 rounded-tl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-amber/30 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-amber/30 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-amber/30 rounded-br" />

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
                <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0C10] ${profile.is_active ? 'bg-[#6DAA75] animate-pulse' : 'bg-red-400'}`} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="font-heading text-xl font-semibold text-[#F2F2F2]">{fullName}</h2>
                </div>

                {/* Gradient separator */}
                <div className="h-px bg-gradient-to-r from-amber via-glacier to-transparent mb-3 w-48" />

                {profile.created_at && (
                  <p className="text-steel text-xs font-mono mb-3">
                    MEMBRE DEPUIS {formatMembershipDuration(profile.created_at).toUpperCase()}
                  </p>
                )}

                {/* Sport tags */}
                {activeSports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeSports.map(([key, tag]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-['Inter'] border"
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
                  <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">HAWKSIGHT</span>
                </div>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[#3A3F47] hover:text-red-400 hover:bg-red-500/10 border border-[#3A3F47]/20 hover:border-red-500/30 transition-all text-[11px] font-mono"
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
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
                  <div className="relative">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#3A3F47]/30">
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
                  <span className={`flex items-center gap-1.5 ${profile.is_active ? 'text-[#6DAA75]' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? 'bg-[#6DAA75]' : 'bg-red-400'}`} />
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
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7B6BC8]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#3A3F47]/30">
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
                  className="text-xs text-amber hover:text-amber/80 font-medium transition-colors"
                >
                  + Ajouter
                </button>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-mist/30 text-sm mb-3">Aucun événement planifié</p>
                  <button
                    onClick={() => setEventModalOpen(true)}
                    className="text-xs text-amber hover:text-amber/80 font-medium transition-colors"
                  >
                    + Ajouter mon premier événement
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map(event => (
                    <EventRow key={event.id} event={event} onDelete={deleteEvent} onComplete={markCompleted} />
                  ))}
                  {pastEvents.length > 0 && (
                    <>
                      <div className="text-[10px] text-mist/30 font-mono uppercase tracking-wider pt-2 pb-1">Passés</div>
                      {pastEvents.map(event => (
                        <EventRow key={event.id} event={event} past onDelete={deleteEvent} onComplete={markCompleted} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sync card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6DAA75]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-[#6DAA75]/10 border border-[#6DAA75]/30 text-[#6DAA75]">
                  <SyncIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Synchronisation</h3>
                  <p className="text-[#3A3F47] text-xs font-mono mt-0.5">
                    {profile.last_sync_at
                      ? formatRelativeTime(profile.last_sync_at)
                      : 'Jamais synchronisé'}
                  </p>
                </div>
              </div>

              {/* Last sync date */}
              {profile.last_sync_at && (
                <div className="mb-4 px-3 py-2 bg-charcoal/60 rounded-lg border border-[#3A3F47]/20">
                  <p className="text-[#3A3F47] text-[10px] font-mono uppercase tracking-wider mb-0.5">Dernière sync</p>
                  <p className="text-mist/70 text-xs font-mono">
                    {new Date(profile.last_sync_at).toLocaleDateString('fr-FR', {
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
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={syncDone
                  ? { backgroundColor: '#6DAA7520', border: '1px solid #6DAA7540', color: '#6DAA75' }
                  : { backgroundColor: '#6DAA7515', border: '1px solid #6DAA7530', color: '#6DAA75' }
                }
              >
                {syncDone ? (
                  <><CheckIcon /> Synchronisé !</>
                ) : (
                  <><SyncIcon spinning={isSyncing} /> {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</>
                )}
              </button>
            </div>
          </div>

          {/* FC Max card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8832A]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30 text-amber">
                  <HeartIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">FC Max personnelle</h3>
                  <p className="text-[#3A3F47] text-xs font-mono mt-0.5">Utilisée pour les zones cardiaques</p>
                </div>
              </div>
              <FCMaxInput />
            </div>
          </div>

          {/* Strava connection card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FC4C02]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/30 text-[#FC4C02]">
                  <StravaIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Connexion Strava</h3>
                  <p className="text-[#3A3F47] text-xs font-mono mt-0.5">Compte lié</p>
                </div>
              </div>

              <div className="space-y-2">
                {profile.strava_id ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-charcoal/60 rounded-lg border border-[#3A3F47]/20">
                    <span className="text-[#3A3F47] text-[10px] font-mono uppercase tracking-wider">Strava ID</span>
                    <span className="text-[#FC4C02] font-mono text-sm">#{profile.strava_id}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-charcoal/60 rounded-lg border border-[#3A3F47]/20">
                    <span className="text-[#3A3F47] text-[10px] font-mono uppercase tracking-wider">Statut</span>
                    <span className="text-mist/30 text-xs font-mono">Non connecté</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      <EventModal
        open={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        onSubmit={createEvent}
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
}

function EventRow({ event, past, onDelete, onComplete }: EventRowProps) {
  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${past ? 'border-[#3A3F47]/15 bg-charcoal/20 opacity-60' : 'border-[#3A3F47]/30 bg-charcoal/40 hover:border-[#7B6BC8]/30'}`}>
      <button
        onClick={() => onComplete(event.id, !event.is_completed)}
        className={`flex-shrink-0 w-4 h-4 rounded border transition-colors ${event.is_completed ? 'bg-[#7B6BC8] border-[#7B6BC8]' : 'border-[#3A3F47] hover:border-[#7B6BC8]'}`}
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
          <span className="text-[9px] font-mono text-mist/30">{dateStr}</span>
          {event.distance_km && <span className="text-[9px] font-mono text-mist/30">· {event.distance_km} km</span>}
        </div>
      </div>
      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded flex-shrink-0"
        style={{ backgroundColor: 'rgba(123,107,200,0.15)', color: '#A89BE8', border: '1px solid rgba(123,107,200,0.3)' }}>
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
          className="flex-1 px-3 py-2 bg-charcoal/60 border border-[#3A3F47]/40 rounded-lg text-mist font-mono text-sm focus:border-amber focus:outline-none transition-colors placeholder:text-mist/20"
        />
        <span className="text-[#3A3F47] font-mono text-sm">BPM</span>
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

      <p className="text-[#3A3F47] text-[10px] font-mono leading-relaxed">
        Valeur stockée localement sur votre appareil. Utilisée pour calculer vos zones cardiaques (Z1–Z5).
      </p>
    </div>
  );
}
