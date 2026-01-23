import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { useActivityDetail, useActivities } from '@/hooks';
import { ActivityMap } from '@/components/maps';
import { ActivityPoster } from '@/components/activity';
import {
  HRZonesChart,
  PaceProfileChart,
  ElevationProfileChart,
} from '@/components/charts';
import type { SportType } from '@/types';

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
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

export function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activityId = id ? parseInt(id, 10) : null;
  const { activity, streams, isLoading, error } = useActivityDetail(activityId);
  const { deleteActivity } = useActivities();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  const handleDelete = async () => {
    if (activityId) {
      const success = await deleteActivity(activityId);
      if (success) {
        navigate('/activities');
      }
    }
  };

  const handleExportPNG = async () => {
    if (!posterRef.current || !activity) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#0B0C10',
        scale: 3,
      });

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleDateString('fr-FR', { month: 'long' })} ${date.getFullYear()} a ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <Link
          to="/activities"
          className="inline-flex items-center gap-2 text-mist/60 hover:text-amber mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform"><ArrowLeftIcon /></span>
          Retour aux activites
        </Link>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">Chargement des details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <Link
          to="/activities"
          className="inline-flex items-center gap-2 text-mist/60 hover:text-amber mb-6 transition-colors group"
        >
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

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Back link */}
      <Link
        to="/activities"
        className="inline-flex items-center gap-2 text-mist/60 hover:text-amber mb-6 transition-colors group"
      >
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
              style={{
                backgroundColor: `${sportColor}22`,
                color: sportColor,
                border: `1px solid ${sportColor}40`,
              }}
            >
              {SPORT_LABELS[activity.sport_type] || activity.sport_type}
            </span>
          </div>
          <p className="text-steel text-sm font-mono">{formatDate(activity.start_date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPNG}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber/15 hover:bg-amber/25 text-amber rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber/20"
          >
            <DownloadIcon />
            Exporter PNG
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20"
          >
            <TrashIcon />
            Supprimer
          </button>
        </div>
      </div>

      {/* Main content: Poster left, HR Zones right (same height) */}
      {hasStreams && (
        <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-center items-start">
          {/* Left: Poster */}
          <ActivityPoster activity={activity} streams={streams} posterRef={posterRef} />

          {/* Right: HR Zones */}
          <div className="w-full lg:w-[555px]">
            <HRZonesChart activity={activity} streams={streams} />
          </div>
        </div>
      )}

      {/* Second row: Elevation and Pace Profile side by side */}
      {hasStreams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Elevation */}
          <ElevationProfileChart
            streams={streams}
            sportType={activity.sport_type}
            totalElevationGain={activity.total_elevation_gain}
          />

          {/* Right: Pace Profile */}
          <PaceProfileChart activity={activity} streams={streams} />
        </div>
      )}

      {/* Map */}
      {hasStreams && (
        <div className="card-glass rounded-lg p-6 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="flex items-center gap-3 mb-4 relative">
            <div className="p-2 rounded-lg bg-glacier/10 border border-glacier/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h2 className="font-heading text-lg font-semibold text-mist">Parcours</h2>
          </div>
          <ActivityMap streams={streams} className="h-[400px] rounded-lg overflow-hidden relative" />
        </div>
      )}

      {!hasStreams && (
        <div className="card-glass rounded-lg p-12 text-center">
          <p className="text-mist/60">Pas de donnees de streams pour cette activite</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-glass rounded-lg p-6 max-w-md w-full relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
                  <TrashIcon />
                </div>
                <h3 className="font-heading text-lg font-semibold text-mist">
                  Confirmer la suppression
                </h3>
              </div>
              <p className="text-mist/70 mb-6">
                Etes-vous sur de vouloir supprimer l'activite "{activity.name}" ? Cette action est
                irreversible.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-steel/30 hover:bg-steel/50 text-mist rounded-lg transition-all hover:-translate-y-0.5"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/30"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
