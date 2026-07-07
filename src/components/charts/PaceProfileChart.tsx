import { useRef, useMemo, useState, useCallback } from "react";
import type { Activity, ActivityStream } from "@/types";
import { sportColor, isBikeType } from '@/services/utils/constants';
import { formatPaceSeconds } from '@/services/utils/formatters';

interface PaceProfileChartProps {
  activity: Activity;
  streams: ActivityStream[];
}

const SVG_W = 440;
const SVG_H = 180;
const MARGIN = { top: 8, right: 16, bottom: 22, left: 36 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom;

export function PaceProfileChart({ activity, streams }: PaceProfileChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const color = sportColor(activity.sport_type);
  const isBike = isBikeType(activity.sport_type);
  const [hover, setHover] = useState<{ x: number; dist: number; value: number } | null>(null);

  const paceProfile = useMemo(() => {
    const valid = streams.filter(s => s.velocity_smooth != null && s.velocity_smooth > 0 && s.distance_m != null);
    if (valid.length < 2) return null;
    const step = Math.max(1, Math.floor(valid.length / 80));
    return valid.filter((_, i) => i % step === 0).map(s => ({
      distance: s.distance_m! / 1000,
      paceSeconds: 1000 / s.velocity_smooth!,
      speedKmh: s.velocity_smooth! * 3.6,
    }));
  }, [streams]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !paceProfile) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const chartX = svgX - MARGIN.left;
    if (chartX < 0 || chartX > CHART_W) { setHover(null); return; }
    const totalDist = paceProfile[paceProfile.length - 1].distance;
    const targetDist = (chartX / CHART_W) * totalDist;
    let closest = paceProfile[0];
    let minDiff = Math.abs(paceProfile[0].distance - targetDist);
    for (const p of paceProfile) {
      const diff = Math.abs(p.distance - targetDist);
      if (diff < minDiff) { minDiff = diff; closest = p; }
    }
    const x = MARGIN.left + (closest.distance / totalDist) * CHART_W;
    setHover({ x, dist: closest.distance, value: closest.speedKmh });
  }, [paceProfile]);

  if (!paceProfile || paceProfile.length < 2) {
    return (
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Allure / Vitesse</div>
        <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>Pas de données de vitesse</div>
      </div>
    );
  }

  // Échelle toujours basée sur la vitesse (km/h), min fixé à 0 — même logique
  // que le graphique "Allure moyenne par semaine" du dashboard (DashboardChartsSection).
  // Une allure (min/km) n'est pas linéaire par rapport à la vitesse : zoomer sur le
  // min/max d'allure de l'activité (ancien comportement) déformait l'échelle.
  const speedValues = paceProfile.map(p => p.speedKmh);
  const maxSpeed = Math.ceil(Math.max(...speedValues)) || 12;
  const totalDistance = paceProfile[paceProfile.length - 1].distance;

  const avgPace = activity.speed_minutes_per_km_hms || "--";
  const avgSpeed = activity.average_speed?.toFixed(1) || "--";

  const yTicks = [maxSpeed / 2, maxSpeed];
  const xTickCount = Math.min(5, Math.floor(totalDistance) + 1);
  const xTickStep = totalDistance / Math.max(xTickCount - 1, 1);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => parseFloat((i * xTickStep).toFixed(1)));

  const toX = (dist: number) => MARGIN.left + (dist / totalDistance) * CHART_W;
  const toY = (speedKmh: number) => {
    const normalized = Math.max(0, Math.min(1, speedKmh / maxSpeed));
    return MARGIN.top + CHART_H - normalized * CHART_H;
  };
  const speedToPaceLabel = (kmh: number) => {
    if (kmh <= 0) return '--';
    const paceSecPerKm = 3600 / kmh;
    return formatPaceSeconds(paceSecPerKm);
  };

  const pathData = paceProfile.map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.distance).toFixed(1)} ${toY(p.speedKmh).toFixed(1)}`).join(" ");
  const lastX = toX(paceProfile[paceProfile.length - 1].distance);
  const areaData = pathData + ` L ${lastX.toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} L ${MARGIN.left} ${(MARGIN.top + CHART_H).toFixed(1)} Z`;

  const hoverY = hover ? toY(hover.value) : null;
  const hoverLabel = hover ? (isBike ? `${hover.value.toFixed(1)} km/h` : `${speedToPaceLabel(hover.value)} /km`) : null;

  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>
        {isBike ? 'Vitesse' : 'Allure / Vitesse'}
      </div>
      <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '12px' }}>
        moy. {isBike ? `${avgSpeed} km/h` : `${avgPace} /km`}
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
          <linearGradient id={`paceGrad-${activity.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0.03" />
          </linearGradient>
          <filter id={`paceGlow-${activity.id}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id={`paceClip-${activity.id}`}>
            <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H} />
          </clipPath>
        </defs>

        {yTicks.map((tick) => {
          const y = toY(tick);
          return (
            <g key={tick}>
              <line x1={MARGIN.left} y1={y} x2={MARGIN.left + CHART_W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <text x={MARGIN.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                {isBike ? `${tick.toFixed(0)}` : speedToPaceLabel(tick)}
              </text>
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

        <g clipPath={`url(#paceClip-${activity.id})`}>
          <path d={areaData} fill={`url(#paceGrad-${activity.id})`} />
          <path d={pathData} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#paceGlow-${activity.id})`} />
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
                  <text x={bx + 36} y={by + 7} textAnchor="middle" fill={color} fontSize="8" fontFamily="'JetBrains Mono', monospace">{hoverLabel}</text>
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
