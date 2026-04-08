import { useRef, useMemo, useState, useCallback } from "react";
import type { ActivityStream, SportType } from "@/types";
import { sportColor } from '@/services/utils/constants';
import { computeYTicks } from '@/services/utils/chartHelpers';

interface ElevationProfileChartProps {
  streams: ActivityStream[];
  sportType?: SportType;
  totalElevationGain?: number;
}

const SVG_W = 440;
const SVG_H = 180;
const MARGIN = { top: 8, right: 16, bottom: 22, left: 28 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom;

export function ElevationProfileChart({ streams, sportType, totalElevationGain }: ElevationProfileChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const color = sportType ? sportColor(sportType) : "#3DB2E0";
  const [hover, setHover] = useState<{ x: number; y: number; dist: number; alt: number } | null>(null);

  const elevationData = useMemo(() => {
    const valid = streams.filter(s => s.altitude != null && s.distance_m != null);
    if (valid.length < 2) return null;
    const step = Math.max(1, Math.floor(valid.length / 80));
    return valid.filter((_, i) => i % step === 0).map(s => ({
      distance: s.distance_m! / 1000,
      altitude: s.altitude!,
    }));
  }, [streams]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !elevationData) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const chartX = svgX - MARGIN.left;
    if (chartX < 0 || chartX > CHART_W) { setHover(null); return; }
    const totalDistance = elevationData[elevationData.length - 1].distance;
    const targetDist = (chartX / CHART_W) * totalDistance;
    let closest = elevationData[0];
    let minDiff = Math.abs(elevationData[0].distance - targetDist);
    for (const p of elevationData) {
      const diff = Math.abs(p.distance - targetDist);
      if (diff < minDiff) { minDiff = diff; closest = p; }
    }
    const altRange = Math.max(...elevationData.map(p => p.altitude)) - Math.min(...elevationData.map(p => p.altitude)) || 1;
    const minAlt = Math.min(...elevationData.map(p => p.altitude));
    const x = MARGIN.left + (closest.distance / totalDistance) * CHART_W;
    const y = MARGIN.top + CHART_H - ((closest.altitude - minAlt) / altRange) * CHART_H;
    setHover({ x, y, dist: closest.distance, alt: closest.altitude });
  }, [elevationData]);

  if (!elevationData || elevationData.length < 2) {
    return (
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Profil altimétrique</div>
        <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '12px' }}>Pas de données d'altitude</div>
      </div>
    );
  }

  const altitudes = elevationData.map(p => p.altitude);
  const minAlt = Math.min(...altitudes);
  const maxAlt = Math.max(...altitudes);
  const altRange = maxAlt - minAlt || 1;
  const totalDistance = elevationData[elevationData.length - 1].distance;
  const yTicks = computeYTicks(minAlt, maxAlt, 4);
  const xTickCount = Math.min(5, Math.floor(totalDistance) + 1);
  const xTickStep = totalDistance / (xTickCount - 1);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => parseFloat((i * xTickStep).toFixed(1)));

  const toX = (dist: number) => MARGIN.left + (dist / totalDistance) * CHART_W;
  const toY = (alt: number) => MARGIN.top + CHART_H - ((alt - minAlt) / altRange) * CHART_H;

  const pathData = elevationData.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.distance).toFixed(1)} ${toY(p.altitude).toFixed(1)}`).join(" ");
  const areaData = pathData + ` L ${toX(totalDistance).toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} L ${MARGIN.left} ${(MARGIN.top + CHART_H).toFixed(1)} Z`;

  const dPlus = totalElevationGain ? Math.round(totalElevationGain) : '--';
  const altMax = Math.round(maxAlt);

  return (
    <div>
      {/* Title + subtitle — dashboard style */}
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Profil altimétrique</div>
      <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '12px' }}>
        {dPlus}m D+ · alt. max {altMax}m
      </div>

      {/* SVG chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ width: '100%', height: 'auto' }}
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="elevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
          <filter id="elevGlow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="elevClip">
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

        <g clipPath="url(#elevClip)">
          <path d={areaData} fill="url(#elevGrad)" />
          <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#elevGlow)" />
        </g>

        <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

        {hover && (
          <g>
            <line x1={hover.x} y1={MARGIN.top} x2={hover.x} y2={MARGIN.top + CHART_H} stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
            <line x1={MARGIN.left} y1={hover.y} x2={MARGIN.left + CHART_W} y2={hover.y} stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.15" />
            <circle cx={hover.x} cy={hover.y} r="3.5" fill={color} opacity="0.9" />
            <circle cx={hover.x} cy={hover.y} r="1.5" fill="#F2F2F2" />
            {(() => {
              const isRight = hover.x > SVG_W * 0.65;
              const bx = isRight ? hover.x - 80 : hover.x + 6;
              const by = Math.max(MARGIN.top + 2, Math.min(hover.y - 22, MARGIN.top + CHART_H - 24));
              return (
                <g>
                  <rect x={bx} y={by} width="72" height="20" rx="3" fill="#0B0C10" stroke={color} strokeWidth="0.8" opacity="0.95" />
                  <text x={bx + 36} y={by + 7} textAnchor="middle" fill={color} fontSize="8" fontFamily="'JetBrains Mono', monospace">{Math.round(hover.alt)} m</text>
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
