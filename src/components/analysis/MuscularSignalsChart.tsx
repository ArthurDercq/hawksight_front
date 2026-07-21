/**
 * MuscularSignalsChart — barh T1 vs T3 pentes appariées (méthodo §5) :
 * vitesse en montée, FC en montée, vitesse en descente, longueur de foulée.
 * Détecte la bascule musculaire, invisible à l'EF seul (vitesse et FC
 * baissent ensemble à pente égale).
 */
import { useMemo } from 'react';
import { InfoTooltip } from '@/components/ui';
import type { EfSignals } from '@/types/ef';

const MuscleIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v16M18 4v16M6 8h12M6 16h12" />
  </svg>
);

interface SignalRow {
  label: string;
  unit: string;
  t1: number;
  t3: number;
  deltaPct: number;
}

function buildRows(muscular: Record<string, number | null>): SignalRow[] {
  const specs: { key: string; label: string; unit: string }[] = [
    { key: 'climb_v', label: 'Vitesse en montée', unit: 'km/h' },
    { key: 'climb_hr', label: 'FC en montée', unit: 'bpm' },
    { key: 'desc_v', label: 'Vitesse en descente', unit: 'km/h' },
    { key: 'stride', label: 'Longueur de foulée', unit: 'm' },
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

  if (rows.length === 0) return null;

  const maxAbs = Math.max(...rows.flatMap((r) => [r.t1, r.t3]));

  return (
    <div className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber/10 border border-amber/30 rounded-lg text-amber shrink-0">
            <MuscleIcon color="#E8832A" />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Signaux musculaires</div>
            <div className="hw-text-caption text-steel mt-0.5">Début (T1) vs fin (T3) de sortie</div>
          </div>
        </div>
        <InfoTooltip>
          Comparaison à pentes appariées entre le premier tiers (T1) et le dernier tiers (T3) de la
          sortie : montée 5-12%, descente -12/-5%, plat ±4%. Une baisse simultanée de vitesse ET de FC
          en montée (score ≥ 2) signale une bascule musculaire — invisible à la courbe EF seule, car les
          deux baisses s'y annulent.
        </InfoTooltip>
      </div>

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="hw-text-label text-mist tracking-wide">{row.label}</span>
              <span
                className="hw-text-data font-semibold"
                style={{ color: row.deltaPct <= -8 ? '#c0392b' : '#9CA3AF' }}
              >
                {row.deltaPct >= 0 ? '+' : ''}{row.deltaPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2.5 bg-steel/10 rounded-full overflow-hidden relative">
                <div
                  className="absolute h-full rounded-full bg-glacier/70"
                  style={{ width: `${(row.t1 / maxAbs) * 100}%` }}
                />
              </div>
              <span className="hw-text-caption text-glacier w-14 text-right">{row.t1.toFixed(1)} {row.unit}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2.5 bg-steel/10 rounded-full overflow-hidden relative">
                <div
                  className="absolute h-full rounded-full bg-amber/70"
                  style={{ width: `${(row.t3 / maxAbs) * 100}%` }}
                />
              </div>
              <span className="hw-text-caption text-amber w-14 text-right">{row.t3.toFixed(1)} {row.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-steel/20">
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded-full bg-glacier/70" />
          <span className="text-mist/40 font-body text-xs">T1 (début)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-2 rounded-full bg-amber/70" />
          <span className="text-mist/40 font-body text-xs">T3 (fin)</span>
        </div>
        <div className="hw-text-caption text-steel">Score musculaire : {efSignals.muscular_score}</div>
      </div>
    </div>
  );
}
