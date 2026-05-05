import { useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useAuth } from '@/context';

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Hex grid ──────────────────────────────────────────────────────────────────
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

// ── Conquest zones ────────────────────────────────────────────────────────────
const CONQUEST_ZONES = [
  { x: 370, y: 250, r: 190, passes: 58 },
  { x: 560, y: 185, r: 115, passes: 34 },
  { x: 230, y: 330, r: 95,  passes: 22 },
  { x: 460, y: 370, r: 80,  passes: 14 },
  { x: 160, y: 185, r: 70,  passes: 8  },
  { x: 620, y: 320, r: 65,  passes: 5  },
  { x: 290, y: 150, r: 55,  passes: 3  },
];

function hexConquestLevel(x: number, y: number): { intensity: number; passes: number } | null {
  let best: { intensity: number; passes: number } | null = null;
  for (const z of CONQUEST_ZONES) {
    const d = Math.sqrt((x - z.x) ** 2 + (y - z.y) ** 2);
    if (d < z.r) {
      const intensity = 1 - d / z.r;
      if (!best || intensity > best.intensity) best = { intensity, passes: z.passes };
    }
  }
  return best;
}

function hexFillColor(intensity: number, passes: number): string {
  if (passes >= 40) return `rgba(232,131,42,${0.15 + intensity * 0.65})`;
  if (passes >= 20) return `rgba(200,100,20,${0.10 + intensity * 0.50})`;
  if (passes >= 10) return `rgba(160,70,10,${0.08 + intensity * 0.38})`;
  if (passes >= 5)  return `rgba(100,50,10,${0.06 + intensity * 0.28})`;
  return `rgba(58,63,71,${0.04 + intensity * 0.15})`;
}

function hexStrokeColor(intensity: number, passes: number): string {
  if (passes >= 40) return `rgba(232,131,42,${0.4 + intensity * 0.55})`;
  if (passes >= 20) return `rgba(200,100,20,${0.3 + intensity * 0.45})`;
  if (passes >= 10) return `rgba(140,70,15,${0.25 + intensity * 0.35})`;
  if (passes >= 5)  return `rgba(90,55,15,${0.2 + intensity * 0.28})`;
  return `rgba(58,63,71,${0.12 + intensity * 0.18})`;
}

