/**
 * GapSignatureChart — signature GAP personnelle actuelle : vitesse relative
 * au plat en fonction de la pente. Scope réduit (décision produit) : courbe
 * actuelle seule, pas de comparaison à une période antérieure (nécessiterait
 * d'historiser gap_curve, hors scope — user_baseline n'a qu'une ligne par
 * user, toujours écrasée au recompute).
 */
import { useMemo, useRef } from 'react';
import { InfoTooltip } from '@/components/ui';
import type { GapCurve } from '@/types/ef';

const WaveIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
  </svg>
);

interface GapSignatureChartProps {
  gapCurve: GapCurve | null;
  color?: string;
}

const CHART_X0 = 40;
const CHART_X1 = 360;
const CHART_Y0 = 20;
const CHART_Y1 = 180;

export function GapSignatureChart({ gapCurve, color = '#3DB2E0' }: GapSignatureChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chart = useMemo(() => {
    if (!gapCurve || gapCurve.gmids.length === 0) return null;

    const minGrade = Math.min(...gapCurve.gmids);
    const maxGrade = Math.max(...gapCurve.gmids);
    const gradeRange = maxGrade - minGrade || 1;
    const minR = Math.min(...gapCurve.rvals) * 0.9;
    const maxR = Math.max(...gapCurve.rvals) * 1.1;
    const rRange = maxR - minR || 1;

    let path = '';
    gapCurve.gmids.forEach((grade, i) => {
      const x = CHART_X0 + ((grade - minGrade) / gradeRange) * (CHART_X1 - CHART_X0);
      const y = CHART_Y0 + ((maxR - gapCurve.rvals[i]) / rRange) * (CHART_Y1 - CHART_Y0);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    const flatY = CHART_Y0 + ((maxR - 1) / rRange) * (CHART_Y1 - CHART_Y0);
    const zeroX = CHART_X0 + ((0 - minGrade) / gradeRange) * (CHART_X1 - CHART_X0);

    return { path, flatY, zeroX, minGrade, maxGrade };
  }, [gapCurve]);

  return (
    <div ref={chartRef} className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
            <WaveIcon color={color} />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Signature GAP actuelle</div>
            <div className="hw-text-caption text-steel mt-0.5">Vitesse relative au plat selon la pente</div>
          </div>
        </div>
        <InfoTooltip>
          Votre courbe GAP personnelle, apprise sur vos sorties Run/Trail des 24 derniers mois (pas la
          courbe Minetti de laboratoire, qui sur-crédite les descentes trail). r=1 au plat ; en dessous
          de 1, vous êtes plus lent qu'au plat à effort égal ; au-dessus, plus rapide (descentes
          modérées typiquement).
        </InfoTooltip>
      </div>

      {!chart ? (
        <div className="flex items-center justify-center h-32 hw-text-caption text-steel">
          Courbe personnelle non calculable — historique Run/Trail encore insuffisant
        </div>
      ) : (
        <div className="relative border border-steel/20 rounded overflow-hidden bg-charcoal-light">
          <svg viewBox="0 0 400 200" className="w-full h-auto">
            {[0, 25, 50, 75, 100].map((pct) => (
              <line
                key={pct}
                x1={CHART_X0} y1={CHART_Y0 + (pct / 100) * (CHART_Y1 - CHART_Y0)}
                x2={CHART_X1} y2={CHART_Y0 + (pct / 100) * (CHART_Y1 - CHART_Y0)}
                stroke="#9CA3AF" strokeWidth="0.5" opacity="0.15"
              />
            ))}
            <line x1={chart.zeroX} y1={CHART_Y0} x2={chart.zeroX} y2={CHART_Y1} stroke="#9CA3AF" strokeWidth="0.5" opacity="0.2" />
            <line x1={CHART_X0} y1={chart.flatY} x2={CHART_X1} y2={chart.flatY} stroke="#E8832A" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
            <path d={chart.path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <text x={CHART_X0} y="195" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">{Math.round(chart.minGrade)}%</text>
            <text x={chart.zeroX} y="195" textAnchor="middle" className="font-mono text-[9px]" fill="#6B7280">0%</text>
            <text x={CHART_X1} y="195" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">{Math.round(chart.maxGrade)}%</text>
          </svg>
        </div>
      )}
    </div>
  );
}
