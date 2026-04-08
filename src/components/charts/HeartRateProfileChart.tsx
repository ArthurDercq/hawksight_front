import { useRef, useMemo, useState, useCallback } from "react";
import type { Activity, ActivityStream } from "@/types";
import { computeYTicks } from '@/services/utils/chartHelpers';

interface HeartRateProfileChartProps {
  activity: Activity;
  streams: ActivityStream[];
}

// HR chart uses moss green regardless of sport type
const HR_COLOR = "#6DAA75";

const SVG_W = 440;
const SVG_H = 180;
const MARGIN = { top: 8, right: 16, bottom: 22, left: 28 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom;

export function HeartRateProfileChart({ activity, streams }: HeartRateProfileChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const color = HR_COLOR;
  const [hover, setHover] = useState<{ x: number; dist: number; value: number } | null>(null);

  const hrData = useMemo(() => {
    const valid = streams.filter(s => s.heartrate != null && s.heartrate > 0 && s.distance_m != null);
    if (valid.length < 2) return null;
    const step = Math.max(1, Math.floor(valid.length / 80));
    return valid.filter((_, i) => i % step === 0).map(s => ({
      distance: s.distance_m! / 1000,
      bpm: s.heartrate!,
    }));
  }, [streams]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
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
    setHover({ x, dist: closest.distance, value: closest.bpm });
  }, [hrData]);

  if (!hrData || hrData.length < 2) {
    return (
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Fréquence cardiaque</div>
        <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>Pas de données de fréquence cardiaque</div>
      </div>
    );
  }

  const bpmValues = hrData.map(p => p.bpm);
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

  const pathData = hrData.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.distance).toFixed(1)} ${toY(p.bpm).toFixed(1)}`).join(" ");
  const lastX = toX(hrData[hrData.length - 1].distance);
  const areaData = pathData + ` L ${lastX.toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} L ${MARGIN.left} ${(MARGIN.top + CHART_H).toFixed(1)} Z`;
  const hoverY = hover ? toY(hover.value) : null;

  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Fréquence cardiaque</div>
      <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '12px' }}>
        moy. {avgHR} bpm · max {maxHR} bpm
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', height: 'auto' }}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`hrGrad-${activity.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
          <filter id={`hrGlow-${activity.id}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={`hrClip-${activity.id}`}>
            <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H} />
          </clipPath>
        </defs>

        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line x1={MARGIN.left} y1={y} x2={MARGIN.left + CHART_W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              {i > 0 && (
                <text x={MARGIN.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                  {Math.round(tick)}
                </text>
              )}
            </g>
          );
        })}

        <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

        {xTicks.map((km) => {
          const x = toX(km);
          return (
            <g key={km}>
              <line x1={x} y1={MARGIN.top + CHART_H} x2={x} y2={MARGIN.top + CHART_H + 3} stroke="rgba(58,63,71,0.6)" strokeWidth="0.8" />
              <text x={x} y={MARGIN.top + CHART_H + 12} textAnchor="middle" fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                {km === 0 ? "" : `${km.toFixed(1)}km`}
              </text>
            </g>
          );
        })}

        <g clipPath={`url(#hrClip-${activity.id})`}>
          <path d={areaData} fill={`url(#hrGrad-${activity.id})`} />
          <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#hrGlow-${activity.id})`} />
        </g>

        <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

        {hover && hoverY !== null && (
          <g>
            <line x1={hover.x} y1={MARGIN.top} x2={hover.x} y2={MARGIN.top + CHART_H} stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
            <line x1={MARGIN.left} y1={hoverY} x2={MARGIN.left + CHART_W} y2={hoverY} stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.15" />
            <circle cx={hover.x} cy={hoverY} r="3.5" fill={color} opacity="0.9" />
            <circle cx={hover.x} cy={hoverY} r="1.5" fill="#F2F2F2" />
            {(() => {
              const isRight = hover.x > SVG_W * 0.65;
              const bx = isRight ? hover.x - 80 : hover.x + 6;
              const by = Math.max(MARGIN.top + 2, Math.min(hoverY - 22, MARGIN.top + CHART_H - 24));
              return (
                <g>
                  <rect x={bx} y={by} width="72" height="20" rx="3" fill="#0B0C10" stroke={color} strokeWidth="0.8" opacity="0.95" />
                  <text x={bx + 36} y={by + 7} textAnchor="middle" fill={color} fontSize="8" fontFamily="'JetBrains Mono', monospace">{Math.round(hover.value)} bpm</text>
                  <text x={bx + 36} y={by + 15} textAnchor="middle" fill="#3A3F47" fontSize="7" fontFamily="'JetBrains Mono', monospace">{hover.dist.toFixed(2)} km</text>
                </g>
              );
            })()}
          </g>
        )}
      </svg>
    </div>
  );
}
