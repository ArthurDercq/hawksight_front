/**
 * TrailAnalysisDashboard - Container for all trail analysis charts
 * ================================================================
 * Follows HawkSight design system
 */

import { useCallback } from 'react';
import type { TrailAnalysisResult } from '@/types/analysis';
import { AidStationChart } from './AidStationChart';
import { RunWalkScatter } from './RunWalkScatter';
import { VAMComparisonChart } from './VAMComparisonChart';
import { DecouplingChart } from './DecouplingChart';
import { ForceProfileHeatmap } from './ForceProfileHeatmap';
import { formatNumber } from '@/services/utils/formatters';

// Icons
const ChartBarIcon = ({ color }: { color: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const ClockIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const MountainIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

const MapPinIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

interface TrailAnalysisDashboardProps {
  data: TrailAnalysisResult;
  color?: string;
}

// Format duration in hours and minutes
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  }
  return `${mins}min`;
}

export function TrailAnalysisDashboard({ data, color = '#E8832A' }: TrailAnalysisDashboardProps) {
  // Export function for charts
  const exportChart = useCallback(async (ref: React.RefObject<HTMLDivElement>, name?: string) => {
    if (!ref.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#0B0C10',
        scale: 3,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hawksight-${name || 'chart'}-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  }, []);

  return (
    <div className="space-y-8">
      {/* Activity Summary Header */}
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
          {/* Corner glow */}
          <div
            className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
            style={{ background: `radial-gradient(circle at top right, ${color}, transparent)`, opacity: 0.08 }}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-lg border"
                style={{ backgroundColor: `${color}10`, borderColor: `${color}30` }}
              >
                <ChartBarIcon color={color} />
              </div>
              <div>
                <h2 className="text-mist font-heading text-xl">{data.activity_name}</h2>
                <p className="text-mist/40 font-body text-sm mt-1">
                  Analyse complète de la performance trail
                </p>
              </div>
            </div>

            {/* Key metrics */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <MapPinIcon color="#6B7280" />
                <div>
                  <div className="text-mist font-mono text-lg">
                    {data.distance_km.toFixed(1)} km
                  </div>
                  <div className="text-mist/40 font-body text-xs">Distance</div>
                </div>
              </div>

              <div className="w-px h-10 bg-steel/30" />

              <div className="flex items-center gap-2">
                <ClockIcon color="#6B7280" />
                <div>
                  <div className="text-mist font-mono text-lg">
                    {formatDuration(data.duration_seconds)}
                  </div>
                  <div className="text-mist/40 font-body text-xs">Durée</div>
                </div>
              </div>

              <div className="w-px h-10 bg-steel/30" />

              <div className="flex items-center gap-2">
                <MountainIcon color="#6B7280" />
                <div>
                  <div className="text-mist font-mono text-lg">
                    {formatNumber(data.elevation_gain)}m
                  </div>
                  <div className="text-mist/40 font-body text-xs">D+</div>
                </div>
              </div>
            </div>
          </div>

          {/* Decorative dots */}
          <div className="absolute bottom-4 right-4 flex gap-1">
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
            <div className="w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: color }} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1: Aid Stations + Run/Walk */}
        <AidStationChart
          data={data.aid_stations}
          color={color}
          onExport={(ref) => exportChart(ref, 'aid-stations')}
        />

        <RunWalkScatter
          data={data.run_walk_data}
          color={color}
          onExport={(ref) => exportChart(ref, 'run-walk')}
        />

        {/* Row 2: VAM + Efficiency */}
        <VAMComparisonChart
          data={data.vam_comparison}
          color={color}
          onExport={(ref) => exportChart(ref, 'vam-comparison')}
        />

        {/* Row 3: Decoupling + Force Profile (full width) */}
        <DecouplingChart
          data={data.decoupling}
          color="#e74c3c"
          onExport={(ref) => exportChart(ref, 'decoupling')}
        />

        {/* Force Profile (full width) */}
        <div className="lg:col-span-2">
          <ForceProfileHeatmap
            data={data.force_profile}
            color={color}
            onExport={(ref) => exportChart(ref, 'force-profile')}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-mist/40 font-mono text-xs py-4">
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        <span>TRAIL_ANALYSIS_COMPLETE</span>
        <span className="text-mist/20">|</span>
        <span>HAWKSIGHT</span>
      </div>
    </div>
  );
}
