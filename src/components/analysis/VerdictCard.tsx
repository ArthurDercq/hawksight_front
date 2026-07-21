/**
 * VerdictCard — croisière, effondrement, type (cardio/musculaire/mixte/
 * aucune), forme du jour, flag altitude, citation de la règle du socle.
 *
 * Le wording du type et de la citation de règle est défini côté back
 * (pacing_rule.wording déjà pré-calculé) — jamais recalculé ici, cohérence
 * front garantie par la Phase 4 du plan.
 */
import { InfoTooltip } from '@/components/ui';
import type { EfAnalysis } from '@/types/ef';

const GaugeIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12 18 8" /><path d="M12 2v2" />
  </svg>
);

const VERDICT_LABELS: Record<string, { label: string; description: string; color: string }> = {
  cardio: {
    label: 'Cardio',
    description: 'La vitesse chute, la fréquence cardiaque reste haute — dérive cardiaque visible sur la courbe EF.',
    color: '#c0392b',
  },
  muscular: {
    label: 'Musculaire',
    description: 'Vitesse et fréquence cardiaque baissent ensemble à pente égale — invisible à l\'EF seul, détecté par comparaison début/fin de sortie.',
    color: '#E8832A',
  },
  mixed: {
    label: 'Mixte',
    description: 'Les deux signatures cardio et musculaire sont présentes sur cette sortie.',
    color: '#8e44ad',
  },
  none: {
    label: 'Aucune bascule',
    description: 'Ni effondrement cardiaque ni signal musculaire net détectés sur cette sortie.',
    color: '#6DAA75',
  },
};

function cruiseColor(cruisePct: number | null): string {
  if (cruisePct == null) return '#9CA3AF';
  if (cruisePct >= -5) return '#6DAA75';
  if (cruisePct >= -12) return '#E8832A';
  return '#c0392b';
}

interface VerdictCardProps {
  efAnalysis: EfAnalysis;
}

export function VerdictCard({ efAnalysis }: VerdictCardProps) {
  const verdict = VERDICT_LABELS[efAnalysis.breakpoint_type ?? 'none'] ?? VERDICT_LABELS.none;
  const formeDelta = efAnalysis.ef_baseline != null && efAnalysis.ef_expected != null
    ? ((efAnalysis.ef_baseline - efAnalysis.ef_expected) / efAnalysis.ef_expected) * 100
    : null;

  return (
    <div className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
            <GaugeIcon color="#3DB2E0" />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Verdict</div>
            <div className="hw-text-caption text-steel mt-0.5">Analyse de la bascule</div>
          </div>
        </div>
        <InfoTooltip>
          Baseline = médiane EF des 15-75 premières minutes (état frais). Croisière = déficit médian
          vs baseline entre la 90e minute et 60% de la sortie. Effondrement = premier instant après la
          90e minute où le déficit dépasse -12% de façon durable. Cardio = la vitesse chute mais la FC
          reste haute. Musculaire = vitesse ET FC baissent ensemble à pente égale — invisible à l'EF seul.
        </InfoTooltip>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="hw-text-label text-steel mb-0.5">Croisière</div>
          <div className="text-xl font-bold font-mono tabular-nums" style={{ color: cruiseColor(efAnalysis.cruise_pct) }}>
            {efAnalysis.cruise_pct != null ? `${efAnalysis.cruise_pct > 0 ? '+' : ''}${efAnalysis.cruise_pct.toFixed(1)}%` : '—'}
          </div>
        </div>
        <div>
          <div className="hw-text-label text-steel mb-0.5">Effondrement</div>
          <div className="text-xl font-bold font-mono tabular-nums" style={{ color: efAnalysis.breakpoint_min != null ? '#c0392b' : '#6DAA75' }}>
            {efAnalysis.breakpoint_min != null ? `${Math.floor(efAnalysis.breakpoint_min / 60)}h${String(efAnalysis.breakpoint_min % 60).padStart(2, '0')}` : 'Aucun'}
          </div>
        </div>
      </div>

      <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: `${verdict.color}10`, border: `1px solid ${verdict.color}30` }}>
        <div className="hw-text-label mb-1" style={{ color: verdict.color }}>{verdict.label}</div>
        <p className="hw-text-caption text-mist/70">{verdict.description}</p>
      </div>

      {formeDelta != null && (
        <div className="flex items-center justify-between mb-3 hw-text-caption text-steel">
          <span>Forme du jour</span>
          <span className="font-mono" style={{ color: formeDelta >= 0 ? '#6DAA75' : '#c0392b' }}>
            {formeDelta >= 0 ? '+' : ''}{formeDelta.toFixed(1)}% vs attendu
          </span>
        </div>
      )}

      {efAnalysis.altitude_flag && (
        <div className="hw-text-caption text-yellow-500/70 mb-3">
          Sortie en altitude — baseline attendue moins fiable (données insuffisantes à cette altitude).
        </div>
      )}

      {efAnalysis.pacing_rule && (
        <div className="pt-3 border-t border-steel/20">
          <div className="hw-text-label text-steel mb-1">Règle du socle</div>
          <p className="hw-text-caption text-mist/70">{efAnalysis.pacing_rule.wording}</p>
        </div>
      )}
    </div>
  );
}
