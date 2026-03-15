import { useParams, Link } from 'react-router-dom';
import { useRef } from 'react';
import { useActivityDetail } from '@/hooks';
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
  const activityId = id ? parseInt(id, 10) : null;
  const { activity, streams, explorationRate, isLoading, error } = useActivityDetail(activityId);
  const posterRef = useRef<HTMLDivElement>(null);

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
      </div>

      {/* Main content: Poster left, HR Zones right (same height) */}
      {hasStreams && (
        <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-center items-start">
          {/* Left: Poster */}
          <ActivityPoster activity={activity} streams={streams} posterRef={posterRef} explorationRate={explorationRate} onExportPNG={handleExportPNG} />

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

      {!hasStreams && (
        <div className="card-glass rounded-lg p-12 text-center">
          <p className="text-mist/60">Pas de donnees de streams pour cette activite</p>
        </div>
      )}

    </div>
  );
}
