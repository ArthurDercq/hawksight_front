import { useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { useAuth } from '@/context';

// ── Icons ──────────────────────────────────────────────────────────────────────
const ArrowRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Territory Hex Map ─────────────────────────────────────────────────────────
type HexCell = { x: number; y: number };

function buildHexGrid(cols: number, rows: number, size: number): HexCell[] {
  const cells: HexCell[] = [];
  const w = size * 2;
  const h = Math.sqrt(3) * size;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * w * 0.75 + size;
      const y = row * h + (col % 2 === 1 ? h / 2 : 0) + size;
      cells.push({ x, y });
    }
  }
  return cells;
}

const EXPLORE_CENTERS = [
  { x: 260, y: 155, r: 115, color: 'amber',   intensity: 1.0  },
  { x: 430, y: 210, r: 85,  color: 'amber',   intensity: 0.72 },
  { x: 340, y: 300, r: 65,  color: 'glacier', intensity: 0.6  },
];

function hexExploreLevel(x: number, y: number): { color: string; fill: number } | null {
  for (const c of EXPLORE_CENTERS) {
    const d = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
    if (d < c.r) return { color: c.color, fill: (1 - d / c.r) * c.intensity };
  }
  return null;
}

function TerritoryHexMap() {
  const cells = useMemo(() => buildHexGrid(18, 10, 26), []);
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 580 380" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <polygon id="th-hex" points="0,-26 22.5,-13 22.5,13 0,26 -22.5,13 -22.5,-13" />
        <filter id="th-glow-a"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="th-glow-g"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="th-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="transparent"/>
          <stop offset="100%" stopColor="#07080B"/>
        </radialGradient>
      </defs>
      {cells.map((c, i) => {
        const level = hexExploreLevel(c.x, c.y);
        const isAmber   = level?.color === 'amber';
        const isGlacier = level?.color === 'glacier';
        const fill = level?.fill ?? 0;
        return (
          <motion.use
            key={i}
            href="#th-hex"
            transform={`translate(${c.x},${c.y})`}
            fill={isAmber ? `rgba(232,131,42,${fill * 0.2})` : isGlacier ? `rgba(61,178,224,${fill * 0.16})` : 'none'}
            stroke={isAmber ? `rgba(232,131,42,${0.25 + fill * 0.6})` : isGlacier ? `rgba(61,178,224,${0.2 + fill * 0.55})` : 'rgba(58,63,71,0.15)'}
            strokeWidth={level ? 0.8 : 0.4}
            filter={isAmber ? 'url(#th-glow-a)' : isGlacier ? 'url(#th-glow-g)' : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.5, delay: visible ? 0.02 * i : 0 }}
          />
        );
      })}
      <rect width="580" height="380" fill="url(#th-vignette)" pointerEvents="none"/>
    </svg>
  );
}

// ── Contour Lines ─────────────────────────────────────────────────────────────
function generateContours() {
  const layers: { d: string; t: number; major: boolean }[] = [];
  const count = 14;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const radius = 200 + t * 620;
    const cx = 900 + Math.sin(t * 1.8) * 30;
    const cy = 420 + Math.cos(t * 1.3) * 18;
    const pts: [number, number][] = [];
    const N = 120;
    for (let k = 0; k <= N; k++) {
      const a = (k / N) * Math.PI * 2;
      const r = radius
        + Math.sin(a * 3 + i * 0.7 + 2.4) * (18 + t * 30)
        + Math.sin(a * 5 - i * 0.4) * (10 + t * 14)
        + Math.sin(a * 8 + i * 0.2) * (6 + t * 8)
        + Math.sin(a * 2 - i * 0.9) * (24 + t * 20);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.72]);
    }
    layers.push({
      d: 'M ' + pts.map(p => p.map(v => v.toFixed(1)).join(',')).join(' L ') + ' Z',
      t,
      major: i % 4 === 0,
    });
  }
  return layers;
}

