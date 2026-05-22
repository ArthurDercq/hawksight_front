import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';
import { authApi } from '@/services/api';

function decodeOnboardingPayload(token: string): { username?: string; firstname?: string } {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return {};
  }
}

export function RegisterPage() {
  const { registerWithOnboarding, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const called = useRef(false);

  const [onboardingToken, setOnboardingToken] = useState<string | null>(null);
  const [stravaName, setStravaName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  // Échange le code onboarding contre le token onboarding au mount
  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    authApi.exchangeStravaCode(code).then(({ access_token }) => {
      const payload = decodeOnboardingPayload(access_token);
      if (!payload) {
        navigate('/login?error=Session+invalide', { replace: true });
        return;
      }
      setOnboardingToken(access_token);
      const name = payload.username || payload.firstname || '';
      setStravaName(name);
      setUsername(name);
      setIsExchanging(false);
    }).catch(() => {
      navigate('/login?error=Lien+expiré,+recommence+la+connexion', { replace: true });
    });
  }, [searchParams, navigate]);

  const passwordsMatch = password === passwordConfirm;
  const isValid = username.trim().length >= 2 && email.includes('@') && password.length >= 8 && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !onboardingToken) return;
    setError('');
    setIsSubmitting(true);
    const result = await registerWithOnboarding(onboardingToken, username.trim(), email.trim(), password);
    if (result === true) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(String(result));
      setIsSubmitting(false);
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
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#E8832A]/5 to-[#3DB2E0]/5 rounded-3xl blur-2xl" />

            <div className="relative bg-[#0B0C10]/80 backdrop-blur-xl border border-steel/30 rounded-lg p-8">
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber/60 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber/60 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-glacier/60 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-glacier/60 rounded-br" />

              {isExchanging ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-amber/30 border-t-amber rounded-full animate-spin mx-auto mb-4" />
                  <p className="hw-text-data text-mist/40 uppercase tracking-[2px]">Vérification Strava…</p>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="mb-7">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-moss/10 border border-moss/30 rounded-md mb-4">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6DAA75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="hw-text-caption text-moss uppercase tracking-wider">Strava connecté</span>
                    </div>
                    <h2 className="text-2xl font-heading font-bold mb-2">
                      {stravaName ? `Bienvenue, ${stravaName.split(' ')[0]} !` : 'Crée ton compte'}
                    </h2>
                    <p className="text-sm text-mist/50 font-body">
                      Choisis tes identifiants pour te connecter les prochaines fois.
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

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block hw-text-label text-mist/40 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="arthur_trail"
                        className="w-full bg-charcoal/60 border border-steel/30 rounded-md px-4 py-3 text-sm font-body text-mist placeholder:text-mist/20 focus:outline-none focus:border-amber/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block hw-text-label text-mist/40 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                        placeholder="arthur@example.com"
                        className="w-full bg-charcoal/60 border border-steel/30 rounded-md px-4 py-3 text-sm font-body text-mist placeholder:text-mist/20 focus:outline-none focus:border-amber/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block hw-text-label text-mist/40 mb-2">
                        Mot de passe <span className="text-mist/20">(8 caractères min.)</span>
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full bg-charcoal/60 border border-steel/30 rounded-md px-4 py-3 text-sm font-body text-mist placeholder:text-mist/20 focus:outline-none focus:border-amber/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block hw-text-label text-mist/40 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={e => setPasswordConfirm(e.target.value)}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className={`w-full bg-charcoal/60 border rounded-md px-4 py-3 text-sm font-body text-mist placeholder:text-mist/20 focus:outline-none transition-colors ${
                          passwordConfirm && !passwordsMatch
                            ? 'border-red-500/40 focus:border-red-500/60'
                            : 'border-steel/30 focus:border-amber/50'
                        }`}
                      />
                      {passwordConfirm && !passwordsMatch && (
                        <p className="mt-1 hw-text-label text-red-400/70 uppercase tracking-wider">
                          Les mots de passe ne correspondent pas
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !isValid}
                      className="w-full py-3 mt-2 rounded-md font-mono text-xs font-bold uppercase tracking-[2px] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber/15 border border-amber/30 text-amber hover:bg-amber/25 hover:border-amber/50"
                    >
                      {isSubmitting ? 'Création du compte…' : 'Créer mon compte'}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
    </div>
  );
}
