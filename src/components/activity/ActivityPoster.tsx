import { useMemo, useState, RefObject } from "react";
import type { Activity, ActivityStream, ActivityExplorationRate } from "@/types";
import { buildStaticMapUrl } from "@/services/mapbox/staticMap";
import { sportColor } from "@/services/utils/constants";
import { projectCoordsToSVG, createSmoothPath } from "@/services/utils/chartHelpers";
import { formatDurationCompact } from "@/services/utils/formatters";

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface ActivityPosterProps {
  race?: { id: string; name: string; type: string } | null;
  activity: Activity;
  streams: ActivityStream[];
  posterRef?: RefObject<HTMLDivElement>;
  explorationRate?: ActivityExplorationRate | null;
  onExportPNG?: () => void;
}


export function ActivityPoster({ activity, streams, posterRef, explorationRate, onExportPNG }: ActivityPosterProps) {
  const color = sportColor(activity.sport_type);
  const [mapImageError, setMapImageError] = useState(false);

  const gpsCoords = useMemo(() =>
    streams.filter(s => s.lat != null && s.lon != null).map(s => ({ lat: s.lat!, lon: s.lon! })),
    [streams]
  );

  const { points } = useMemo(() => projectCoordsToSVG(gpsCoords), [gpsCoords]);
  const path = useMemo(() => createSmoothPath(points), [points]);

  const mapboxUrl = useMemo(() => {
    if (gpsCoords.length < 2) return null;
    return buildStaticMapUrl({
      coordinates: gpsCoords.map(c => [c.lat, c.lon] as [number, number]),
      color,
      width: 800,
      height: 500,
      strokeWidth: 1.5,
    });
  }, [gpsCoords, color]);

  const useMapbox = mapboxUrl && !mapImageError;
  const hasGPSData = points.length > 0;

  const distance = activity.distance_km || activity.distance || 0;
  const duration = activity.moving_time_hms ?? formatDurationCompact(activity.moving_time);
  const isBike = activity.sport_type === "Bike";
  const pace = isBike
    ? (activity.average_speed != null ? activity.average_speed.toFixed(1) : "--")
    : (activity.speed_minutes_per_km_hms ?? "--");
  const paceLabel = isBike ? "Vitesse moy." : "Allure moy.";
  const paceUnit = isBike ? "km/h" : "/km";
  const elevation = activity.total_elevation_gain ?? 0;
  const heartRate = activity.average_heartrate ?? null;

  // pstat style helpers
  const pstatLabel: React.CSSProperties = { fontSize: '8px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' };
  const pstatVal = (c: string): React.CSSProperties => ({ fontSize: '18px', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', fontVariantNumeric: 'tabular-nums', color: c });
  const pstatUnit: React.CSSProperties = { fontSize: '11px', color: 'rgba(242,242,242,0.4)', marginLeft: '2px' };

  return (
    <div
      ref={posterRef}
      style={{
        background: '#060c18',
        border: '1px solid rgba(58,63,71,0.35)',
        borderRadius: '10px',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Corner brackets TL + TR amber */}
      <span style={{ position: 'absolute', top: 0, left: 0, width: '14px', height: '14px', borderTop: '2px solid rgba(232,131,42,0.5)', borderLeft: '2px solid rgba(232,131,42,0.5)', borderRadius: '8px 0 0 0', zIndex: 2 }} />
      <span style={{ position: 'absolute', top: 0, right: 0, width: '14px', height: '14px', borderTop: '2px solid rgba(232,131,42,0.5)', borderRight: '2px solid rgba(232,131,42,0.5)', borderRadius: '0 8px 0 0', zIndex: 2 }} />

      {/* Map area */}
      <div style={{ flex: 1, minHeight: '260px', position: 'relative', background: '#060c18' }}>
        {/* Gradient overlay bottom */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 60%, #060c18 100%)', pointerEvents: 'none', zIndex: 1 }} />

        {useMapbox ? (
          <img
            src={mapboxUrl}
            alt="Trace GPS"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setMapImageError(true)}
          />
        ) : hasGPSData ? (
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <defs>
              <filter id="poster-glow">
                <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <linearGradient id="trace-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="50%" stopColor={color} stopOpacity="1" />
                <stop offset="100%" stopColor={color} stopOpacity="0.5" />
              </linearGradient>
            </defs>
            {/* Glow layer — large + very transparent */}
            <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.08" />
            {/* Main trace — fine + gradient */}
            <path d={path} fill="none" stroke="url(#trace-grad)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" filter="url(#poster-glow)" />
            {/* Start dot */}
            <circle cx={points[0].x} cy={points[0].y} r="1.5" fill={color} opacity="0.9" />
            <circle cx={points[0].x} cy={points[0].y} r="3" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
            {/* End dot */}
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.2" fill={color} opacity="0.7" />
          </svg>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
            Pas de données GPS
          </div>
        )}
      </div>

      {/* Stats grid — 3×2 */}
      <div style={{ padding: '16px', background: '#060c18', borderTop: '1px solid rgba(58,63,71,0.25)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div>
            <div style={pstatLabel}>Distance</div>
            <div style={pstatVal('#E8832A')}>{distance.toFixed(1)}<span style={pstatUnit}>km</span></div>
          </div>
          <div>
            <div style={pstatLabel}>Durée</div>
            <div style={pstatVal('#F2F2F2')}>{duration}</div>
          </div>
          <div>
            <div style={pstatLabel}>D+</div>
            <div style={pstatVal('#3DB2E0')}>{Math.round(elevation)}<span style={pstatUnit}>m</span></div>
          </div>
          <div>
            <div style={pstatLabel}>{paceLabel}</div>
            <div style={pstatVal('#6DAA75')}>{pace}{pace !== '--' && <span style={pstatUnit}>{paceUnit}</span>}</div>
          </div>
          {heartRate && (
            <div>
              <div style={pstatLabel}>FC moy.</div>
              <div style={pstatVal('#F2F2F2')}>{Math.round(heartRate)}<span style={pstatUnit}>bpm</span></div>
            </div>
          )}
          {explorationRate && explorationRate.exploration_rate != null && (
            <div>
              <div style={pstatLabel}>Nv. territoire</div>
              <div style={pstatVal('#3DB2E0')}>{Math.round(explorationRate.exploration_rate)}<span style={pstatUnit}>%</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderTop: '1px solid rgba(58,63,71,0.2)', background: 'rgba(0,0,0,0.3)' }}>
        <span style={{ fontSize: '8px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace' }}>
          HawkSight · #ACT-{activity.id.toString().padStart(4, '0')}
        </span>
        {onExportPNG && (
          <button
            onClick={onExportPNG}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(242,242,242,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.color = '#3A3F47')}
          >
            <DownloadIcon /> Exporter PNG
          </button>
        )}
      </div>
    </div>
  );
}
