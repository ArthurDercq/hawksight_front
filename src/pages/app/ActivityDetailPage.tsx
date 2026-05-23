import { useParams, Link } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useActivityDetail } from '@/hooks';
import { useActivities } from '@/hooks';
import { Spinner } from '@/components/ui/Spinner';
import { ActivityPoster, ActivityModal, TrailStatsCard } from '@/components/activity';
import {
  HRZonesChart,
  PaceProfileChart,
  ElevationProfileChart,
  HeartRateProfileChart,
} from '@/components/charts';
import { eventsApi } from '@/services/api';
import type { ActivityFormData, TrainingEvent, ActivityRecord } from '@/types';
import { sportColor, sportLabel } from '@/services/utils/constants';
import { formatDateLong } from '@/services/utils/formatters';

// ── Icons ─────────────────────────────────────────────────────────────────────
const ArrowLeftIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const AnalyticsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const ExplorationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2" /><line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const isTrail = (sport: string) => sport === 'Trail';

// ── Records card ─────────────────────────────────────────────────────────────
const RECORD_LABELS: Record<string, string> = {
  '5k': '5 km', '10k': '10 km', 'semi': 'Semi', '30k': '30 km',
  'marathon': 'Marathon', '50k': '50 km', '75k': '75 km', 'longest': 'Plus longue',
  'climb_5min': 'D+ 5min', 'climb_30min': 'D+ 30min', 'climb_60min': 'D+ 60min',
  'descent_5min': 'D- 5min', 'descent_30min': 'D- 30min',
  'kv_1000m': 'KV 1000m', 'longest_climb': 'Montée continue',
  'max_dplus_activity': 'Max D+', 'best_dplus_ratio': 'Meilleur ratio D+', 'best_week_dplus': 'Meilleure semaine D+',
};

const TrophyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2" />
    <rect x="6" y="18" width="12" height="4" />
  </svg>
);

