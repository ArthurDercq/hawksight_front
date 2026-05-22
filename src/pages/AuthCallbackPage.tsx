import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

const STEPS = [
  "Vérification de l'autorisation Strava…",
  'Création de ton compte HawkSight…',
  'Génération du token de session…',
];

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { loginWithStravaCode } = useAuth();
  const navigate = useNavigate();
  const called = useRef(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStepIndex(i => (i + 1) % STEPS.length), 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    loginWithStravaCode(code).then(result => {
      if (result === true) {
        navigate('/dashboard', { replace: true });
      } else if (result === 'register') {
        // Nouvel utilisateur — le code onboarding est dans l'URL, on le passe à /register
        navigate(`/register?code=${encodeURIComponent(code)}`, { replace: true });
      } else if (result === 403) {
        navigate('/invite-only', { replace: true });
      } else {
        navigate(`/login?error=${encodeURIComponent(String(result))}`, { replace: true });
      }
    });
  }, [searchParams, loginWithStravaCode, navigate]);

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F2F2F2] overflow-hidden relative flex items-center justify-center">
      {/* Orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#E8832A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-[#3DB2E0]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo / brand — identique LoginPage */}
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

            <div className="relative bg-[#0B0C10]/80 backdrop-blur-xl border border-[#3A3F47]/30 rounded-lg p-8 text-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber/60 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber/60 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-glacier/60 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-glacier/60 rounded-br" />

              {/* Logo pulse ring */}
              <div className="flex justify-center mb-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-16 h-16 rounded-full border border-amber/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute w-12 h-12 rounded-full bg-amber/5" />
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-amber relative z-10">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-md mb-5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                <span className="text-xs font-mono text-amber uppercase tracking-wider">Connexion en cours</span>
              </div>

              {/* Step animé */}
              <div className="h-5 flex items-center justify-center mb-6">
                <motion.p
                  key={stepIndex}
                  className="hw-text-data text-mist/50 uppercase tracking-[1.5px]"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {STEPS[stepIndex]}
                </motion.p>
              </div>

              {/* Shimmer bar */}
              <div className="w-full h-px bg-steel/20 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute top-0 left-0 h-full w-1/3"
                  style={{ background: 'linear-gradient(90deg, transparent, #E8832A, transparent)' }}
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
    </div>
  );
}
