import { useRef, useMemo } from "react";
import type { ActivityStream, SportType } from "@/types";

const MountainIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface ElevationProfileChartProps {
  streams: ActivityStream[];
  sportType?: SportType;
  totalElevationGain?: number;
}

const SPORT_COLORS: Record<SportType, string> = {
  Run: "#E8832A",
  Trail: "#C96A1A",
  Bike: "#3DB2E0",
  Swim: "#6DAA75",
  Hike: "#6DAA75",
  WeightTraining: "#3A3F47",
};

export function ElevationProfileChart({ streams, sportType, totalElevationGain }: ElevationProfileChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const color = sportType ? SPORT_COLORS[sportType] : "#3DB2E0";

  const elevationData = useMemo(() => {
    const validStreams = streams.filter(
      (s) => s.altitude != null && s.distance_m != null
    );
    if (validStreams.length < 2) return null;

    // Sous-echantillonner a ~50 points
    const step = Math.max(1, Math.floor(validStreams.length / 50));

    return validStreams
      .filter((_, i) => i % step === 0)
      .map((s) => ({
        distance: s.distance_m! / 1000,
        altitude: s.altitude!,
      }));
  }, [streams]);

  const exportChart = async () => {
    if (!chartRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#0B0C10",
        scale: 3,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `hawksight-elevation-profile.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error exporting chart:", error);
    }
  };

  if (!elevationData || elevationData.length < 2) {
    return (
      <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 text-center h-full flex items-center justify-center">
        <p className="text-[#3A3F47] font-['Inter'] text-sm">
          Pas de donnees d'altitude
        </p>
      </div>
    );
  }

  // Calculer min/max pour le scaling
  const altitudes = elevationData.map((p) => p.altitude);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const range = maxAlt - minAlt || 1;

  const totalDistance = elevationData[elevationData.length - 1].distance;

  return (
    <div
      ref={chartRef}
      className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden h-full flex flex-col"
    >
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

      <div className="relative flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
          <div className="flex items-start gap-3">
            <div
              className="p-2 border rounded"
              style={{
                backgroundColor: `${color}10`,
                borderColor: `${color}30`,
              }}
            >
              <MountainIcon color={color} />
            </div>
            <div>
              <h3 className="font-heading text-[#F2F2F2]">Denivele</h3>
              <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                Profil altimetrique du parcours
              </p>
            </div>
          </div>

          <div className="flex gap-1">
            <button
              onClick={exportChart}
              className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all"
            >
              <DownloadIcon />
            </button>
          </div>
        </div>

        {/* Elevation Chart */}
        <div className="flex-1 relative mt-6 border border-[#3A3F47]/20 rounded overflow-hidden bg-[#0B0C10] min-h-[120px]">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #F2F2F2 1px, transparent 1px),
                linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
              `,
              backgroundSize: "40px 20px",
            }}
          />

          {/* Y-axis labels */}
          <div className="absolute left-2 top-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            {Math.round(maxAlt)}m
          </div>
          <div className="absolute left-2 bottom-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            {Math.round(minAlt)}m
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-2 left-12 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            0 km
          </div>
          <div className="absolute bottom-2 right-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            {totalDistance.toFixed(1)} km
          </div>

          {/* SVG Chart */}
          <svg viewBox="0 0 400 150" className="w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient
                id="elevationGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
              <filter id="elevationGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent) => (
              <line
                key={`h-${percent}`}
                x1="20"
                y1={(percent / 100) * 130 + 10}
                x2="390"
                y2={(percent / 100) * 130 + 10}
                stroke="#3A3F47"
                strokeWidth="0.5"
                opacity="0.2"
              />
            ))}

            {/* Create path */}
            {(() => {
              const pathData = elevationData
                .map((point, i) => {
                  const x = 20 + (i / (elevationData.length - 1)) * 370;
                  const normalizedAlt = (point.altitude - minAlt) / range;
                  const y = 140 - normalizedAlt * 120;
                  return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                })
                .join(" ");

              const areaData = pathData + ` L 390 140 L 20 140 Z`;

              return (
                <>
                  {/* Area under curve */}
                  <path d={areaData} fill="url(#elevationGradient)" />

                  {/* Main line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#elevationGlow)"
                  />
                </>
              );
            })()}
          </svg>

          {/* Technical overlay corners */}
          <div
            className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20"
            style={{ borderColor: color }}
          />
          <div
            className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20"
            style={{ borderColor: color }}
          />
          <div
            className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20"
            style={{ borderColor: color }}
          />
          <div
            className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20"
            style={{ borderColor: color }}
          />
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30 mt-6">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
              ELEVATION_PROFILE
            </span>
          </div>
          <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
            D+: {totalElevationGain ? Math.round(totalElevationGain) : "--"}m
          </span>
        </div>
      </div>
    </div>
  );
}
