import { useRef, useMemo, useState, useCallback } from "react";
import type { Activity, ActivityStream, SportType } from "@/types";

const HeartIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface HeartRateProfileChartProps {
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

// SVG layout constants
const SVG_W = 440;
const SVG_H = 200;
const MARGIN = { top: 10, right: 20, bottom: 24, left: 26 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom;

function computeYTicks(min: number, max: number, count = 4): number[] {
  const rawStep = (max - min) / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let i = 0; i < count + 2; i++) {
    const v = start + i * step;
    if (v >= min - step * 0.1 && v <= max + step * 0.1) ticks.push(v);
  }
  return ticks.slice(0, count);
}

export function HeartRateProfileChart({ activity, streams }: HeartRateProfileChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const color = SPORT_COLORS[activity.sport_type] || "#E8832A";

  const [hover, setHover] = useState<{ x: number; y: number; dist: number; value: number } | null>(null);

  const hrData = useMemo(() => {
    const validStreams = streams.filter(
      (s) => s.heartrate != null && s.heartrate > 0 && s.distance_m != null
    );
    if (validStreams.length < 2) return null;

    const step = Math.max(1, Math.floor(validStreams.length / 80));

    return validStreams
      .filter((_, i) => i % step === 0)
      .map((s) => ({
        distance: s.distance_m! / 1000,
        bpm: s.heartrate!,
      }));
  }, [streams]);

  const exportChart = async () => {
    if (!chartRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, { backgroundColor: "#0B0C10", scale: 3 });
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `hawksight-heartrate-${activity.id}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error("Error exporting chart:", error);
    }
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || !hrData) return;
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
      const chartX = svgX - MARGIN.left;
      if (chartX < 0 || chartX > CHART_W) { setHover(null); return; }

      const totalDist = hrData[hrData.length - 1].distance;
      const targetDist = (chartX / CHART_W) * totalDist;

      let closest = hrData[0];
      let minDiff = Math.abs(hrData[0].distance - targetDist);
      for (const p of hrData) {
        const diff = Math.abs(p.distance - targetDist);
        if (diff < minDiff) { minDiff = diff; closest = p; }
      }

      const x = MARGIN.left + (closest.distance / totalDist) * CHART_W;
      setHover({ x, y: 0, dist: closest.distance, value: closest.bpm });
    },
    [hrData]
  );

  if (!hrData || hrData.length < 2) {
    return (
      <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 text-center">
        <p className="text-[#3A3F47] font-['Inter'] text-sm">Pas de données de fréquence cardiaque</p>
      </div>
    );
  }

  const bpmValues = hrData.map((p) => p.bpm);
  const minValue = Math.min(...bpmValues);
  const maxValue = Math.max(...bpmValues);
  const range = maxValue - minValue || 1;
  const totalDistance = hrData[hrData.length - 1].distance;

  const avgHR = activity.average_heartrate?.toFixed(0) || "--";
  const maxHR = activity.max_heartrate?.toFixed(0) || "--";

  const yTicks = computeYTicks(minValue, maxValue, 4);

  const xTickCount = Math.min(5, Math.floor(totalDistance) + 1);
  const xTickStep = totalDistance / Math.max(xTickCount - 1, 1);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => parseFloat((i * xTickStep).toFixed(1)));

  const toX = (dist: number) => MARGIN.left + (dist / totalDistance) * CHART_W;
  const toY = (val: number) => MARGIN.top + CHART_H - ((val - minValue) / range) * CHART_H;

  const pathData = hrData
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.distance).toFixed(1)} ${toY(p.bpm).toFixed(1)}`)
    .join(" ");

  const lastX = toX(hrData[hrData.length - 1].distance);
  const areaData = pathData + ` L ${lastX.toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} L ${MARGIN.left} ${(MARGIN.top + CHART_H).toFixed(1)} Z`;

  const hoverY = hover ? toY(hover.value) : null;

  return (
    <div
      ref={chartRef}
      className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
    >
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
          <div className="flex items-start gap-3">
            <div className="p-2 border rounded" style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}>
              <HeartIcon color={color} />
            </div>
            <div>
              <h3 className="font-heading text-[#F2F2F2]">Fréquence Cardiaque</h3>
              <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">Évolution des BPM sur le parcours</p>
            </div>
          </div>
          <button onClick={exportChart} className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all">
            <DownloadIcon />
          </button>
        </div>

        {/* Chart */}
        <div className="mt-6 aspect-[2.2]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`hrGradient-${activity.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.04" />
              </linearGradient>
              <filter id={`hrGlow-${activity.id}`}>
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id={`hrClip-${activity.id}`}>
                <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H} />
              </clipPath>
            </defs>

            {/* Y gridlines + labels */}
            {yTicks.map((tick, i) => {
              const y = toY(tick);
              return (
                <g key={tick}>
                  <line
                    x1={MARGIN.left} y1={y}
                    x2={MARGIN.left + CHART_W} y2={y}
                    stroke="#3A3F47" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.4"
                  />
                  {i > 0 && (
                    <text
                      x={MARGIN.left - 6} y={y}
                      textAnchor="end" dominantBaseline="middle"
                      fill="#3A3F47" fontSize="9"
                      fontFamily="'JetBrains Mono', 'Courier New', monospace"
                    >
                      {Math.round(tick)}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Y unit label */}
            <text
              x={MARGIN.left - 6} y={MARGIN.top - 2}
              textAnchor="end"
              fill="#3A3F47" fontSize="8"
              fontFamily="'JetBrains Mono', 'Courier New', monospace"
              opacity="0.6"
            >
              bpm
            </text>

            {/* X axis line */}
            <line
              x1={MARGIN.left} y1={MARGIN.top + CHART_H}
              x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H}
              stroke="#3A3F47" strokeWidth="0.5" opacity="0.4"
            />

            {/* X tick marks + labels */}
            {xTicks.map((km) => {
              const x = MARGIN.left + (km / totalDistance) * CHART_W;
              return (
                <g key={km}>
                  <line
                    x1={x} y1={MARGIN.top + CHART_H}
                    x2={x} y2={MARGIN.top + CHART_H + 4}
                    stroke="#3A3F47" strokeWidth="0.8" opacity="0.6"
                  />
                  <text
                    x={x} y={MARGIN.top + CHART_H + 13}
                    textAnchor="middle"
                    fill="#3A3F47" fontSize="9"
                    fontFamily="'JetBrains Mono', 'Courier New', monospace"
                  >
                    {km === 0 ? "" : `${km.toFixed(1)} km`}
                  </text>
                </g>
              );
            })}

            {/* Area + line */}
            <g clipPath={`url(#hrClip-${activity.id})`}>
              <path d={areaData} fill={`url(#hrGradient-${activity.id})`} />
              <path
                d={pathData}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#hrGlow-${activity.id})`}
              />
            </g>

            {/* Y axis line */}
            <line
              x1={MARGIN.left} y1={MARGIN.top}
              x2={MARGIN.left} y2={MARGIN.top + CHART_H}
              stroke="#3A3F47" strokeWidth="0.5" opacity="0.4"
            />

            {/* Crosshair */}
            {hover && hoverY !== null && (
              <g>
                <line
                  x1={hover.x} y1={MARGIN.top}
                  x2={hover.x} y2={MARGIN.top + CHART_H}
                  stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4"
                />
                <line
                  x1={MARGIN.left} y1={hoverY}
                  x2={MARGIN.left + CHART_W} y2={hoverY}
                  stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.25"
                />
                <circle cx={hover.x} cy={hoverY} r="4" fill={color} opacity="0.9" />
                <circle cx={hover.x} cy={hoverY} r="2" fill="#F2F2F2" />
                {(() => {
                  const isRight = hover.x > SVG_W * 0.65;
                  const bx = isRight ? hover.x - 84 : hover.x + 8;
                  const by = Math.max(MARGIN.top + 2, Math.min(hoverY - 24, MARGIN.top + CHART_H - 26));
                  return (
                    <g>
                      <rect x={bx} y={by} width="76" height="22" rx="3"
                        fill="#0B0C10" stroke={color} strokeWidth="0.8" opacity="0.95" />
                      <text x={bx + 38} y={by + 8} textAnchor="middle"
                        fill={color} fontSize="9" fontFamily="'JetBrains Mono', 'Courier New', monospace">
                        {Math.round(hover.value)} bpm
                      </text>
                      <text x={bx + 38} y={by + 17} textAnchor="middle"
                        fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', 'Courier New', monospace">
                        {hover.dist.toFixed(2)} km
                      </text>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">HEART_RATE</span>
          </div>
          <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
            AVG: {avgHR} bpm · MAX: {maxHR} bpm
          </span>
        </div>
      </div>
    </div>
  );
}
