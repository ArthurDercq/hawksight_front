/**
 * PacingRuleChart — risque d'effondrement par tranche de croisière (méthodo
 * §7, règle Pacing) : croisière ≥-5% → risque faible, -5/-12% → modéré,
 * <-12% → élevé. Calibré sur l'historique réel du user.
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
import type { RulesResult } from '@/types/ef';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const TRANCHE_ORDER = ['>=-5%', '-12%/-5%', '<-12%'] as const;
const TRANCHE_LABELS: Record<string, string> = {
  '>=-5%': 'Croisière ≥ -5%',
  '-12%/-5%': 'Croisière -5% à -12%',
  '<-12%': 'Croisière < -12%',
};
const TRANCHE_COLORS: Record<string, string> = {
  '>=-5%': '#6DAA75',
  '-12%/-5%': '#E8832A',
  '<-12%': '#E84242',
};
const MIN_RELIABLE_N = 5;

function withReliability(hex: string, n: number): string {
  if (n >= MIN_RELIABLE_N) return hex;
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},0.4)`;
}

const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } };
const gridStyle = { color: 'rgba(255,255,255,0.03)' };

interface PacingRuleChartProps {
  rules: RulesResult | null;
}

export function PacingRuleChart({ rules }: PacingRuleChartProps) {
  const rows = useMemo(() => {
    if (!rules) return [];
    return TRANCHE_ORDER
      .map((key) => ({ key, ...rules.pacing[key] }))
      .filter((r) => r.n > 0);
  }, [rules]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-glacier" />
      <span className="hw-br hw-br-br hw-br-glacier-dim" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Règle Pacing</h3>
          <p className="hw-chart-subtitle">Risque d'effondrement par tranche de croisière</p>
        </div>
        <InfoTooltip>
          Sur votre historique de sorties longues, quel pourcentage a fini par un effondrement selon la
          croisière observée en cours de route ? Actionnable dès la 2e heure de course : une croisière
          qui plonge sous -12% signale un risque élevé de bascule, pas seulement une dérive cardiaque
          normale de l'ultra.
        </InfoTooltip>
      </div>

      <div className="h-[200px]">
        {rows.length === 0 ? (
          <div className="hw-chart-empty">Historique insuffisant pour estimer cette règle</div>
        ) : (
          <Bar
            data={{
              labels: rows.map((r) => TRANCHE_LABELS[r.key]),
              datasets: [{
                data: rows.map((r) => r.pct_collapse ?? 0),
                backgroundColor: rows.map((r) => withReliability(TRANCHE_COLORS[r.key], r.n)),
                borderRadius: 3,
                barPercentage: 0.6,
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
                  borderColor: '#3DB2E0',
                  borderWidth: 1,
                  titleFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
                  padding: 10,
                  cornerRadius: 4,
                  callbacks: {
                    label: (ctx) => {
                      const row = rows[ctx.dataIndex];
                      const pct = row.pct_collapse != null ? `${Math.round(row.pct_collapse)}%` : '—';
                      const warn = row.n < MIN_RELIABLE_N ? ' (échantillon faible)' : '';
                      return `${pct} sur ${row.n} sortie${row.n > 1 ? 's' : ''}${warn}`;
                    },
                  },
                },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
