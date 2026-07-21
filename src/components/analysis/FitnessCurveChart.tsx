/**
 * FitnessCurveChart — historique des baselines dans le temps + niveau de
 * forme actuel (méthodo §6 : médiane des baselines des sorties longues des
 * 180 derniers jours). Ligne temporelle + repère horizontal, pas de série
 * glissante recalculée côté front — fitness_180d est la valeur courante
 * telle que fournie par le backend.
 */
import { useMemo, useRef } from 'react';
import { InfoTooltip } from '@/components/ui';
import type { BaselineHistoryPoint } from '@/types/ef';

const TrendIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);

interface FitnessCurveChartProps {
  baselineHistory: BaselineHistoryPoint[];
  fitness180d: number | null;
  color?: string;
}

const CHART_X0 = 40;
const CHART_X1 = 360;
const CHART_Y0 = 20;
const CHART_Y1 = 180;

export function FitnessCurveChart({ baselineHistory, fitness180d, color = '#3DB2E0' }: FitnessCurveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chart = useMemo(() => {
    if (baselineHistory.length === 0) return null;

    const dates = baselineHistory.map((p) => new Date(p.date).getTime());
    const values = baselineHistory.map((p) => p.baseline);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const dateRange = maxDate - minDate || 1;
    let minVal = Math.min(...values) * 0.9;
    let maxVal = Math.max(...values) * 1.1;
    if (fitness180d != null) {
      minVal = Math.min(minVal, fitness180d * 0.95);
      maxVal = Math.max(maxVal, fitness180d * 1.05);
    }
    const valRange = maxVal - minVal || 1;

    let path = '';
    baselineHistory.forEach((p, i) => {
      const x = CHART_X0 + ((new Date(p.date).getTime() - minDate) / dateRange) * (CHART_X1 - CHART_X0);
      const y = CHART_Y0 + ((maxVal - p.baseline) / valRange) * (CHART_Y1 - CHART_Y0);
      path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    const fitnessY = fitness180d != null ? CHART_Y0 + ((maxVal - fitness180d) / valRange) * (CHART_Y1 - CHART_Y0) : null;

    return {
      path, fitnessY,
      firstDate: new Date(minDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
      lastDate: new Date(maxDate).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
    };
  }, [baselineHistory, fitness180d]);

  return (
    <div ref={chartRef} className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
            <TrendIcon color={color} />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Courbe de forme</div>
            <div className="hw-text-caption text-steel mt-0.5">Baseline EF dans le temps</div>
          </div>
        </div>
        <InfoTooltip>
          Chaque point = la baseline EF (état frais) d'une sortie longue analysée. La ligne pointillée
          indique votre forme actuelle : la médiane des baselines des sorties longues des 180 derniers
          jours — un indicateur de tendance, pas une prédiction pour la prochaine sortie.
        </InfoTooltip>
      </div>

      {!chart ? (
        <div className="flex items-center justify-center h-32 hw-text-caption text-steel">
          Pas encore assez de sorties longues analysées
        </div>
      ) : (
        <>
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
              {chart.fitnessY != null && (
                <line x1={CHART_X0} y1={chart.fitnessY} x2={CHART_X1} y2={chart.fitnessY} stroke="#E8832A" strokeWidth="1" strokeDasharray="4,3" opacity="0.7" />
              )}
              <path d={chart.path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <text x={CHART_X0} y="195" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">{chart.firstDate}</text>
              <text x={CHART_X1} y="195" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">{chart.lastDate}</text>
            </svg>
          </div>
          {fitness180d != null && (
            <div className="flex items-center gap-1.5 mt-3 justify-center">
              <div className="w-4 h-0.5 bg-amber" />
              <span className="text-mist/40 font-body text-xs">Forme actuelle (médiane 180j) : {fitness180d.toFixed(1)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
