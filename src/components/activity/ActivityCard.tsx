import { Link } from 'react-router-dom';
import type { Activity } from '@/types';
import { SPORT_COLORS } from '@/services/utils/constants';

interface ActivityCardProps {
  activity: Activity;
  onEdit?: (activity: Activity) => void;
  onDelete?: (activity: Activity) => void;
}

const SPORT_BAR_COLORS: Record<string, string> = {
  Run: '#3DB2E0',
  Trail: '#C96A1A',
  Bike: '#7B6BC8',
  Swim: '#8B92A0',
  WeightTraining: '#9ca3af',
  Hike: '#5A5F6C',
};

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const sportStyle = SPORT_COLORS[activity.sport_type] || SPORT_COLORS.Run;
  const barColor = SPORT_BAR_COLORS[activity.sport_type] || '#3DB2E0';
  const isBike = activity.sport_type === 'Bike';
  const isWeightTraining = activity.sport_type === 'WeightTraining';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div
      style={{
        background: '#0B0C10',
        border: '1px solid rgba(58,63,71,0.3)',
        borderRadius: '8px',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(58,63,71,0.6)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(58,63,71,0.3)')}
    >
      {/* Corner brackets TL amber, BR sport color */}
      <span className="hw-br hw-br-tl" style={{ borderColor: `${barColor}66` }} />
      <span className="hw-br hw-br-br" style={{ borderColor: `${barColor}44` }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
        {/* Sport bar */}
        <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: barColor, flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            to={`/activity/${activity.id}`}
            style={{ fontSize: '13px', fontWeight: 600, color: '#F2F2F2', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E8832A')}
            onMouseLeave={e => (e.currentTarget.style.color = '#F2F2F2')}
          >
            {activity.name}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {sportStyle.label} · {formatDate(activity.start_date)}
            </span>
            {activity.race && (
              <span style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(123,107,200,0.15)', color: '#A89BE8', border: '1px solid rgba(123,107,200,0.3)' }}>
                🏁 {activity.race.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '12px' }}>
        {!isWeightTraining && (
          <div>
            <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>Distance</p>
            <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#E8832A' }}>
              {(activity.distance_km || activity.distance || 0).toFixed(1)}<span style={{ fontSize: '9px', color: 'rgba(232,131,42,0.5)', marginLeft: '2px' }}>km</span>
            </p>
          </div>
        )}
        <div>
          <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>Durée</p>
          <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#F2F2F2' }}>
            {activity.moving_time_hms || `${Math.round(activity.moving_time / 60)} min`}
          </p>
        </div>
        {!isWeightTraining && activity.total_elevation_gain !== undefined && activity.total_elevation_gain > 0 && (
          <div>
            <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>D+</p>
            <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#3DB2E0' }}>
              {Math.round(activity.total_elevation_gain)}<span style={{ fontSize: '9px', color: 'rgba(61,178,224,0.5)', marginLeft: '2px' }}>m</span>
            </p>
          </div>
        )}
        {!isWeightTraining && activity.speed_minutes_per_km_hms && (
          <div>
            <p style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', textTransform: 'uppercase', marginBottom: '2px' }}>{isBike ? 'Vitesse' : 'Allure'}</p>
            <p style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: '#6DAA75' }}>
              {isBike ? `${activity.average_speed?.toFixed(1) || '--'}` : activity.speed_minutes_per_km_hms}
              <span style={{ fontSize: '9px', color: 'rgba(109,170,117,0.5)', marginLeft: '2px' }}>{isBike ? 'km/h' : '/km'}</span>
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(58,63,71,0.2)' }}>
        <Link to={`/activity/${activity.id}`} className="hw-link">
          Voir détails →
        </Link>
        {(onEdit || onDelete) && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button
                onClick={() => onEdit(activity)}
                style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(242,242,242,0.3)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(242,242,242,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(242,242,242,0.3)')}
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(activity)}
                style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: 'rgba(252,129,129,0.4)', background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(252,129,129,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(252,129,129,0.4)')}
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
