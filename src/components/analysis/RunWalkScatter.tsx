/**
 * RunWalkScatter - Scatter plot showing run vs walk transition
 * ============================================================
 * Follows HawkSight design system
 */

import { useRef, useMemo } from 'react';
import type { RunWalkPoint } from '@/types/analysis';

// Icons
const ActivityIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface RunWalkScatterProps {
  data: RunWalkPoint[];
  color?: string;
  onExport?: (ref: React.RefObject<HTMLDivElement>) => void;
}

// Color scale for cadence (120 SPM = blue/walk, 180 SPM = red/run)
function getCadenceColor(cadence: number): string {
  const minCadence = 120;
  const maxCadence = 180;
  const normalized = Math.max(0, Math.min(1, (cadence - minCadence) / (maxCadence - minCadence)));

  // Blue (walk) -> Yellow -> Red (run)
  if (normalized < 0.5) {
    const t = normalized * 2;
    const r = Math.round(61 + t * (255 - 61));
    const g = Math.round(178 + t * (193 - 178));
    const b = Math.round(224 - t * 217);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (normalized - 0.5) * 2;
    const r = Math.round(255 - t * 23);
    const g = Math.round(193 - t * 62);
    const b = Math.round(7 + t * 35);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export function RunWalkScatter({ data, color = '#E8832A', onExport }: RunWalkScatterProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (data.length === 0) return { minSlope: -30, maxSlope: 30, minSpeed: 0, maxSpeed: 20 };

    const slopes = data.map(d => d.slope);
    const speeds = data.map(d => d.speed_kmh);

    return {
      minSlope: Math.max(-35, Math.min(...slopes) - 5),
      maxSlope: Math.min(35, Math.max(...slopes) + 5),
      minSpeed: 0,
      maxSpeed: Math.min(25, Math.max(...speeds) + 2)
    };
  }, [data]);

  // Transform data to SVG coordinates
  const points = useMemo(() => {
    const { minSlope, maxSlope, minSpeed, maxSpeed } = bounds;
    const slopeRange = maxSlope - minSlope;
    const speedRange = maxSpeed - minSpeed;

    return data.map(point => ({
      x: 40 + ((point.slope - minSlope) / slopeRange) * 320,
      y: 10 + ((maxSpeed - point.speed_kmh) / speedRange) * 180,
      color: getCadenceColor(point.cadence),
      cadence: point.cadence,
      slope: point.slope,
      speed: point.speed_kmh
    }));
  }, [data, bounds]);

  if (data.length === 0) {
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
                <ActivityIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Analyse Course/Marche</h3>
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
          className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none"
          style={{ background: `radial-gradient(circle at bottom left, #3DB2E0, transparent)`, opacity: 0.08 }}
        />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/30">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <ActivityIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Analyse Biomécanique</h3>
                <p className="text-mist/40 font-body text-xs mt-1">
                  Transition Course/Marche par gradient
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

          {/* Scatter Plot */}
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
              {/* Grid lines */}
              {[-20, -10, 0, 10, 20].map((slope) => {
                const x = 40 + ((slope - bounds.minSlope) / (bounds.maxSlope - bounds.minSlope)) * 320;
                return (
                  <g key={`slope-${slope}`}>
                    <line x1={x} y1="10" x2={x} y2="190" stroke="#9CA3AF" strokeWidth="0.5" opacity="0.3" />
                    <text x={x} y="208" textAnchor="middle" className="font-mono text-[10px]" fill="#6B7280">
                      {slope}%
                    </text>
                  </g>
                );
              })}

              {[5, 10, 15, 20].map((speed) => {
                const y = 10 + ((bounds.maxSpeed - speed) / (bounds.maxSpeed - bounds.minSpeed)) * 180;
                return (
                  <g key={`speed-${speed}`}>
                    <line x1="40" y1={y} x2="360" y2={y} stroke="#9CA3AF" strokeWidth="0.5" opacity="0.3" />
                    <text x="35" y={y + 3} textAnchor="end" className="font-mono text-[10px]" fill="#6B7280">
                      {speed}
                    </text>
                  </g>
                );
              })}

              {/* Transition zone highlight (0-8% slope) */}
              <rect
                x={40 + ((0 - bounds.minSlope) / (bounds.maxSlope - bounds.minSlope)) * 320}
                y="10"
                width={((8 - 0) / (bounds.maxSlope - bounds.minSlope)) * 320}
                height="180"
                fill="#6DAA75"
                opacity="0.1"
              />

              {/* Vertical line at 0% */}
              <line
                x1={40 + ((0 - bounds.minSlope) / (bounds.maxSlope - bounds.minSlope)) * 320}
                y1="10"
                x2={40 + ((0 - bounds.minSlope) / (bounds.maxSlope - bounds.minSlope)) * 320}
                y2="190"
                stroke="#9CA3AF"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.5"
              />

              {/* Data points */}
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="2.5"
                  fill={point.color}
                  opacity="0.7"
                />
              ))}

              {/* Axis labels */}
              <text x="200" y="220" textAnchor="middle" className="font-body text-[10px]" fill="#F2F2F2">
                Pente (%)
              </text>
              <text x="12" y="100" textAnchor="middle" transform="rotate(-90, 12, 100)" className="font-body text-[10px]" fill="#F2F2F2">
                Vitesse (km/h)
              </text>
            </svg>

            {/* Technical corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
          </div>

          {/* Legend - Cadence color scale */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-glacier" />
                <span className="text-mist/40 font-body text-xs">Marche (&lt;120 spm)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFC107' }} />
                <span className="text-mist/40 font-body text-xs">Transition</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber" />
                <span className="text-mist/40 font-body text-xs">Course (&gt;180 spm)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-moss/20 rounded" />
              <span className="text-mist/40 font-body text-xs">Zone de transition</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-mist/40 font-mono text-xs">RUN_WALK_ANALYSIS</span>
            </div>
            <span className="text-mist/40 font-mono text-xs">
              {data.length} POINTS
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