function RecordsCard({ records }: { records: ActivityRecord[] }) {
  return (
    <div className="hw-card-dark-lg mb-8">
      <div className="flex items-center gap-3 pb-3 border-b border-steel/25 mb-4">
        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 shrink-0">
          <TrophyIcon />
        </div>
        <div>
          <div className="text-sm font-semibold text-mist">Records personnels</div>
          <div className="hw-text-caption text-steel mt-0.5">{records.length} record{records.length > 1 ? 's' : ''} détenu{records.length > 1 ? 's' : ''} sur cette activité</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {records.map(r => (
          <div key={r.id} className="bg-steel/10 border border-steel/20 rounded-lg px-3 py-2.5">
            <div className="hw-text-label text-steel mb-1">
              {RECORD_LABELS[r.distance_key] ?? r.distance_key}
            </div>
            <div className="text-base font-bold font-mono tabular-nums text-amber-400">
              {r.time_formatted ?? r.value_formatted ?? r.value}
            </div>
            {r.pace_formatted && (
              <div className="hw-text-caption text-steel mt-0.5">{r.pace_formatted} /km</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Shared chart card className
const chartCard = 'hw-card-dark-lg';

// ── Back link — used in loading/error states ──────────────────────────────────
function BackLink() {
  return (
    <Link to="/activities" className="inline-flex items-center gap-1.5 hw-text-data text-steel no-underline mb-4 hover:text-mist/60 transition-colors">
      <ArrowLeftIcon /> Retour aux activités
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ActivityDetailPage() {
  const { id } = useParams();
  const activityId = id ? parseInt(id, 10) : null;
  const { activity, streams, explorationRate, trailStats, race, records, isLoading, error, refetch } = useActivityDetail(activityId);
  const { updateActivity } = useActivities();
  const posterRef = useRef<HTMLDivElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [linkingEvent, setLinkingEvent] = useState(false);
  const [linkedEvent, setLinkedEvent] = useState<{ id: string; name: string; type: string } | null>(null);

  useEffect(() => { eventsApi.getEvents().then(setEvents).catch(() => {}); }, []);
  useEffect(() => { setLinkedEvent(race ?? null); }, [race]);

  const handleExportPNG = async () => {
    if (!posterRef.current || !activity) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, { backgroundColor: '#0B0C10', scale: 3 });
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hawksight-${activity.name?.toLowerCase().replace(/\s+/g, '-') || 'activity'}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (err) { console.error('Error exporting PNG:', err); }
  };

  const handleLinkEvent = async (eventId: string) => {
    if (!activity) return;
    setLinkingEvent(true);
    try {
      await eventsApi.linkActivity(eventId, activity.id);
      const ev = events.find(e => e.id === eventId);
      if (ev) setLinkedEvent({ id: ev.id, name: ev.name, type: ev.type });
      setShowEventPicker(false);
    } catch (err) { console.error('Erreur liaison event:', err); }
    finally { setLinkingEvent(false); }
  };

  const handleUnlinkEvent = async () => {
    if (!linkedEvent) return;
    setLinkingEvent(true);
    try { await eventsApi.unlinkActivity(linkedEvent.id); setLinkedEvent(null); }
    finally { setLinkingEvent(false); }
  };

  const handleSaveEdit = async (data: ActivityFormData): Promise<boolean> => {
    if (!activity) return false;
    const success = await updateActivity(activity.id, data);
    if (success) { setShowEditModal(false); refetch(); }
    return success;
  };

  // ── Loading / Error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <BackLink />
        <div className="flex justify-center py-12"><Spinner message="Chargement des détails..." /></div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-[1280px] mx-auto">
        <BackLink />
        <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="hw-text-data text-steel/85 uppercase tracking-wider">{error || 'Activité non trouvée'}</p>
        </div>
      </div>
    );
  }

  const activitySportColor = sportColor(activity.sport_type);
  const hasStreams = streams.length > 0;
  const trail = isTrail(activity.sport_type);

  return (
    <div className="max-w-[1280px] mx-auto flex flex-col gap-5">

      {/* ── Back + Header ── */}
      <div>
        <BackLink />
        <div className="flex items-start justify-between">
          <div>
            <div className="hw-page-title mb-1.5">{activity.name || 'Activité sans titre'}</div>
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Sport badge */}
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full hw-text-caption font-semibold uppercase tracking-wider"
                style={{ backgroundColor: `${activitySportColor}26`, color: activitySportColor, border: `1px solid ${activitySportColor}59` }}
              >
                {sportLabel(activity.sport_type)}
              </span>
              {/* Date */}
              <span className="hw-text-data text-steel">{formatDateLong(activity.start_date)}</span>
              {/* Event */}
              {linkedEvent ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full hw-text-caption text-glacier bg-glacier/10 border border-glacier/30">
                  🏁 {linkedEvent.name}
                  <button
                    onClick={handleUnlinkEvent}
                    disabled={linkingEvent}
                    className="bg-transparent border-none cursor-pointer text-glacier/50 hover:text-glacier/90 p-0 leading-none transition-colors"
                    title="Délier"
                  >✕</button>
                </span>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowEventPicker(v => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full hw-text-caption text-steel border border-steel/30 bg-transparent cursor-pointer hover:border-steel/60 hover:text-mist/60 transition-colors"
                  >
                    🏁 Lier un événement
                  </button>
                  {showEventPicker && (
                    <div className="absolute top-full left-0 mt-1 z-20 bg-charcoal border border-steel/40 rounded-lg min-w-[200px] max-h-48 overflow-y-auto shadow-2xl">
                      {events.length === 0 ? (
                        <p className="px-3 py-2 hw-text-data text-steel">Aucun événement</p>
                      ) : events.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => handleLinkEvent(ev.id)}
                          disabled={linkingEvent}
                          className="w-full text-left px-3 py-2 hw-text-data text-mist/70 bg-transparent border-none cursor-pointer hover:bg-steel/20 transition-colors"
                        >
                          <div className="font-medium truncate">{ev.name}</div>
                          <div className="hw-text-caption text-steel mt-0.5">{new Date(ev.date).toLocaleDateString('fr-FR')} · {ev.type}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Edit button */}
          <button
            onClick={() => setShowEditModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md hw-text-data text-mist/40 border border-steel/35 bg-transparent cursor-pointer hover:text-mist/80 hover:border-steel/70 hover:bg-steel/10 transition-all"
          >
            <EditIcon /> Modifier
          </button>
        </div>
      </div>

      {/* ── Row 1 : Poster + Trail Stats / Exploration + HR Zones ── */}
      {hasStreams && (
        <div className="grid grid-cols-2 gap-4">
          <ActivityPoster
            activity={activity}
            streams={streams}
            posterRef={posterRef}
            explorationRate={explorationRate}
            onExportPNG={handleExportPNG}
            race={linkedEvent}
          />
          {trail && trailStats ? (
            <TrailStatsCard trailStats={trailStats} sportColor={activitySportColor} />
          ) : (
            <div className="flex flex-col gap-4">
              {explorationRate && (
                <ExplorationCard explorationRate={explorationRate} sportColor={activitySportColor} />
              )}
              <div className={chartCard}>
                <HRZonesChart activity={activity} streams={streams} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section separator — Analyses détaillées ── */}
      {hasStreams && (
        <div className="hw-section-sep flex items-start gap-3.5 mt-1">
          <div className="absolute top-0 left-0 w-24 h-px bg-gradient-to-r from-glacier to-transparent" />
          <div className="relative p-1.5 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
            <AnalyticsIcon />
          </div>
          <div>
            <div className="font-mono text-[15px] font-semibold text-mist">Analyses détaillées</div>
            <div className="flex items-center gap-1 mt-1.5">
              <div className="w-16 h-px bg-gradient-to-r from-glacier to-transparent" />
              <div className="w-1 h-1 rounded-full bg-glacier" />
            </div>
          </div>
        </div>
      )}

      {/* ── Row 2 : Elevation + Pace ── */}
      {hasStreams && (
        <div className="grid grid-cols-2 gap-4">
          <div className={chartCard}>
            <span className="hw-br hw-br-tl hw-br-glacier" />
            <span className="hw-br hw-br-br hw-br-glacier-dim" />
            <ElevationProfileChart streams={streams} sportType={activity.sport_type} totalElevationGain={activity.total_elevation_gain} />
          </div>
          <div className={chartCard}>
            <span className="hw-br hw-br-tl hw-br-amber" />
            <span className="hw-br hw-br-br hw-br-amber-dark" />
            <PaceProfileChart activity={activity} streams={streams} />
          </div>
        </div>
      )}

      {/* ── Row 3 : HR Profile + HR Zones + Exploration (trail) ── */}
      {hasStreams && activity.has_heartrate && (
        <div
          className={`grid gap-4 mb-8 ${trail && explorationRate ? 'grid-cols-3' : 'grid-cols-2'}`}
        >
          <div className={chartCard}>
            <span className="hw-br hw-br-tl hw-br-moss" />
            <span className="hw-br hw-br-br hw-br-moss" />
            <HeartRateProfileChart activity={activity} streams={streams} />
          </div>
          <div className={chartCard}>
            <span className="hw-br hw-br-tl hw-br-glacier" />
            <span className="hw-br hw-br-br hw-br-glacier-dim" />
            <HRZonesChart activity={activity} streams={streams} />
          </div>
          {trail && explorationRate && (
            <ExplorationCard explorationRate={explorationRate} sportColor={activitySportColor} />
          )}
        </div>
      )}

      {/* ── No streams fallback ── */}
      {!hasStreams && (
        <div className="hw-card-dark-lg p-12 text-center">
          <p className="font-mono text-xs text-steel">Pas de données de streams pour cette activité</p>
        </div>
      )}

      {/* ── Records ── */}
      {records.length > 0 && <RecordsCard records={records} />}

      {showEditModal && (
        <ActivityModal activity={activity} onClose={() => setShowEditModal(false)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}

// ── Exploration card ──────────────────────────────────────────────────────────
function ExplorationCard({ explorationRate, sportColor }: {
  explorationRate: { exploration_rate: number | null; new_cells: number; total_cells: number };
  sportColor: string;
}) {
  return (
    <div className="hw-card-dark-lg">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
          <ExplorationIcon />
        </div>
        <div>
          <div className="text-sm font-semibold text-mist">Exploration</div>
          <div className="hw-text-caption text-steel mt-0.5">Territoire découvert</div>
        </div>
      </div>
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Taux', value: explorationRate.exploration_rate != null ? `${Math.round(explorationRate.exploration_rate)}%` : '--', sub: 'nouveau territoire', color: sportColor },
          { label: 'Conquis', value: `${explorationRate.new_cells}`, sub: 'nouvelles zones', color: '#F2F2F2' },
          { label: 'Surface', value: `${(explorationRate.total_cells * 0.737).toFixed(1)}`, sub: 'km² couverts', color: '#F2F2F2' },
        ].map(({ label, value, sub, color }) => (
          <div key={label}>
            <div className="hw-text-label text-steel mb-0.5">{label}</div>
            <div className="text-2xl font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
            <div className="hw-text-caption text-mist/30 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
