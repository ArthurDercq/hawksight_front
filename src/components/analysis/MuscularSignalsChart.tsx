/**
 * MuscularSignalsChart — variation T1 vs T3 pentes appariées (méthodo §5) :
 * vitesse en montée, FC en montée, vitesse en descente, longueur de foulée.
 * Détecte la bascule musculaire, invisible à l'EF seul (vitesse et FC
 * baissent ensemble à pente égale). Affiché en delta % par catégorie — les
 * 4 signaux ont des unités natives incompatibles (km/h, bpm, m), un delta %
 * partagé est le seul axe qui reste lisible sur un même graphique (valeurs
 * absolues disponibles en tooltip).
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
import type { EfSignals } from '@/types/ef';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const axisStyle = { color: 'rgba(242,242,242,0.2)', font: { size: 10, family: 'JetBrains Mono' } };
const gridStyle = { color: 'rgba(255,255,255,0.03)' };
const COLLAPSE_THRESHOLD_PCT = -8;

interface SignalRow {
  label: string;
  unit: string;
  t1: number;
  t3: number;
  deltaPct: number;
}

function buildRows(muscular: Record<string, number | null>): SignalRow[] {
  const specs: { key: string; label: string; unit: string }[] = [
    { key: 'climb_v', label: 'Vitesse montée', unit: 'km/h' },
    { key: 'climb_hr', label: 'FC montée', unit: 'bpm' },
    { key: 'desc_v', label: 'Vitesse descente', unit: 'km/h' },
    { key: 'stride', label: 'Foulée', unit: 'm' },
  ];
  const rows: SignalRow[] = [];
  for (const spec of specs) {
    const t1 = muscular[`${spec.key}_1`];
    const t3 = muscular[`${spec.key}_3`];
    if (t1 == null || t3 == null || t1 === 0) continue;
    rows.push({ label: spec.label, unit: spec.unit, t1, t3, deltaPct: ((t3 - t1) / t1) * 100 });
  }
  return rows;
}

interface MuscularSignalsChartProps {
  efSignals: EfSignals;
}

export function MuscularSignalsChart({ efSignals }: MuscularSignalsChartProps) {
  const rows = useMemo(() => buildRows(efSignals.muscular), [efSignals.muscular]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-amber" />
      <span className="hw-br hw-br-br hw-br-amber-dark" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Signaux musculaires</h3>
          <p className="hw-chart-subtitle">Variation début (T1) → fin (T3) de sortie</p>
        </div>
        <InfoTooltip>
          Comparaison à pentes appariées entre le premier tiers (T1) et le dernier tiers (T3) de la
          sortie : montée 5-12%, descente -12/-5%, plat ±4%. Une baisse simultanée de vitesse ET de FC
          en montée (score ≥ 2) signale une bascule musculaire — invisible à la courbe EF seule, car les
          deux baisses s'y annulent.
        </InfoTooltip>
      </div>

      <div className="h-[200px]">
        {rows.length === 0 ? (
          <div className="hw-chart-empty">Signaux musculaires indisponibles pour cette sortie</div>
        ) : (
          <Bar
            data={{
              labels: rows.map((r) => r.label),
              datasets: [{
                data: rows.map((r) => r.deltaPct),
                backgroundColor: rows.map((r) => r.deltaPct <= COLLAPSE_THRESHOLD_PCT ? '#E84242' : '#3DB2E0'),
                borderRadius: 3,
                barPercentage: 0.6,
              }],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y' as const,
              scales: {
                x: { grid: gridStyle, ticks: { ...axisStyle, callback: (v: number | string) => `${v}%` } },
                y: { grid: { display: false }, ticks: axisStyle },
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
                      const row = rows[ctx.dataIndex];
                      return `T1 ${row.t1.toFixed(1)} ${row.unit} → T3 ${row.t3.toFixed(1)} ${row.unit} (${row.deltaPct >= 0 ? '+' : ''}${row.deltaPct.toFixed(1)}%)`;
                    },
                  },
                },
              },
            }}
          />
        )}
      </div>

      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-steel/20">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#E84242]" />
          <span className="hw-chart-subtitle">Bascule (≤ {COLLAPSE_THRESHOLD_PCT}%)</span>
        </div>
        <span className="hw-chart-subtitle">Score musculaire : {efSignals.muscular_score}</span>
      </div>
    </div>
  );
}
