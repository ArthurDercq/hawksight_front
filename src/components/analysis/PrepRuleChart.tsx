/**
 * PrepRuleChart — risque d'effondrement selon la charge de préparation
 * (méthodo §7, règle Préparation) : sortie > 1.5x le D+ hebdomadaire moyen
 * des 42 derniers jours → risque nettement plus élevé. Affiche aussi la
 * position actuelle (ratio de la dernière sortie) en texte à côté du seuil.
 */
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { InfoTooltip } from '@/components/ui';
import type { RulesResult, Outing } from '@/types/ef';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } };
const gridStyle = { color: 'rgba(255,255,255,0.03)' };

interface PrepRuleChartProps {
  rules: RulesResult | null;
  outings: Outing[];
}

export function PrepRuleChart({ rules, outings }: PrepRuleChartProps) {
  const lastRatio = useMemo(() => {
    const withRatio = outings.filter((o) => o.d42_ratio != null);
    if (withRatio.length === 0) return null;
    return withRatio[withRatio.length - 1].d42_ratio;
  }, [outings]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-amber" />
      <span className="hw-br hw-br-br hw-br-amber-dark" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Règle Préparation</h3>
          <p className="hw-chart-subtitle">
            {rules ? `D+ sortie vs D+ hebdo moyen (42j) · seuil ${rules.preparation.threshold}×` : 'Historique insuffisant'}
          </p>
        </div>
        <InfoTooltip>
          Une sortie dont le D+ dépasse le seuil × votre D+ hebdomadaire moyen des 42 derniers jours
          (repos compris) s'accompagne d'un risque d'effondrement nettement plus élevé sur votre
          historique — la caisse n'a pas eu le temps de s'adapter à cette charge inhabituelle.
        </InfoTooltip>
      </div>

      <div className="h-[200px]">
        {!rules ? (
          <div className="hw-chart-empty">Historique insuffisant pour estimer cette règle</div>
        ) : (
          <Bar
            data={{
              labels: [`Sous le seuil (${rules.preparation.threshold}×)`, 'Au-dessus du seuil'],
              datasets: [{
                data: [rules.preparation.below_threshold.pct_collapse ?? 0, rules.preparation.above_threshold.pct_collapse ?? 0],
                backgroundColor: ['#6DAA75', '#E84242'],
                borderRadius: 3,
                barPercentage: 0.5,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: { grid: { display: false }, ticks: axisStyle },
                y: { min: 0, max: 100, grid: gridStyle, ticks: { ...axisStyle, stepSize: 25, callback: (v: number | string) => `${v}%` } },
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#0B0C10',
                  borderColor: '#E8832A',
                  borderWidth: 1,
                  titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  padding: 10,
                  cornerRadius: 4,
                  callbacks: {
                    label: (ctx) => {
                      const bucket = ctx.dataIndex === 0 ? rules.preparation.below_threshold : rules.preparation.above_threshold;
                      const pct = bucket.pct_collapse != null ? `${Math.round(bucket.pct_collapse)}%` : '—';
                      return `${pct} sur ${bucket.n} sortie${bucket.n > 1 ? 's' : ''}`;
                    },
                  },
                },
              },
            }}
          />
        )}
      </div>

      {rules && (
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-steel/20">
          <span className="hw-chart-subtitle">Dernière sortie :</span>
          <span
            className="hw-text-data font-semibold"
            style={{ color: lastRatio != null && lastRatio > rules.preparation.threshold ? '#E84242' : '#6DAA75' }}
          >
            {lastRatio != null ? `${lastRatio.toFixed(2)}×` : '—'}
          </span>
        </div>
      )}
    </div>
  );
}
