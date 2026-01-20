import { useProfile } from '@/hooks';
import { formatRelativeTime, formatMembershipDuration, formatSex } from '@/services/utils/formatters';

// SVG Icons
const UserIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const SyncIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export function ProfilePage() {
  const { profile, isLoading, error } = useProfile();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-heading text-3xl font-bold text-mist mb-6">Profil</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="animate-spin w-12 h-12 text-amber mx-auto mb-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-mist/60">Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="font-heading text-3xl font-bold text-mist mb-6">Profil</h1>
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6 text-center">
          <p className="text-red-400">{error || 'Impossible de charger le profil'}</p>
        </div>
      </div>
    );
  }

  const fullName = profile.firstname && profile.lastname
    ? `${profile.firstname} ${profile.lastname}`
    : profile.username || 'Utilisateur';

  const location = [profile.city, profile.country].filter(Boolean).join(', ') || 'Non renseigné';

  return (
    <div className="max-w-4xl mx-auto px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-[#7B6BC8]/10 border border-[#7B6BC8]/30 text-[#7B6BC8]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="font-heading text-3xl font-bold text-mist">Profil</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Header */}
        <div className="md:col-span-3 card-glass rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative flex items-center gap-6">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={`Photo de ${fullName}`}
                className="w-24 h-24 rounded-full object-cover border-3 border-amber shadow-lg shadow-amber/30"
              />
            ) : (
              <div className="w-24 h-24 bg-steel/30 rounded-full flex items-center justify-center border-3 border-steel text-steel">
                <UserIcon />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-heading text-2xl font-semibold text-mist">{fullName}</h2>
                {profile.premium && (
                  <span className="px-3 py-1 bg-gradient-to-r from-amber to-amber-light text-charcoal text-xs font-bold rounded-full uppercase tracking-wider shadow-lg shadow-amber/30">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-mist/60 flex items-center gap-2 mt-1">
                <span className="text-glacier"><MapPinIcon /></span>
                {location}
              </p>
              {profile.created_at && (
                <p className="text-steel text-sm mt-2 font-mono">
                  Membre depuis {formatMembershipDuration(profile.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="card-glass rounded-lg p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-amber/10 border border-amber/30 text-amber">
                <ActivityIcon />
              </div>
              <h3 className="text-sm text-mist/60">Activites</h3>
            </div>
            <p className="text-3xl font-bold font-mono text-amber">
              {profile.activities_count ?? 0}
            </p>
          </div>
        </div>

        <div className="card-glass rounded-lg p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-glacier/10 border border-glacier/30 text-glacier">
                <DatabaseIcon />
              </div>
              <h3 className="text-sm text-mist/60">Streams</h3>
            </div>
            <p className="text-3xl font-bold font-mono text-glacier">
              {profile.streams_count ?? 0}
            </p>
          </div>
        </div>

        <div className="card-glass rounded-lg p-6 relative overflow-hidden group hover:-translate-y-0.5 transition-all">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-moss/10 border border-moss/30 text-moss">
                <SyncIcon />
              </div>
              <h3 className="text-sm text-mist/60">Derniere sync</h3>
            </div>
            <p className="text-2xl font-bold font-mono text-moss">
              {profile.last_sync_at ? formatRelativeTime(profile.last_sync_at) : 'Jamais'}
            </p>
          </div>
        </div>

        {/* Account Details */}
        <div className="md:col-span-3 card-glass rounded-lg p-6 relative overflow-hidden">
          <div className="absolute inset-0 grid-pattern pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-steel/20 border border-steel/30 text-mist">
                <SettingsIcon />
              </div>
              <h3 className="font-heading font-semibold text-mist">Details du compte</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-charcoal/50 rounded-lg p-4">
                <p className="text-xs text-mist/50 uppercase tracking-wider mb-1">Email</p>
                <p className="text-mist font-mono">{profile.email_address || 'Non renseigné'}</p>
              </div>
              <div className="bg-charcoal/50 rounded-lg p-4">
                <p className="text-xs text-mist/50 uppercase tracking-wider mb-1">Strava ID</p>
                <p className="text-mist font-mono">{profile.strava_id || '-'}</p>
              </div>
              <div className="bg-charcoal/50 rounded-lg p-4">
                <p className="text-xs text-mist/50 uppercase tracking-wider mb-1">Genre</p>
                <p className="text-mist">{formatSex(profile.sex)}</p>
              </div>
              <div className="bg-charcoal/50 rounded-lg p-4">
                <p className="text-xs text-mist/50 uppercase tracking-wider mb-1">Statut</p>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-moss animate-pulse' : 'bg-red-400'}`} />
                  <p className={profile.is_active ? 'text-moss' : 'text-red-400'}>
                    {profile.is_active ? 'Actif' : 'Inactif'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
