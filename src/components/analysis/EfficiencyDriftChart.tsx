/**
 * EfficiencyDriftChart - Line chart with altitude area background
 * ===============================================================
 * Follows HawkSight design system
 */

import { useRef, useMemo } from 'react';
import type { EfficiencyResult } from '@/types/analysis';

// Icons
const TrendingDownIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface EfficiencyDriftChartProps {
  data: EfficiencyResult;
  color?: string;
  onExport?: (ref: React.RefObject<HTMLDivElement>) => void;
}

export function EfficiencyDriftChart({ data, color = '#8e44ad', onExport }: EfficiencyDriftChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { efficiencyPath, altitudePath, bounds, firstHourX, lastHourStartX } = useMemo(() => {
    const ts = data.timeseries;
    if (ts.length === 0) {
      return {
        efficiencyPath: '',
        altitudePath: '',
        bounds: { minTime: 0, maxTime: 1, minEff: 0, maxEff: 1, minAlt: 0, maxAlt: 1 },
        firstHourX: 0,
        lastHourStartX: 0
      };
    }

    const times = ts.map(p => p.time_min);
    const effs = ts.map(p => p.efficiency);
    const alts = ts.map(p => p.altitude);

    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const minEff = Math.min(...effs) * 0.9;
    const maxEff = Math.max(...effs) * 1.1;
    const minAlt = Math.min(...alts);
    const maxAlt = Math.max(...alts);

    const timeRange = maxTime - minTime || 1;
    const effRange = maxEff - minEff || 1;
    const altRange = maxAlt - minAlt || 1;

    // Build paths
    let effPath = '';
    let altPath = '';

    ts.forEach((point, i) => {
      const x = 40 + ((point.time_min - minTime) / timeRange) * 320;
      const yEff = 20 + ((maxEff - point.efficiency) / effRange) * 160;
      const yAlt = 200 - ((point.altitude - minAlt) / altRange) * 80;

      if (i === 0) {
        effPath = `M ${x} ${yEff}`;
        altPath = `M 40 200 L ${x} ${yAlt}`;
      } else {
        effPath += ` L ${x} ${yEff}`;
        altPath += ` L ${x} ${yAlt}`;
      }
    });

    // Close altitude path for fill
    altPath += ` L 360 200 L 40 200 Z`;

    // Calculate highlight zones
    const firstHourX = 40 + (60 / timeRange) * 320;
    const lastHourStartX = 40 + ((maxTime - 60 - minTime) / timeRange) * 320;

    return {
      efficiencyPath: effPath,
      altitudePath: altPath,
      bounds: { minTime, maxTime, minEff, maxEff, minAlt, maxAlt },
      firstHourX: Math.min(firstHourX, 360),
      lastHourStartX: Math.max(lastHourStartX, 40)
    };
  }, [data.timeseries]);

  if (data.timeseries.length === 0) {
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
                <TrendingDownIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Analyse d'Efficacité</h3>
                <p className="text-mist/40 font-body text-xs mt-1">Pas de données disponibles</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-48 text-mist/40 font-body text-sm">
              Données insuffisantes
            </div>
          </div>
        </div>
      </div>
    );
  }

  const driftColor = data.loss_pct > 0 ? '#c0392b' : '#27ae60';
  const driftLabel = data.loss_pct > 0 ? `−${data.loss_pct.toFixed(1)}%` : `+${Math.abs(data.loss_pct).toFixed(1)}%`;

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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${color}, transparent)`, opacity: 0.05 }}
        />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/30">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <TrendingDownIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Endurance & Efficacité</h3>
                <p className="text-mist/40 font-body text-xs mt-1">
                  Drift d'efficacité: <span style={{ color: driftColor }} className="font-bold font-mono">{driftLabel}</span>
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

          {/* Chart */}
          <div className="relative border border-steel/20 rounded overflow-hidden bg-charcoal-light">
            {/* Grid background */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px), linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)`,
                backgroundSize: '40px 40px'
              }}
            />

            <svg viewBox="0 0 400 220" className="w-full h-auto">
              <defs>
                <linearGradient id="effGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
                <filter id="effGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* First hour highlight zone */}
              <rect
                x="40"
                y="20"
                width={firstHourX - 40}
                height="180"
                fill="#6DAA75"
                opacity="0.08"
              />

              {/* Last hour highlight zone */}
              <rect
                x={lastHourStartX}
                y="20"
                width={360 - lastHourStartX}
                height="180"
                fill="#c0392b"
                opacity="0.08"
              />

              {/* Altitude area (background) */}
              <path
                d={altitudePath}
                fill="#3A3F47"
                opacity="0.15"
              />

              {/* Horizontal grid lines */}
              {[0, 25, 50, 75, 100].map((percent) => (
                <line
                  key={percent}
                  x1="40"
                  y1={20 + (percent / 100) * 160}
                  x2="360"
                  y2={20 + (percent / 100) * 160}
                  stroke="#3A3F47"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
              ))}

              {/* Efficiency line */}
              <path
                d={efficiencyPath}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#effGlow)"
              />

              {/* Start average line */}
              {data.start_avg > 0 && (
                <line
                  x1="40"
                  y1={20 + ((bounds.maxEff - data.start_avg) / (bounds.maxEff - bounds.minEff)) * 160}
                  x2={firstHourX}
                  y2={20 + ((bounds.maxEff - data.start_avg) / (bounds.maxEff - bounds.minEff)) * 160}
                  stroke="#6DAA75"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
              )}

              {/* End average line */}
              {data.end_avg > 0 && (
                <line
                  x1={lastHourStartX}
                  y1={20 + ((bounds.maxEff - data.end_avg) / (bounds.maxEff - bounds.minEff)) * 160}
                  x2="360"
                  y2={20 + ((bounds.maxEff - data.end_avg) / (bounds.maxEff - bounds.minEff)) * 160}
                  stroke="#c0392b"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                />
              )}

              {/* X-axis labels */}
              <text x="40" y="210" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">
                0 min
              </text>
              <text x="200" y="210" textAnchor="middle" className="font-mono text-[9px]" fill="#6B7280">
                {Math.round(bounds.maxTime / 2)} min
              </text>
              <text x="360" y="210" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">
                {Math.round(bounds.maxTime)} min
              </text>

              {/* Y-axis labels */}
              <text x="35" y="25" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">
                {bounds.maxEff.toFixed(2)}
              </text>
              <text x="35" y="180" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">
                {bounds.minEff.toFixed(2)}
              </text>

              {/* Axis label */}
              <text x="12" y="100" textAnchor="middle" transform="rotate(-90, 12, 100)" className="font-body text-[9px]" fill="#F2F2F2">
                Effort m/beat
              </text>
            </svg>

            {/* Technical corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-moss/10 border border-moss/30 rounded-lg p-3">
              <div className="text-moss font-body text-xs">Début (1ère heure)</div>
              <div className="text-mist font-mono text-lg mt-1">
                {data.start_avg.toFixed(3)}
              </div>
              <div className="text-mist/40 font-body text-[10px]">effort-m/beat</div>
            </div>

            <div className="bg-[#c0392b]/10 border border-[#c0392b]/30 rounded-lg p-3">
              <div className="text-[#c0392b] font-body text-xs">Fin (dernière heure)</div>
              <div className="text-mist font-mono text-lg mt-1">
                {data.end_avg.toFixed(3)}
              </div>
              <div className="text-mist/40 font-body text-[10px]">effort-m/beat</div>
            </div>

            <div className="border border-steel/30 rounded-lg p-3" style={{ backgroundColor: `${driftColor}10` }}>
              <div className="font-body text-xs" style={{ color: driftColor }}>Drift</div>
              <div className="font-mono text-lg mt-1" style={{ color: driftColor }}>
                {driftLabel}
              </div>
              <div className="text-mist/40 font-body text-[10px]">fatigue normalisée</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-mist/40 font-mono text-xs">EFFICIENCY_ANALYSIS</span>
            </div>
            <span className="text-mist/40 font-mono text-xs">
              {data.timeseries.length} SAMPLES
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
