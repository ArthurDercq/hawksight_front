import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate, MotionValue } from 'motion/react';
import { useAuth } from '@/context';
import { useEffect, useRef } from 'react';
import explorationMapImg from '@/assets/exploration-map.png';
import { Logo } from '@/components/ui';

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
const ElevationIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);
const MountainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m8 3 4 8 5-5 2 8" /><path d="M4 14l3-3 4 4 5-5 4 4" /><line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);
const GlobeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

// ── GPS trace path (style trail de montagne) ───────────────────────────────────
const GPS_PATH = "M 60 380 C 80 340, 100 320, 130 300 C 160 280, 170 260, 185 235 C 200 210, 210 195, 230 175 C 250 155, 260 140, 280 125 C 300 110, 315 100, 340 88 C 365 76, 375 70, 400 62 C 425 54, 440 52, 465 48 C 490 44, 510 46, 535 50 C 560 54, 575 62, 600 72 C 625 82, 638 92, 660 105 C 682 118, 690 128, 710 145 C 730 162, 738 175, 755 195 C 772 215, 778 230, 792 252 C 806 274, 810 290, 820 315";

// ── Hex grid (réutilisé depuis Sidebar) ───────────────────────────────────────
const HEX_ROWS: { y: number; xs: number[]; opacity: number }[] = [
  { y: 520, xs: [80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800, 840], opacity: 0.18 },
  { y: 486, xs: [60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820], opacity: 0.14 },
  { y: 452, xs: [80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800, 840], opacity: 0.11 },
  { y: 418, xs: [60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820], opacity: 0.08 },
  { y: 384, xs: [80, 160, 240, 320, 400, 480, 560, 640, 720, 800], opacity: 0.06 },
  { y: 350, xs: [120, 280, 440, 600, 760], opacity: 0.04 },
  { y: 316, xs: [200, 440, 680], opacity: 0.02 },
];

function HexBackground() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="xMidYMid slice" viewBox="0 0 900 540">
      <defs>
        <polygon id="lp-hex" points="0,-20 17.3,-10 17.3,10 0,20 -17.3,10 -17.3,-10" />
      </defs>
      {HEX_ROWS.map(({ y, xs, opacity }) =>
        xs.map((x, i) => (
          <motion.use
            key={`${x}-${y}`}
            href="#lp-hex"
            transform={`translate(${x},${y})`}
            stroke={`rgba(232,131,42,${opacity})`}
            strokeWidth="0.8"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.05 * i + (540 - y) / 540 * 1.5 }}
          />
        ))
      )}
    </svg>
  );
}

// ── GPS Trace animée ───────────────────────────────────────────────────────────
// Keypoints le long du path pour animer le dot
const PATH_POINTS = [
  { x: 60, y: 380 }, { x: 100, y: 340 }, { x: 130, y: 300 }, { x: 165, y: 270 },
  { x: 195, y: 235 }, { x: 215, y: 205 }, { x: 240, y: 180 }, { x: 268, y: 155 },
  { x: 295, y: 130 }, { x: 325, y: 108 }, { x: 360, y: 90 },  { x: 400, y: 74 },
  { x: 440, y: 60 },  { x: 480, y: 52 },  { x: 520, y: 50 },  { x: 560, y: 54 },
  { x: 600, y: 64 },  { x: 638, y: 80 },  { x: 670, y: 100 }, { x: 700, y: 122 },
  { x: 728, y: 148 }, { x: 750, y: 178 }, { x: 770, y: 210 }, { x: 790, y: 245 },
  { x: 810, y: 280 }, { x: 820, y: 315 },
];

function useDotPosition(pathLength: MotionValue<number>) {
  const xs = PATH_POINTS.map(p => p.x);
  const ys = PATH_POINTS.map(p => p.y);
  const keys = PATH_POINTS.map((_, i) => i / (PATH_POINTS.length - 1));
  const dotX = useTransform(pathLength, keys, xs);
  const dotY = useTransform(pathLength, keys, ys);
  return { dotX, dotY };
}

