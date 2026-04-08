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
import type { ActivityFormData, TrainingEvent } from '@/types';
import { sportColor, sportLabel } from '@/services/utils/constants';
import { formatDateLong } from '@/services/utils/formatters';

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

// Shared style constants (Style A)
const chartCard = {
  background: '#0B0C10',
  border: '1px solid rgba(58,63,71,0.3)',
  borderRadius: '10px',
  padding: '18px',
  position: 'relative' as const,
  overflow: 'hidden' as const,
};

export function ActivityDetailPage() {
  const { id } = useParams();
  const activityId = id ? parseInt(id, 10) : null;
  const { activity, streams, explorationRate, trailStats, race, isLoading, error, refetch } = useActivityDetail(activityId);
  const { updateActivity } = useActivities();
  const posterRef = useRef<HTMLDivElement>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [events, setEvents] = useState<TrainingEvent[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [linkingEvent, setLinkingEvent] = useState(false);
  const [linkedEvent, setLinkedEvent] = useState<{ id: string; name: string; type: string } | null>(null);

  useEffect(() => {
    eventsApi.getEvents().then(setEvents).catch(() => {});
  }, []);

  useEffect(() => {
    setLinkedEvent(race ?? null);
  }, [race]);

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
    } catch (err) {
      console.error('Error exporting PNG:', err);
    }
  };

  const handleLinkEvent = async (eventId: string) => {
    if (!activity) return;
    setLinkingEvent(true);
    try {
      await eventsApi.linkActivity(eventId, activity.id);
      const ev = events.find(e => e.id === eventId);
      if (ev) setLinkedEvent({ id: ev.id, name: ev.name, type: ev.type });
      setShowEventPicker(false);
    } catch (err) {
      console.error('Erreur liaison event:', err);
    } finally {
      setLinkingEvent(false);
    }
  };

  const handleUnlinkEvent = async () => {
    if (!linkedEvent) return;
    setLinkingEvent(true);
    try {
      await eventsApi.unlinkActivity(linkedEvent.id);
      setLinkedEvent(null);
    } finally {
      setLinkingEvent(false);
    }
  };

  const handleSaveEdit = async (data: ActivityFormData): Promise<boolean> => {
    if (!activity) return false;
    const success = await updateActivity(activity.id, data);
    if (success) {
      setShowEditModal(false);
      refetch();
    }
    return success;
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px' }}>
        <Link
          to="/activities"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', marginBottom: '16px' }}
        >
          <ArrowLeftIcon /> Retour aux activités
        </Link>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spinner message="Chargement des détails..." />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px' }}>
        <Link
          to="/activities"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', marginBottom: '16px' }}
        >
          <ArrowLeftIcon /> Retour aux activités
        </Link>
        <div style={{ background: 'rgba(232,66,66,0.1)', border: '1px solid rgba(232,66,66,0.3)', borderRadius: '8px', padding: '24px', textAlign: 'center' }}>
          <p style={{ color: '#E84242', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{error || 'Activité non trouvée'}</p>
        </div>
      </div>
    );
  }

  const activitySportColor = sportColor(activity.sport_type);
  const hasStreams = streams.length > 0;
  const trail = isTrail(activity.sport_type);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Back + Header */}
      <div>
        <Link
          to="/activities"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', textDecoration: 'none', marginBottom: '4px', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(242,242,242,0.6)')}
          onMouseLeave={e => (e.currentTarget.style.color = '#3A3F47')}
        >
          <ArrowLeftIcon /> Retour aux activités
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#F2F2F2', marginBottom: '6px' }}>
              {activity.name || 'Activité sans titre'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {/* Sport badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px',
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px',
                backgroundColor: `${activitySportColor}26`, color: activitySportColor, border: `1px solid ${activitySportColor}59`,
              }}>
                {sportLabel(activity.sport_type)}
              </span>
              {/* Date */}
              <span style={{ fontSize: '11px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>
                {formatDateLong(activity.start_date)}
              </span>
              {/* Event badge */}
              {linkedEvent ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', color: '#3DB2E0', background: 'rgba(61,178,224,0.1)', border: '1px solid rgba(61,178,224,0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                  🏁 {linkedEvent.name}
                  <button
                    onClick={handleUnlinkEvent}
                    disabled={linkingEvent}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3DB2E0', opacity: 0.5, padding: 0, lineHeight: 1 }}
                    title="Délier"
                  >✕</button>
                </span>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowEventPicker(v => !v)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 9px', borderRadius: '20px', fontSize: '10px', color: '#3A3F47', border: '1px solid rgba(58,63,71,0.3)', background: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace', transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(58,63,71,0.6)'; e.currentTarget.style.color = 'rgba(242,242,242,0.6)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(58,63,71,0.3)'; e.currentTarget.style.color = '#3A3F47'; }}
                  >
                    🏁 Lier un événement
                  </button>
                  {showEventPicker && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20, background: '#0B0C10', border: '1px solid rgba(58,63,71,0.4)', borderRadius: '8px', minWidth: '200px', maxHeight: '192px', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
                      {events.length === 0 ? (
                        <p style={{ padding: '8px 12px', fontSize: '11px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>Aucun événement</p>
                      ) : events.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => handleLinkEvent(ev.id)}
                          disabled={linkingEvent}
                          style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: '11px', color: 'rgba(242,242,242,0.7)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(58,63,71,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                          <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>{new Date(ev.date).toLocaleDateString('fr-FR')} · {ev.type}</div>
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', color: 'rgba(242,242,242,0.4)', border: '1px solid rgba(58,63,71,0.35)', background: 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(242,242,242,0.8)'; e.currentTarget.style.borderColor = 'rgba(58,63,71,0.7)'; e.currentTarget.style.background = 'rgba(58,63,71,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,242,0.4)'; e.currentTarget.style.borderColor = 'rgba(58,63,71,0.35)'; e.currentTarget.style.background = 'transparent'; }}
          >
            <EditIcon /> Modifier
          </button>
        </div>
      </div>

      {/* ROW 1 : Poster + Trail Stats */}
      {hasStreams && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {explorationRate && (
                <ExplorationCard explorationRate={explorationRate} sportColor={activitySportColor} />
              )}
              <HRZonesChart activity={activity} streams={streams} />
            </div>
          )}
        </div>
      )}

      {/* Section separator — Analyses détaillées */}
      {hasStreams && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', paddingTop: '20px', borderTop: '1px solid rgba(61,178,224,0.2)', marginTop: '4px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-1px', left: 0, width: '100px', height: '1px', background: 'linear-gradient(90deg, #3DB2E0, transparent)' }} />
          <div style={{ position: 'relative', padding: '7px', background: 'rgba(61,178,224,0.1)', border: '1px solid rgba(61,178,224,0.3)', borderRadius: '7px', color: '#3DB2E0', flexShrink: 0 }}>
            <AnalyticsIcon />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#F2F2F2' }}>Analyses détaillées</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '5px' }}>
              <div style={{ width: '64px', height: '1px', background: 'linear-gradient(90deg, #3DB2E0, transparent)' }} />
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3DB2E0' }} />
            </div>
          </div>
        </div>
      )}

      {/* ROW 2 : Elevation + Pace */}
      {hasStreams && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Elevation profile */}
          <div style={{ ...chartCard }}>
            <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(61,178,224,0.4)' }} />
            <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(61,178,224,0.3)' }} />
            <ElevationProfileChart streams={streams} sportType={activity.sport_type} totalElevationGain={activity.total_elevation_gain} />
          </div>
          {/* Pace profile */}
          <div style={{ ...chartCard }}>
            <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(232,131,42,0.4)' }} />
            <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(232,131,42,0.3)' }} />
            <PaceProfileChart activity={activity} streams={streams} />
          </div>
        </div>
      )}

      {/* ROW 3 : HR Profile + HR Zones + Exploration (trail only) */}
      {hasStreams && activity.has_heartrate && (
        <div style={{ display: 'grid', gridTemplateColumns: trail && explorationRate ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {/* HR Profile */}
          <div style={{ ...chartCard }}>
            <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(109,170,117,0.4)' }} />
            <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(109,170,117,0.3)' }} />
            <HeartRateProfileChart activity={activity} streams={streams} />
          </div>
          {/* HR Zones */}
          <div style={{ ...chartCard }}>
            <span className="hw-br hw-br-tl" style={{ borderColor: 'rgba(61,178,224,0.4)' }} />
            <span className="hw-br hw-br-br" style={{ borderColor: 'rgba(61,178,224,0.3)' }} />
            <HRZonesChart activity={activity} streams={streams} />
          </div>
          {/* Exploration (trail only) */}
          {trail && explorationRate && (
            <ExplorationCard explorationRate={explorationRate} sportColor={activitySportColor} />
          )}
        </div>
      )}

      {/* No streams fallback */}
      {!hasStreams && (
        <div style={{ ...chartCard, padding: '48px', textAlign: 'center' }}>
          <p style={{ color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>Pas de données de streams pour cette activité</p>
        </div>
      )}

      {/* Edit modal */}
      {showEditModal && (
        <ActivityModal
          activity={activity}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

// Exploration card — standalone component used in row 1 (non-trail) and row 3 (trail)
function ExplorationCard({ explorationRate, sportColor }: {
  explorationRate: { exploration_rate: number | null; new_cells: number; total_cells: number };
  sportColor: string;
}) {
  return (
    <div style={{
      background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '10px', padding: '18px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(58,63,71,0.25)', marginBottom: '14px' }}>
        <div style={{ padding: '8px', background: 'rgba(61,178,224,0.1)', border: '1px solid rgba(61,178,224,0.3)', borderRadius: '7px', color: '#3DB2E0', flexShrink: 0 }}>
          <ExplorationIcon />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F2F2F2' }}>Exploration</div>
          <div style={{ fontSize: '10px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>Territoire découvert</div>
        </div>
      </div>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '8px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Taux</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: sportColor, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {explorationRate.exploration_rate != null ? `${Math.round(explorationRate.exploration_rate)}%` : '--'}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(242,242,242,0.3)', marginTop: '1px' }}>nouveau territoire</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Conquis</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F2F2F2', fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {explorationRate.new_cells}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(242,242,242,0.3)', marginTop: '1px' }}>nouvelles zones</div>
        </div>
        <div>
          <div style={{ fontSize: '8px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', marginBottom: '2px' }}>Surface</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#F2F2F2', fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {(explorationRate.total_cells * 0.737).toFixed(1)}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(242,242,242,0.3)', marginTop: '1px' }}>km² couverts</div>
        </div>
      </div>
    </div>
  );
}
