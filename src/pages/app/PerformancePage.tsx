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

const RulesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M5 9l-3 6a4 4 0 0 0 8 0L7 9M19 9l-3 6a4 4 0 0 0 8 0L21 9M2 9h10M14 9h8" />
  </svg>
);

const SignatureIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" />
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

function SectionSeparator({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="hw-section-sep flex items-start gap-3.5 mt-1">
      <div className="absolute top-0 left-0 w-24 h-px bg-gradient-to-r from-glacier to-transparent" />
      <div className="relative p-1.5 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
        {icon}
      </div>
      <div>
        <div className="font-mono text-[15px] font-semibold text-mist">{title}</div>
        <div className="flex items-center gap-1 mt-1.5">
          <div className="w-16 h-px bg-gradient-to-r from-glacier to-transparent" />
          <div className="w-1 h-1 rounded-full bg-glacier" />
        </div>
      </div>
    </div>
  );
}

function SocleSummaryCard({
  nOutings, modelVersion, computedAt, vFlat,
}: { nOutings: number | null; modelVersion: string | null; computedAt: string | null; vFlat: number | null }) {
  return (
    <div className="relative overflow-hidden flex flex-col bg-charcoal border border-steel/30 rounded-lg p-5 min-h-[240px]">
      <span className="hw-br hw-br-tl hw-br-amber" />
      <span className="hw-br hw-br-br hw-br-amber-dark" />
      <p className="hw-score-eyebrow">Votre socle</p>
      <div className="flex items-end gap-1 mt-1.5">
        <p className="font-mono text-[56px] font-black leading-none text-amber tabular-nums">
          {nOutings ?? '--'}
        </p>
        <span className="hw-text-value text-amber/40 pb-2">sorties</span>
      </div>
      <div className="hw-grad-sep" />
      <div className="flex flex-col gap-2 mt-3">
        <div className="flex items-center justify-between">
          <span className="hw-text-label text-steel">Vitesse de référence (plat)</span>
          <span className="hw-text-data text-mist">{vFlat != null ? `${vFlat.toFixed(1)} km/h` : '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="hw-text-label text-steel">Modèle</span>
          <span className="hw-text-data text-mist">{modelVersion ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="hw-text-label text-steel">Dernière analyse</span>
          <span className="hw-text-data text-mist">
            {computedAt ? new Date(computedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PerformancePage() {
  const { baseline, isLoading, error } = useEfBaseline();
  const hasData = baseline !== null;

  return (
    <div className="flex flex-col gap-3 max-w-[1200px]">
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

          {/* ── Row hero : résumé du socle + courbe de forme ── */}
          <div className="grid gap-3 grid-cols-[280px_1fr]">
            <SocleSummaryCard
              nOutings={baseline.n_outings}
              modelVersion={baseline.model_version}
              computedAt={baseline.computed_at}
              vFlat={baseline.v_flat}
            />
            <FitnessCurveChart baselineHistory={baseline.baseline_history} fitness180d={baseline.fitness_180d} />
          </div>

          <SectionSeparator icon={<RulesIcon />} title="Règles personnelles" />

          <div className="grid grid-cols-2 gap-3">
            <PacingRuleChart rules={baseline.rules} />
            <PrepRuleChart rules={baseline.rules} outings={baseline.outings} />
          </div>

          <SectionSeparator icon={<SignatureIcon />} title="Signature physiologique" />

          <div className="grid grid-cols-2 gap-3">
            <GapSignatureChart gapCurve={baseline.gap_curve} />
            <PhysioBudgetScatter outings={baseline.outings} />
          </div>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
