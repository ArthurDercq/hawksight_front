/**
 * AidStationChart - Bar chart showing time spent at aid stations
 * ==============================================================
 * Follows HawkSight design system
 */

import { useRef } from 'react';
import type { AidStation } from '@/types/analysis';

// Icons
const CoffeeIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" y1="2" x2="6" y2="4" />
    <line x1="10" y1="2" x2="10" y2="4" />
    <line x1="14" y1="2" x2="14" y2="4" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface AidStationChartProps {
  data: AidStation[];
  color?: string;
  onExport?: (ref: React.RefObject<HTMLDivElement>) => void;
}

export function AidStationChart({ data, color = '#E8832A', onExport }: AidStationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

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
                <CoffeeIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Temps aux Ravitaillements</h3>
                <p className="text-mist/40 font-body text-xs mt-1">Aucun arrêt détecté (&gt;5 min)</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-32 text-mist/40 font-body text-sm">
              Pas de ravitaillements détectés
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maxDuration = Math.max(...data.map(d => d.duration_min));
  const totalTime = data.reduce((sum, d) => sum + d.duration_min, 0);

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
                <CoffeeIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Temps aux Ravitaillements</h3>
                <p className="text-mist/40 font-body text-xs mt-1">
                  Stratégie de course - Total: <span className="font-mono" style={{ color }}>{Math.floor(totalTime)} min {Math.round((totalTime % 1) * 60)} sec</span>
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

          {/* Bar Chart */}
          <div className="space-y-4">
            {data.map((station, i) => {
              const widthPercent = (station.duration_min / maxDuration) * 100;

              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-sm text-mist">
                      {station.name}
                    </span>
                    <span className="font-mono text-sm font-semibold" style={{ color }}>
                      {station.duration_formatted ?? `${station.duration_min.toFixed(1)} min`}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="relative h-8 bg-charcoal-light border border-steel/20 rounded overflow-hidden">
                    {/* Grid background */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px)`,
                        backgroundSize: '20px 100%'
                      }}
                    />

                    {/* Bar fill */}
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-700 ease-out"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: `${color}20`,
                        borderRight: `2px solid ${color}`
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-50"
                        style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }}
                      />
                    </div>

                    {/* Markers */}
                    {[25, 50, 75].map((mark) => (
                      <div
                        key={mark}
                        className="absolute inset-y-0 w-px bg-steel/20"
                        style={{ left: `${mark}%` }}
                      />
                    ))}
                  </div>

                  {/* Km marker */}
                  <div className="flex justify-between text-mist/40 font-mono text-[10px]">
                    <span>km {station.km_point.toFixed(1)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-mist/40 font-mono text-xs">AID_STATION_ANALYSIS</span>
            </div>
            <span className="text-mist/40 font-mono text-xs">
              {data.length} STOP{data.length > 1 ? 'S' : ''}
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
