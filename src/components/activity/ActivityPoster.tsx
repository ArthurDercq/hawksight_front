import { useMemo, RefObject } from "react";
import type { Activity, ActivityStream, SportType } from "@/types";

// SVG Icons
const MapPinIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ActivitySvgIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

interface ActivityPosterProps {
  activity: Activity;
  streams: ActivityStream[];
  posterRef?: RefObject<HTMLDivElement>;
}

const SPORT_COLORS: Record<SportType, string> = {
  Run: "#E8832A",
  Trail: "#C96A1A",
  Bike: "#3DB2E0",
  Swim: "#6DAA75",
  Hike: "#6DAA75",
  WeightTraining: "#3A3F47",
};

const SPORT_LABELS: Record<SportType, string> = {
  Run: "Course",
  Trail: "Trail",
  Bike: "Velo",
  Swim: "Natation",
  Hike: "Randonnee",
  WeightTraining: "Musculation",
};

// Project GPS coordinates to SVG viewBox (0-100)
function projectCoordsToSVG(
  coords: { lat: number; lon: number }[],
  padding: number = 10
): { points: { x: number; y: number }[]; bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } } {
  if (coords.length === 0) {
    return { points: [], bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 } };
  }

  const lats = coords.map(c => c.lat);
  const lons = coords.map(c => c.lon);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLon = Math.min(...lons);
  const maxLon = Math.max(...lons);

  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;

  // Normalize to 0-100 with padding
  const usableRange = 100 - 2 * padding;
  const points = coords.map(({ lat, lon }) => ({
    x: padding + ((lon - minLon) / lonRange) * usableRange,
    y: padding + ((maxLat - lat) / latRange) * usableRange, // Invert Y axis
  }));

  return { points, bounds: { minLat, maxLat, minLon, maxLon } };
}

// Create smooth SVG path from points using quadratic Bezier curves
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }

  // Add last point
  if (points.length > 1) {
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  }

  return path;
}

// Format coordinates to degrees/minutes
function formatCoord(value: number, isLat: boolean): string {
  const direction = isLat ? (value >= 0 ? "N" : "S") : (value >= 0 ? "E" : "W");
  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.floor((absValue - degrees) * 60);
  return `${direction} ${degrees}°${minutes.toString().padStart(2, "0")}'`;
}

