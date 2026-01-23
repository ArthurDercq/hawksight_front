import { useRef, useMemo } from "react";
import type { Activity, ActivityStream, SportType } from "@/types";

const HeartIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface HRZonesChartProps {
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

const HR_ZONES = [
  { name: "Z1", label: "Recuperation", range: "50-60%", min: 98, max: 117, color: "#3DB2E0" },
  { name: "Z2", label: "Endurance", range: "60-70%", min: 117, max: 137, color: "#4CAF50" },
  { name: "Z3", label: "Tempo", range: "70-80%", min: 137, max: 156, color: "#FFC107" },
  { name: "Z4", label: "Seuil", range: "80-90%", min: 156, max: 176, color: "#FF9800" },
  { name: "Z5", label: "VO2max", range: "90-100%", min: 176, max: 195, color: "#E8832A" },
];

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export function HRZonesChart({ activity, streams }: HRZonesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const color = SPORT_COLORS[activity.sport_type] || "#E8832A";

  const hrZones = useMemo(() => {
    const hrData = streams.filter((s) => s.heartrate != null);
    if (hrData.length === 0) return null;

    const counts = HR_ZONES.map(() => 0);

    hrData.forEach((s) => {
      const hr = s.heartrate!;
      const zoneIdx = HR_ZONES.findIndex((z) => hr >= z.min && hr < z.max);
      if (zoneIdx >= 0) counts[zoneIdx]++;
    });

    const total = counts.reduce((a, b) => a + b, 0) || 1;

    return HR_ZONES.map((zone, i) => ({
      ...zone,
      percentage: (counts[i] / total) * 100,
      time: (counts[i] / total) * activity.moving_time,
    }));
  }, [streams, activity.moving_time]);

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
          link.download = `hawksight-hr-zones-${activity.id}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error exporting chart:", error);
    }
  };

  if (!hrZones) {
    return (
      <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 text-center">
        <p className="text-[#3A3F47] font-['Inter'] text-sm">
          Pas de donnees de frequence cardiaque
        </p>
      </div>
    );
  }

  return (
    <div
      ref={chartRef}
      className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8832A]/5 rounded-full blur-3xl" />

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
              <HeartIcon color={color} />
            </div>
            <div>
              <h3 className="font-heading text-[#F2F2F2]">
                Zones de Frequence Cardiaque
              </h3>
              <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                Distribution du temps par zone
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

        {/* HR Zones Chart */}
        <div className="space-y-4">
          {hrZones.map((zone, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#F2F2F2]">
                    {zone.name}
                  </span>
                  <span className="font-['Inter'] text-xs text-[#3A3F47]">
                    {zone.label}
                  </span>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#3A3F47]/60">
                    {zone.range}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#3A3F47]">
                    {formatTime(zone.time)}
                  </span>
                  <span
                    className="font-['JetBrains_Mono'] text-sm"
                    style={{ color: zone.color }}
                  >
                    {zone.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="relative h-8 bg-[#0B0C10] border border-[#3A3F47]/20 rounded overflow-hidden">
                {/* Grid background */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px)`,
                    backgroundSize: "20px 100%",
                  }}
                />

                {/* Bar fill */}
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500"
                  style={{
                    width: `${zone.percentage}%`,
                    backgroundColor: `${zone.color}20`,
                    borderRight: `2px solid ${zone.color}`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${zone.color}40)`,
                    }}
                  />
                </div>

                {/* Tracking markers */}
                {[25, 50, 75].map((mark) => (
                  <div
                    key={mark}
                    className="absolute inset-y-0 w-px bg-[#3A3F47]/20"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
              HR_ANALYSIS
            </span>
          </div>
          <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
            AVG: {activity.average_heartrate ? Math.round(activity.average_heartrate) : "--"} BPM
          </span>
        </div>
      </div>
    </div>
  );
}
