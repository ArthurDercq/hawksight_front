import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

export function PlateformePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(232,131,42,0.06) 0%, transparent 55%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/20 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            <span className="font-mono text-[10px] text-amber uppercase tracking-[3px]">Plateforme · SaaS Trail</span>
          </motion.div>

          <motion.h1
            className="font-heading font-bold text-5xl md:text-7xl text-mist leading-none mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Tout ce dont<br />
            <span className="text-amber font-normal italic">un trailer a besoin.</span>
          </motion.h1>

          <motion.p
            className="font-mono text-[11px] text-steel/85 leading-relaxed tracking-wide max-w-xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            HawkSight centralise l'analyse de tes activités, la cartographie de ton territoire et le suivi de ta progression — en une seule plateforme connectée à Strava.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            <button onClick={handleCTA} className="hw-btn-amber px-10 py-3.5 text-sm">
              {isAuthenticated ? 'Accéder au Dashboard' : 'Essayer gratuitement'}
              <ArrowRightIcon />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-glacier/10 border border-glacier/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse" />
              <span className="font-mono text-[10px] text-glacier uppercase tracking-[2px]">Ce que tu obtiens</span>
            </div>
            <h2 className="font-heading font-bold text-4xl text-mist">
              Une plateforme, trois dimensions.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '◈',
                title: 'Territoire H3',
                desc: 'Cartographie hexagonale de chaque sentier couru. Visualise ton empire, mesure ta progression, identifie les zones inexplorées.',
                color: 'amber',
                href: '/terrain',
                cta: 'Voir Terrain →',
              },
              {
                icon: '⟁',
                title: 'Analytics',
                desc: 'Pace, dénivelé, fréquence cardiaque, VAM — chaque donnée de tes sorties analysée et mise en contexte sur la durée.',
                color: 'glacier',
                href: '/analytics',
                cta: 'Voir Analytics →',
              },
              {
                icon: '◎',
                title: 'Méthode',
                desc: 'Un score trail multidimensionnel calculé sur ton historique complet. Endurance, technicité, régularité, dénivelé, vitesse.',
                color: 'amber',
                href: '/methode',
                cta: 'Voir Méthode →',
              },
            ].map(({ icon, title, desc, color, href, cta }, i) => (
              <motion.div
                key={title}
                className="hw-card-dark relative p-6 flex flex-col gap-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
              >
                <span className={`hw-br hw-br-tl hw-br-${color}`} />
                <span className={`hw-br hw-br-br hw-br-${color}`} />
                <span className={`font-mono text-3xl ${color === 'amber' ? 'text-amber' : 'text-glacier'}`}>{icon}</span>
                <div>
                  <h3 className="font-heading font-semibold text-lg text-mist mb-2">{title}</h3>
                  <p className="font-mono text-[9px] text-steel/80 leading-relaxed">{desc}</p>
                </div>
                <a href={href} className="hw-link mt-auto">{cta}</a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Intégration Strava ── */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(61,178,224,0.03) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="hw-card-dark relative p-8 md:p-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="hw-br hw-br-tl hw-br-amber" />
            <span className="hw-br hw-br-tr hw-br-amber" />
            <span className="hw-br hw-br-bl" />
            <span className="hw-br hw-br-br" />
            <p className="font-mono text-[9px] text-amber uppercase tracking-[3px] mb-3">Connexion en 30 secondes</p>
            <h2 className="font-heading font-bold text-3xl md:text-4xl text-mist mb-4">
              Connecte Strava.<br />Tout le reste est automatique.
            </h2>
            <p className="font-mono text-[10px] text-steel/75 uppercase tracking-[1px] mb-8">
              Toutes tes activités · Aucune saisie manuelle · Mise à jour à chaque sortie
            </p>
            <button onClick={handleCTA} className="hw-btn-amber px-10 py-3.5 text-sm">
              {isAuthenticated ? 'Accéder au Dashboard' : 'Commencer maintenant'}
              <ArrowRightIcon />
            </button>
          </motion.div>
        </div>
      </section>

      {/* ── Placeholder sections futures ── */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="hw-grad-sep mx-auto w-16" />
        </div>
      </section>

    </div>
  );
}