function ContourLayer() {
  const contours = useMemo(() => generateContours(), []);
  return (
    <svg
      viewBox="0 0 1800 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none"
    >
      <defs>
        <radialGradient id="topo-fade" cx="50%" cy="46%" r="70%">
          <stop offset="0%" stopColor="#0B0C10" stopOpacity="0" />
          <stop offset="55%" stopColor="#0B0C10" stopOpacity="0" />
          <stop offset="100%" stopColor="#0B0C10" stopOpacity="0.95" />
        </radialGradient>
        <mask id="topo-mask">
          <rect width="1800" height="900" fill="white" />
          <rect width="1800" height="900" fill="url(#topo-fade)" />
        </mask>
      </defs>
      <g mask="url(#topo-mask)" style={{ mixBlendMode: 'screen' }}>
        {contours.map((c, i) => (
          <path
            key={i}
            d={c.d}
            fill="none"
            stroke={
              c.major
                ? `rgba(232,131,42,${0.12 + c.t * 0.55})`
                : `rgba(140,155,175,${0.08 + c.t * 0.22})`
            }
            strokeWidth={c.major ? 0.9 : 0.5}
            style={{
              opacity: 0,
              animation: `topoFade 1.2s ${0.03 * i + 0.2}s ease-out forwards`,
            }}
          />
        ))}
      </g>
      {/* Summit crosshair */}
      <g transform="translate(900,420)" style={{ opacity: 0, animation: 'topoFade 0.8s 2.2s ease-out forwards' }}>
        <circle r="3" fill="#E8832A" />
        <circle r="14" fill="none" stroke="#E8832A" strokeWidth="0.8" opacity="0.6" />
        <circle r="28" fill="none" stroke="#E8832A" strokeWidth="0.5" opacity="0.3" />
        <line x1="-42" y1="0" x2="-18" y2="0" stroke="#E8832A" strokeWidth="0.8" opacity="0.7" />
        <line x1="18" y1="0" x2="42" y2="0" stroke="#E8832A" strokeWidth="0.8" opacity="0.7" />
        <line x1="0" y1="-42" x2="0" y2="-18" stroke="#E8832A" strokeWidth="0.8" opacity="0.7" />
        <line x1="0" y1="18" x2="0" y2="42" stroke="#E8832A" strokeWidth="0.8" opacity="0.7" />
      </g>
      <style>{`
        @keyframes topoFade {
          from { opacity: 0; stroke-dasharray: 0 2400; }
          to   { opacity: 1; stroke-dasharray: 2400 0; }
        }
      `}</style>
    </svg>
  );
}

