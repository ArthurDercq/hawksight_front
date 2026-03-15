import { useState, useEffect } from 'react';
import { useProfile, useKPI } from '@/hooks';
import { explorationApi, activitiesApi, apiClient } from '@/services/api';
import { formatRelativeTime, formatMembershipDuration } from '@/services/utils/formatters';

// ─── Icons ────────────────────────────────────────────────────────────────────

const UserIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);


const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SyncIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg
    width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    className={spinning ? 'animate-spin' : ''}
    style={spinning ? { animationDirection: 'reverse' } : {}}
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StravaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
  </svg>
);

const HeartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const IdIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

// ─── Sport tags config ─────────────────────────────────────────────────────────

const SPORT_TAGS: Record<string, { label: string; color: string; emoji: string }> = {
  total_km_run:   { label: 'Course',  color: '#E8832A', emoji: '🏃' },
  total_km_trail: { label: 'Trail',   color: '#C96A1A', emoji: '🏔️' },
  total_km_bike:  { label: 'Vélo',    color: '#3DB2E0', emoji: '🚵' },
  total_km_swim:  { label: 'Natation',color: '#6DAA75', emoji: '🏊' },
};

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
}

function StatCard({ icon, label, value, unit, color }: StatCardProps) {
  return (
    <div className="card-glass rounded-lg p-5 relative overflow-hidden group hover:-translate-y-0.5 transition-all">
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none"
        style={{ backgroundColor: color }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg border" style={{ backgroundColor: `${color}15`, borderColor: `${color}30`, color }}>
            {icon}
          </div>
          <span className="text-xs text-mist/50 font-['Inter'] uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
          {unit && <span className="text-xs text-mist/30 font-mono">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-steel/10 last:border-0">
      <span className="text-xs text-mist/40 font-mono uppercase tracking-wider">{label}</span>
      <span className="text-sm text-mist font-mono">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ProfilePage() {
  const { profile, isLoading, error } = useProfile();
  const { kpis } = useKPI();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [explorationKm2, setExplorationKm2] = useState<number | null>(null);

  useEffect(() => {
    explorationApi.getStats().then(s => setExplorationKm2(s.surface_km2)).catch(() => null);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncDone(false);
    try {
      await activitiesApi.syncActivities();
      await activitiesApi.syncStreams();
      apiClient.clearCache();
      window.dispatchEvent(new Event('activities-updated'));
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch (e) {
      console.error('Sync error', e);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-center py-24">
        <div className="text-center">
          <svg className="animate-spin w-10 h-10 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-mist/50 font-mono text-sm">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 font-mono text-sm">{error || 'Impossible de charger le profil'}</p>
        </div>
      </div>
    );
  }

  const fullName = profile.username || 'Utilisateur';

  // Active sports from KPIs
  const activeSports = kpis
    ? Object.entries(SPORT_TAGS).filter(([key]) => (kpis[key as keyof typeof kpis] as number ?? 0) > 0)
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6">
      {/* Page title */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-[#7B6BC8]/10 border border-[#7B6BC8]/30 text-[#7B6BC8]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="font-heading text-2xl font-bold text-mist">Profil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">

          {/* Hero card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
            {/* Corner brackets */}
            <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-amber/30 rounded-tl" />
            <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-amber/30 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-amber/30 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-amber/30 rounded-br" />

            {/* Glow behind avatar */}
            <div className="absolute top-4 left-4 w-32 h-32 bg-amber/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex items-start gap-6">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-amber/20 blur-xl" />
                <div className="relative w-20 h-20 rounded-full bg-steel/20 border-2 border-steel/40 flex items-center justify-center text-steel">
                  <UserIcon />
                </div>
                {/* Status dot */}
                <span className={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 border-[#0B0C10] ${profile.is_active ? 'bg-[#6DAA75] animate-pulse' : 'bg-red-400'}`} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="font-heading text-xl font-semibold text-[#F2F2F2]">{fullName}</h2>
                </div>

                {/* Gradient separator */}
                <div className="h-px bg-gradient-to-r from-amber via-glacier to-transparent mb-3 w-48" />

                {profile.created_at && (
                  <p className="text-steel text-xs font-mono mb-3">
                    MEMBRE DEPUIS {formatMembershipDuration(profile.created_at).toUpperCase()}
                  </p>
                )}

                {/* Sport tags */}
                {activeSports.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeSports.map(([key, tag]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-['Inter'] border"
                        style={{ backgroundColor: `${tag.color}12`, borderColor: `${tag.color}30`, color: tag.color }}
                      >
                        {tag.emoji} {tag.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* HAWKSIGHT monogram top right */}
              <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                <div className="flex gap-0.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1 h-1 rounded-full bg-amber" style={{ opacity: 1 - i * 0.3 }} />
                  ))}
                </div>
                <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">HAWKSIGHT</span>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4">
            <StatCard
              icon={<GlobeIcon />}
              label="Territoire conquis"
              value={explorationKm2 !== null ? formatNumber(explorationKm2) : '—'}
              unit="km²"
              color="#7B6BC8"
            />
          </div>

          {/* Account details */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden">
                  <div className="relative">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-steel/10 border border-steel/20 text-mist/50">
                  <IdIcon />
                </div>
                <h3 className="font-heading font-semibold text-mist text-sm">Informations du compte</h3>
              </div>

              <DetailRow label="Email" value={profile.email_address || <span className="text-mist/30">Non renseigné</span>} />
              <DetailRow label="Strava ID" value={profile.strava_id ? `#${profile.strava_id}` : '—'} />
              <DetailRow
                label="Statut"
                value={
                  <span className={`flex items-center gap-1.5 ${profile.is_active ? 'text-[#6DAA75]' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${profile.is_active ? 'bg-[#6DAA75]' : 'bg-red-400'}`} />
                    {profile.is_active ? 'Actif' : 'Inactif'}
                  </span>
                }
              />
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          {/* Sync card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6DAA75]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-[#6DAA75]/10 border border-[#6DAA75]/30 text-[#6DAA75]">
                  <SyncIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Synchronisation</h3>
                  <p className="text-[#3A3F47] text-xs font-mono mt-0.5">
                    {profile.last_sync_at
                      ? formatRelativeTime(profile.last_sync_at)
                      : 'Jamais synchronisé'}
                  </p>
                </div>
              </div>

              {/* Last sync date */}
              {profile.last_sync_at && (
                <div className="mb-4 px-3 py-2 bg-charcoal/60 rounded-lg border border-[#3A3F47]/20">
                  <p className="text-[#3A3F47] text-[10px] font-mono uppercase tracking-wider mb-0.5">Dernière sync</p>
                  <p className="text-mist/70 text-xs font-mono">
                    {new Date(profile.last_sync_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              )}

              {/* Sync button */}
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={syncDone
                  ? { backgroundColor: '#6DAA7520', border: '1px solid #6DAA7540', color: '#6DAA75' }
                  : { backgroundColor: '#6DAA7515', border: '1px solid #6DAA7530', color: '#6DAA75' }
                }
              >
                {syncDone ? (
                  <><CheckIcon /> Synchronisé !</>
                ) : (
                  <><SyncIcon spinning={isSyncing} /> {isSyncing ? 'Synchronisation...' : 'Synchroniser maintenant'}</>
                )}
              </button>
            </div>
          </div>

          {/* FC Max card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8832A]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30 text-amber">
                  <HeartIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">FC Max personnelle</h3>
                  <p className="text-[#3A3F47] text-xs font-mono mt-0.5">Utilisée pour les zones cardiaques</p>
                </div>
              </div>
              <FCMaxInput />
            </div>
          </div>

          {/* Strava connection card */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FC4C02]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-[#3A3F47]/30">
                <div className="p-1.5 rounded-lg bg-[#FC4C02]/10 border border-[#FC4C02]/30 text-[#FC4C02]">
                  <StravaIcon />
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-mist text-sm">Connexion Strava</h3>
                  <p className="text-[#3A3F47] text-xs font-mono mt-0.5">Compte lié</p>
                </div>
              </div>

              <div className="space-y-2">
                {profile.strava_id ? (
                  <div className="flex items-center justify-between px-3 py-2 bg-charcoal/60 rounded-lg border border-[#3A3F47]/20">
                    <span className="text-[#3A3F47] text-[10px] font-mono uppercase tracking-wider">Strava ID</span>
                    <span className="text-[#FC4C02] font-mono text-sm">#{profile.strava_id}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-3 py-2 bg-charcoal/60 rounded-lg border border-[#3A3F47]/20">
                    <span className="text-[#3A3F47] text-[10px] font-mono uppercase tracking-wider">Statut</span>
                    <span className="text-mist/30 text-xs font-mono">Non connecté</span>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── FC Max sub-component ─────────────────────────────────────────────────────

const FC_MAX_KEY = 'hawksight:fc_max';

function FCMaxInput() {
  const [value, setValue] = useState<string>(() => {
    return localStorage.getItem(FC_MAX_KEY) ?? '';
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 250) {
      localStorage.setItem(FC_MAX_KEY, String(parsed));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={100}
          max={250}
          value={value}
          onChange={e => { setValue(e.target.value); setSaved(false); }}
          onKeyDown={handleKeyDown}
          placeholder="ex: 185"
          className="flex-1 px-3 py-2 bg-charcoal/60 border border-[#3A3F47]/40 rounded-lg text-mist font-mono text-sm focus:border-amber focus:outline-none transition-colors placeholder:text-mist/20"
        />
        <span className="text-[#3A3F47] font-mono text-sm">BPM</span>
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={saved
          ? { backgroundColor: '#E8832A20', border: '1px solid #E8832A40', color: '#E8832A' }
          : { backgroundColor: '#E8832A10', border: '1px solid #E8832A25', color: '#E8832A' }
        }
      >
        {saved ? <><CheckIcon /> Sauvegardé</> : 'Enregistrer'}
      </button>

      <p className="text-[#3A3F47] text-[10px] font-mono leading-relaxed">
        Valeur stockée localement sur votre appareil. Utilisée pour calculer vos zones cardiaques (Z1–Z5).
      </p>
    </div>
  );
}
