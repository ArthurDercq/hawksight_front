/**
 * FitnessCurveChart — historique des baselines dans le temps + niveau de
 * forme actuel (méthodo §6 : médiane des baselines des sorties longues des
 * 180 derniers jours). Ligne temporelle + repère horizontal, pas de série
 * glissante recalculée côté front — fitness_180d est la valeur courante
 * telle que fournie par le backend.
 */
import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { InfoTooltip } from '@/components/ui';
import type { BaselineHistoryPoint } from '@/types/ef';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } };
const gridStyle = { color: 'rgba(255,255,255,0.03)' };

interface FitnessCurveChartProps {
  baselineHistory: BaselineHistoryPoint[];
  fitness180d: number | null;
}

export function FitnessCurveChart({ baselineHistory, fitness180d }: FitnessCurveChartProps) {
  const labels = useMemo(
    () => baselineHistory.map((p) => new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
    [baselineHistory],
  );
  const values = useMemo(() => baselineHistory.map((p) => p.baseline), [baselineHistory]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-glacier" />
      <span className="hw-br hw-br-br hw-br-glacier-dim" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Courbe de forme</h3>
          <p className="hw-chart-subtitle">Baseline EF dans le temps</p>
        </div>
        <InfoTooltip>
          Chaque point = la baseline EF (état frais) d'une sortie longue analysée. La ligne pointillée
          indique votre forme actuelle : la médiane des baselines des sorties longues des 180 derniers
          jours — un indicateur de tendance, pas une prédiction pour la prochaine sortie.
        </InfoTooltip>
      </div>

      <div className="h-[200px]">
        {baselineHistory.length === 0 ? (
          <div className="hw-chart-empty">Pas encore assez de sorties longues analysées</div>
        ) : (
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: 'Baseline EF',
                  data: values,
                  borderColor: '#3DB2E0',
                  backgroundColor: 'rgba(61,178,224,0.08)',
                  fill: true,
                  tension: 0,
                  pointRadius: 3,
                  pointBackgroundColor: '#3DB2E0',
                },
                ...(fitness180d != null ? [{
                  label: 'Forme actuelle (médiane 180j)',
                  data: values.map(() => fitness180d),
                  borderColor: '#E8832A',
                  borderDash: [4, 3],
                  pointRadius: 0,
                  fill: false,
                }] : []),
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: axisStyle },
                y: { grid: gridStyle, ticks: axisStyle },
              },
              plugins: {
                legend: { display: true, position: 'bottom' as const, labels: { color: 'rgba(242,242,242,0.4)', font: { size: 10, family: 'JetBrains Mono' }, boxWidth: 10, padding: 10 } },
                tooltip: {
                  backgroundColor: '#0B0C10',
                  borderColor: '#3DB2E0',
                  borderWidth: 1,
                  titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  padding: 10,
                  cornerRadius: 4,
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
