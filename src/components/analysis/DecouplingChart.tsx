/**
 * DecouplingChart - Dual axis chart showing HR/Speed decoupling
 * =============================================================
 * Follows HawkSight design system
 */

import { useRef, useMemo } from 'react';
import type { DecouplingResult } from '@/types/analysis';

// Icons
const ThermometerIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface DecouplingChartProps {
  data: DecouplingResult | null;
  color?: string;
  onExport?: (ref: React.RefObject<HTMLDivElement>) => void;
}

export function DecouplingChart({ data, color = '#e74c3c', onExport }: DecouplingChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { hrPath, speedPath, corrPath, corrFillPath, bounds } = useMemo(() => {
    if (!data || data.timeseries.length === 0) {
      return {
        hrPath: '',
        speedPath: '',
        corrPath: '',
        corrFillPath: '',
        bounds: { minHR: 0, maxHR: 1, minSpeed: 0, maxSpeed: 1 }
      };
    }

    const ts = data.timeseries;
    const hrs = ts.map(p => p.hr);
    const speeds = ts.map(p => p.gap_speed);

    const minHR = Math.min(...hrs) - 5;
    const maxHR = Math.max(...hrs) + 5;
    const minSpeed = Math.min(...speeds) * 0.9;
    const maxSpeed = Math.max(...speeds) * 1.1;

    const hrRange = maxHR - minHR || 1;
    const speedRange = maxSpeed - minSpeed || 1;

    let hrP = '';
    let speedP = '';
    let corrP = '';
    let corrFillP = '';

    ts.forEach((point, i) => {
      const x = 40 + (i / (ts.length - 1)) * 320;

      // Top chart (HR and Speed)
      const yHR = 20 + ((maxHR - point.hr) / hrRange) * 80;
      const ySpeed = 20 + ((maxSpeed - point.gap_speed) / speedRange) * 80;

      // Bottom chart (Correlation)
      const yCorr = 130 + ((1 - point.rolling_corr) / 2) * 70; // -1 to 1 mapped to chart

      if (i === 0) {
        hrP = `M ${x} ${yHR}`;
        speedP = `M ${x} ${ySpeed}`;
        corrP = `M ${x} ${yCorr}`;
        corrFillP = `M 40 165 L ${x} ${yCorr}`; // Start at y=0 line
      } else {
        hrP += ` L ${x} ${yHR}`;
        speedP += ` L ${x} ${ySpeed}`;
        corrP += ` L ${x} ${yCorr}`;
        corrFillP += ` L ${x} ${yCorr}`;
      }
    });

    // Close fill path for negative correlation area
    corrFillP += ` L 360 165 L 40 165 Z`;

    return {
      hrPath: hrP,
      speedPath: speedP,
      corrPath: corrP,
      corrFillPath: corrFillP,
      bounds: { minHR, maxHR, minSpeed, maxSpeed }
    };
  }, [data]);

  if (!data || data.timeseries.length === 0) {
    return (
      <div
        className="group relative"
        style={{ '--metric-color': color } as React.CSSProperties}
      >
        {/* Hover glow */}
        <div
          className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: `linear-gradient(135deg, ${color}20, transparent)`, filter: 'blur(20px)' }}
        />

        <div className="relative bg-charcoal border border-steel/30 rounded-lg p-6 transition-all duration-300 group-hover:border-[var(--metric-color)]"> 

          <div className="relative">
            <div className="flex items-center gap-3 pb-4 border-b border-steel/30">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <ThermometerIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Analyse de Décorrélation</h3>
                <p className="text-mist/40 font-body text-xs mt-1">Pas de pic cardiaque significatif détecté</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-48 text-mist/40 font-body text-sm">
              Données insuffisantes pour l'analyse
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find worst decoupling point
  const worstCorr = Math.min(...data.timeseries.map(p => p.rolling_corr));

  return (
    <div
      ref={chartRef}
      className="group relative"
      style={{ '--metric-color': color } as React.CSSProperties}
    >
      {/* Hover glow */}
      <div
        className="absolute -inset-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${color}20, transparent)`, filter: 'blur(20px)' }}
      />

      <div className="relative bg-charcoal border border-steel/30 rounded-lg p-6 overflow-hidden transition-all duration-300 group-hover:border-[var(--metric-color)]"> 

        {/* Corner glow */}
        <div
          className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
          style={{ background: `radial-gradient(circle at top right, ${color}, transparent)`, opacity: 0.08 }}
        />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/30">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <ThermometerIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Stress Thermique & Décorrélation</h3>
                <p className="text-mist/40 font-body text-xs mt-1">
                  Pic HR: <span className="font-mono font-bold" style={{ color }}>{data.peak_hr} bpm</span> - 45 dernières minutes
                </p>
              </div>
            </div>

            {onExport && (
              <button
                onClick={() => onExport(chartRef)}
                className="p-1.5 hover:bg-steel/20 rounded transition-all duration-300"
              >
                <DownloadIcon color="#6B7280" />
              </button>
            )}
          </div>

          {/* Charts */}
          <div className="relative border border-steel/20 rounded overflow-hidden bg-charcoal-light">
            <svg viewBox="0 0 400 220" className="w-full h-auto">
              <defs>
                <filter id="decGlow">
                  <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* TOP CHART: HR and Speed */}
              <g>
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <line
                    key={`top-${percent}`}
                    x1="40"
                    y1={20 + (percent / 100) * 80}
                    x2="360"
                    y2={20 + (percent / 100) * 80}
                    stroke="#9CA3AF"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                ))}

                {/* HR line (red) */}
                <path
                  d={hrPath}
                  fill="none"
                  stroke="#e74c3c"
                  strokeWidth="2"
                  strokeLinecap="round"
                  filter="url(#decGlow)"
                />

                {/* Speed line (blue) */}
                <path
                  d={speedPath}
                  fill="none"
                  stroke="#3DB2E0"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />

                {/* Y-axis labels */}
                <text x="35" y="25" textAnchor="end" className="font-mono text-[8px]" fill="#e74c3c">
                  {Math.round(bounds.maxHR)}
                </text>
                <text x="35" y="100" textAnchor="end" className="font-mono text-[8px]" fill="#e74c3c">
                  {Math.round(bounds.minHR)}
                </text>

                {/* Title */}
                <text x="200" y="12" textAnchor="middle" className="font-body text-[9px]" fill="#F2F2F2">
                  FC & Vitesse GAP
                </text>
              </g>

              {/* Separator */}
              <line x1="40" y1="115" x2="360" y2="115" stroke="#9CA3AF" strokeWidth="1" />

              {/* BOTTOM CHART: Correlation */}
              <g>
                {/* Zero line (correlation = 0) */}
                <line
                  x1="40"
                  y1="165"
                  x2="360"
                  y2="165"
                  stroke="#9CA3AF"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />

                {/* Good sync threshold (0.8) */}
                <line
                  x1="40"
                  y1={130 + ((1 - 0.8) / 2) * 70}
                  x2="360"
                  y2={130 + ((1 - 0.8) / 2) * 70}
                  stroke="#6DAA75"
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.5"
                />

                {/* Fill area for negative correlation (decoupling zone) */}
                <clipPath id="negativeClip">
                  <rect x="40" y="165" width="320" height="35" />
                </clipPath>
                <path
                  d={corrFillPath}
                  fill="#e74c3c"
                  opacity="0.2"
                  clipPath="url(#negativeClip)"
                />

                {/* Correlation line */}
                <path
                  d={corrPath}
                  fill="none"
                  stroke="#8e44ad"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Y-axis labels */}
                <text x="35" y="135" textAnchor="end" className="font-mono text-[8px]" fill="#6B7280">
                  1.0
                </text>
                <text x="35" y="167" textAnchor="end" className="font-mono text-[8px]" fill="#6B7280">
                  0
                </text>
                <text x="35" y="200" textAnchor="end" className="font-mono text-[8px]" fill="#6B7280">
                  -1
                </text>

                {/* Title */}
                <text x="200" y="125" textAnchor="middle" className="font-body text-[9px]" fill="#F2F2F2">
                  Corrélation HR/Vitesse (5min rolling)
                </text>
              </g>

              {/* X-axis label */}
              <text x="200" y="215" textAnchor="middle" className="font-body text-[9px]" fill="#6B7280">
                Temps (45 dernières minutes avant pic)
              </text>
            </svg>

            {/* Technical corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#e74c3c]" />
                <span className="text-mist/40 font-body text-xs">FC (bpm)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-glacier opacity-60" />
                <span className="text-mist/40 font-body text-xs">GAP Speed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-[#8e44ad]" />
                <span className="text-mist/40 font-body text-xs">Corrélation</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-[#e74c3c]/20" />
              <span className="text-mist/40 font-body text-xs">Zone de décorrélation</span>
            </div>
          </div>

          {/* Insight */}
          <div className="bg-[#e74c3c]/10 border border-[#e74c3c]/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <ThermometerIcon color="#e74c3c" />
              <div>
                <p className="text-mist font-body text-sm">
                  Pire décorrélation: <span className="font-mono font-bold" style={{ color }}>{worstCorr.toFixed(2)}</span>
                </p>
                <p className="text-mist/40 font-body text-xs mt-1">
                  {worstCorr < 0
                    ? "La FC et la vitesse évoluent en sens inverse - signe de stress thermique ou fatigue intense"
                    : "La synchronisation reste correcte - bonne gestion de l'effort"
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-mist/40 font-mono text-xs">DECOUPLING_ANALYSIS</span>
            </div>
            <span className="text-mist/40 font-mono text-xs">
              PEAK: {data.peak_hr} BPM
            </span>
          </div>

          {/* Decorative dots */}
          <div className="absolute bottom-6 right-6 flex gap-1">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
            <div className="w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>
    </div>
  );
}