// ── Radar Chart ───────────────────────────────────────────────────────────────
const RADAR_AXES = [
  { label: 'Endurance',   score: 0.78, elite: 0.88 },
  { label: 'Dénivelé',    score: 0.85, elite: 0.82 },
  { label: 'Régularité',  score: 0.62, elite: 0.80 },
  { label: 'Vitesse',     score: 0.71, elite: 0.92 },
  { label: 'Technicité',  score: 0.90, elite: 0.85 },
];
const N = RADAR_AXES.length;
const CX = 200, CY = 200, R = 108;

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

  const playerPoly = useTransform(progress, v =>
    radarPolygon(RADAR_AXES.map(a => a.score * v))
  );
  const elitePoly = useTransform(progress, v =>
    radarPolygon(RADAR_AXES.map(a => a.elite * v))
  );

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg ref={ref} width="400" height="400" viewBox="0 0 400 400">
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

      {rings.map(r => (
        <polygon key={r}
          points={radarPolygon(Array(N).fill(r))}
          fill="none" stroke="rgba(58,63,71,0.35)" strokeWidth={r === 1 ? 0.8 : 0.5}
        />
      ))}
      {RADAR_AXES.map((_, i) => {
        const [x, y] = radarPoint(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(58,63,71,0.4)" strokeWidth="0.6" />;
      })}

      <motion.polygon points={elitePoly as unknown as string} fill="rgba(61,178,224,0.04)" stroke="rgba(61,178,224,0.35)" strokeWidth="1" strokeDasharray="3 3" />
      <motion.polygon points={playerPoly as unknown as string} fill="rgba(61,178,224,0.12)" stroke="rgba(61,178,224,0)" strokeWidth="0" filter="url(#radar-glow-soft)" />
      <motion.polygon points={playerPoly as unknown as string} fill="rgba(61,178,224,0.10)" stroke="rgba(61,178,224,0.9)" strokeWidth="1.5" filter="url(#radar-glow)" />

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
      {RADAR_AXES.map((a, i) => {
        const [x, y] = radarPoint(i, R + 22);
        const anchor = x < CX - 5 ? 'end' : x > CX + 5 ? 'start' : 'middle';
        return (
          <text key={i} x={x} y={y + 4} textAnchor={anchor} fontSize="8" fontFamily="'JetBrains Mono', monospace" fill="rgba(242,242,242,0.45)" letterSpacing="1.5">
            {a.label.toUpperCase()}
          </text>
        );
      })}

      <text x={CX} y={CY - 6} textAnchor="middle" fontSize="22" fontFamily="Poppins, sans-serif" fontWeight="700" fill="#3DB2E0">79</text>
      <text x={CX} y={CY + 10} textAnchor="middle" fontSize="7" fontFamily="'JetBrains Mono', monospace" fill="rgba(61,178,224,0.5)" letterSpacing="2">SCORE</text>
    </svg>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export function HomePage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCTA = () => navigate(isAuthenticated ? '/dashboard' : '/login');

  return (
    <div className="min-h-screen">

      {/* ── HERO ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <ContourLayer />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, #0B0C10 92%)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none" style={{ background: 'linear-gradient(to top, #0B0C10, transparent)' }} />

        {/* Corner brackets — top only, amber */}
        <span className="hw-br hw-br-tl hw-br-amber" style={{ opacity: 0, animation: 'fadeIn 0.8s 0.3s ease-out forwards' }} />
        <span className="hw-br hw-br-tr hw-br-amber" style={{ opacity: 0, animation: 'fadeIn 0.8s 0.3s ease-out forwards' }} />

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-2.5 mb-10 px-3.5 py-1.5 bg-amber/10 border border-amber/30 rounded-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-amber" style={{ boxShadow: '0 0 10px #E8832A' }} />
            <span className="font-mono text-[10px] text-amber uppercase tracking-[3px]">Live · Trail Intelligence</span>
          </motion.div>

          <motion.h1
            className="font-heading font-bold text-5xl md:text-7xl text-mist mb-4 tracking-tight leading-none"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Maîtrise<br />
            <span className="text-amber font-normal italic tracking-normal">ton terrain.</span>
          </motion.h1>

          <motion.div
            className="flex items-center justify-center gap-5 mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
          >
            <span className="h-px w-14" style={{ background: 'linear-gradient(90deg, transparent, #E8832A)' }} />
            <span className="font-mono text-[10px] text-steel uppercase tracking-[3px]">Analyse · Territoire · Performance</span>
            <span className="h-px w-14" style={{ background: 'linear-gradient(90deg, #E8832A, transparent)' }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="flex items-center justify-center gap-5"
          >
            <button onClick={handleCTA} className="hw-btn-amber px-10 py-3.5 text-sm">
              {isAuthenticated ? 'Accéder au Dashboard' : 'Accéder au terrain'}
              <ArrowRightIcon />
            </button>
          </motion.div>
        </div>

        {/* Bottom HUD readouts */}
        <div className="absolute bottom-8 left-12 right-12 flex items-end justify-between pointer-events-none">
          <motion.div
            className="flex gap-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            {[
              { label: 'LAT', value: '14.8097°N' },
              { label: 'LON', value: '61.1681°W' },
              { label: 'ELEV', value: '1 397 m' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-mono text-[8px] text-steel/75 uppercase tracking-[2px] mb-1">{label}</p>
                <p className="font-mono text-[13px] text-mist/80 font-medium tracking-wide">{value}</p>
              </div>
            ))}
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-2 absolute left-1/2 -translate-x-1/2 bottom-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <p className="font-mono text-[8px] text-mist/50 uppercase tracking-[3px] mb-1">Scroll pour explorer</p>
            <svg width="14" height="22" viewBox="0 0 14 22">
              <rect x="1" y="1" width="12" height="20" rx="6" fill="none" stroke="rgba(242,242,242,0.3)" strokeWidth="1" />
              <circle cx="7" cy="7" r="1.5" fill="#E8832A">
                <animate attributeName="cy" values="7;14;7" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
          </motion.div>

          <motion.div
            className="flex gap-10"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
          >
            {[
              { label: 'BEARING', value: 'N 12°' },
              { label: 'H3 CELL', value: '8a2e44' },
              { label: 'STATUS', value: 'TRACKING', amber: true },
            ].map(({ label, value, amber }) => (
              <div key={label}>
                <p className="font-mono text-[8px] text-steel/75 uppercase tracking-[2px] mb-1">{label}</p>
                <p className={`font-mono text-[13px] font-medium tracking-wide ${amber ? 'text-amber' : 'text-mist/80'}`}>{value}</p>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          className="absolute left-12 top-1/2 font-mono text-[8px] text-mist/40 uppercase tracking-[4px] whitespace-nowrap pointer-events-none"
          style={{ transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'left center' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          v2.4 · BUILD 2026.04 · PRECISION MODE
        </motion.div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </section>

      {/* ── Bande transition ── */}
      <motion.div
        className="relative mt-16 px-12 py-5 border-y border-steel/10 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,131,42,0.04) 30%, rgba(61,178,224,0.03) 70%, transparent)' }} />
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-8">
          {/* Ligne gauche */}
          <div className="flex items-center gap-8">
            {[
              { label: 'Distance totale', value: '1 842', unit: 'km' },
              { label: 'Dénivelé cumulé', value: '68 000', unit: 'm D+' },
              { label: 'Sorties analysées', value: '147', unit: '' },
            ].map(({ label, value, unit }) => (
              <div key={label} className="flex flex-col gap-0.5 whitespace-nowrap">
                <span className="font-mono text-[8px] text-steel/85 uppercase tracking-[2px]">{label}</span>
                <span className="font-mono text-[12px] text-mist/70 font-medium tabular-nums">
                  {value}{unit && <span className="font-mono text-[9px] text-steel/75 ml-1">{unit}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Centre — séparateur gradient */}
          <div className="flex items-center gap-4 shrink-0">
            <span className="h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, #E8832A)' }} />
            <span className="font-mono text-[8px] text-steel/75 uppercase tracking-[3px]">Données terrain</span>
            <span className="h-px w-10" style={{ background: 'linear-gradient(90deg, #3DB2E0, transparent)' }} />
          </div>

          {/* Ligne droite */}
          <div className="flex items-center gap-8">
            {[
              { label: 'Zones couvertes', value: '847 km²', amber: false },
              { label: 'Couverture', value: '8%', amber: false },
              { label: 'Statut', value: 'ACTIF', amber: true },
            ].map(({ label, value, amber }) => (
              <div key={label} className="flex flex-col gap-0.5 whitespace-nowrap">
                <span className="font-mono text-[8px] text-steel/85 uppercase tracking-[2px]">{label}</span>
                <span className={`font-mono text-[12px] font-medium tabular-nums ${amber ? 'text-amber/70' : 'text-mist/70'}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Section Territoire ── */}
      <section className="relative py-24 px-6 overflow-hidden">

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          {/* Texte gauche */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              <span className="font-mono text-[10px] text-amber uppercase tracking-[2px]">Territoire</span>
            </div>

            <h2 className="font-heading font-bold text-4xl md:text-5xl text-mist leading-tight">
              Chaque sortie<br />
              <span className="text-amber font-normal italic">trace ton empire.</span>
            </h2>

            <p className="font-mono text-[11px] text-steel/70 leading-relaxed tracking-wide max-w-sm">
              HawkSight cartographie chaque kilomètre couru en cellules hexagonales H3. Au fil des sorties, ton territoire se construit — visible, mesurable, expansible.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Sorties', value: '147', color: 'text-amber', br: 'amber' },
                { label: 'Couverture', value: '8%', color: 'text-amber', br: 'amber' },
                { label: 'Surface', value: '847 km²', color: 'text-glacier', br: 'glacier' },
              ].map(({ label, value, color, br }) => (
                <div key={label} className="hw-card-dark relative p-3">
                  <span className={`hw-br hw-br-tl hw-br-${br}`} />
                  <span className={`hw-br hw-br-br hw-br-${br}`} />
                  <p className="font-mono text-[8px] text-steel/75 uppercase tracking-[2px] mb-1.5">{label}</p>
                  <p className={`font-heading text-xl font-bold tabular-nums ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Barre de progression conquête */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[8px] text-steel/75 uppercase tracking-[2px]">Niveau de conquête</span>
                <span className="font-mono text-[8px] text-amber uppercase tracking-[2px]">Traileur Confirmé</span>
              </div>
              <div className="h-1 bg-steel/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #E8832A, #C96A1A)' }}
                  initial={{ width: 0 }}
                  whileInView={{ width: '62%' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
              <div className="flex justify-between">
                {['Explorateur', 'Confirmé', 'Territoire Libre', 'Légende'].map((s, i) => (
                  <span key={s} className={`font-mono text-[7px] uppercase tracking-[1px] ${i <= 1 ? 'text-amber/60' : 'text-steel/80'}`}>{s}</span>
                ))}
              </div>
            </div>

            <a
              href="/terrain"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber/30 bg-amber/5 hover:bg-amber/10 hover:border-amber/50 transition-all"
            >
              <span className="font-mono text-[10px] text-amber uppercase tracking-[2px]">Explorer le terrain</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8832A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </motion.div>

          {/* Hex map droite */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="hw-card-dark-lg p-0 overflow-hidden aspect-[3/2]" style={{ background: '#05060A' }}>
              <span className="hw-br hw-br-tl hw-br-amber" />
              <span className="hw-br hw-br-tr hw-br-amber" />
              <span className="hw-br hw-br-bl" />
              <span className="hw-br hw-br-br" />

              <TerritoryHexMap />

              {/* Overlay info badges */}
              <div className="hw-card-dark absolute top-4 right-4 px-3 py-2">
                <span className="hw-br hw-br-tl hw-br-amber" />
                <span className="hw-br hw-br-br hw-br-amber" />
                <p className="font-mono text-[7px] text-steel/75 uppercase tracking-[2px] mb-0.5">Dernière sortie</p>
                <p className="font-mono text-[11px] text-amber font-medium">+12 cellules</p>
              </div>
              <div className="hw-card-dark absolute bottom-4 left-4 px-3 py-2">
                <span className="hw-br hw-br-tl hw-br-glacier" />
                <span className="hw-br hw-br-br hw-br-glacier" />
                <p className="font-mono text-[7px] text-steel/75 uppercase tracking-[2px] mb-0.5">Zone glacier</p>
                <p className="font-mono text-[11px] text-glacier font-medium">Nouveau massif</p>
              </div>
            </div>
            <div className="absolute -inset-4 bg-amber/5 rounded-3xl blur-3xl -z-10 pointer-events-none" />
          </motion.div>
        </div>
      </section>

      {/* ── Section Terrain → page dédiée /terrain ── */}

      {/* ── Section Profil Trailer ── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-gradient-to-b from-transparent via-steel/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(61,178,224,0.04) 0%, transparent 60%)' }} />

        <div className="max-w-7xl mx-auto">
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

          <div className="grid grid-cols-[1fr_auto_1fr] gap-16 items-center">
            <motion.div
              className="flex flex-col gap-8"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {[
                { label: 'Endurance', score: 78, color: '#E8832A', desc: "Capacité à maintenir l'effort sur la durée. Calculée sur tes sorties longues et le maintien de la FC." },
                { label: 'Dénivelé', score: 85, color: '#3DB2E0', desc: 'Efficacité en montée et descente. Ratio VAP / vitesse à plat et gestion des descentes techniques.' },
                { label: 'Régularité', score: 62, color: '#6DAA75', desc: "Constance de l'effort et de l'allure. Écart-type de pace et gestion des relances après ravito." },
              ].map(({ label, score, color, desc }, i) => (
                <div key={label} className="text-right">
                  <div className="flex items-center justify-end gap-3 mb-1.5">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[2px] mb-0.5" style={{ color }}>{label}</p>
                      <p className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>{score}<span className="font-mono text-[10px] text-steel/75 ml-0.5">/100</span></p>
                    </div>
                    <div className="w-1 h-10 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${color}, ${color}40)` }} />
                  </div>
                  <p className="font-mono text-[9px] text-steel/85 leading-relaxed max-w-xs ml-auto">{desc}</p>
                  <div className="mt-2 h-px bg-steel/10 rounded-full overflow-hidden">
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

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            >
              <RadarChart />
            </motion.div>

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
                      <p className="font-heading text-2xl font-bold tabular-nums" style={{ color }}>{score}<span className="font-mono text-[10px] text-steel/75 ml-0.5">/100</span></p>
                    </div>
                  </div>
                  <p className="font-mono text-[9px] text-steel/85 leading-relaxed max-w-xs">{desc}</p>
                  <div className="mt-2 h-px bg-steel/10 rounded-full overflow-hidden">
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

          <motion.div
            className="text-center mt-16 flex flex-col items-center gap-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <div className="flex items-center gap-6 font-mono text-[9px] text-steel/75 uppercase tracking-[2px]">
              <div className="flex items-center gap-2"><div className="w-6 h-px bg-glacier/60" /><span>Ton profil</span></div>
              <div className="flex items-center gap-2"><div className="w-6 h-px border-t border-dashed border-steel/40" /><span>Référence élite</span></div>
            </div>
            <p className="font-mono text-[9px] text-steel/65 uppercase tracking-[1px]">Calculé sur 147 sorties · 1 842 km · 68 000 m D+</p>
            <a
              href="/methode"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full border border-glacier/30 bg-glacier/5 hover:bg-glacier/10 hover:border-glacier/50 transition-all"
            >
              <span className="font-mono text-[10px] text-glacier uppercase tracking-[2px]">Découvrir la méthode</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
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
