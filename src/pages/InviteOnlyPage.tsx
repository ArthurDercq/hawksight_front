import { motion } from 'motion/react';
import { Lock, Mail } from 'lucide-react';
import { Logo } from '@/components/ui';

export function InviteOnlyPage() {
  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F2F2F2] overflow-hidden relative flex items-center justify-center">
      {/* Glowing orbs */}
      <div className="absolute top-1/4 -left-40 w-96 h-96 bg-[#E8832A]/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-[#3DB2E0]/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size={52} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#E8832A]/5 to-[#3DB2E0]/5 rounded-3xl blur-2xl" />

            <div className="relative bg-[#0B0C10]/80 backdrop-blur-xl border border-[#3A3F47]/30 rounded-lg p-8 text-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-amber/60 rounded-tl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-amber/60 rounded-tr" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-glacier/60 rounded-bl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-glacier/60 rounded-br" />

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-14 h-14 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-amber" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-md mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-amber" />
                <span className="text-xs font-mono text-amber uppercase tracking-wider">Accès restreint</span>
              </div>

              <h2 className="text-2xl font-heading font-bold mb-3">HawkSight est en bêta privée</h2>

              <p className="text-mist/60 font-body text-sm leading-relaxed mb-6">
                L'accès à la plateforme est actuellement réservé aux utilisateurs invités.
                Pour rejoindre la bêta, contacte-nous et nous t'enverrons un lien d'invitation personnalisé.
              </p>

              <a
                href="mailto:arthur.dercq@skynet.be?subject=Demande%20d%27acc%C3%A8s%20HawkSight"
                className="group inline-flex items-center gap-2 px-5 py-3 bg-amber/10 border border-amber/40 rounded-md text-amber font-mono text-sm uppercase tracking-wider hover:bg-amber/20 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Demander un accès
              </a>

              <div className="mt-6 pt-6 border-t border-[#3A3F47]/30">
                <a
                  href="/login"
                  className="text-xs font-mono text-mist/30 hover:text-mist/60 transition-colors uppercase tracking-widest"
                >
                  ← Retour à la connexion
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
    </div>
  );
}
