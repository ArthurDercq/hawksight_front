/**
 * PhysioBudgetScatter — nuage de points des sorties longues effondrées :
 * X = heure d'effondrement, taille = durée, couleur = sport (méthodo §7,
 * règle Budget — la durée décide SI, la température décide QUAND).
 */
import { useMemo, useRef } from 'react';
import { InfoTooltip } from '@/components/ui';
import { sportColor } from '@/services/utils/constants';
import type { Outing } from '@/types/ef';

const ThermoIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
  </svg>
);

interface PhysioBudgetScatterProps {
  outings: Outing[];
}

const CHART_X0 = 50;
const CHART_X1 = 360;
const CHART_Y0 = 20;
const CHART_Y1 = 180;
const MIN_RADIUS = 3;
const MAX_RADIUS = 12;

export function PhysioBudgetScatter({ outings }: PhysioBudgetScatterProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chart = useMemo(() => {
    const collapsed = outings.filter((o) => o.collapse && o.breakpoint_min != null && o.avg_temp_c != null);
    if (collapsed.length === 0) return null;

    const hours = collapsed.map((o) => (o.breakpoint_min as number) / 60);
    const temps = collapsed.map((o) => o.avg_temp_c as number);
    const durations = collapsed.map((o) => o.duration_h);
    const maxHour = Math.max(...hours) * 1.1 || 1;
    const minTemp = Math.min(...temps) - 2;
    const maxTemp = Math.max(...temps) + 2;
    const tempRange = maxTemp - minTemp || 1;
    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations) || 1;
    const durRange = maxDur - minDur || 1;

    const points = collapsed.map((o) => {
      const hour = (o.breakpoint_min as number) / 60;
      const temp = o.avg_temp_c as number;
      const x = CHART_X0 + (hour / maxHour) * (CHART_X1 - CHART_X0);
      const y = CHART_Y0 + ((maxTemp - temp) / tempRange) * (CHART_Y1 - CHART_Y0);
      const r = MIN_RADIUS + ((o.duration_h - minDur) / durRange) * (MAX_RADIUS - MIN_RADIUS);
      return { x, y, r, color: sportColor(o.sport_type), activityId: o.activity_id, hour, temp };
    });

    return { points, maxHour, minTemp, maxTemp };
  }, [outings]);

  return (
    <div ref={chartRef} className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#c0392b]/10 border border-[#c0392b]/30 rounded-lg text-[#c0392b] shrink-0">
            <ThermoIcon color="#c0392b" />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Budget physiologique</div>
            <div className="hw-text-caption text-steel mt-0.5">Heure d'effondrement × température</div>
          </div>
        </div>
        <InfoTooltip>
          Chaque point = une sortie effondrée. X = heure de la bascule, Y = température moyenne, taille
          = durée totale de la sortie. La durée décide SI vous risquez un effondrement (au-delà de 6h,
          risque nettement plus élevé) ; la température décide QUAND (plus il fait chaud, plus tôt la
          bascule survient).
        </InfoTooltip>
      </div>

      {!chart ? (
        <div className="flex items-center justify-center h-40 hw-text-caption text-steel">
          Aucun effondrement enregistré sur l'historique — rien à représenter
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
            {chart.points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.color} opacity="0.55" stroke={p.color} strokeWidth="1">
                <title>{`${p.hour.toFixed(1)}h, ${p.temp.toFixed(0)}°C`}</title>
              </circle>
            ))}
            <text x={CHART_X0} y="195" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">0h</text>
            <text x={CHART_X1} y="195" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">{chart.maxHour.toFixed(0)}h</text>
            <text x="20" y={CHART_Y0 + 4} textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">{Math.round(chart.maxTemp)}°</text>
            <text x="20" y={CHART_Y1} textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">{Math.round(chart.minTemp)}°</text>
          </svg>
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-3 hw-text-caption text-steel/60">
        Taille du point = durée de la sortie
      </div>
    </div>
  );
}
