import { useEffect } from 'react';
import { motion, animate, useMotionValue } from 'motion/react';
import { Logo } from '@/components/ui';
import type { JobSyncStatus } from '@/hooks/useSyncStatus';

const JOB_MESSAGES: Record<string, { label: string; sub: string }> = {
  initial_sync_metadata: { label: 'Récupération de vos activités…',   sub: 'Import de l\'historique Strava' },
  sync_streams_chunk:    { label: 'Calcul des données GPS…',           sub: 'Analyse des flux de capteurs' },
  compute_kpis:          { label: 'Calcul de vos statistiques…',       sub: 'KPIs, records, Trail Score' },
  compute_exploration:   { label: 'Cartographie de vos zones…',        sub: 'Hexagones et territoires explorés' },
};

// Skeleton card — pulse amber subtil
function SkeletonCard({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`hw-card-dark rounded-lg overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-2 w-20 rounded-full bg-steel/20 animate-pulse" />
          <div className="h-2 w-10 rounded-full bg-steel/10 animate-pulse" />
        </div>
        <div className="h-10 w-32 rounded bg-steel/15 animate-pulse" style={{ animationDelay: `${delay + 0.1}s` }} />
        <div className="h-1 w-full rounded-full bg-steel/10 animate-pulse" style={{ animationDelay: `${delay + 0.2}s` }} />
      </div>
    </motion.div>
  );
}

function SkeletonChart({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      className="hw-card-dark rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="h-2 w-28 rounded-full bg-steel/20 animate-pulse" />
          <div className="h-2 w-16 rounded-full bg-steel/10 animate-pulse" />
        </div>
        {/* Fake bar chart */}
        <div className="flex items-end gap-2 h-24 pt-2">
          {[55, 80, 40, 95, 65, 30, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-steel/15 animate-pulse"
              style={{ height: `${h}%`, animationDelay: `${delay + i * 0.05}s` }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Barre de progression animée qui monte jusqu'à ~85% pendant le sync
function SyncProgressBar({ progress }: { progress: number }) {
  const width = useMotionValue(0);

  useEffect(() => {
    animate(width, progress, { duration: 1.2, ease: 'easeOut' });
  }, [progress, width]);

  return (
    <div className="w-full h-1 bg-steel/20 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{
          width: width.get() + '%',
          background: 'linear-gradient(90deg, #E8832A 0%, #FF9D4A 100%)',
          boxShadow: '0 0 8px rgba(232,131,42,0.5)',
        }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </div>
  );
}

interface Props {
  status: JobSyncStatus | null;
  hasData: boolean;
}

export function OnboardingScreen({ status, hasData }: Props) {
  const isSyncing = status?.is_syncing ?? true;
  const hasError = status?.has_error ?? false;
  const jobProgress = status?.current_job?.progress ?? 0;
  const isRateLimitPaused = isSyncing
    && status?.current_job?.status === 'pending'
    && jobProgress === 0;

  // Pendant le sync : monte progressivement jusqu'à 90% max (le vrai 100% = données présentes)
  // Sans job progress : animation indéterminée entre 10 et 60%
  const displayProgress = isSyncing
    ? jobProgress > 0 ? Math.min(jobProgress, 90) : undefined
    : hasData ? 100 : 0;

  // Pour l'indéterminé, on anime en boucle
  const indeterminateWidth = useMotionValue(10);
  useEffect(() => {
    if (displayProgress !== undefined) return;
    let cancelled = false;
    function pulse() {
      if (cancelled) return;
      animate(indeterminateWidth, 60, { duration: 1.8, ease: 'easeInOut' }).then(() => {
        if (cancelled) return;
        animate(indeterminateWidth, 15, { duration: 1.4, ease: 'easeInOut' }).then(pulse);
      });
    }
    pulse();
    return () => { cancelled = true; };
  }, [displayProgress, indeterminateWidth]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B0C10] overflow-y-auto">
      {/* Orbs */}
      <div className="fixed top-1/4 -left-40 w-96 h-96 bg-[#E8832A]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -right-40 w-80 h-80 bg-[#3DB2E0]/6 rounded-full blur-3xl pointer-events-none" />

      {/* Hex grid subtile */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='48'%3E%3Cpolygon points='28,2 52,14 52,38 28,50 4,38 4,14' fill='none' stroke='%233A3F47' stroke-width='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: '56px 48px',
          opacity: 0.15,
          maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
        }}
      />

    <div className="relative z-10 max-w-[900px] mx-auto px-8 py-12 flex flex-col gap-6">

      {/* Header brand */}
      <motion.div
        className="flex items-center gap-3 mb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo size={28} />
        <span className="font-mono text-xs text-steel/85 uppercase tracking-[3px]">HawkSight</span>
      </motion.div>

      {/* Message principal */}
      <motion.div
        className="relative overflow-hidden hw-card-dark rounded-lg p-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Glow */}
        <span className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at top left, rgba(232,131,42,0.07) 0%, transparent 60%)' }} />
        <span className="hw-br hw-br-tl hw-br-amber" />
        <span className="hw-br hw-br-br hw-br-glacier" />

        <div className="flex items-center gap-4">
          <Logo size={36} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isSyncing && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber absolute" />
                </span>
              )}
              <h2 className="font-heading font-bold text-lg text-mist">
                {hasError
                  ? 'Une erreur est survenue'
                  : isRateLimitPaused
                  ? 'Pause Strava — reprise automatique'
                  : isSyncing
                  ? (JOB_MESSAGES[status?.current_job?.type ?? '']?.label ?? 'Import de tes activités Strava en cours…')
                  : hasData
                  ? 'Import terminé !'
                  : 'Aucune activité trouvée'}
              </h2>
            </div>
            <p className="font-mono text-[11px] text-steel uppercase tracking-wider">
              {hasError
                ? 'Contacte le support si le problème persiste'
                : isRateLimitPaused
                ? 'Limite API Strava atteinte — reprise dans ~15 min, cette page se met à jour automatiquement'
                : isSyncing
                ? (JOB_MESSAGES[status?.current_job?.type ?? '']?.sub ?? 'Première synchronisation — quelques minutes selon ton historique')
                : hasData
                ? 'Rechargement du dashboard…'
                : 'Connecte Strava et déclenche une synchronisation depuis ton profil'}
            </p>
          </div>
          {isSyncing && (
            <div className="font-mono text-2xl font-black text-amber/60 tabular-nums shrink-0">
              {displayProgress !== undefined ? `${Math.round(displayProgress)}%` : '···'}
            </div>
          )}
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          {displayProgress !== undefined ? (
            <SyncProgressBar progress={displayProgress} />
          ) : (
            <div className="w-full h-1 bg-steel/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: indeterminateWidth,
                  background: 'linear-gradient(90deg, #E8832A 0%, #FF9D4A 100%)',
                  boxShadow: '0 0 8px rgba(232,131,42,0.4)',
                }}
              />
            </div>
          )}
        </div>

        {isSyncing && (
          <p className="mt-3 font-mono text-[9px] text-steel/75 uppercase tracking-[1.5px]">
            Cette page se met à jour automatiquement toutes les 5 secondes
          </p>
        )}
      </motion.div>

      {/* Skeleton dashboard — donne l'impression que les données arrivent */}
      <div className="grid gap-3" style={{ gridTemplateColumns: '280px 1fr' }}>
        <SkeletonCard delay={0.1} className="min-h-[280px]" />
        <SkeletonCard delay={0.18} className="min-h-[280px]" />
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <SkeletonCard key={i} delay={0.25 + i * 0.07} />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <SkeletonCard delay={0.5} />
        <SkeletonChart delay={0.58} />
        <SkeletonChart delay={0.66} />
      </div>

      <SkeletonChart delay={0.75} />

    </div>{/* inner max-w */}
    </div> /* fixed fullscreen */
  );
}
