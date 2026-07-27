/**
 * CriticalMomentCard — zoom sur l'événement critique de la sortie (§14.1 méthodo)
 * ================================================================================
 * GAP + FC superposés (double axe), rolling_corr en bande séparée en dessous —
 * zone rouge quand rolling_corr < 0 (discordance : la FC monte quand la
 * vitesse chute).
 *
 * Ne rend rien si critical_window est null (aucune ancre trouvée — sortie
 * plate/saine, pas d'événement notable) : pattern déjà en place pour
 * surfaceClassification/trailStats optionnels sur ActivityDetailPage.
 *
 * SVG maison suivant le gabarit PaceProfileChart (viewBox/marges) — cf.
 * hawksight-charts skill, Partie A.6. Deux zones de dessin empilées dans un
 * même SVG plutôt que deux composants distincts : la bande de corrélation
 * n'a de sens que rattachée au même axe temporel que GAP/FC au-dessus.
 */
import { useId, useMemo } from 'react';
import type { CriticalWindow } from '@/types/ef';

const ANCHOR_LABELS: Record<CriticalWindow['anchor_type'], string> = {
  collapse: 'Effondrement',
  microstop_burst: 'Rafale de micro-arrêts',
  hr_peak: 'Pic de fréquence cardiaque',
};

const SVG_W = 440;
const SVG_H = 210;
const MARGIN = { left: 32, right: 16 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
// Zone haute : GAP + FC superposés
const TOP_Y0 = 8;
const TOP_Y1 = 118;
// Zone basse : bande rolling_corr
const CORR_Y0 = 138;
const CORR_Y1 = 180;
const AXIS_Y = 196;

interface CriticalMomentCardProps {
  criticalWindow: CriticalWindow | null;
}

export function CriticalMomentCard({ criticalWindow }: CriticalMomentCardProps) {
  const uid = useId();

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

    const toX = (t: number) => MARGIN.left + ((t - minT) / timeRange) * CHART_W;

    let gapPath = '';
    let hrPath = '';
    series.forEach((p, i) => {
      const x = toX(p.t_min);
      const yGap = TOP_Y1 - ((p.gap - minGap) / gapRange) * (TOP_Y1 - TOP_Y0);
      const yHr = TOP_Y1 - ((p.hr - minHr) / hrRange) * (TOP_Y1 - TOP_Y0);
      gapPath += i === 0 ? `M ${x} ${yGap}` : ` L ${x} ${yGap}`;
      hrPath += i === 0 ? `M ${x} ${yHr}` : ` L ${x} ${yHr}`;
    });

    const corrSegments: { x0: number; x1: number; negative: boolean }[] = [];
    for (let i = 0; i < series.length - 1; i++) {
      const corr = series[i].rolling_corr;
      if (corr == null) continue;
      corrSegments.push({ x0: toX(series[i].t_min), x1: toX(series[i + 1].t_min), negative: corr < 0 });
    }

    let corrPath = '';
    series.forEach((p) => {
      if (p.rolling_corr == null) return;
      const x = toX(p.t_min);
      const y = CORR_Y1 - ((p.rolling_corr + 1) / 2) * (CORR_Y1 - CORR_Y0);
      corrPath += corrPath === '' ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    return { gapPath, hrPath, corrPath, corrSegments, anchorX: toX(criticalWindow.anchor_min), minT, maxT };
  }, [criticalWindow]);

  if (!criticalWindow || !chart) return null;

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-red" />
      <span className="hw-br hw-br-br hw-br-red-dim" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Moment critique</h3>
          <p className="hw-chart-subtitle">
            {ANCHOR_LABELS[criticalWindow.anchor_type]} à {Math.round(criticalWindow.anchor_min)} min
          </p>
        </div>
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', height: 'auto' }} preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id={`cmClip-${uid}`}>
            <rect x={MARGIN.left} y={TOP_Y0} width={CHART_W} height={TOP_Y1 - TOP_Y0} />
          </clipPath>
        </defs>

        {/* Grille zone haute */}
        {[0, 0.5, 1].map((pct) => (
          <line
            key={pct}
            x1={MARGIN.left} y1={TOP_Y0 + pct * (TOP_Y1 - TOP_Y0)}
            x2={MARGIN.left + CHART_W} y2={TOP_Y0 + pct * (TOP_Y1 - TOP_Y0)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="1"
          />
        ))}

        {/* Ancre */}
        <line x1={chart.anchorX} y1={TOP_Y0} x2={chart.anchorX} y2={CORR_Y1} stroke="#E84242" strokeWidth="1.2" strokeDasharray="4,3" opacity="0.6" />

        <g clipPath={`url(#cmClip-${uid})`}>
          <path d={chart.gapPath} fill="none" stroke="#3DB2E0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={chart.hrPath} fill="none" stroke="#E8832A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <line x1={MARGIN.left} y1={TOP_Y1} x2={MARGIN.left + CHART_W} y2={TOP_Y1} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />
        <line x1={MARGIN.left} y1={TOP_Y0} x2={MARGIN.left} y2={TOP_Y1} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

        {/* Séparateur + label bande corrélation */}
        <text x={MARGIN.left} y={CORR_Y0 - 6} className="font-mono" fontSize="8" fill="#3A3F47" fontFamily="'JetBrains Mono', monospace">
          rolling_corr (GAP × FC, 5 min)
        </text>

        {/* Bande rolling_corr : zone rouge quand corr < 0 */}
        {chart.corrSegments.filter((s) => s.negative).map((s, i) => (
          <rect key={i} x={s.x0} y={CORR_Y0} width={Math.max(1, s.x1 - s.x0)} height={CORR_Y1 - CORR_Y0} fill="#E84242" opacity="0.12" />
        ))}
        <line x1={MARGIN.left} y1={(CORR_Y0 + CORR_Y1) / 2} x2={MARGIN.left + CHART_W} y2={(CORR_Y0 + CORR_Y1) / 2} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />
        <path d={chart.corrPath} fill="none" stroke="#F2F2F2" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
        <line x1={MARGIN.left} y1={CORR_Y0} x2={MARGIN.left} y2={CORR_Y1} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

        {/* Axe X */}
        <text x={MARGIN.left} y={AXIS_Y} textAnchor="start" fontSize="8" fill="#3A3F47" fontFamily="'JetBrains Mono', monospace">
          {Math.round(chart.minT)} min
        </text>
        <text x={MARGIN.left + CHART_W} y={AXIS_Y} textAnchor="end" fontSize="8" fill="#3A3F47" fontFamily="'JetBrains Mono', monospace">
          {Math.round(chart.maxT)} min
        </text>
      </svg>

      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-steel/20">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-glacier" />
          <span className="hw-chart-subtitle">GAP</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-amber" />
          <span className="hw-chart-subtitle">FC</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#E84242]/20 border border-[#E84242]/40" />
          <span className="hw-chart-subtitle">Discordance (corr &lt; 0)</span>
        </div>
      </div>
    </div>
  );
}
