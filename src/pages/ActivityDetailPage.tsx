import { useParams, Link } from 'react-router-dom';
import { useRef } from 'react';
import { useActivityDetail } from '@/hooks';
import { ActivityPoster } from '@/components/activity';
import {
  HRZonesChart,
  PaceProfileChart,
  ElevationProfileChart,
  HeartRateProfileChart,
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

      {/* Main content: Poster left, Exploration + HR Zones right */}
      {hasStreams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ActivityPoster activity={activity} streams={streams} posterRef={posterRef} explorationRate={explorationRate} onExportPNG={handleExportPNG} />
          <div className="flex flex-col gap-6">
            {/* Exploration card */}
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
                      <span className="font-heading text-2xl text-[#F2F2F2]">
                        {(explorationRate.total_cells * 0.737).toFixed(1)}
                      </span>
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

      {/* Second row: Elevation + HR (left col) and Pace Profile (right col) */}
      {hasStreams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left column: Elevation on top, HR below */}
          <div className="flex flex-col gap-6">
            <ElevationProfileChart
              streams={streams}
              sportType={activity.sport_type}
              totalElevationGain={activity.total_elevation_gain}
            />
            {activity.has_heartrate && (
              <HeartRateProfileChart activity={activity} streams={streams} />
            )}
          </div>
          {/* Right column: Pace Profile */}
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
