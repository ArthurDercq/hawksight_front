import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';
import { authApi } from '@/services/api';

export function LoginPage() {
  const { isAuthenticated, loginWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invite = searchParams.get('invite') ?? undefined;
  const callbackError = searchParams.get('error') ?? '';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(callbackError);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStravaLoading, setIsStravaLoading] = useState(false);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) return;
    setError('');
    setIsSubmitting(true);
    const result = await loginWithCredentials(identifier.trim(), password);
    if (result === true) {
      navigate('/dashboard', { replace: true });
    } else if (result === 401) {
      setError('Identifiant ou mot de passe incorrect.');
    } else {
      setError(String(result));
    }
    setIsSubmitting(false);
  };

  const handleStravaLogin = async () => {
    setError('');
    setIsStravaLoading(true);
    try {
      const url = await authApi.getStravaLoginUrl(invite);
      window.location.href = url;
    } catch {
      setError('Impossible de contacter le serveur. Réessaie dans un moment.');
      setIsStravaLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F2F2F2] overflow-hidden relative flex items-center justify-center">
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#E8832A]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-[#3DB2E0]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size={52} />
            </div>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber" style={{ opacity: 1 - i * 0.3 }} />
                ))}
              </div>
              <span className="font-mono text-xs text-steel/80 tracking-widest uppercase">HawkSight</span>
            </div>
            <p className="text-mist/40 text-sm font-body">Plateforme d'analyse sportive</p>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#E8832A]/5 to-[#3DB2E0]/5 rounded-3xl blur-2xl" />

            <div className="relative bg-[#0B0C10]/80 backdrop-blur-xl border border-steel/30 rounded-lg p-8">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber/60 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber/60 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-glacier/60 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-glacier/60 rounded-br" />

              <div className="mb-7">
                <h2 className="text-2xl font-heading font-bold mb-2">Connexion</h2>
                <p className="text-sm text-mist/50 font-body">
                  Accède à ton espace d'analyse sportive.
                </p>
              </div>

              {error && (
                <motion.div
                  className="mb-5 p-3 bg-steel/10 border border-steel/20 rounded-lg"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-mist/60 text-xs font-mono uppercase tracking-wider">{error}</p>
                </motion.div>
              )}

              {/* Credentials form */}
              <form onSubmit={handleCredentialLogin} className="space-y-4 mb-6">
                <div>
                  <label className="block hw-text-label text-mist/40 mb-2">
                    Email ou nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    autoComplete="username"
                    placeholder="arthur@example.com"
                    className="w-full bg-charcoal/60 border border-steel/30 rounded-md px-4 py-3 text-sm font-body text-mist placeholder:text-mist/20 focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block hw-text-label text-mist/40 mb-2">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full bg-charcoal/60 border border-steel/30 rounded-md px-4 py-3 text-sm font-body text-mist placeholder:text-mist/20 focus:outline-none focus:border-amber/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !identifier || !password}
                  className="w-full py-3 rounded-md font-mono text-xs font-bold uppercase tracking-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber/15 border border-amber/30 text-amber hover:bg-amber/25 hover:border-amber/50"
                >
                  {isSubmitting ? 'Connexion…' : 'Se connecter'}
                </button>
              </form>

              {/* Separator */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-steel/20" />
                <span className="hw-text-label text-mist/25">ou</span>
                <div className="flex-1 h-px bg-steel/20" />
              </div>

              {/* Strava — première connexion */}
              <button
                onClick={handleStravaLogin}
                disabled={isStravaLoading}
                className="group relative w-full px-6 py-3.5 rounded-md font-mono text-xs font-bold uppercase tracking-[1.5px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border border-[#FC4C02]/30 bg-[#FC4C02]/10 text-[#FC4C02] hover:bg-[#FC4C02]/20 hover:border-[#FC4C02]/50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                {isStravaLoading ? 'Redirection…' : 'Première connexion via Strava'}
              </button>

              <p className="mt-5 text-center hw-text-caption text-mist/25">
                HawkSight ne stocke jamais ton mot de passe Strava
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
    </div>
  );
}