function AnimatedTrace() {
  const pathLength = useMotionValue(0);
  const { dotX, dotY } = useDotPosition(pathLength);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const loop = () => {
      animate(pathLength, 1, { duration: 4, ease: 'easeInOut' }).then(() => {
        setTimeout(() => { pathLength.set(0); loop(); }, 800);
      });
    };
    loop();
  }, [pathLength]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 900 540" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="lp-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="lp-glow-strong">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Glow layer */}
      <motion.path d={GPS_PATH} stroke="#E8832A" strokeWidth="8" fill="none" strokeLinecap="round" opacity={0.12} style={{ pathLength }} filter="url(#lp-glow-strong)" />
      {/* Main trace */}
      <motion.path d={GPS_PATH} stroke="#E8832A" strokeWidth="1.5" fill="none" strokeLinecap="round" style={{ pathLength }} filter="url(#lp-glow)" />
      {/* Moving dot — outer glow */}
      <motion.circle r="7" fill="#E8832A" opacity={0.3} filter="url(#lp-glow-strong)" style={{ x: dotX, y: dotY }} />
      {/* Moving dot — core */}
      <motion.circle r="4" fill="#E8832A" style={{ x: dotX, y: dotY }} filter="url(#lp-glow)" />
      {/* Moving dot — white center */}
      <motion.circle r="1.8" fill="#fff" style={{ x: dotX, y: dotY }} />
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="bg-charcoal text-mist min-h-screen">

      {/* ── Minimal header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-charcoal/80 backdrop-blur-sm border-b border-steel/20">
        <div className="flex items-center gap-2.5">
          <Logo size={26} />
          <span className="font-mono text-sm font-bold text-mist tracking-[1px]">HAWKSIGHT</span>
        </div>
        <button onClick={handleCTA} className="hw-btn-amber py-1.5 px-4 text-xs">
          {isAuthenticated ? 'Dashboard' : 'Connexion'} <ArrowRightIcon />
        </button>
      </header>

      {/* ── HERO ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Hex grid background */}
        <HexBackground />

        {/* GPS trace */}
        <AnimatedTrace />

        {/* Gradient vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #0B0C10 80%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to top, #0B0C10, transparent)' }} />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          {/* Eyebrow */}
          <motion.div
            className="inline-flex items-center gap-2 mb-8 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
            <span className="font-mono text-[10px] text-amber uppercase tracking-[2px]">Trail Analytics</span>
          </motion.div>

          <motion.h1
            className="font-heading font-bold text-5xl md:text-7xl text-mist mb-6 tracking-tight leading-none"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Maîtrise<br />
            <span className="text-amber">ton terrain.</span>
          </motion.h1>

          <motion.p
            className="font-mono text-[13px] text-steel uppercase tracking-[3px] mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Analyse · Territoire · Performance
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <button
              onClick={handleCTA}
              className="hw-btn-amber px-10 py-3.5 text-sm"
            >
              {isAuthenticated ? 'Accéder au Dashboard' : 'Commencer'}
              <ArrowRightIcon />
            </button>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-transparent via-amber/60 to-transparent" />
          <div className="w-1 h-1 rounded-full bg-amber/60" />
        </motion.div>
      </section>

      {/* ── Section 1 — La Conquête ── */}
      <section className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          {/* Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="hw-card-dark-lg p-0 overflow-hidden">
              <span className="hw-br hw-br-tl hw-br-amber" />
              <span className="hw-br hw-br-tr hw-br-amber" />
              <span className="hw-br hw-br-bl hw-br-amber-dark" />
              <span className="hw-br hw-br-br hw-br-amber-dark" />

              <img
                src={explorationMapImg}
                alt="Coverage Map"
                className="w-full aspect-square object-cover opacity-70"
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, #0B0C10 10%, transparent 50%)' }} />

              {/* Glow zones */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute rounded-full blur-2xl" style={{ width: '45%', height: '40%', top: '20%', left: '15%', background: 'radial-gradient(circle, rgba(232,131,42,0.35) 0%, transparent 70%)' }} />
                <div className="absolute rounded-full blur-xl" style={{ width: '30%', height: '30%', top: '35%', left: '50%', background: 'radial-gradient(circle, rgba(232,131,42,0.25) 0%, transparent 70%)' }} />
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div className="bg-charcoal/90 backdrop-blur-sm border border-amber/30 rounded-lg px-4 py-3">
                  <p className="font-mono text-[8px] text-steel uppercase tracking-[2px] mb-1">Couverture</p>
                  <p className="font-mono text-3xl font-bold text-amber tabular-nums">8%</p>
                </div>
                <div className="bg-charcoal/90 backdrop-blur-sm border border-glacier/30 rounded-lg px-4 py-3">
                  <p className="font-mono text-[8px] text-steel uppercase tracking-[2px] mb-1">Surface</p>
                  <p className="font-mono text-3xl font-bold text-glacier tabular-nums">847 km²</p>
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 bg-amber/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />
          </motion.div>

          {/* Text */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full">
              <GlobeIcon />
              <span className="font-mono text-[10px] text-amber uppercase tracking-[2px]">La Conquête</span>
            </div>

            <h2 className="font-heading font-bold text-4xl md:text-5xl text-mist leading-tight">
              Chaque sortie élargit<br />ton empreinte.
            </h2>

            <p className="font-mono text-[11px] text-steel leading-relaxed tracking-wide">
              Suis ton taux de couverture.<br />
              Observe ton expansion territoire par territoire.
            </p>

            <div className="hw-grad-sep" />

            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber" />
              <span className="font-mono text-[10px] text-steel uppercase tracking-[2px]">Cartographie hexagonale H3</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Section 2 — La Stratégie ── */}
      <section className="relative py-32 px-6">
        {/* Subtle separator */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-steel/30 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">

          {/* Text */}
          <motion.div
            className="space-y-8 order-2 md:order-1"
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-glacier/10 border border-glacier/30 rounded-full">
              <ElevationIcon />
              <span className="font-mono text-[10px] text-glacier uppercase tracking-[2px]">La Stratégie</span>
            </div>

            <h2 className="font-heading font-bold text-4xl md:text-5xl text-mist leading-tight">
              Analyse avancée,<br />sans compromis.
            </h2>

            <div className="flex flex-col gap-4">
              {[
                { icon: <ElevationIcon />, label: 'Profil dénivelé & VAP', color: '#E8832A' },
                { icon: <HeartIcon />, label: 'Efficacité cardiaque', color: '#3DB2E0' },
                { icon: <MountainIcon />, label: 'Analyse montées / descentes', color: '#6DAA75' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 * i }}
                >
                  <div className="p-2.5 rounded-lg border shrink-0" style={{ backgroundColor: `${item.color}15`, borderColor: `${item.color}30`, color: item.color }}>
                    {item.icon}
                  </div>
                  <span className="font-mono text-[11px] text-mist/70 uppercase tracking-[1.5px]">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            className="relative order-1 md:order-2"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="hw-card-dark-lg p-0 overflow-hidden">
              <span className="hw-br hw-br-tl hw-br-glacier" />
              <span className="hw-br hw-br-tr hw-br-glacier" />
              <span className="hw-br hw-br-bl hw-br-glacier-dim" />
              <span className="hw-br hw-br-br hw-br-glacier-dim" />

              <img
                src="https://images.unsplash.com/photo-1621361607621-aa46e79bd017?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFpbCUyMHJ1bm5pbmclMjBtb3VudGFpbiUyMHBhdGh8ZW58MXx8fHwxNzcyMzkwMzYzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Trail Analysis"
                className="w-full aspect-square object-cover opacity-35"
              />
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, #0B0C10 10%, transparent 50%)' }} />

              <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3">
                <div className="bg-charcoal/90 backdrop-blur-sm border border-amber/30 rounded-lg p-3">
                  <p className="font-mono text-[8px] text-steel uppercase tracking-[2px] mb-1">Dénivelé +</p>
                  <p className="font-mono text-2xl font-bold text-amber tabular-nums">1 247 m</p>
                </div>
                <div className="bg-charcoal/90 backdrop-blur-sm border border-glacier/30 rounded-lg p-3">
                  <p className="font-mono text-[8px] text-steel uppercase tracking-[2px] mb-1">FC Moy</p>
                  <p className="font-mono text-2xl font-bold text-glacier tabular-nums">142 bpm</p>
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 bg-glacier/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative py-40 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(232,131,42,0.04) 0%, transparent 70%)' }} />

        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center space-y-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="hw-grad-sep mx-auto w-24" />

          <h2 className="font-heading font-bold text-4xl md:text-6xl text-mist leading-tight">
            Ne laisse plus<br />ton terrain inexploré.
          </h2>

          <button onClick={handleCTA} className="hw-btn-amber px-12 py-4 text-sm">
            {isAuthenticated ? 'Accéder au Dashboard' : 'Commencer maintenant'}
            <ArrowRightIcon />
          </button>

          <div className="flex items-center justify-center gap-3 text-steel font-mono text-[9px] uppercase tracking-[2px]">
            <div className="flex gap-1">
              {[1, 0.6, 0.3].map((op, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-amber" style={{ opacity: op }} />
              ))}
            </div>
            <span>System Ready</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
