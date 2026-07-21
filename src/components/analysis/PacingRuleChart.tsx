/**
 * PacingRuleChart — risque d'effondrement par tranche de croisière (méthodo
 * §7, règle Pacing) : croisière ≥-5% → risque faible, -5/-12% → modéré,
 * <-12% → élevé. Calibré sur l'historique réel du user.
 */
import { useMemo } from 'react';
import { InfoTooltip } from '@/components/ui';
import type { RulesResult } from '@/types/ef';

const ScaleIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M5 9l-3 6a4 4 0 0 0 8 0L7 9M19 9l-3 6a4 4 0 0 0 8 0L21 9M2 9h10M14 9h8" />
  </svg>
);

const TRANCHE_ORDER = ['>=-5%', '-12%/-5%', '<-12%'] as const;
const TRANCHE_LABELS: Record<string, string> = {
  '>=-5%': 'Croisière ≥ -5%',
  '-12%/-5%': 'Croisière -5% à -12%',
  '<-12%': 'Croisière < -12%',
};
const TRANCHE_COLORS: Record<string, string> = {
  '>=-5%': '#6DAA75',
  '-12%/-5%': '#E8832A',
  '<-12%': '#c0392b',
};
const MIN_RELIABLE_N = 5;

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
    <div className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
            <ScaleIcon color="#3DB2E0" />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Règle Pacing</div>
            <div className="hw-text-caption text-steel mt-0.5">Risque d'effondrement par tranche de croisière</div>
          </div>
        </div>
        <InfoTooltip>
          Sur votre historique de sorties longues, quel pourcentage a fini par un effondrement selon la
          croisière observée en cours de route ? Actionnable dès la 2e heure de course : une croisière
          qui plonge sous -12% signale un risque élevé de bascule, pas seulement une dérive cardiaque
          normale de l'ultra.
        </InfoTooltip>
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center justify-center h-32 hw-text-caption text-steel">
          Historique insuffisant pour estimer cette règle
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <div key={row.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="hw-text-label text-mist tracking-wide">{TRANCHE_LABELS[row.key]}</span>
                <span className="hw-text-data font-semibold" style={{ color: TRANCHE_COLORS[row.key] }}>
                  {row.pct_collapse != null ? `${Math.round(row.pct_collapse)}%` : '—'}
                </span>
              </div>
              <div className="h-2.5 bg-steel/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${row.pct_collapse ?? 0}%`,
                    background: TRANCHE_COLORS[row.key],
                    opacity: row.n < MIN_RELIABLE_N ? 0.4 : 1,
                  }}
                />
              </div>
              <p className="hw-text-caption text-steel/60 mt-0.5">
                {row.n} sortie{row.n > 1 ? 's' : ''}{row.n < MIN_RELIABLE_N ? ' — échantillon faible' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
