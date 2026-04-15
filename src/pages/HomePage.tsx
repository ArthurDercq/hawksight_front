import { useNavigate } from 'react-router-dom';
import explorationMapImg from '@/assets/exploration-map.png';
import { motion, useMotionValue, useTransform, animate, MotionValue } from 'motion/react';
import { useAuth } from '@/context';
import { useEffect, useRef } from 'react';
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

// ── GPS trace path (profil de montagne) ───────────────────────────────────────
// Départ bas-gauche → montée douce → grand sommet centré → descente → petite bosse
const GPS_PATH = "M -20 500 C 5 496, 17 492, 30 490 C 55 486, 67 478, 80 470 C 105 458, 117 448, 130 440 C 155 420, 167 410, 180 400 C 205 375, 217 362, 230 350 C 255 320, 267 305, 280 290 C 305 255, 317 237, 330 220 C 355 180, 367 160, 380 140 C 400 105, 410 87, 420 70 C 432 48, 441 34, 450 20 C 459 34, 468 48, 480 70 C 490 87, 500 105, 520 140 C 533 160, 545 180, 570 220 C 583 237, 595 255, 620 290 C 633 305, 645 320, 670 350 C 683 362, 695 375, 720 400 C 733 410, 745 420, 770 440 C 783 448, 795 458, 820 470 C 832 474, 841 462, 850 440 C 862 448, 871 454, 880 460 C 892 466, 901 478, 910 490";

// ── Hex grid (réutilisé depuis Sidebar) ───────────────────────────────────────
const HEX_ROWS: { y: number; xs: number[]; opacity: number }[] = [
  { y: 520, xs: [80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800, 840], opacity: 0.28 },
  { y: 486, xs: [60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820], opacity: 0.22 },
  { y: 452, xs: [80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800, 840], opacity: 0.17 },
  { y: 418, xs: [60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460, 500, 540, 580, 620, 660, 700, 740, 780, 820], opacity: 0.13 },
  { y: 384, xs: [80, 160, 240, 320, 400, 480, 560, 640, 720, 800], opacity: 0.09 },
  { y: 350, xs: [120, 280, 440, 600, 760], opacity: 0.06 },
  { y: 316, xs: [200, 440, 680], opacity: 0.04 },
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
// Keypoints : montée douce → grand sommet → descente → petite bosse
const PATH_POINTS = [
  // montée douce (aile gauche)
  { x: -20, y: 500 },
  { x: 30,  y: 490 },
  { x: 80,  y: 470 },
  { x: 130, y: 440 },
  { x: 180, y: 400 },
  { x: 230, y: 350 },
  { x: 280, y: 290 },
  { x: 330, y: 220 },

  // montée raide vers pic (signature)
  { x: 380, y: 140 },
  { x: 420, y: 70 },
  { x: 450, y: 20 },   // sommet centré

  // descente rapide (symétrie aile droite)
  { x: 480, y: 70 },
  { x: 520, y: 140 },
  { x: 570, y: 220 },
  { x: 620, y: 290 },
  { x: 670, y: 350 },
  { x: 720, y: 400 },

  // retour baseline
  { x: 770, y: 440 },
  { x: 820, y: 470 },

  // petite bosse finale
  { x: 850, y: 440 },
  { x: 880, y: 460 },
  { x: 910, y: 490 },
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
  const drawLength  = useMotionValue(0); // 0→1 : dessin orange
  const eraseLength = useMotionValue(0); // 0→1 : effaceur qui grandit depuis le début
  const drawOpacity = useMotionValue(1); // 1→0 : fade out du glow résiduel en fin d'effacement

  const { dotX, dotY }         = useDotPosition(drawLength);
  const { dotX: eX, dotY: eY } = useDotPosition(eraseLength);

  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    // Phase 1 : dessin en 5s
    animate(drawLength, 1, { duration: 5, ease: 'easeInOut' }).then(() => {
      // Phase 2 : pause 0.4s puis effacement en 4s
      setTimeout(() => {
        animate(eraseLength, 1, { duration: 4, ease: 'easeInOut' });
        // Fade out du glow résiduel sur la fin de l'effacement
        animate(drawOpacity, 0, { duration: 4, ease: 'easeIn', delay: 2 });
      }, 100);
    });
  }, [drawLength, eraseLength, drawOpacity]);

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

      {/* ── Trait orange complet (base) ── */}
      <motion.path d={GPS_PATH} stroke="#E8832A" strokeWidth="8"   fill="none" strokeLinecap="round" style={{ pathLength: drawLength, opacity: useTransform(drawOpacity, v => v * 0.12) }} filter="url(#lp-glow-strong)" />
      <motion.path d={GPS_PATH} stroke="#E8832A" strokeWidth="1.5" fill="none" strokeLinecap="round" style={{ pathLength: drawLength, opacity: drawOpacity }} filter="url(#lp-glow)" />

      {/* ── Trait effaceur : même path, couleur bg, grandit depuis le début ── */}
      <motion.path d={GPS_PATH} stroke="#0B0C10" strokeWidth="40"  fill="none" strokeLinecap="round" style={{ pathLength: eraseLength }} />
      <motion.path d={GPS_PATH} stroke="#0B0C10" strokeWidth="20"  fill="none" strokeLinecap="round" style={{ pathLength: eraseLength }} />

      {/* ── Dot dessin (visible pendant phase 1) ── */}
      <motion.circle r="7"   fill="#E8832A" opacity={0.3} filter="url(#lp-glow-strong)" style={{ x: dotX, y: dotY }} />
      <motion.circle r="4"   fill="#E8832A" filter="url(#lp-glow)" style={{ x: dotX, y: dotY }} />
      <motion.circle r="1.8" fill="#fff"    style={{ x: dotX, y: dotY }} />

      {/* ── Dot effacement (visible pendant phase 2, suit l'effaceur) ── */}
      <motion.circle r="7"   fill="#E8832A" opacity={0.3} filter="url(#lp-glow-strong)" style={{ x: eX, y: eY }} />
      <motion.circle r="4"   fill="#E8832A" filter="url(#lp-glow)" style={{ x: eX, y: eY }} />
      <motion.circle r="1.8" fill="#fff"    style={{ x: eX, y: eY }} />
    </svg>
  );
}

