import { SectionTitle } from '@/components/ui/SectionTitle';
import { Spinner } from '@/components/ui/Spinner';
import { useEfBaseline } from '@/hooks';
import {
  PacingRuleChart,
  PrepRuleChart,
  FitnessCurveChart,
  PhysioBudgetScatter,
  GapSignatureChart,
} from '@/components/analysis';

const ChartBarIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

function FlagsBanner({ flags }: { flags: string[] }) {
  return (
    <div className="hw-card-dark p-4 space-y-2">
      {flags.map((flag, i) => (
        <div key={i} className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="hw-text-caption text-steel/85">{flag}</p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="hw-card-dark-lg p-12 text-center">
      <p className="font-mono text-sm text-steel">
        Pas encore assez d'historique pour construire votre socle de performance.
      </p>
      <p className="hw-text-caption text-steel/60 mt-2">
        Continuez à enregistrer vos sorties longues — l'analyse s'affine automatiquement.
      </p>
    </div>
  );
}

export function PerformancePage() {
  const { baseline, isLoading, error } = useEfBaseline();
  const hasData = baseline !== null;

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">
      <SectionTitle
        title="Analyse de Performance"
        subtitle="Votre socle personnel — règles, forme, signature GAP"
        icon={<ChartBarIcon color="#E8832A" />}
      />

      {isLoading && !hasData ? (
        <div className="flex justify-center py-12">
          <Spinner message="Chargement de votre socle d'analyse..." fullPage={false} />
        </div>
      ) : error && !hasData ? (
        <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="hw-text-data text-steel/85 uppercase tracking-wider">{error}</p>
        </div>
      ) : baseline ? (
        <>
          {baseline.flags.length > 0 && <FlagsBanner flags={baseline.flags} />}

          <div className="grid grid-cols-2 gap-4">
            <PacingRuleChart rules={baseline.rules} />
            <PrepRuleChart rules={baseline.rules} outings={baseline.outings} />
          </div>

          <FitnessCurveChart baselineHistory={baseline.baseline_history} fitness180d={baseline.fitness_180d} />

          <div className="grid grid-cols-2 gap-4">
            <PhysioBudgetScatter outings={baseline.outings} />
            <GapSignatureChart gapCurve={baseline.gap_curve} />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
