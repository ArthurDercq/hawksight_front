/**
 * CriticalMomentCard — zoom sur l'événement critique de la sortie (§14.1 méthodo)
 * ================================================================================
 * FC + GAP superposés (double axe, précédent VAMComparisonChart), rolling_corr
 * en bande séparée en dessous — zone rouge quand rolling_corr < 0 (discordance
 * : la FC monte quand la vitesse chute).
 *
 * Ne rend rien si critical_window est null (aucune ancre trouvée — sortie
 * plate/saine, pas d'événement notable) : pattern déjà en place pour
 * surfaceClassification/trailStats optionnels sur ActivityDetailPage.
 */
import { useRef, useMemo } from 'react';
import type { CriticalWindow } from '@/types/ef';

const ZoomIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ANCHOR_LABELS: Record<CriticalWindow['anchor_type'], string> = {
  collapse: 'Effondrement',
  microstop_burst: 'Rafale de micro-arrêts',
  hr_peak: 'Pic de fréquence cardiaque',
};

interface CriticalMomentCardProps {
  criticalWindow: CriticalWindow | null;
  color?: string;
}

const CHART_X0 = 40;
const CHART_X1 = 360;
const TOP_Y0 = 15;
const TOP_Y1 = 130;
const CORR_Y0 = 145;
const CORR_Y1 = 200;

export function CriticalMomentCard({ criticalWindow, color = '#c0392b' }: CriticalMomentCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chart = useMemo(() => {
    if (!criticalWindow || criticalWindow.series.length === 0) return null;
    const { series } = criticalWindow;

    const times = series.map((p) => p.t_min);
    const gaps = series.map((p) => p.gap);
    const hrs = series.map((p) => p.hr);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    const timeRange = maxT - minT || 1;
    const minGap = Math.min(...gaps) * 0.9;
    const maxGap = Math.max(...gaps) * 1.1;
    const gapRange = maxGap - minGap || 1;
    const minHr = Math.min(...hrs) - 5;
    const maxHr = Math.max(...hrs) + 5;
    const hrRange = maxHr - minHr || 1;

    const xOf = (t: number) => CHART_X0 + ((t - minT) / timeRange) * (CHART_X1 - CHART_X0);

    let gapPath = '';
    let hrPath = '';
    series.forEach((p, i) => {
      const x = xOf(p.t_min);
      const yGap = TOP_Y1 - ((p.gap - minGap) / gapRange) * (TOP_Y1 - TOP_Y0);
      const yHr = TOP_Y1 - ((p.hr - minHr) / hrRange) * (TOP_Y1 - TOP_Y0);
      gapPath += i === 0 ? `M ${x} ${yGap}` : ` L ${x} ${yGap}`;
      hrPath += i === 0 ? `M ${x} ${yHr}` : ` L ${x} ${yHr}`;
    });

    // Bande rolling_corr : segments rouges quand corr < 0
    const corrSegments: { x0: number; x1: number; negative: boolean }[] = [];
    for (let i = 0; i < series.length - 1; i++) {
      const corr = series[i].rolling_corr;
      if (corr == null) continue;
      corrSegments.push({ x0: xOf(series[i].t_min), x1: xOf(series[i + 1].t_min), negative: corr < 0 });
    }

    let corrPath = '';
    series.forEach((p) => {
      if (p.rolling_corr == null) return;
      const x = xOf(p.t_min);
      const y = CORR_Y1 - ((p.rolling_corr + 1) / 2) * (CORR_Y1 - CORR_Y0);
      corrPath += corrPath === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    return { gapPath, hrPath, corrPath, corrSegments, anchorX: xOf(criticalWindow.anchor_min) };
  }, [criticalWindow]);

  if (!criticalWindow || !chart) return null;

  return (
    <div ref={chartRef} className="hw-card-dark-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="p-2 bg-[#c0392b]/10 border border-[#c0392b]/30 rounded-lg text-[#c0392b] shrink-0">
          <ZoomIcon color={color} />
        </div>
        <div>
          <div className="text-sm font-semibold text-mist">Moment critique</div>
          <div className="hw-text-caption text-steel mt-0.5">
            {ANCHOR_LABELS[criticalWindow.anchor_type]} à {Math.round(criticalWindow.anchor_min)} min
          </div>
        </div>
      </div>

      <div className="relative border border-steel/20 rounded overflow-hidden bg-charcoal-light">
        <svg viewBox="0 0 400 210" className="w-full h-auto">
          {/* Ancre */}
          <line x1={chart.anchorX} y1={TOP_Y0} x2={chart.anchorX} y2={CORR_Y1} stroke={color} strokeWidth="1.5" strokeDasharray="4,3" opacity="0.6" />

          {/* GAP */}
          <path d={chart.gapPath} fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {/* FC */}
          <path d={chart.hrPath} fill="none" stroke="#E8832A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Séparateur */}
          <line x1={CHART_X0} y1="138" x2={CHART_X1} y2="138" stroke="#3A3F47" strokeWidth="1" opacity="0.4" />
          <text x={CHART_X0} y="150" className="font-mono text-[8px]" fill="#6B7280">rolling_corr (GAP × FC, 5 min)</text>

          {/* Bande rolling_corr : zone rouge quand corr < 0 */}
          {chart.corrSegments.filter((s) => s.negative).map((s, i) => (
            <rect key={i} x={s.x0} y={CORR_Y0} width={Math.max(1, s.x1 - s.x0)} height={CORR_Y1 - CORR_Y0} fill="#c0392b" opacity="0.12" />
          ))}
          <line x1={CHART_X0} y1={(CORR_Y0 + CORR_Y1) / 2} x2={CHART_X1} y2={(CORR_Y0 + CORR_Y1) / 2} stroke="#9CA3AF" strokeWidth="0.5" opacity="0.3" />
          <path d={chart.corrPath} fill="none" stroke="#F2F2F2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Axe X */}
          <text x={CHART_X0} y="205" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">
            {Math.round(criticalWindow.series[0].t_min)} min
          </text>
          <text x={CHART_X1} y="205" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">
            {Math.round(criticalWindow.series[criticalWindow.series.length - 1].t_min)} min
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-glacier" />
          <span className="text-mist/40 font-body text-xs">GAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-amber" />
          <span className="text-mist/40 font-body text-xs">FC</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#c0392b]/20 border border-[#c0392b]/40" />
          <span className="text-mist/40 font-body text-xs">Discordance (corr &lt; 0)</span>
        </div>
      </div>
    </div>
  );
}