// ── Radar Chart ───────────────────────────────────────────────────────────────
// 5 axes : Endurance(78) Dénivelé(85) Régularité(62) Vitesse(71) Technicité(90)
const RADAR_AXES = [
  { label: 'Endurance',   score: 0.78, elite: 0.88 },
  { label: 'Dénivelé',    score: 0.85, elite: 0.82 },
  { label: 'Régularité',  score: 0.62, elite: 0.80 },
  { label: 'Vitesse',     score: 0.71, elite: 0.92 },
  { label: 'Technicité',  score: 0.90, elite: 0.85 },
];
const N = RADAR_AXES.length;
const CX = 160, CY = 160, R = 120;

function radarPoint(i: number, r: number): [number, number] {
  const angle = (Math.PI * 2 * i) / N - Math.PI / 2;
  return [CX + r * Math.cos(angle), CY + r * Math.sin(angle)];
}

function radarPolygon(scores: number[]): string {
  return scores.map((s, i) => radarPoint(i, s * R).join(',')).join(' ');
}

function RadarChart() {
  const progress = useMotionValue(0);
  const ref = useRef<SVGSVGElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !triggered.current) {
          triggered.current = true;
          animate(progress, 1, { duration: 1.4, ease: 'easeOut' });
        }
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [progress]);

  // Polygone animé via useTransform
  const playerPoly = useTransform(progress, v =>
    radarPolygon(RADAR_AXES.map(a => a.score * v))
  );
  const elitePoly = useTransform(progress, v =>
    radarPolygon(RADAR_AXES.map(a => a.elite * v))
  );

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg ref={ref} width="320" height="320" viewBox="0 0 320 320">
      <defs>
        <filter id="radar-glow">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="radar-glow-soft">
          <feGaussianBlur stdDeviation="8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Anneaux de référence */}
      {rings.map(r => (
        <polygon key={r}
          points={radarPolygon(Array(N).fill(r))}
          fill="none" stroke="rgba(58,63,71,0.35)" strokeWidth={r === 1 ? 0.8 : 0.5}
        />
      ))}

      {/* Axes */}
      {RADAR_AXES.map((_, i) => {
        const [x, y] = radarPoint(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(58,63,71,0.4)" strokeWidth="0.6" />;
      })}

      {/* Polygone élite (pointillés glacier) */}
      <motion.polygon
        points={elitePoly as unknown as string}
        fill="rgba(61,178,224,0.04)"
        stroke="rgba(61,178,224,0.35)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Polygone joueur — glow fort */}
      <motion.polygon
        points={playerPoly as unknown as string}
        fill="rgba(61,178,224,0.12)"
        stroke="rgba(61,178,224,0)"
        strokeWidth="0"
        filter="url(#radar-glow-soft)"
      />
      {/* Polygone joueur — contour net */}
      <motion.polygon
        points={playerPoly as unknown as string}
        fill="rgba(61,178,224,0.10)"
        stroke="rgba(61,178,224,0.9)"
        strokeWidth="1.5"
        filter="url(#radar-glow)"
      />

      {/* Points sur les sommets */}
      {RADAR_AXES.map((a, i) => {
        const [x, y] = radarPoint(i, a.score * R);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="5" fill="rgba(61,178,224,0.25)" filter="url(#radar-glow)" />
            <circle cx={x} cy={y} r="2.5" fill="#3DB2E0" filter="url(#radar-glow)" />
            <circle cx={x} cy={y} r="1" fill="#fff" />
          </g>
        );
      })}

      {/* Labels axes */}
      {RADAR_AXES.map((a, i) => {
        const [x, y] = radarPoint(i, R + 22);
        const anchor = x < CX - 5 ? 'end' : x > CX + 5 ? 'start' : 'middle';
        return (
          <text key={i} x={x} y={y + 4} textAnchor={anchor}
            fontSize="8" fontFamily="'JetBrains Mono', monospace" fill="rgba(242,242,242,0.45)"
            letterSpacing="1.5"
          >
            {a.label.toUpperCase()}
          </text>
        );
      })}

      {/* Score central */}
      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="22" fontFamily="Poppins, sans-serif" fontWeight="700" fill="#3DB2E0">
        79
      </text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize="7" fontFamily="'JetBrains Mono', monospace" fill="rgba(61,178,224,0.5)" letterSpacing="2">
        SCORE
      </text>
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
                <div className="absolute rounded-full blur-2xl" style={{ width: '35%', height: '30%', top: '55%', left: '25%', background: 'radial-gradient(circle, rgba(61,178,224,0.18) 0%, transparent 70%)' }} />
                <div className="absolute rounded-full blur-xl" style={{ width: '20%', height: '20%', top: '10%', left: '60%', background: 'radial-gradient(circle, rgba(232,131,42,0.20) 0%, transparent 70%)' }} />
                <div className="absolute rounded-full blur-3xl" style={{ width: '50%', height: '45%', top: '30%', left: '30%', background: 'radial-gradient(circle, rgba(232,131,42,0.10) 0%, transparent 70%)' }} />
              </div>

              {/* Stats overlay */}
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <div className="bg-charcoal/90 backdrop-blur-sm border border-amber/30 rounded-lg px-4 py-3">
                  <p className="font-mono text-[8px] text-steel uppercase tracking-[2px] mb-1">Couverture</p>
                  <p className="font-heading text-3xl font-bold text-amber tabular-nums">8%</p>
                </div>
                <div className="bg-charcoal/90 backdrop-blur-sm border border-glacier/30 rounded-lg px-4 py-3">
                  <p className="font-mono text-[8px] text-steel uppercase tracking-[2px] mb-1">Surface</p>
                  <p className="font-heading text-3xl font-bold text-glacier tabular-nums">847 km²</p>
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
            <div className="hw-card-dark-lg p-0 overflow-hidden" style={{ background: '#07080B' }}>
              <span className="hw-br hw-br-tl hw-br-glacier" />
              <span className="hw-br hw-br-tr hw-br-glacier" />
              <span className="hw-br hw-br-bl hw-br-glacier-dim" />
              <span className="hw-br hw-br-br hw-br-glacier-dim" />

              {/* ── Dashboard HUD ── */}
              <div className="p-5 flex flex-col gap-3">

                {/* Header HUD */}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[8px] text-steel uppercase tracking-[2px]">Trail · Grand Ballon</span>
                  <span className="font-mono text-[8px] text-glacier/60 uppercase tracking-[1px]">14 Apr 2026</span>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Distance', value: '28.4', unit: 'km',  color: 'text-amber' },
                    { label: 'D+',       value: '1 247', unit: 'm',  color: 'text-glacier' },
                    { label: 'Temps',    value: '4:12',  unit: 'h',  color: 'text-mist' },
                    { label: 'FC Moy',   value: '142',   unit: 'bpm',color: 'text-moss' },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label} className="bg-charcoal/60 border border-steel/20 rounded-md p-2">
                      <p className="font-mono text-[7px] text-steel/60 uppercase tracking-[1px] mb-0.5">{label}</p>
                      <p className={`font-heading text-base font-bold tabular-nums leading-none ${color}`}>{value}<span className="font-mono text-[7px] text-steel/50 ml-0.5">{unit}</span></p>
                    </div>
                  ))}
                </div>

                {/* Elevation chart SVG */}
                <div className="bg-charcoal/40 border border-steel/15 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[7px] text-steel uppercase tracking-[2px]">Profil Dénivelé</span>
                    <span className="font-mono text-[7px] text-amber/60">+1247m / -1198m</span>
                  </div>
                  <svg width="100%" height="64" viewBox="0 0 320 64" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="elev-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#E8832A" stopOpacity="0.4"/>
                        <stop offset="100%" stopColor="#E8832A" stopOpacity="0.02"/>
                      </linearGradient>
                      <filter id="elev-glow"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <path d="M0 60 C20 58,35 52,50 44 C65 36,75 28,90 18 C100 11,108 6,118 4 C128 2,132 8,142 14 C152 20,158 26,170 32 C182 38,190 42,202 36 C214 30,220 20,232 12 C242 5,248 2,256 4 C264 6,270 14,280 22 C290 30,298 40,310 50 L320 56 L320 64 L0 64 Z"
                      fill="url(#elev-grad)" />
                    <path d="M0 60 C20 58,35 52,50 44 C65 36,75 28,90 18 C100 11,108 6,118 4 C128 2,132 8,142 14 C152 20,158 26,170 32 C182 38,190 42,202 36 C214 30,220 20,232 12 C242 5,248 2,256 4 C264 6,270 14,280 22 C290 30,298 40,310 50 L320 56"
                      fill="none" stroke="#E8832A" strokeWidth="1.2" strokeLinecap="round" filter="url(#elev-glow)" />
                  </svg>
                </div>

                {/* HR zones bar */}
                <div className="bg-charcoal/40 border border-steel/15 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[7px] text-steel uppercase tracking-[2px]">Zones FC</span>
                    <span className="font-mono text-[7px] text-glacier/60">2h34 en Z3-Z4</span>
                  </div>
                  <div className="flex gap-0.5 h-3 rounded-sm overflow-hidden">
                    {[
                      { w: '8%',  color: '#6DAA75' },
                      { w: '14%', color: '#3DB2E0' },
                      { w: '28%', color: '#E8832A' },
                      { w: '32%', color: '#E8832A', opacity: 0.6 },
                      { w: '18%', color: '#fc8181' },
                    ].map((z, i) => (
                      <div key={i} className="h-full rounded-sm" style={{ width: z.w, background: z.color, opacity: z.opacity ?? 1 }} />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1">
                    {['Z1','Z2','Z3','Z4','Z5'].map(z => (
                      <span key={z} className="font-mono text-[6px] text-steel/40">{z}</span>
                    ))}
                  </div>
                </div>

                {/* Pace line */}
                <div className="bg-charcoal/40 border border-steel/15 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[7px] text-steel uppercase tracking-[2px]">Allure</span>
                    <span className="font-mono text-[7px] text-moss/60">Moy 8'54''/km</span>
                  </div>
                  <svg width="100%" height="36" viewBox="0 0 320 36" preserveAspectRatio="none">
                    <defs>
                      <filter id="pace-glow"><feGaussianBlur stdDeviation="1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                    </defs>
                    <path d="M0 20 C15 18,25 14,40 16 C55 18,60 24,75 20 C90 16,95 10,110 12 C125 14,130 22,145 18 C160 14,165 8,180 10 C195 12,200 20,215 24 C230 28,235 22,250 18 C265 14,275 16,290 20 C300 23,308 26,320 24"
                      fill="none" stroke="#6DAA75" strokeWidth="1.2" strokeLinecap="round" filter="url(#pace-glow)" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="absolute -inset-6 bg-glacier/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── Section Profil Trailer ── */}
      <section className="relative py-32 px-6 overflow-hidden">
        {/* Séparateur top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-steel/30 to-transparent pointer-events-none" />
        {/* Glow ambiant centré */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(61,178,224,0.04) 0%, transparent 60%)' }} />

        <div className="max-w-7xl mx-auto">

          {/* Header centré */}
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 bg-glacier/10 border border-glacier/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse" />
              <span className="font-mono text-[10px] text-glacier uppercase tracking-[2px]">Profil Trailer</span>
            </div>
            <h2 className="font-heading font-bold text-4xl md:text-6xl text-mist leading-tight mb-6">
              Ton ADN de trailer,<br /><span className="text-glacier">révélé par tes données.</span>
            </h2>
            <p className="font-mono text-[11px] text-steel uppercase tracking-[2px] max-w-2xl mx-auto leading-relaxed">
              HawkSight analyse l'ensemble de tes sorties pour construire ton profil unique.<br />
              5 dimensions. Des centaines de sorties. Une seule vérité.
            </p>
          </motion.div>

          {/* Layout : axes à gauche, radar au centre, axes à droite */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center">

            {/* Axes gauche */}
            <motion.div
              className="flex flex-col gap-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {[
                { label: 'Endurance', score: 78, color: '#E8832A', desc: 'Capacité à maintenir l\'effort sur la durée. Calculée sur tes sorties longues et le maintien de la FC.' },
                { label: 'Dénivelé', score: 85, color: '#3DB2E0', desc: 'Efficacité en montée et descente. Ratio VAP / vitesse à plat et gestion des descentes techniques.' },
                { label: 'Régularité', score: 62, color: '#6DAA75', desc: 'Constance de l\'effort et de l\'allure. Écart-type de pace et gestion des relances après ravito.' },
              ].map(({ label, score, color, desc }, i) => (
                <div key={label} className="text-right">
                  <div className="flex items-center justify-end gap-3 mb-1.5">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[2px] mb-0.5" style={{ color }}>{label}</p>
                      <p className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>{score}<span className="font-mono text-[10px] text-steel/50 ml-0.5">/100</span></p>
                    </div>
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${color}, ${color}40)` }} />
                  </div>
                  <p className="font-mono text-[9px] text-steel/60 leading-relaxed max-w-xs ml-auto">{desc}</p>
                  {/* Barre de score */}
                  <div className="mt-2 h-0.5 bg-steel/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Radar SVG central */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            >
              <RadarChart />
            </motion.div>

            {/* Axes droite */}
            <motion.div
              className="flex flex-col gap-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {[
                { label: 'Vitesse', score: 71, color: '#E8832A', desc: 'Vitesse de pointe et capacité à relancer. Basée sur tes fractions rapides et tes temps aux portions plates.' },
                { label: 'Technicité', score: 90, color: '#3DB2E0', desc: 'Aisance sur terrain varié. Analysée via la variance de cadence sur terrain accidenté et les descentes.' },
              ].map(({ label, score, color, desc }, i) => (
                <div key={label}>
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${color}, ${color}40)` }} />
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[2px] mb-0.5" style={{ color }}>{label}</p>
                      <p className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>{score}<span className="font-mono text-[10px] text-steel/50 ml-0.5">/100</span></p>
                    </div>
                  </div>
                  <p className="font-mono text-[9px] text-steel/60 leading-relaxed max-w-xs">{desc}</p>
                  <div className="mt-2 h-0.5 bg-steel/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${score}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Baseline */}
          <motion.div
            className="text-center mt-16 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="flex items-center gap-6 font-mono text-[9px] text-steel/50 uppercase tracking-[2px]">
              <div className="flex items-center gap-2"><div className="w-6 h-px bg-glacier/60" /><span>Ton profil</span></div>
              <div className="flex items-center gap-2"><div className="w-6 h-px border-t border-dashed border-steel/40" /><span>Référence élite</span></div>
            </div>
            <p className="font-mono text-[9px] text-steel/40 uppercase tracking-[1px]">Calculé sur 147 sorties · 1 842 km · 68 000 m D+</p>
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
