import { useMemo, useState, RefObject } from "react";
import type { Activity, ActivityStream, ActivityExplorationRate } from "@/types";
import { buildStaticMapUrl } from "@/services/mapbox/staticMap";
import { sportColor, isBikeType } from "@/services/utils/constants";
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

function PstatLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[8px] text-steel uppercase tracking-[2px]">{children}</div>
  );
}

function PstatValue({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div className="font-mono text-[18px] font-bold tabular-nums" style={{ color }}>{children}</div>
  );
}

function PstatUnit({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[11px] text-mist/40 ml-0.5">{children}</span>;
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
  const isBike = isBikeType(activity.sport_type);
  const pace = isBike
    ? (activity.average_speed != null ? activity.average_speed.toFixed(1) : "--")
    : (activity.speed_minutes_per_km_hms ?? "--");
  const paceLabel = isBike ? "Vitesse moy." : "Allure moy.";
  const paceUnit = isBike ? "km/h" : "/km";
  const elevation = activity.total_elevation_gain ?? 0;
  const heartRate = activity.average_heartrate ?? null;

  return (
    <div
      ref={posterRef}
      className="relative flex flex-col overflow-hidden rounded-[10px] bg-charcoal-dark border border-steel/35"
    >
      {/* Corner brackets TL + TR amber */}
      <span className="hw-br hw-br-tl hw-br-amber" />
      <span className="hw-br hw-br-tr hw-br-amber" />

      {/* Map area */}
      <div className="relative flex-1 min-h-[260px] bg-charcoal-dark">
        {/* Gradient overlay bottom */}
        <div className="absolute inset-0 pointer-events-none z-[1]" style={{ background: 'linear-gradient(to bottom, transparent 60%, #060c18 100%)' }} />

        {useMapbox ? (
          <img
            src={mapboxUrl}
            alt="Trace GPS"
            className="w-full h-full object-cover block"
            onError={() => setMapImageError(true)}
          />
        ) : hasGPSData ? (
          <svg viewBox="0 0 100 100" className="w-full h-full">
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
            <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.08" />
            <path d={path} fill="none" stroke="url(#trace-grad)" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" filter="url(#poster-glow)" />
            <circle cx={points[0].x} cy={points[0].y} r="1.5" fill={color} opacity="0.9" />
            <circle cx={points[0].x} cy={points[0].y} r="3" fill="none" stroke={color} strokeWidth="0.5" opacity="0.4" />
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="1.2" fill={color} opacity="0.7" />
          </svg>
        ) : (
          <div className="flex items-center justify-center h-full font-mono text-xs text-steel">
            Pas de données GPS
          </div>
        )}
      </div>

      {/* Stats grid — 3×2 */}
      <div className="p-4 bg-charcoal-dark border-t border-steel/25">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <PstatLabel>Distance</PstatLabel>
            <PstatValue color="#E8832A">{distance.toFixed(1)}<PstatUnit>km</PstatUnit></PstatValue>
          </div>
          <div>
            <PstatLabel>Durée</PstatLabel>
            <PstatValue color="#F2F2F2">{duration}</PstatValue>
          </div>
          <div>
            <PstatLabel>D+</PstatLabel>
            <PstatValue color="#3DB2E0">{Math.round(elevation)}<PstatUnit>m</PstatUnit></PstatValue>
          </div>
          <div>
            <PstatLabel>{paceLabel}</PstatLabel>
            <PstatValue color="#6DAA75">{pace}{pace !== '--' && <PstatUnit>{paceUnit}</PstatUnit>}</PstatValue>
          </div>
          {heartRate && (
            <div>
              <PstatLabel>FC moy.</PstatLabel>
              <PstatValue color="#F2F2F2">{Math.round(heartRate)}<PstatUnit>bpm</PstatUnit></PstatValue>
            </div>
          )}
          {explorationRate && explorationRate.exploration_rate != null && (
            <div>
              <PstatLabel>Nv. territoire</PstatLabel>
              <PstatValue color="#3DB2E0">{Math.round(explorationRate.exploration_rate)}<PstatUnit>%</PstatUnit></PstatValue>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-steel/20 bg-black/30">
        <span className="font-mono text-[8px] text-steel uppercase tracking-[2px]">
          HawkSight · #ACT-{activity.id.toString().padStart(4, '0')}
        </span>
        {onExportPNG && (
          <button
            onClick={onExportPNG}
            className="inline-flex items-center gap-1.5 font-mono text-[9px] text-steel bg-transparent border-none cursor-pointer hover:text-mist/50 transition-colors"
          >
            <DownloadIcon /> Exporter PNG
          </button>
        )}
      </div>
    </div>
  );
}
