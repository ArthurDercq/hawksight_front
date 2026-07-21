/**
 * PrepRuleChart — risque d'effondrement selon la charge de préparation
 * (méthodo §7, règle Préparation) : sortie > 1.5x le D+ hebdomadaire moyen
 * des 42 derniers jours → risque nettement plus élevé. Affiche aussi la
 * position actuelle (ratio de la dernière sortie) sur l'axe du seuil.
 */
import { useMemo } from 'react';
import { InfoTooltip } from '@/components/ui';
import type { RulesResult, Outing } from '@/types/ef';

const MountainIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
  </svg>
);

interface PrepRuleChartProps {
  rules: RulesResult | null;
  outings: Outing[];
}

const AXIS_MAX_RATIO = 3;

export function PrepRuleChart({ rules, outings }: PrepRuleChartProps) {
  const lastRatio = useMemo(() => {
    const withRatio = outings.filter((o) => o.d42_ratio != null);
    if (withRatio.length === 0) return null;
    return withRatio[withRatio.length - 1].d42_ratio;
  }, [outings]);

  if (!rules) {
    return (
      <div className="hw-card-dark-lg">
        <div className="flex items-center gap-3 pb-3 border-b border-steel/25 mb-3.5">
          <div className="p-2 bg-amber/10 border border-amber/30 rounded-lg text-amber shrink-0">
            <MountainIcon color="#E8832A" />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Règle Préparation</div>
            <div className="hw-text-caption text-steel mt-0.5">Historique insuffisant</div>
          </div>
        </div>
      </div>
    );
  }

  const { above_threshold, below_threshold, threshold } = rules.preparation;
  const clampedRatio = lastRatio != null ? Math.min(lastRatio, AXIS_MAX_RATIO) : null;
  const thresholdPct = (threshold / AXIS_MAX_RATIO) * 100;

  return (
    <div className="hw-card-dark-lg">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber/10 border border-amber/30 rounded-lg text-amber shrink-0">
            <MountainIcon color="#E8832A" />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Règle Préparation</div>
            <div className="hw-text-caption text-steel mt-0.5">D+ sortie vs D+ hebdomadaire moyen (42j)</div>
          </div>
        </div>
        <InfoTooltip>
          Une sortie dont le D+ dépasse {threshold}× votre D+ hebdomadaire moyen des 42 derniers jours
          (repos compris) s'accompagne d'un risque d'effondrement nettement plus élevé sur votre
          historique — la caisse n'a pas eu le temps de s'adapter à cette charge inhabituelle.
        </InfoTooltip>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <div className="hw-text-label text-steel mb-0.5">Sous le seuil ({threshold}×)</div>
          <div className="text-xl font-bold font-mono tabular-nums text-moss">
            {below_threshold.pct_collapse != null ? `${Math.round(below_threshold.pct_collapse)}%` : '—'}
          </div>
          <div className="hw-text-caption text-steel/60">{below_threshold.n} sorties</div>
        </div>
        <div>
          <div className="hw-text-label text-steel mb-0.5">Au-dessus du seuil</div>
          <div className="text-xl font-bold font-mono tabular-nums" style={{ color: '#c0392b' }}>
            {above_threshold.pct_collapse != null ? `${Math.round(above_threshold.pct_collapse)}%` : '—'}
          </div>
          <div className="hw-text-caption text-steel/60">{above_threshold.n} sorties</div>
        </div>
      </div>

      <div className="relative h-3 bg-steel/10 rounded-full overflow-hidden">
        <div className="absolute h-full bg-moss/30" style={{ width: `${thresholdPct}%` }} />
        <div className="absolute h-full bg-[#c0392b]/20" style={{ left: `${thresholdPct}%`, right: 0 }} />
        <div className="absolute top-0 bottom-0 w-0.5 bg-mist/60" style={{ left: `${thresholdPct}%` }} />
        {clampedRatio != null && (
          <div
            className="absolute -top-1 w-2 h-5 rounded-full bg-glacier border-2 border-charcoal"
            style={{ left: `calc(${(clampedRatio / AXIS_MAX_RATIO) * 100}% - 4px)` }}
            title={`Position actuelle : ${lastRatio?.toFixed(2)}×`}
          />
        )}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="hw-text-caption text-steel/50">0×</span>
        {lastRatio != null && (
          <span className="hw-text-caption text-glacier">Dernière sortie : {lastRatio.toFixed(2)}×</span>
        )}
        <span className="hw-text-caption text-steel/50">{AXIS_MAX_RATIO}×+</span>
      </div>
    </div>
  );
}
