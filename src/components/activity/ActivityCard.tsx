import { Link } from 'react-router-dom';
import type { Activity } from '@/types';
import { SPORT_COLORS } from '@/services/utils/constants';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const sportStyle = SPORT_COLORS[activity.sport_type] || SPORT_COLORS.Run;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDistance = (distance: number) => {
    const km = distance / 1000;
    return `${km.toFixed(1)} km`;
  };

  return (
    <div className="bg-charcoal-light border border-steel/30 rounded-lg p-4 hover:border-steel/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link
            to={`/activity/${activity.id}`}
            className="font-heading font-semibold text-mist hover:text-amber transition-colors truncate block"
          >
            {activity.name}
          </Link>
          <p className="text-sm text-mist/60">{formatDate(activity.start_date)}</p>
        </div>
        <span
          className="px-2 py-1 text-xs font-medium rounded ml-2 shrink-0"
          style={{ backgroundColor: sportStyle.bg, color: sportStyle.color }}
        >
          {sportStyle.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        <div>
          <p className="text-xs text-mist/50">Distance</p>
          <p className="font-mono text-sm text-amber">
            {activity.distance_km
              ? `${activity.distance_km.toFixed(1)} km`
              : formatDistance(activity.distance)}
          </p>
        </div>
        <div>
          <p className="text-xs text-mist/50">Duree</p>
          <p className="font-mono text-sm text-mist">
            {activity.moving_time_hms || `${Math.round(activity.moving_time / 60)} min`}
          </p>
        </div>
        {activity.total_elevation_gain !== undefined && activity.total_elevation_gain > 0 && (
          <div>
            <p className="text-xs text-mist/50">D+</p>
            <p className="font-mono text-sm text-glacier">
              {Math.round(activity.total_elevation_gain)} m
            </p>
          </div>
        )}
        {activity.speed_minutes_per_km_hms && (
          <div>
            <p className="text-xs text-mist/50">Allure</p>
            <p className="font-mono text-sm text-moss">{activity.speed_minutes_per_km_hms}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-steel/20">
        <Link
          to={`/activity/${activity.id}`}
          className="text-sm text-mist/60 hover:text-amber transition-colors"
        >
          Voir details →
        </Link>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(activity)}
                className="px-2 py-1 text-xs text-mist/60 hover:text-mist hover:bg-steel/30 rounded transition-colors"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity)}
                className="px-2 py-1 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
