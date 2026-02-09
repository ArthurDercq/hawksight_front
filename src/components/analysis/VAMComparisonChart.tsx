/**
 * VAMComparisonChart - Bar chart with VAM + Line for HR
 * =====================================================
 * Follows HawkSight design system
 */

import { useRef, useMemo } from 'react';
import type { ClimbVAM } from '@/types/analysis';

// Icons
const MountainIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface VAMComparisonChartProps {
  data: ClimbVAM[];
  color?: string;
  onExport?: (ref: React.RefObject<HTMLDivElement>) => void;
}

export function VAMComparisonChart({ data, color = '#E8832A', onExport }: VAMComparisonChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { maxVAM, minHR, maxHR } = useMemo(() => {
    if (data.length === 0) return { maxVAM: 1000, minHR: 140, maxHR: 180 };
    const vams = data.map(d => d.vam);
    const hrs = data.map(d => d.avg_hr);
    return {
      maxVAM: Math.max(...vams) * 1.2,
      minHR: Math.min(...hrs) - 10,
      maxHR: Math.max(...hrs) + 10
    };
  }, [data]);

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
          {/* Grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none rounded-lg"
            style={{
              backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px), linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)`,
              backgroundSize: '16px 16px',
              opacity: 0.03,
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-3 pb-4 border-b border-steel/30">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <MountainIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Comparaison des Montées</h3>
                <p className="text-mist/40 font-body text-xs mt-1">Aucune montée significative détectée</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-48 text-mist/40 font-body text-sm">
              Pas de montées détectées (&gt;100m D+)
            </div>
          </div>
        </div>
      </div>
    );
  }

  const barWidth = Math.min(60, 300 / data.length);
  const barGap = Math.min(30, 150 / data.length);

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
        {/* Grid pattern background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px), linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
            opacity: 0.03,
          }}
        />

        {/* Corner glow */}
        <div
          className="absolute top-0 left-0 w-32 h-32 pointer-events-none"
          style={{ background: `radial-gradient(circle at top left, #3DB2E0, transparent)`, opacity: 0.08 }}
        />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/30">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <MountainIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Analyse des Montées (VAM)</h3>
                <p className="text-mist/40 font-body text-xs mt-1">
                  Vitesse Ascensionnelle Moyenne & Fréquence Cardiaque
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
                backgroundImage: `linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)`,
                backgroundSize: '100% 40px'
              }}
            />

            <svg viewBox={`0 0 ${50 + data.length * (barWidth + barGap)} 250`} className="w-full h-auto">
              {/* Y-axis left (VAM) */}
              {[0, 250, 500, 750, 1000].map((vam) => {
                const y = 200 - (vam / maxVAM) * 180;
                return (
                  <g key={`vam-${vam}`}>
                    <line x1="45" y1={y} x2={45 + data.length * (barWidth + barGap)} y2={y} stroke="#3A3F47" strokeWidth="0.5" opacity="0.2" />
                    <text x="40" y={y + 3} textAnchor="end" className="font-mono text-[9px]" fill="#3DB2E0">
                      {vam}
                    </text>
                  </g>
                );
              })}

              {/* Y-axis right (HR) - labels only */}
              {[140, 150, 160, 170, 180].map((hr) => {
                if (hr < minHR || hr > maxHR) return null;
                const y = 200 - ((hr - minHR) / (maxHR - minHR)) * 180;
                return (
                  <text
                    key={`hr-${hr}`}
                    x={50 + data.length * (barWidth + barGap) + 5}
                    y={y + 3}
                    textAnchor="start"
                    className="font-mono text-[9px]"
                    fill="#E8832A"
                  >
                    {hr}
                  </text>
                );
              })}

              {/* Bars (VAM) */}
              {data.map((climb, i) => {
                const x = 50 + i * (barWidth + barGap);
                const barHeight = (climb.vam / maxVAM) * 180;
                const y = 200 - barHeight;

                return (
                  <g key={i}>
                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="#3DB2E0"
                      opacity="0.3"
                    />
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill="none"
                      stroke="#3DB2E0"
                      strokeWidth="2"
                    />

                    {/* VAM value inside bar */}
                    <text
                      x={x + barWidth / 2}
                      y={y + barHeight / 2 + 4}
                      textAnchor="middle"
                      className="font-mono text-[10px] font-bold"
                      fill="#F2F2F2"
                    >
                      {Math.round(climb.vam)}
                    </text>

                    {/* Climb name */}
                    <text
                      x={x + barWidth / 2}
                      y="220"
                      textAnchor="middle"
                      className="font-body text-[8px]"
                      fill="#F2F2F2"
                    >
                      {climb.climb_name.length > 12 ? climb.climb_name.substring(0, 12) + '...' : climb.climb_name}
                    </text>

                    {/* D+ label */}
                    <text
                      x={x + barWidth / 2}
                      y="235"
                      textAnchor="middle"
                      className="font-mono text-[8px]"
                      fill="#6B7280"
                    >
                      +{climb.elev_gain}m
                    </text>
                  </g>
                );
              })}

              {/* HR Line */}
              <path
                d={data.map((climb, i) => {
                  const x = 50 + i * (barWidth + barGap) + barWidth / 2;
                  const y = 200 - ((climb.avg_hr - minHR) / (maxHR - minHR)) * 180;
                  return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                }).join(' ')}
                fill="none"
                stroke="#E8832A"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* HR Points */}
              {data.map((climb, i) => {
                const x = 50 + i * (barWidth + barGap) + barWidth / 2;
                const y = 200 - ((climb.avg_hr - minHR) / (maxHR - minHR)) * 180;

                return (
                  <g key={`hr-point-${i}`}>
                    <circle cx={x} cy={y} r="6" fill="#E8832A" />
                    <circle cx={x} cy={y} r="3" fill="#F2F2F2" />
                    {/* HR value */}
                    <text
                      x={x + 15}
                      y={y - 8}
                      textAnchor="middle"
                      className="font-mono text-[9px] font-bold"
                      fill="#E8832A"
                    >
                      {Math.round(climb.avg_hr)}
                    </text>
                  </g>
                );
              })}

              {/* Axis labels */}
              <text x="15" y="110" textAnchor="middle" transform="rotate(-90, 15, 110)" className="font-body text-[10px]" fill="#3DB2E0">
                VAM (m/h)
              </text>
            </svg>

            {/* Technical corners */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20" style={{ borderColor: color }} />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-3 bg-glacier/30 border border-glacier" />
              <span className="text-mist/40 font-body text-xs">VAM (m/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-amber" />
              <div className="w-2 h-2 rounded-full bg-amber" />
              <span className="text-mist/40 font-body text-xs">FC moy. (bpm)</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-mist/40 font-mono text-xs">CLIMB_ANALYSIS</span>
            </div>
            <span className="text-mist/40 font-mono text-xs">
              {data.length} CLIMB{data.length > 1 ? 'S' : ''}
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
