import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const METRICS = [
  { label: 'Pace moyen',       value: '5:42',   unit: '/km',   color: 'text-amber'   },
  { label: 'VAM',              value: '842',    unit: 'm/h',   color: 'text-glacier' },
  { label: 'FC moyenne',       value: '154',    unit: 'bpm',   color: 'text-amber'   },
  { label: 'Dénivelé / sortie', value: '487',   unit: 'm D+',  color: 'text-mist'    },
  { label: 'Allure trail',     value: '6:18',   unit: '/km',   color: 'text-glacier' },
  { label: 'Efficacité',       value: '91',     unit: '%',     color: 'text-amber'   },
];

export function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCTA = () => navigate(isAuthenticated ? '/kpi' : '/login');

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 60% 25%, rgba(61,178,224,0.06) 0%, transparent 55%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-glacier/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-glacier/10 border border-glacier/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse" />
              <span className="font-mono text-[10px] text-glacier uppercase tracking-[3px]">Analytics · Données trail</span>
            </div>
            <h1 className="font-heading font-bold text-5xl md:text-6xl text-mist leading-none mb-6">
              Tes données.<br />
              <span className="text-glacier font-normal italic">Toute la vérité.</span>
            </h1>
            <p className="font-mono text-[11px] text-steel/60 leading-relaxed tracking-wide mb-8 max-w-md">
              Pace, dénivelé, fréquence cardiaque, VAM, efficacité — HawkSight calcule des dizaines d'indicateurs sur chaque sortie et les met en perspective sur ton historique complet.
            </p>
            <button onClick={handleCTA} className="hw-btn-amber px-10 py-3.5 text-sm">
              {isAuthenticated ? 'Voir mes stats' : 'Analyser mes sorties'}
              <ArrowRightIcon />
            </button>
          </motion.div>

          {/* Mock metrics grid */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            {METRICS.map(({ label, value, unit, color }, i) => (
              <motion.div
                key={label}
                className="hw-card-dark relative p-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.07 }}
              >
                <p className="font-mono text-[7px] text-steel/40 uppercase tracking-[1px] mb-1.5">{label}</p>
                <p className={`font-heading text-2xl font-bold tabular-nums ${color}`}>
                  {value}
                  <span className="font-mono text-[9px] text-steel/40 ml-1">{unit}</span>
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Feature list ── */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              <span className="font-mono text-[10px] text-amber uppercase tracking-[2px]">Ce qu'on calcule</span>
            </div>
            <h2 className="font-heading font-bold text-4xl text-mist">
              Des indicateurs faits pour le trail.
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { icon: '⟁', title: 'Analyse par activité',        desc: 'Profil de pace, zones FC, courbe de puissance, décalage aérobique — chaque sortie disséquée en détail.',                              color: 'glacier' },
              { icon: '◈', title: 'Tendances sur la durée',       desc: 'Évolution de ta VAM, de ton endurance, de ta capacité en dénivelé semaine après semaine sur 1 an ou plus.',                          color: 'amber'   },
              { icon: '⬡', title: 'Comparaison multi-sports',     desc: 'Trail, Run, Rando, Vélo — chaque sport analysé séparément et comparé. Vois comment tes disciplines se nourrissent entre elles.',      color: 'glacier' },
              { icon: '◎', title: 'KPIs hebdo & records',         desc: 'Distance, dénivelé, durée — résumé automatique chaque semaine. Tes records perso mis à jour en temps réel.',                         color: 'amber'   },
            ].map(({ icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                className="hw-card-dark relative p-5 flex gap-4"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.08 * i }}
              >
                <span className={`hw-br hw-br-tl hw-br-${color}`} />
                <span className={`font-mono text-xl shrink-0 mt-0.5 ${color === 'amber' ? 'text-amber' : 'text-glacier'}`}>{icon}</span>
                <div>
                  <h3 className="font-heading font-semibold text-base text-mist mb-1.5">{title}</h3>
                  <p className="font-mono text-[9px] text-steel/50 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(61,178,224,0.04) 0%, transparent 65%)' }} />
        <motion.div
          className="relative z-10 max-w-xl mx-auto text-center space-y-7"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="hw-grad-sep mx-auto w-20" />
          <h2 className="font-heading font-bold text-4xl text-mist leading-tight">
            Arrête de courir à l'aveugle.
          </h2>
          <button onClick={handleCTA} className="hw-btn-amber px-10 py-4 text-sm">
            {isAuthenticated ? 'Voir mes Analytics' : 'Commencer maintenant'}
            <ArrowRightIcon />
          </button>
        </motion.div>
      </section>

    </div>
  );
}
