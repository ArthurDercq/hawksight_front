/**
 * ForceProfileHeatmap - 1D heatmap showing GAP pace by gradient
 * =============================================================
 * Follows HawkSight design system
 */

import { useRef, useMemo } from 'react';
import type { ForceProfilePoint } from '@/types/analysis';

// Icons
const TargetIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const DownloadIcon = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface ForceProfileHeatmapProps {
  data: ForceProfilePoint[];
  color?: string;
  onExport?: (ref: React.RefObject<HTMLDivElement>) => void;
}

// Color scale for pace: fast (green) -> slow (red)
function getPaceColor(pace: number, minPace: number, maxPace: number): string {
  if (pace === 0) return '#1F2833'; // No data - charcoal-light

  const normalized = Math.max(0, Math.min(1, (pace - minPace) / (maxPace - minPace)));

  // Green (fast) -> Yellow -> Orange (slow)
  if (normalized < 0.5) {
    const t = normalized * 2;
    const r = Math.round(109 + t * 146); // moss -> amber transition
    const g = Math.round(170 - t * 39);
    const b = Math.round(117 - t * 75);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const t = (normalized - 0.5) * 2;
    const r = Math.round(232 - t * 30);
    const g = Math.round(131 - t * 80);
    const b = Math.round(42 + t * 20);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

function formatPace(pace: number): string {
  if (pace === 0) return '--';
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ForceProfileHeatmap({ data, color = '#E8832A', onExport }: ForceProfileHeatmapProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  // Filter out zero values and calculate bounds
  const { filteredData, minPace, maxPace, avgPace } = useMemo(() => {
    const nonZero = data.filter(d => d.gap_pace_min_km > 0);
    if (nonZero.length === 0) {
      return { filteredData: data, minPace: 4, maxPace: 12, avgPace: 0 };
    }

    const paces = nonZero.map(d => d.gap_pace_min_km);
    const avg = paces.reduce((a, b) => a + b, 0) / paces.length;

    return {
      filteredData: data,
      minPace: Math.min(...paces),
      maxPace: Math.max(...paces),
      avgPace: avg
    };
  }, [data]);

  // Find strength and weakness zones
  const analysis = useMemo(() => {
    const nonZero = data.filter(d => d.gap_pace_min_km > 0);
    if (nonZero.length === 0) return null;

    // Best pace in uphill (positive slope)
    const uphillData = nonZero.filter(d => d.slope_bin > 5);
    const downhillData = nonZero.filter(d => d.slope_bin < -5);
    const flatData = nonZero.filter(d => d.slope_bin >= -5 && d.slope_bin <= 5);

    const bestUphill = uphillData.length > 0
      ? uphillData.reduce((best, curr) => curr.gap_pace_min_km < best.gap_pace_min_km ? curr : best)
      : null;

    const bestDownhill = downhillData.length > 0
      ? downhillData.reduce((best, curr) => curr.gap_pace_min_km < best.gap_pace_min_km ? curr : best)
      : null;

    const avgFlat = flatData.length > 0
      ? flatData.reduce((sum, d) => sum + d.gap_pace_min_km, 0) / flatData.length
      : 0;

    return { bestUphill, bestDownhill, avgFlat };
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
                <TargetIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Profil de Force</h3>
                <p className="text-mist/40 font-body text-xs mt-1">Pas de données disponibles</p>
              </div>
            </div>
            <div className="flex items-center justify-center h-32 text-mist/40 font-body text-sm">
              Données insuffisantes
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Select key slopes to display (-30, -20, -10, 0, 10, 20, 30)
  const keySlopes = [-30, -20, -10, -5, 0, 5, 10, 20, 30];
  const displayData = keySlopes.map(slope => {
    const point = filteredData.find(d => d.slope_bin === slope);
    return point || { slope_bin: slope, gap_pace_min_km: 0 };
  });

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
          className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none"
          style={{ background: `radial-gradient(circle at bottom right, #6DAA75, transparent)`, opacity: 0.08 }}
        />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/30">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <TargetIcon color={color} />
              </div>
              <div>
                <h3 className="font-heading text-mist">Profil de Force (GAP)</h3>
                <p className="text-mist/40 font-body text-xs mt-1">
                  Efficacité par gradient - Allure GAP médiane
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

          {/* Heatmap */}
          <div className="space-y-2">
            {/* Labels row */}
            <div className="flex justify-between px-2">
              <span className="text-mist/40 font-mono text-[10px]">Descente</span>
              <span className="text-mist/40 font-mono text-[10px]">Plat</span>
              <span className="text-mist/40 font-mono text-[10px]">Montée</span>
            </div>

            {/* Heatmap cells */}
            <div className="flex gap-1">
              {displayData.map((point, i) => {
                const bgColor = getPaceColor(point.gap_pace_min_km, minPace, maxPace);
                const isZero = point.slope_bin === 0;

                return (
                  <div
                    key={i}
                    className={`flex-1 rounded transition-all duration-300 hover:scale-105 ${isZero ? 'ring-2 ring-mist/30' : ''}`}
                    style={{ backgroundColor: bgColor }}
                  >
                    <div className="p-2 text-center">
                      <div className="text-mist font-mono text-xs font-bold">
                        {formatPace(point.gap_pace_min_km)}
                      </div>
                      <div className="text-mist/70 font-mono text-[10px] mt-1">
                        {point.slope_bin > 0 ? '+' : ''}{point.slope_bin}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Color scale legend */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <span className="text-moss font-body text-xs">Rapide</span>
              <div className="flex h-3 w-32 rounded overflow-hidden">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1"
                    style={{ backgroundColor: getPaceColor(minPace + (i / 9) * (maxPace - minPace), minPace, maxPace) }}
                  />
                ))}
              </div>
              <span className="text-amber font-body text-xs">Lent</span>
            </div>
          </div>

          {/* Analysis insights */}
          {analysis && (
            <div className="grid grid-cols-3 gap-3">
              {/* Uphill strength */}
              <div className="bg-moss/10 border border-moss/30 rounded-lg p-3">
                <div className="text-moss font-body text-xs">Force en montée</div>
                {analysis.bestUphill ? (
                  <>
                    <div className="text-mist font-mono text-lg mt-1">
                      {formatPace(analysis.bestUphill.gap_pace_min_km)}
                    </div>
                    <div className="text-mist/40 font-mono text-[10px]">
                      à {analysis.bestUphill.slope_bin}%
                    </div>
                  </>
                ) : (
                  <div className="text-mist/40 font-body text-sm mt-1">N/A</div>
                )}
              </div>

              {/* Flat pace */}
              <div className="bg-steel/20 border border-steel/30 rounded-lg p-3">
                <div className="text-mist font-body text-xs">Allure sur plat</div>
                <div className="text-mist font-mono text-lg mt-1">
                  {formatPace(analysis.avgFlat)}
                </div>
                <div className="text-mist/40 font-mono text-[10px]">
                  moy. -5% à +5%
                </div>
              </div>

              {/* Downhill */}
              <div className="bg-glacier/10 border border-glacier/30 rounded-lg p-3">
                <div className="text-glacier font-body text-xs">Force en descente</div>
                {analysis.bestDownhill ? (
                  <>
                    <div className="text-mist font-mono text-lg mt-1">
                      {formatPace(analysis.bestDownhill.gap_pace_min_km)}
                    </div>
                    <div className="text-mist/40 font-mono text-[10px]">
                      à {analysis.bestDownhill.slope_bin}%
                    </div>
                  </>
                ) : (
                  <div className="text-mist/40 font-body text-sm mt-1">N/A</div>
                )}
              </div>
            </div>
          )}

          {/* Correlation insight */}
          <div className="bg-charcoal-light border border-steel/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-mist/40 font-body text-xs">
              <span className="text-mist">Corrélation Pente/Allure:</span>
              <span>Plus la pente est raide, plus l'allure GAP diminue (normal). Cherche les anomalies!</span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-steel/30">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-mist/40 font-mono text-xs">FORCE_PROFILE</span>
            </div>
            <span className="text-mist/40 font-mono text-xs">
              AVG GAP: {formatPace(avgPace)} /km
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
