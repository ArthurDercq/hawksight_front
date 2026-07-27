/**
 * PhysioBudgetScatter — nuage de points des sorties longues effondrées :
 * X = heure d'effondrement, Y = température, taille = durée, couleur = sport
 * (méthodo §7, règle Budget — la durée décide SI, la température décide
 * QUAND). Filtré sur collapse === true.
 */
import { useMemo } from 'react';
import { Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';
import { InfoTooltip } from '@/components/ui';
import { sportColor } from '@/services/utils/constants';
import type { Outing } from '@/types/ef';

ChartJS.register(LinearScale, PointElement, Tooltip);

const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } };
const gridStyle = { color: 'rgba(255,255,255,0.03)' };
const MIN_RADIUS = 4;
const MAX_RADIUS = 20;

interface BubblePoint {
  x: number;
  y: number;
  r: number;
  sport: string;
  hour: number;
  temp: number;
  durationH: number;
}

interface PhysioBudgetScatterProps {
  outings: Outing[];
}

export function PhysioBudgetScatter({ outings }: PhysioBudgetScatterProps) {
  const points = useMemo<BubblePoint[]>(() => {
    const collapsed = outings.filter((o) => o.collapse && o.breakpoint_min != null && o.avg_temp_c != null);
    if (collapsed.length === 0) return [];

    const durations = collapsed.map((o) => o.duration_h);
    const minDur = Math.min(...durations);
    const maxDur = Math.max(...durations) || 1;
    const durRange = maxDur - minDur || 1;

    return collapsed.map((o) => ({
      x: (o.breakpoint_min as number) / 60,
      y: o.avg_temp_c as number,
      r: MIN_RADIUS + ((o.duration_h - minDur) / durRange) * (MAX_RADIUS - MIN_RADIUS),
      sport: o.sport_type,
      hour: (o.breakpoint_min as number) / 60,
      temp: o.avg_temp_c as number,
      durationH: o.duration_h,
    }));
  }, [outings]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-red" />
      <span className="hw-br hw-br-br hw-br-red-dim" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Budget physiologique</h3>
          <p className="hw-chart-subtitle">Heure d'effondrement × température</p>
        </div>
        <InfoTooltip>
          Chaque point = une sortie effondrée. X = heure de la bascule, Y = température moyenne, taille
          = durée totale de la sortie. La durée décide SI vous risquez un effondrement (au-delà de 6h,
          risque nettement plus élevé) ; la température décide QUAND (plus il fait chaud, plus tôt la
          bascule survient).
        </InfoTooltip>
      </div>

      <div className="h-[200px]">
        {points.length === 0 ? (
          <div className="hw-chart-empty">Aucun effondrement enregistré sur l'historique</div>
        ) : (
          <Bubble
            data={{
              datasets: [{
                data: points,
                backgroundColor: points.map((p) => `${sportColor(p.sport)}8c`),
                borderColor: points.map((p) => sportColor(p.sport)),
                borderWidth: 1,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: { ...axisStyle, callback: (v: number | string) => `${v}h` } },
                y: { grid: gridStyle, ticks: { ...axisStyle, callback: (v: number | string) => `${v}°` } },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#0B0C10',
                  borderColor: '#E84242',
                  borderWidth: 1,
                  titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  padding: 10,
                  cornerRadius: 4,
                  callbacks: {
                    label: (ctx) => {
                      const p = points[ctx.dataIndex];
                      return `${p.hour.toFixed(1)}h · ${p.temp.toFixed(0)}°C · ${p.durationH.toFixed(1)}h de sortie`;
                    },
                  },
                },
              },
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-center mt-3 pt-3 border-t border-steel/20">
        <span className="hw-chart-subtitle">Taille du point = durée de la sortie</span>
      </div>
    </div>
  );
}
