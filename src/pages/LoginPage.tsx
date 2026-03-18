import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context';
import { Logo } from '@/components/ui';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username.trim(), password, rememberMe);

    if (result === true) {
      navigate('/dashboard');
    } else {
      setError(result);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F2F2F2] overflow-hidden relative flex items-center justify-center">
      {/* Glowing orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#E8832A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-[#3DB2E0]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main content */}
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
              <span className="font-['JetBrains_Mono'] text-xs text-[#3A3F47] tracking-widest uppercase">HawkSight</span>
            </div>
            <p className="text-mist/40 text-sm font-['Inter']">Plateforme d'analyse sportive</p>
          </div>

          {/* Form card */}
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
                  <span className="text-xs font-['JetBrains_Mono'] text-amber uppercase tracking-wider">Accès sécurisé</span>
                </div>
                <h2 className="text-2xl font-heading font-bold">Connexion</h2>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-['Inter']">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Username */}
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-['Inter'] text-mist block">
                    Nom d'utilisateur
                  </label>
                  <div className="relative group">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="admin"
                      className="w-full px-4 py-3 bg-[#1C1E26]/50 border border-[#3A3F47]/50 rounded-md text-mist font-['Inter'] transition-all outline-none focus:border-amber focus:bg-[#1C1E26]/80 placeholder:text-mist/20"
                    />
                    <div className="absolute inset-0 border border-amber rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-['Inter'] text-mist block">
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••"
                      className="w-full px-4 py-3 pr-12 bg-[#1C1E26]/50 border border-[#3A3F47]/50 rounded-md text-mist font-['Inter'] transition-all outline-none focus:border-amber focus:bg-[#1C1E26]/80 placeholder:text-mist/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#3A3F47] hover:text-amber transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <div className="absolute inset-0 border border-amber rounded-md opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember_me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-[#1C1E26] border border-[#3A3F47] rounded accent-amber cursor-pointer"
                  />
                  <label htmlFor="remember_me" className="text-sm text-mist/50 hover:text-mist transition-colors font-['Inter'] cursor-pointer">
                    Se souvenir de moi <span className="text-xs">(30 jours)</span>
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full px-6 py-3.5 bg-amber text-charcoal font-heading font-bold rounded-md transition-all hover:shadow-[0_0_30px_rgba(232,131,42,0.4)] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden mt-2"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Connexion en cours...
                      </>
                    ) : (
                      <>
                        Se connecter
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                  {!isLoading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber to-[#FF9D4A] opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
    </div>
  );
}
