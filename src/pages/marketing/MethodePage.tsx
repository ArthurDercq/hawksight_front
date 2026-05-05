import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const AXES = [
  { label: 'Endurance',  score: 78, color: '#E8832A', desc: 'Maintien de l\'effort sur la durée. Calculé sur tes sorties longues et la stabilité de ta FC.' },
  { label: 'Dénivelé',   score: 85, color: '#3DB2E0', desc: 'Efficacité en montée et descente. VAP, ratio D+/vitesse, gestion des descentes techniques.' },
  { label: 'Régularité', score: 62, color: '#6DAA75', desc: 'Constance de l\'allure. Écart-type de pace, gestion des relances après effort intense.' },
  { label: 'Vitesse',    score: 71, color: '#E8832A', desc: 'Capacité à relancer. Basée sur tes fractions rapides et ton maintien d\'allure sur terrain plat.' },
  { label: 'Technicité', score: 90, color: '#3DB2E0', desc: 'Aisance sur terrain varié. Variance de cadence sur terrain accidenté et vitesse en descente.' },
];

export function MethodePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCTA = () => navigate(isAuthenticated ? '/performance' : '/login');

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 40% 30%, rgba(232,131,42,0.06) 0%, transparent 55%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/20 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            <span className="font-mono text-[10px] text-amber uppercase tracking-[3px]">Méthode · Trail Score</span>
          </motion.div>

          <motion.h1
            className="font-heading font-bold text-5xl md:text-7xl text-mist leading-none mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Ton ADN<br />
            <span className="text-amber font-normal italic">de trailer.</span>
          </motion.h1>

          <motion.p
            className="font-mono text-[11px] text-steel/60 leading-relaxed tracking-wide max-w-xl mx-auto mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            Le Trail Score HawkSight analyse des centaines de sorties sur 5 dimensions pour construire ton profil unique. Un seul chiffre qui dit tout — et 5 axes qui expliquent pourquoi.
          </motion.p>

          <motion.button
            onClick={handleCTA}
            className="hw-btn-amber px-10 py-3.5 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
          >
            {isAuthenticated ? 'Voir mon Trail Score' : 'Calculer mon score'}
            <ArrowRightIcon />
          </motion.button>
        </div>
      </section>

      {/* ── Les 5 axes ── */}
      <section className="relative py-20 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(61,178,224,0.03) 0%, transparent 60%)' }} />
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-glacier/10 border border-glacier/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse" />
              <span className="font-mono text-[10px] text-glacier uppercase tracking-[2px]">5 dimensions · 1 score</span>
            </div>
            <h2 className="font-heading font-bold text-4xl text-mist mb-3">
              Ce que le score mesure vraiment.
            </h2>
            <p className="font-mono text-[10px] text-steel/45 uppercase tracking-[2px]">
              Calculé sur ton historique complet — pas sur une seule sortie.
            </p>
          </motion.div>

          <div className="space-y-3">
            {AXES.map(({ label, score, color, desc }, i) => (
              <motion.div
                key={label}
                className="hw-card-dark relative p-5 flex items-center gap-6"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.07 * i }}
              >
                <div className="w-1 h-10 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${color}, ${color}40)` }} />
                <div className="w-28 shrink-0">
                  <p className="font-mono text-[9px] uppercase tracking-[2px] mb-0.5" style={{ color }}>{label}</p>
                  <p className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>
                    {score}<span className="font-mono text-[9px] text-steel/40 ml-0.5">/100</span>
                  </p>
                </div>
                <div className="flex-1">
                  <div className="h-1 bg-steel/10 rounded-full overflow-hidden mb-2">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="font-mono text-[9px] text-steel/45 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comment c'est calculé ── */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="font-heading font-bold text-3xl text-mist">Comment c'est calculé.</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Connexion Strava',    desc: 'Toutes tes activités sont importées automatiquement. Chaque sortie compte, même les anciennes.',           color: 'amber'   },
              { step: '02', title: 'Calcul des features', desc: 'Pace, FC, VAM, cadence, dénivelé — HawkSight calcule des dizaines de métriques par activité.',            color: 'glacier' },
              { step: '03', title: 'Score & radar',       desc: 'Un algorithme transforme ces métriques en 5 scores normalisés et un Trail Score global sur 100.',          color: 'amber'   },
            ].map(({ step, title, desc, color }, i) => (
              <motion.div
                key={step}
                className="hw-card-dark relative p-6"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.1 * i }}
              >
                <span className={`hw-br hw-br-tl hw-br-${color}`} />
                <p className="font-mono text-[8px] text-steel/30 uppercase tracking-[3px] mb-3">{step}</p>
                <h3 className="font-heading font-semibold text-base text-mist mb-2">{title}</h3>
                <p className="font-mono text-[9px] text-steel/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(232,131,42,0.04) 0%, transparent 65%)' }} />
        <motion.div
          className="relative z-10 max-w-xl mx-auto text-center space-y-7"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="hw-grad-sep mx-auto w-20" />
          <h2 className="font-heading font-bold text-4xl text-mist leading-tight">
            Découvre ton profil de trailer.
          </h2>
          <button onClick={handleCTA} className="hw-btn-amber px-10 py-4 text-sm">
            {isAuthenticated ? 'Voir mon Trail Score' : 'Commencer maintenant'}
            <ArrowRightIcon />
          </button>
        </motion.div>
      </section>

    </div>
  );
}