// ── Conquest Map ──────────────────────────────────────────────────────────────
function ConquestHexMap() {
  const cells = useMemo(() => buildHexGrid(26, 16, 24), []);
  const ref = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState(false);
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); setTimeout(() => setScanDone(true), 3600); }
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <svg ref={ref} viewBox="0 0 800 530" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="cp-glow-hi"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <filter id="cp-glow-mid"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <radialGradient id="cp-vignette" cx="50%" cy="50%" r="50%">
          <stop offset="50%" stopColor="transparent"/>
          <stop offset="100%" stopColor="#05060A"/>
        </radialGradient>
        <polygon id="cp-hex" points="0,-24 20.8,-12 20.8,12 0,24 -20.8,12 -20.8,-12" />
      </defs>

      {cells.map((c, i) => {
        const lvl = hexConquestLevel(c.x, c.y);
        const fill   = lvl ? hexFillColor(lvl.intensity, lvl.passes) : 'rgba(18,20,28,0.6)';
        const stroke = lvl ? hexStrokeColor(lvl.intensity, lvl.passes) : 'rgba(58,63,71,0.10)';
        const isHot  = (lvl?.passes ?? 0) >= 40;
        const isMid  = (lvl?.passes ?? 0) >= 20;
        return (
          <motion.use
            key={i}
            href="#cp-hex"
            transform={`translate(${c.x},${c.y})`}
            fill={fill}
            stroke={stroke}
            strokeWidth={isHot ? 1.1 : isMid ? 0.7 : 0.4}
            filter={isHot ? 'url(#cp-glow-hi)' : isMid ? 'url(#cp-glow-mid)' : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: visible ? 1 : 0 }}
            transition={{ duration: 0.35, delay: visible ? 0.012 * i : 0 }}
          />
        );
      })}

      {/* Scan line */}
      {visible && !scanDone && (
        <motion.line
          x1="0" y1="0" x2="800" y2="0"
          stroke="rgba(232,131,42,0.22)" strokeWidth="1.5"
          initial={{ y: -10 }}
          animate={{ y: 540 }}
          transition={{ duration: 2.8, delay: 0.5, ease: 'linear' }}
        />
      )}

      <rect width="800" height="530" fill="url(#cp-vignette)" pointerEvents="none"/>
    </svg>
  );
}

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '', decimals = 0 }: { target: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !triggered.current) {
        triggered.current = true;
        const start = performance.now();
        const duration = 1800;
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setValue(ease * target);
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);

  const display = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString('fr-FR');
  return <span ref={ref}>{display}{suffix}</span>;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function TerrainPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const handleCTA = () => navigate(isAuthenticated ? '/exploration' : '/login');

  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 55% 30%, rgba(232,131,42,0.07) 0%, transparent 55%)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-6 flex items-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              <span className="font-mono text-[10px] text-amber uppercase tracking-[3px]">Exploration · H3 Hex · Trail</span>
            </div>
            <span className="h-px w-16" style={{ background: 'linear-gradient(90deg, rgba(232,131,42,0.5), transparent)' }} />
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <h1 className="font-heading font-bold text-5xl md:text-7xl text-mist leading-none mb-6">
                Conquiers<br />
                <span className="text-amber font-normal italic">chaque cellule.</span>
              </h1>
              <p className="font-mono text-[11px] text-steel/60 leading-relaxed tracking-wide mb-8 max-w-md">
                HawkSight découpe le terrain en milliers de cellules hexagonales H3. Chaque passage sur un sentier est enregistré et pondéré. Au fil des sorties, une carte de chaleur unique se construit — ton territoire réel, visible et mesurable.
              </p>
              <div className="flex items-center gap-4">
                <button onClick={handleCTA} className="hw-btn-amber px-10 py-3.5 text-sm">
                  Explorer mon terrain <ArrowRightIcon />
                </button>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 0.55, 0.25].map((op, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-amber" style={{ opacity: op }} />
                    ))}
                  </div>
                  <span className="font-mono text-[9px] text-steel/40 uppercase tracking-[2px]">Connexion Strava</span>
                </div>
              </div>
            </motion.div>

            {/* KPIs hero */}
            <motion.div
              className="grid grid-cols-2 gap-3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {[
                { label: 'Zones conquises', value: 612, suffix: '', color: 'text-amber', br: 'amber', decimals: 0 },
                { label: 'Nouvelles cellules', value: 184, suffix: '', color: 'text-amber', br: 'amber', decimals: 0 },
                { label: 'Surface couverte', value: 41.8, suffix: ' km²', color: 'text-mist', br: 'steel', decimals: 1 },
                { label: 'Score exploration', value: 30.1, suffix: '%', color: 'text-glacier', br: 'glacier', decimals: 1 },
              ].map(({ label, value, suffix, color, br, decimals }) => (
                <div key={label} className="hw-card-dark relative p-4">
                  <span className={`hw-br hw-br-tl hw-br-${br}`} />
                  <span className={`hw-br hw-br-br hw-br-${br}`} />
                  <p className="font-mono text-[8px] text-steel/40 uppercase tracking-[2px] mb-2">{label}</p>
                  <p className={`font-heading text-3xl font-bold tabular-nums ${color}`}>
                    <AnimatedCounter target={value} suffix={suffix} decimals={decimals} />
                  </p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Carte principale ── */}
      <section className="relative px-6 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_300px] gap-5">

            {/* Carte conquest */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="hw-card-dark-lg p-0 overflow-hidden relative" style={{ background: '#04050A', aspectRatio: '16/9' }}>
                <span className="hw-br hw-br-tl hw-br-amber" />
                <span className="hw-br hw-br-br hw-br-amber" />

                {/* HUD header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 border-b border-steel/10" style={{ background: 'rgba(4,5,10,0.7)', backdropFilter: 'blur(8px)' }}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[8px] text-steel/50 uppercase tracking-[2px]">Carte de passage · H3 Res.9</span>
                    <span className="w-px h-3 bg-steel/20" />
                    <span className="font-mono text-[8px] text-mist/30 tracking-wide">47.85°N · 7.10°E · WGS84</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[8px] text-amber/60 uppercase tracking-[2px]">Mulhouse · 612 Zones</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" style={{ boxShadow: '0 0 6px #E8832A' }} />
                  </div>
                </div>

                <ConquestHexMap />

                {/* Badge territoire continu max */}
                <div className="absolute top-12 right-4 p-3 min-w-[150px]" style={{ background: 'rgba(4,5,10,0.92)', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '8px' }}>
                  <span className="hw-br hw-br-tl hw-br-amber" />
                  <p className="font-mono text-[7px] text-steel/40 uppercase tracking-[2px] mb-1.5">Territoire continu max</p>
                  <p className="font-heading text-base font-bold text-mist italic mb-2">Massif du Grand Ballon</p>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-mono text-[7px] text-steel/40 uppercase tracking-[1px] mb-0.5">Zones</p>
                      <p className="font-heading text-lg font-bold text-amber">64</p>
                    </div>
                    <div>
                      <p className="font-mono text-[7px] text-steel/40 uppercase tracking-[1px] mb-0.5">Surface</p>
                      <p className="font-heading text-lg font-bold text-amber">4.6<span className="font-mono text-[9px] text-steel/40 ml-0.5">km²</span></p>
                    </div>
                  </div>
                </div>

                {/* Badge fréquence */}
                <div className="absolute bottom-10 left-4 px-3 py-2" style={{ background: 'rgba(4,5,10,0.92)', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '8px' }}>
                  <span className="hw-br hw-br-tl hw-br-amber" />
                  <p className="font-mono text-[7px] text-steel/40 uppercase tracking-[2px] mb-1.5">Fréquence · 58 max</p>
                  <div className="flex items-center gap-0.5">
                    {[1, 0.85, 0.7, 0.55, 0.40, 0.28, 0.18, 0.10].map((op, i) => (
                      <div key={i} className="w-6 h-3 rounded-[2px]" style={{ background: `rgba(232,131,42,${op})` }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono text-[7px] text-steel/30">1</span>
                    <span className="font-mono text-[7px] text-steel/30">58</span>
                  </div>
                </div>

                {/* Légende bas */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[7px] text-steel/35 uppercase tracking-[2px]">Fréquence</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: '1–4',   color: 'rgba(90,55,15,0.7)' },
                        { label: '5–9',   color: 'rgba(130,65,12,0.75)' },
                        { label: '10–19', color: 'rgba(165,75,10,0.8)' },
                        { label: '20–39', color: 'rgba(200,100,20,0.9)' },
                        { label: '40+',   color: 'rgba(232,131,42,1)' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center gap-0.5">
                          <div className="w-7 h-2 rounded-[2px]" style={{ background: s.color }} />
                          <span className="font-mono text-[6px] text-steel/30">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -inset-1 bg-amber/4 rounded-2xl blur-2xl -z-10 pointer-events-none" />
            </motion.div>

            {/* Panel stats */}
            <motion.div
              className="flex flex-col gap-4"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              {/* Vue ensemble */}
              <div className="hw-card-dark p-4 relative">
                <span className="hw-br hw-br-tl hw-br-amber" />
                <p className="font-mono text-[8px] text-steel/40 uppercase tracking-[2px] mb-3">Vue d'ensemble</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Zones',     value: 612,  suffix: '',     color: 'text-amber',   decimals: 0 },
                    { label: 'Nouvelles', value: 184,  suffix: ' cells', color: 'text-amber', decimals: 0 },
                    { label: 'Surface',   value: 41.8, suffix: ' km²', color: 'text-mist',    decimals: 1 },
                    { label: 'Explo',     value: 30.1, suffix: '%',    color: 'text-glacier', decimals: 1 },
                  ].map(({ label, value, suffix, color, decimals }) => (
                    <div key={label}>
                      <p className="font-mono text-[7px] text-steel/35 uppercase tracking-[1px] mb-0.5">{label}</p>
                      <p className={`font-heading text-xl font-bold tabular-nums ${color}`}>
                        <AnimatedCounter target={value} suffix={suffix} decimals={decimals} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fréquentation */}
              <div className="hw-card-dark p-4 relative flex-1">
                <span className="hw-br hw-br-tl hw-br-glacier" />
                <p className="font-mono text-[8px] text-steel/40 uppercase tracking-[2px] mb-3">Fréquentation</p>
                <div className="space-y-2.5">
                  {[
                    { label: 'Médiane', value: '6',   unit: 'passages' },
                    { label: 'Moyenne', value: '9.4', unit: 'passages' },
                    { label: 'Max',     value: '58',  unit: 'passages', amber: true },
                  ].map(({ label, value, unit, amber }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="font-mono text-[8px] text-steel/55 uppercase tracking-[1px]">{label}</span>
                      <span className="font-mono text-[8px] text-steel/25">{unit}</span>
                      <span className={`font-heading text-base font-bold tabular-nums ${amber ? 'text-amber' : 'text-mist'}`}>{value}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-steel/10">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[7px] text-steel/40 uppercase tracking-[1px]">Novelty Gap</span>
                      <span className="font-mono text-[7px] text-steel/25">Terrain hétérogène</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-1 flex-1 bg-steel/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #3DB2E0, #E8832A)' }}
                          initial={{ width: 0 }}
                          whileInView={{ width: '52%' }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.4, delay: 0.4, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="font-heading text-base font-bold text-mist tabular-nums shrink-0">52</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 sem → 1 an */}
              <div className="hw-card-dark p-4 relative">
                <span className="hw-br hw-br-br hw-br-amber" />
                <p className="font-mono text-[8px] text-steel/40 uppercase tracking-[2px] mb-3">4 Sem → 1 An</p>
                <div className="space-y-3">
                  {[
                    { label: 'Zones',         cur: 142,  max: 612,  pct: 23 },
                    { label: 'Surface km²',   cur: 9.2,  max: 41.8, pct: 22 },
                    { label: 'Exploration %', cur: 12.7, max: 30.1, pct: 42 },
                  ].map(({ label, cur, max, pct }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[7px] text-steel/45 uppercase tracking-[1px]">{label}</span>
                        <span className="font-mono text-[7px] text-amber/60 tabular-nums">{cur}<span className="text-steel/25"> / {max}</span></span>
                      </div>
                      <div className="h-0.5 bg-steel/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #E8832A, #C96A1A)' }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${pct}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bande séparatrice ── */}
      <div className="relative px-6 py-4 border-y border-steel/10 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(232,131,42,0.03) 40%, rgba(61,178,224,0.02) 60%, transparent)' }} />
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {[
            { label: 'Distance totale', value: '1 842 km' },
            { label: 'Dénivelé cumulé', value: '68 000 m D+' },
            { label: 'Sorties analysées', value: '147' },
            { label: 'Top zone', value: '58 passages', amber: true },
            { label: 'Profil', value: 'L\'Explorateur', amber: true },
          ].map(({ label, value, amber }) => (
            <div key={label} className="flex flex-col gap-0.5 whitespace-nowrap">
              <span className="font-mono text-[7px] text-steel/40 uppercase tracking-[2px]">{label}</span>
              <span className={`font-mono text-[11px] font-medium tabular-nums ${amber ? 'text-amber/80' : 'text-mist/60'}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section conquête : niveaux ── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(232,131,42,0.04) 0%, transparent 55%)' }} />

        <div className="max-w-7xl mx-auto">
          <motion.div
            className="mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-amber/10 border border-amber/30 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
              <span className="font-mono text-[10px] text-amber uppercase tracking-[2px]">Progression · Conquête</span>
            </div>
            <h2 className="font-heading font-bold text-4xl md:text-5xl text-mist leading-tight">
              Chaque sortie<br />
              <span className="text-amber font-normal italic">trace ton empire.</span>
            </h2>
          </motion.div>

          {/* Niveaux de conquête */}
          <div className="grid md:grid-cols-4 gap-4 mb-12">
            {[
              { rank: '01', label: 'Explorateur',      desc: 'Tu poses tes premières empreintes. Chaque nouvelle cellule compte.',   zones: '0–150',   pct: 25,  active: false },
              { rank: '02', label: 'Confirmé',          desc: 'Ton territoire s\'affirme. Des massifs entiers portent ta signature.',  zones: '150–400',  pct: 62,  active: true  },
              { rank: '03', label: 'Territoire Libre',  desc: 'Moins de zones inconnues que de zones conquises. Tu contrôles.',       zones: '400–700',  pct: 0,   active: false },
              { rank: '04', label: 'Légende',           desc: 'Saturation maximale. Ton territoire est une œuvre cartographique.',    zones: '700+',     pct: 0,   active: false },
            ].map(({ rank, label, desc, zones, pct, active }, i) => (
              <motion.div
                key={rank}
                className={`hw-card-dark relative p-5 ${active ? 'border-amber/40' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
                style={active ? { background: 'rgba(232,131,42,0.04)', borderColor: 'rgba(232,131,42,0.3)' } : {}}
              >
                {active && <span className="hw-br hw-br-tl hw-br-amber" />}
                {active && <span className="hw-br hw-br-br hw-br-amber" />}
                {active && (
                  <div className="absolute top-4 right-4">
                    <span className="font-mono text-[7px] text-amber uppercase tracking-[2px] px-2 py-0.5 bg-amber/10 border border-amber/30 rounded-full">Actuel</span>
                  </div>
                )}
                <p className="font-mono text-[8px] text-steel/30 uppercase tracking-[3px] mb-2">{rank}</p>
                <p className={`font-heading font-bold text-lg mb-1 ${active ? 'text-amber' : 'text-mist/50'}`}>{label}</p>
                <p className="font-mono text-[8px] text-steel/40 uppercase tracking-[1px] mb-3">{zones} zones</p>
                <p className="font-mono text-[9px] text-steel/50 leading-relaxed mb-4">{desc}</p>
                {active && (
                  <div>
                    <div className="h-1 bg-steel/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #E8832A, #C96A1A)' }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.4, delay: 0.3, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="font-mono text-[7px] text-amber/50 mt-1 text-right">{pct}%</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* 3 feature cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: '◈',
                title: 'Carte de chaleur live',
                desc: 'Chaque passage colorise ta carte en temps réel. La densité révèle tes zones de domination et les angles morts à conquérir.',
                color: 'amber',
                tag: 'Visualisation',
              },
              {
                icon: '⬡',
                title: 'Grille H3 Résolution 9',
                desc: 'Précision au mètre près. Des milliers de cellules hexagonales indépendantes — chacune est une conquête à part entière.',
                color: 'glacier',
                tag: 'Précision · H3',
              },
              {
                icon: '↗',
                title: 'Export haute résolution',
                desc: 'Génère une image de ta carte de territoire. Partage tes conquêtes, défie tes compagnons, documente ta progression.',
                color: 'amber',
                tag: 'SVG · PNG',
              },
            ].map(({ icon, title, desc, color, tag }, i) => (
              <motion.div
                key={title}
                className="hw-card-dark relative p-5"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 * i }}
              >
                <span className={`hw-br hw-br-tl hw-br-${color}`} />
                <span className={`hw-br hw-br-br hw-br-${color}`} />
                <div className="flex items-start justify-between mb-4">
                  <span className={`font-mono text-2xl ${color === 'amber' ? 'text-amber' : 'text-glacier'}`}>{icon}</span>
                  <span className={`font-mono text-[7px] uppercase tracking-[2px] px-2 py-0.5 rounded-full border ${color === 'amber' ? 'text-amber/60 border-amber/20 bg-amber/5' : 'text-glacier/60 border-glacier/20 bg-glacier/5'}`}>{tag}</span>
                </div>
                <h3 className="font-heading font-semibold text-base text-mist mb-2">{title}</h3>
                <p className="font-mono text-[9px] text-steel/50 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(232,131,42,0.05) 0%, transparent 65%)' }} />

        <motion.div
          className="relative z-10 max-w-2xl mx-auto text-center space-y-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="hw-grad-sep mx-auto w-24" />
          <h2 className="font-heading font-bold text-4xl md:text-6xl text-mist leading-tight">
            Ton territoire<br />
            <span className="text-amber font-normal italic">t'attend.</span>
          </h2>
          <p className="font-mono text-[10px] text-steel/50 uppercase tracking-[2px]">
            Connecte Strava · Ta carte se génère en quelques secondes · Zéro configuration
          </p>
          <button onClick={handleCTA} className="hw-btn-amber px-12 py-4 text-sm">
            {isAuthenticated ? 'Accéder à l\'Exploration' : 'Commencer maintenant'}
            <ArrowRightIcon />
          </button>
          <div className="flex items-center justify-center gap-3 text-steel font-mono text-[9px] uppercase tracking-[2px]">
            <div className="flex gap-1">
              {[1, 0.6, 0.3].map((op, i) => (
                <div key={i} className="w-1 h-1 rounded-full bg-amber" style={{ opacity: op }} />
              ))}
            </div>
            <span>System Ready · H3 Grid Online</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
