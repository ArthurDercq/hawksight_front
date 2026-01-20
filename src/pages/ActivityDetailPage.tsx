import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useActivityDetail, useActivities } from '@/hooks';
import { ActivityMap } from '@/components/maps';
import {
  ElevationChart,
  HeartrateChart,
  PaceChart,
  CadenceChart,
  GradeChart,
  PowerChart,
} from '@/components/charts';
import type { SportType } from '@/types';

// SVG Icons for stats
const DistanceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 9l2-2 4 4 4-4 4 4" />
    <path d="M5 15l2-2 4 4 4-4 4 4" />
  </svg>
);

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PaceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const ElevationIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3l4 8 5-5 2 8" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CadenceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

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

const STAT_ICONS: Record<string, React.ComponentType> = {
  'Distance': DistanceIcon,
  'Duree': ClockIcon,
  'Allure': PaceIcon,
  'Denivele': ElevationIcon,
  'FC moy': HeartIcon,
  'Cadence': CadenceIcon,
};

const STAT_COLORS: Record<string, string> = {
  'Distance': '#E8832A',
  'Duree': '#F2F2F2',
  'Allure': '#6DAA75',
  'Denivele': '#3DB2E0',
  'FC moy': '#E85858',
  'Cadence': '#9477D9',
};

export function ActivityDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const activityId = id ? parseInt(id, 10) : null;
  const { activity, streams, isLoading, error } = useActivityDetail(activityId);
  const { deleteActivity } = useActivities();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    if (activityId) {
      const success = await deleteActivity(activityId);
      if (success) {
        navigate('/activities');
      }
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
  const hasPower = streams.some((s) => s.power !== null && s.power !== undefined);
  const isBike = activity.sport_type === 'Bike';

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
            <h1 className="font-heading text-3xl font-bold text-mist">
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
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-red-500/20"
        >
          <TrashIcon />
          Supprimer
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <StatCard
          label="Distance"
          value={`${(activity.distance_km || activity.distance / 1000 || 0).toFixed(2)} km`}
        />
        <StatCard label="Duree" value={activity.moving_time_hms || '--'} />
        <StatCard
          label="Allure"
          value={activity.speed_minutes_per_km_hms ? `${activity.speed_minutes_per_km_hms} /km` : '--'}
        />
        <StatCard
          label="Denivele"
          value={activity.total_elevation_gain ? `${Math.round(activity.total_elevation_gain)} m` : '--'}
        />
        <StatCard
          label="FC moy"
          value={activity.average_heartrate ? `${Math.round(activity.average_heartrate)} bpm` : '--'}
        />
        <StatCard
          label="Cadence"
          value={activity.average_cadence ? `${Math.round(activity.average_cadence)} spm` : '--'}
        />
      </div>

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

      {/* Charts */}
      {hasStreams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Elevation */}
          <ChartCard title="Profil altimetrique" icon="elevation" color="#3DB2E0">
            <ElevationChart streams={streams} />
          </ChartCard>

          {/* Heart Rate */}
          <ChartCard title="Frequence cardiaque" icon="heart" color="#E85858">
            <HeartrateChart streams={streams} />
          </ChartCard>

          {/* Pace */}
          <ChartCard title="Allure" icon="pace" color="#6DAA75">
            <PaceChart activity={activity} streams={streams} />
          </ChartCard>

          {/* Grade */}
          <ChartCard title="Pente" icon="grade" color="#9477D9">
            <GradeChart streams={streams} />
          </ChartCard>

          {/* Cadence (Bike only) */}
          {isBike && (
            <ChartCard title="Cadence" icon="cadence" color="#E8832A">
              <CadenceChart streams={streams} />
            </ChartCard>
          )}

          {/* Power */}
          {hasPower && (
            <ChartCard title="Puissance" icon="power" color="#7B6BC8">
              <PowerChart streams={streams} />
            </ChartCard>
          )}
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

// Sub-components
interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  const Icon = STAT_ICONS[label];
  const color = STAT_COLORS[label] || '#F2F2F2';

  return (
    <div className="bg-steel/20 rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-lg group">
      <div className="flex items-center justify-center gap-2 mb-2">
        {Icon && (
          <span style={{ color }} className="opacity-70 group-hover:opacity-100 transition-opacity">
            <Icon />
          </span>
        )}
        <p className="text-mist/60 text-xs uppercase tracking-wider">{label}</p>
      </div>
      <p className="font-mono font-semibold text-lg" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

// Chart icons map
const CHART_ICONS: Record<string, React.ReactNode> = {
  elevation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l4 8 5-5 2 8" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  ),
  heart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  pace: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  ),
  grade: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  cadence: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  power: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

interface ChartCardProps {
  title: string;
  icon?: string;
  color?: string;
  children: React.ReactNode;
}

function ChartCard({ title, icon, color = '#3DB2E0', children }: ChartCardProps) {
  return (
    <div className="card-glass rounded-lg p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern pointer-events-none" />
      <div className="flex items-center gap-3 mb-4 relative">
        {icon && (
          <div
            className="p-2 rounded-lg border"
            style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}
          >
            {CHART_ICONS[icon]}
          </div>
        )}
        <h2 className="font-heading text-lg font-semibold text-mist">{title}</h2>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
