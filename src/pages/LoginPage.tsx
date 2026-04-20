import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';
import { authApi } from '@/services/api';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invite = searchParams.get('invite') ?? undefined;
  const callbackError = searchParams.get('error') ?? '';
  const [error, setError] = useState(callbackError);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleStravaLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      const url = await authApi.getStravaLoginUrl(invite);
      window.location.href = url;
    } catch {
      setError('Impossible de contacter le serveur. Réessaie dans un moment.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F2F2F2] overflow-hidden relative flex items-center justify-center">
      {/* Glowing orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#E8832A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-[#3DB2E0]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo / brand */}
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
              <span className="font-mono text-xs text-[#3A3F47] tracking-widest uppercase">HawkSight</span>
            </div>
            <p className="text-mist/40 text-sm font-body">Plateforme d'analyse sportive</p>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#E8832A]/5 to-[#3DB2E0]/5 rounded-3xl blur-2xl" />

            <div className="relative bg-[#0B0C10]/80 backdrop-blur-xl border border-[#3A3F47]/30 rounded-lg p-8">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber/60 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber/60 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-glacier/60 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-glacier/60 rounded-br" />

              {/* Header */}
              <div className="mb-7">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-md mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                  <span className="text-xs font-mono text-amber uppercase tracking-wider">
                    {invite ? 'Accès sur invitation' : 'Accès bêta'}
                  </span>
                </div>
                <h2 className="text-2xl font-heading font-bold mb-2">Connexion</h2>
                <p className="text-sm text-mist/50 font-body leading-relaxed">
                  {invite
                    ? 'Tu as été invité à rejoindre HawkSight. Connecte-toi avec ton compte Strava pour activer ton accès.'
                    : 'Connecte-toi avec ton compte Strava pour accéder à ta plateforme d\'analyse.'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-body">
                  {error}
                </div>
              )}

              {/* Strava button */}
              <button
                onClick={handleStravaLogin}
                disabled={isLoading}
                className="group relative w-full px-6 py-4 rounded-md font-heading font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-3"
                style={{ background: '#FC4C02' }}
              >
                {/* Strava logo SVG */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                <span className="relative z-10">
                  {isLoading ? 'Redirection...' : 'Se connecter avec Strava'}
                </span>
                {!isLoading && (
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>

              <p className="mt-5 text-center text-xs text-mist/30 font-mono">
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