// Format duration from seconds to readable string
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}min`;
  }
  return `${minutes}min ${secs.toString().padStart(2, "0")}s`;
}

// Format date to readable string
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ActivityPoster({ activity, streams, posterRef }: ActivityPosterProps) {
  const color = SPORT_COLORS[activity.sport_type] || "#E8832A";
  const sportLabel = SPORT_LABELS[activity.sport_type] || activity.sport_type;

  // Extract GPS coordinates from streams
  const gpsCoords = useMemo(() => {
    return streams
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => ({ lat: s.lat!, lon: s.lon! }));
  }, [streams]);

  // Project to SVG coordinates
  const { points, bounds } = useMemo(() => {
    return projectCoordsToSVG(gpsCoords);
  }, [gpsCoords]);

  // Create SVG path
  const path = useMemo(() => createSmoothPath(points), [points]);

  // Calculate metrics
  const distance = activity.distance_km || activity.distance || 0;
  const duration = activity.moving_time_hms ?? formatDuration(activity.moving_time);
  const isBike = activity.sport_type === "Bike";
  const pace = isBike
    ? (activity.average_speed?.toFixed(1) ?? "--")
    : (activity.speed_minutes_per_km_hms ?? "--");
  const paceLabel = isBike ? "Vitesse moy." : "Allure moy.";
  const paceUnit = isBike ? "km/h" : "/km";
  const elevation = activity.total_elevation_gain ?? 0;
  const heartRate = activity.average_heartrate ?? null;

  const hasGPSData = points.length > 0;

  return (
    <div
      ref={posterRef}
      className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden w-[555px]"
    >
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#E8832A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="space-y-3 pb-4 border-b border-[#3A3F47]/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div
                    className="absolute inset-0 blur-lg"
                    style={{ backgroundColor: `${color}33` }}
                  />
                  <div
                    className="relative p-2 border rounded"
                    style={{
                      backgroundColor: `${color}10`,
                      borderColor: `${color}30`,
                    }}
                  >
                    <MapPinIcon color={color} />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-[#F2F2F2]">
                    {activity.name || "Activite sans titre"}
                  </h3>
                  <p className="text-[#3A3F47] font-['Inter'] text-sm mt-1">
                    {formatDate(activity.start_date)} • {sportLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{
                        backgroundColor: color,
                        opacity: 1 - i * 0.3,
                      }}
                    />
                  ))}
                </div>
                <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                  HAWKSIGHT
                </span>
              </div>
            </div>
          </div>

          {/* Main GPS Trace */}
          <div className="relative aspect-square border border-[#3A3F47]/40 rounded-lg overflow-hidden bg-[#0B0C10]">
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #F2F2F2 1px, transparent 1px),
                  linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
                `,
                backgroundSize: "20px 20px",
              }}
            />

            {/* Corner coordinates overlay */}
            {hasGPSData && (
              <>
                <div className="absolute top-2 left-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                  {formatCoord(bounds.maxLat, true)}
                </div>
                <div className="absolute top-2 right-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                  {formatCoord(bounds.maxLon, false)}
                </div>
                <div className="absolute bottom-2 left-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                  ALT {Math.round(elevation)}m
                </div>
                <div className="absolute bottom-2 right-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                  {distance.toFixed(1)}km
                </div>
              </>
            )}

            {/* GPS Trace SVG */}
            {hasGPSData ? (
              <svg viewBox="0 0 100 100" className="w-full h-full relative">
                {/* Shadow/glow effect */}
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Main trace */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                  filter="url(#glow)"
                />

                {/* Tracking points every N points */}
                {points
                  .filter((_, i) => i % Math.max(1, Math.floor(points.length / 15)) === 0)
                  .map((point, i) => (
                    <g key={i}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="1.5"
                        fill={color}
                        opacity="0.4"
                      />
                      {i % 2 === 0 && (
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="3"
                          fill="none"
                          stroke={color}
                          strokeWidth="0.5"
                          opacity="0.2"
                        />
                      )}
                    </g>
                  ))}

                {/* Start point */}
                <circle
                  cx={points[0].x}
                  cy={points[0].y}
                  r="3"
                  fill={color}
                  opacity="0.9"
                />
                <circle
                  cx={points[0].x}
                  cy={points[0].y}
                  r="5"
                  fill="none"
                  stroke={color}
                  strokeWidth="1"
                  opacity="0.5"
                />

                {/* End point */}
                <circle
                  cx={points[points.length - 1].x}
                  cy={points[points.length - 1].y}
                  r="2.5"
                  fill={color}
                  opacity="0.7"
                />
              </svg>
            ) : (
              <div className="flex items-center justify-center h-full text-[#3A3F47] font-['Inter'] text-sm">
                Pas de donnees GPS
              </div>
            )}

            {/* Technical overlay corners */}
            <div
              className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 opacity-20"
              style={{ borderColor: color }}
            />
            <div
              className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 opacity-20"
              style={{ borderColor: color }}
            />
            <div
              className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 opacity-20"
              style={{ borderColor: color }}
            />
            <div
              className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 opacity-20"
              style={{ borderColor: color }}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <div className="text-[#3A3F47] font-['Inter'] text-xs">Distance</div>
              <div className="font-['JetBrains_Mono'] text-lg" style={{ color }}>
                {distance.toFixed(2)}
                <span className="text-xs text-[#F2F2F2]/40 ml-1">km</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[#3A3F47] font-['Inter'] text-xs">Duree</div>
              <div className="font-['JetBrains_Mono'] text-lg" style={{ color }}>
                {duration}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[#3A3F47] font-['Inter'] text-xs">{paceLabel}</div>
              <div className="font-['JetBrains_Mono'] text-lg" style={{ color }}>
                {pace}
                {pace !== "--" && <span className="text-xs text-[#F2F2F2]/40 ml-1">{paceUnit}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-[#3A3F47] font-['Inter'] text-xs">Denivele</div>
              <div className="font-['JetBrains_Mono'] text-lg" style={{ color }}>
                {Math.round(elevation)}
                <span className="text-xs text-[#F2F2F2]/40 ml-1">m</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[#3A3F47] font-['Inter'] text-xs">BPM moy.</div>
              <div className="font-['JetBrains_Mono'] text-lg" style={{ color }}>
                {heartRate ? Math.round(heartRate) : "--"}
                {heartRate && <span className="text-xs text-[#F2F2F2]/40 ml-1">bpm</span>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
            <div className="flex items-center gap-2">
              <ActivitySvgIcon />
              <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                ACTIVITY_{activity.id.toString().padStart(3, "0")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                RECORDED
              </span>
            </div>
          </div>
        </div>
      </div>
  );
}
