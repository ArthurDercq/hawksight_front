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
import type { SportType, ActivityFormData, TrainingEvent } from '@/types';

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const SPORT_COLORS: Record<SportType, string> = {
  Run: '#E8832A',
  Trail: '#E8832A',
  Bike: '#3DB2E0',
  Swim: '#6DAA75',
  Hike: '#6DAA75',
  WeightTraining: '#3A3F47',
};

const SPORT_LABELS: Record<SportType, string> = {
  Run: 'Course',
  Trail: 'Trail',
  Bike: 'Velo',
  Swim: 'Natation',
  Hike: 'Randonnee',
  WeightTraining: 'Musculation',
};

const isTrail = (sport: SportType) => sport === 'Trail';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'long' })} ${date.getFullYear()} a ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/activities" className="inline-flex items-center gap-2 text-mist/60 hover:text-amber mb-6 transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform"><ArrowLeftIcon /></span>
          Retour aux activites
        </Link>
        <div className="flex items-center justify-center py-12">
          <Spinner message="Chargement des details..." />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/activities" className="inline-flex items-center gap-2 text-mist/60 hover:text-amber mb-6 transition-colors group">
          <span className="group-hover:-translate-x-1 transition-transform"><ArrowLeftIcon /></span>
          Retour aux activites
        </Link>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error || 'Activite non trouvee'}</p>
        </div>
      </div>
    );
  }

  const sportColor = SPORT_COLORS[activity.sport_type] || '#E8832A';
  const hasStreams = streams.length > 0;
  const trail = isTrail(activity.sport_type);

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Back link */}
      <Link to="/activities" className="inline-flex items-center gap-2 text-mist/60 hover:text-amber mb-6 transition-colors group">
        <span className="group-hover:-translate-x-1 transition-transform"><ArrowLeftIcon /></span>
        Retour aux activites
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-mist">
              {activity.name || 'Activite sans titre'}
            </h1>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium tracking-wide uppercase"
              style={{ backgroundColor: `${sportColor}22`, color: sportColor, border: `1px solid ${sportColor}40` }}
            >
              {SPORT_LABELS[activity.sport_type] || activity.sport_type}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-steel text-sm font-mono">{formatDate(activity.start_date)}</p>
            {linkedEvent ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-['JetBrains_Mono'] bg-[#3DB2E0]/10 text-[#3DB2E0] border border-[#3DB2E0]/30">
                🏁 {linkedEvent.name}
                <button onClick={handleUnlinkEvent} disabled={linkingEvent} className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity" title="Délier">✕</button>
              </span>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowEventPicker(v => !v)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-['JetBrains_Mono'] text-[#3A3F47] border border-[#3A3F47]/30 hover:border-[#3A3F47]/60 hover:text-mist/60 transition-all"
                >
                  🏁 Lier un événement
                </button>
                {showEventPicker && (
                  <div className="absolute top-full left-0 mt-1 z-20 bg-[#0B0C10] border border-[#3A3F47]/40 rounded-lg shadow-xl min-w-[200px] max-h-48 overflow-y-auto">
                    {events.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-[#3A3F47] font-['JetBrains_Mono']">Aucun événement</p>
                    ) : events.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => handleLinkEvent(ev.id)}
                        disabled={linkingEvent}
                        className="w-full text-left px-3 py-2 text-xs text-mist/70 hover:bg-steel/20 hover:text-mist transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="font-medium truncate">{ev.name}</div>
                        <div className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px] mt-0.5">{new Date(ev.date).toLocaleDateString('fr-FR')} · {ev.type}</div>
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
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-mist/50 hover:text-mist border border-[#3A3F47]/30 hover:border-[#3A3F47]/60 rounded-lg transition-all hover:bg-steel/10 self-start"
        >
          <EditIcon />
          Modifier
        </button>
      </div>

      {/* Row 1: Poster + (Exploration + HR Zones) */}
      {hasStreams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ActivityPoster activity={activity} streams={streams} posterRef={posterRef} explorationRate={explorationRate} onExportPNG={handleExportPNG} race={linkedEvent} />
          <div className="flex flex-col gap-6">
            {trail && trailStats && (
              <TrailStatsCard trailStats={trailStats} sportColor={sportColor} />
            )}
            {explorationRate && (
              <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3DB2E0]/5 rounded-full blur-3xl" />
                <div className="relative">
                  <div className="flex items-start gap-3 pb-4 border-b border-[#3A3F47]/30 mb-6">
                    <div className="p-2 border rounded" style={{ backgroundColor: `${sportColor}10`, borderColor: `${sportColor}30` }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sportColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2" /><line x1="2" y1="12" x2="22" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-heading text-[#F2F2F2]">Exploration</h3>
                      <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">Territoire découvert lors de cette activité</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider">Taux</span>
                      <span className="font-heading text-2xl" style={{ color: sportColor }}>
                        {explorationRate.exploration_rate != null ? `${Math.round(explorationRate.exploration_rate)}%` : "--"}
                      </span>
                      <span className="text-[#3A3F47] font-['Inter'] text-xs">de nouveau territoire</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider">Conquis</span>
                      <span className="font-heading text-2xl text-[#F2F2F2]">{explorationRate.new_cells}</span>
                      <span className="text-[#3A3F47] font-['Inter'] text-xs">nouvelles zones</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px] uppercase tracking-wider">Surface</span>
                      <span className="font-heading text-2xl text-[#F2F2F2]">{(explorationRate.total_cells * 0.737).toFixed(1)}</span>
                      <span className="text-[#3A3F47] font-['Inter'] text-xs">km² couverts</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <HRZonesChart activity={activity} streams={streams} />
          </div>
        </div>
      )}

      {/* Row 2: Charts */}
      {hasStreams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="flex flex-col gap-6">
            <ElevationProfileChart streams={streams} sportType={activity.sport_type} totalElevationGain={activity.total_elevation_gain} />
            {activity.has_heartrate && <HeartRateProfileChart activity={activity} streams={streams} />}
          </div>
          <PaceProfileChart activity={activity} streams={streams} />
        </div>
      )}

      {!hasStreams && (
        <div className="card-glass rounded-lg p-12 text-center">
          <p className="text-mist/60">Pas de donnees de streams pour cette activite</p>
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
