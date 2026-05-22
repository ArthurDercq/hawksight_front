import { Link } from 'react-router-dom';
import type { Activity } from '@/types';
import { sportBarColor, SPORT_COLORS } from '@/services/utils/constants';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const sportStyle = SPORT_COLORS[activity.sport_type] || SPORT_COLORS.Run;
  const barColor = sportBarColor(activity.sport_type);
  const isBike = activity.sport_type === 'Bike';
  const isWeightTraining = activity.sport_type === 'WeightTraining';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="hw-card-dark group hover:border-steel/60 transition-colors">
      {/* Corner brackets */}
      <span className="hw-br hw-br-tl" style={{ borderColor: `${barColor}66` }} />
      <span className="hw-br hw-br-br" style={{ borderColor: `${barColor}44` }} />

      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        {/* Sport bar */}
        <div className="w-[3px] h-9 rounded-sm shrink-0 mt-0.5" style={{ background: barColor }} />
        <div className="flex-1 min-w-0">
          <Link
            to={`/activity/${activity.id}`}
            className="block text-sm font-semibold text-mist truncate no-underline hover:text-amber transition-colors"
          >
            {activity.name}
          </Link>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="hw-text-label text-steel">
              {sportStyle.label} · {formatDate(activity.start_date)}
            </span>
            {activity.race && (
              <span className="hw-event-badge">
                🏁 {activity.race.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2.5 mb-3">
        {!isWeightTraining && (
          <div>
            <p className="hw-text-label text-mist/30 mb-0.5">Distance</p>
            <p className="text-sm font-bold font-mono tabular-nums text-amber">
              {(activity.distance_km || activity.distance || 0).toFixed(1)}
              <span className="hw-text-label text-amber/50 ml-0.5">km</span>
            </p>
          </div>
        )}
        <div>
          <p className="hw-text-label text-mist/30 mb-0.5">Durée</p>
          <p className="text-sm font-bold font-mono tabular-nums text-mist">
            {activity.moving_time_hms || `${Math.round(activity.moving_time / 60)} min`}
          </p>
        </div>
        {!isWeightTraining && activity.total_elevation_gain !== undefined && activity.total_elevation_gain > 0 && (
          <div>
            <p className="hw-text-label text-mist/30 mb-0.5">D+</p>
            <p className="text-sm font-bold font-mono tabular-nums text-glacier">
              {Math.round(activity.total_elevation_gain)}
              <span className="hw-text-label text-glacier/50 ml-0.5">m</span>
            </p>
          </div>
        )}
        {!isWeightTraining && activity.speed_minutes_per_km_hms && (
          <div>
            <p className="hw-text-label text-mist/30 mb-0.5">{isBike ? 'Vitesse' : 'Allure'}</p>
            <p className="text-sm font-bold font-mono tabular-nums text-moss">
              {isBike ? `${activity.average_speed?.toFixed(1) || '--'}` : activity.speed_minutes_per_km_hms}
              <span className="hw-text-label text-moss/50 ml-0.5">{isBike ? 'km/h' : '/km'}</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2.5 border-t border-steel/20">
        <Link to={`/activity/${activity.id}`} className="hw-link">
          Voir détails →
        </Link>
        {(onEdit || onDelete) && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(activity)}
                className="hw-text-label text-mist/30 bg-transparent border-none cursor-pointer hover:text-mist/70 transition-colors"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity)}
                className="hw-text-label text-red-400/40 bg-transparent border-none cursor-pointer hover:text-red-400/80 transition-colors"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
