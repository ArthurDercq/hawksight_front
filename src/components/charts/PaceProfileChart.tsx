import { useRef, useMemo } from "react";
import type { Activity, ActivityStream, SportType } from "@/types";

const TrendingUpIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface PaceProfileChartProps {
  activity: Activity;
  streams: ActivityStream[];
}

const SPORT_COLORS: Record<SportType, string> = {
  Run: "#E8832A",
  Trail: "#C96A1A",
  Bike: "#3DB2E0",
  Swim: "#6DAA75",
  Hike: "#6DAA75",
  WeightTraining: "#3A3F47",
};

export function PaceProfileChart({ activity, streams }: PaceProfileChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const color = SPORT_COLORS[activity.sport_type] || "#E8832A";
  const isBike = activity.sport_type === "Bike";

  const paceProfile = useMemo(() => {
    const validStreams = streams.filter(
      (s) => s.velocity_smooth != null && s.velocity_smooth > 0 && s.distance_m != null
    );
    if (validStreams.length < 2) return null;

    // Sous-echantillonner a ~50 points
    const step = Math.max(1, Math.floor(validStreams.length / 50));

    return validStreams
      .filter((_, i) => i % step === 0)
      .map((s) => {
        // velocity_smooth est en m/s
        // Pour course: convertir en s/km (allure)
        // Pour velo: convertir en km/h (vitesse)
        const speedKmh = s.velocity_smooth! * 3.6; // m/s -> km/h
        const paceSeconds = s.velocity_smooth! > 0 ? 1000 / s.velocity_smooth! : 0; // s/km

        return {
          distance: s.distance_m! / 1000,
          paceSeconds,
          speedKmh,
          paceDisplay: `${Math.floor(paceSeconds / 60)}:${Math.floor(paceSeconds % 60)
            .toString()
            .padStart(2, "0")}`,
        };
      });
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
          link.download = `hawksight-pace-profile-${activity.id}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error exporting chart:", error);
    }
  };

  if (!paceProfile || paceProfile.length < 2) {
    return (
      <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 text-center">
        <p className="text-[#3A3F47] font-['Inter'] text-sm">
          Pas de donnees de vitesse
        </p>
      </div>
    );
  }

  // Calculer min/max pour le scaling
  const values = isBike
    ? paceProfile.map((p) => p.speedKmh)
    : paceProfile.map((p) => p.paceSeconds);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const totalDistance = activity.distance_km || activity.distance / 1000 || 0;
  const avgPace = activity.speed_minutes_per_km_hms || "--";
  const avgSpeed = activity.average_speed?.toFixed(1) || "--";

  return (
    <div
      ref={chartRef}
      className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

      <div className="relative space-y-6">
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
              <TrendingUpIcon color={color} />
            </div>
            <div>
              <h3 className="font-heading text-[#F2F2F2]">Profil d'Allure</h3>
              <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                Evolution de la {isBike ? "vitesse" : "vitesse"} sur le parcours
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

        {/* Pace Chart */}
        <div className="relative aspect-[2/1] border border-[#3A3F47]/20 rounded overflow-hidden bg-[#0B0C10]">
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
            {isBike ? "Rapide" : "Rapide"}
          </div>
          <div className="absolute left-2 bottom-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            {isBike ? "Lent" : "Lent"}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-2 left-12 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            0 km
          </div>
          <div className="absolute bottom-2 right-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
            {totalDistance.toFixed(1)} km
          </div>

          {/* SVG Chart */}
          <svg viewBox="0 0 400 200" className="w-full h-full">
            <defs>
              <linearGradient
                id={`paceGradient-${activity.id}`}
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.05" />
              </linearGradient>
              <filter id={`glow-${activity.id}`}>
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
                y1={(percent / 100) * 180 + 10}
                x2="390"
                y2={(percent / 100) * 180 + 10}
                stroke="#3A3F47"
                strokeWidth="0.5"
                opacity="0.2"
              />
            ))}

            {/* Create path */}
            {(() => {
              const pathData = paceProfile
                .map((point, i) => {
                  const x = 20 + (i / (paceProfile.length - 1)) * 370;
                  const value = isBike ? point.speedKmh : point.paceSeconds;
                  // Pour l'allure (course), inverser car allure basse = rapide
                  const normalizedValue = isBike
                    ? (value - minValue) / range
                    : (maxValue - value) / range;
                  const y = 180 - normalizedValue * 160 + 10;
                  return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                })
                .join(" ");

              const areaData = pathData + ` L 390 190 L 20 190 Z`;

              return (
                <>
                  {/* Area under curve */}
                  <path d={areaData} fill={`url(#paceGradient-${activity.id})`} />

                  {/* Main line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#glow-${activity.id})`}
                  />

                  {/* Data points every 10th */}
                  {paceProfile
                    .filter((_, i) => i % 10 === 0)
                    .map((point, idx) => {
                      const i = idx * 10;
                      const x = 20 + (i / (paceProfile.length - 1)) * 370;
                      const value = isBike ? point.speedKmh : point.paceSeconds;
                      const normalizedValue = isBike
                        ? (value - minValue) / range
                        : (maxValue - value) / range;
                      const y = 180 - normalizedValue * 160 + 10;

                      return (
                        <g key={i}>
                          <circle cx={x} cy={y} r="3" fill={color} opacity="0.6" />
                          <circle cx={x} cy={y} r="1.5" fill="#F2F2F2" />
                        </g>
                      );
                    })}
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
        <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
              PACE_ANALYSIS
            </span>
          </div>
          <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
            AVG: {isBike ? `${avgSpeed} km/h` : `${avgPace} /km`}
          </span>
        </div>
      </div>
    </div>
  );
}
