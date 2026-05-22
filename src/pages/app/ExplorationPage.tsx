import { useMemo, useState, useEffect, useRef } from 'react';
import { useExploration, useTerritories } from '@/hooks';
import { ExplorationMap } from '@/components/maps';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Spinner } from '@/components/ui/Spinner';
import { explorationApi, type ExplorationRateItem } from '@/services/api/exploration';
import type { ExplorationStats, SportFilter, TerritoryLargest } from '@/types';

// ── Icons ─────────────────────────────────────────────────────────────────────
const GlobeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const SPORT_FILTERS: { value: SportFilter; label: string }[] = [
  { value: 'all', label: 'Tout' }, { value: 'run', label: 'Course' },
  { value: 'trail', label: 'Trail' }, { value: 'bike', label: 'Vélo' }, { value: 'other', label: 'Autres' },
];

const HOTSPOT_PERIODS = [
  { value: '3m', label: '3 mois' }, { value: '6m', label: '6 mois' },
  { value: '1y', label: '1 an' }, { value: 'all', label: 'Tout' },
];

const fmt = (n: number | undefined | null, d = 0) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR').format(d > 0 ? parseFloat(n.toFixed(d)) : Math.round(n));

const fmtPct = (v: number | undefined | null) => v == null ? '—' : `${v.toFixed(1)} %`;

// ── Primitives ────────────────────────────────────────────────────────────────
function StatRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="hw-text-label">{label}</span>
      <span className={`hw-text-data font-semibold ${accent ? 'text-glacier' : 'text-mist/80'}`}>{value}</span>
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className="hw-pb-bg mt-1">
      <div className="hw-pb-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function PanelSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="hw-card-dark overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-steel/5 transition-colors">
        <span className="hw-text-label text-steel">{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="px-4 pb-3 divide-y divide-steel/10">{children}</div>}
    </div>
  );
}

// ── Right stats panel ─────────────────────────────────────────────────────────
function StatsPanel({ stats, showCoreOnly, onToggleCoreOnly, coreThreshold }: {
  stats: ExplorationStats; showCoreOnly: boolean; onToggleCoreOnly: () => void; coreThreshold: number;
}) {
  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-0.5">

      {/* Profil Explorateur teaser */}
      <div className="hw-card-dark p-3 flex items-center gap-3 border-glacier/20">
        <span className="hw-br hw-br-tl hw-br-glacier" />
        <div className="w-7 h-7 rounded-full bg-glacier/10 border border-glacier/30 flex items-center justify-center shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="hw-text-label text-glacier/70 tracking-[2px]">Profil Explorateur</p>
          <p className="hw-text-caption text-mist/50 truncate">Score · Archétype · Tendances</p>
        </div>
        <span className="hw-text-label text-muted shrink-0 border border-steel/20 rounded px-1.5 py-0.5">Soon</span>
      </div>

      {/* Core toggle */}
      <button onClick={onToggleCoreOnly}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hw-text-label ${
          showCoreOnly ? 'bg-glacier/10 border-glacier/40 text-glacier' : 'bg-charcoal border-steel/20 text-muted hover:border-steel/40 hover:text-mist/60'
        }`}>
        <span>Cœur de territoire</span>
        <span className={`hw-text-label px-2 py-0.5 rounded border ${
          showCoreOnly ? 'border-glacier/40 text-glacier/70 bg-glacier/5' : 'border-steel/20 text-muted'
        }`}>≥ {coreThreshold} passages</span>
      </button>

      <PanelSection title="Territoire">
        <StatRow label="Surface explorée" value={`${fmt(stats.surface_km2)} km²`} />
        <StatRow label="Zones explorées"  value={`${fmt(stats.total_cells)} zones`} />
        <StatRow label="Nouvelles / an"   value={`${fmt(stats.new_this_year)} zones`} />
        <StatRow label="Score exploration" value={`${fmt(stats.exploration_score * 1000, 1)} m²/km`} accent />
      </PanelSection>

      <PanelSection title="Ancrage">
        <div className="py-1.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="hw-text-label">Zones cœur</span>
            <span className="hw-text-data font-semibold text-glacier">
              {fmtPct(stats.core_ratio != null ? stats.core_ratio * 100 : null)}
            </span>
          </div>
          <ProgressBar value={stats.core_ratio ?? 0} max={1} color="#3DB2E0" />
        </div>
        <StatRow label="Niveau d'ancrage" value={stats.core_level ?? '—'} />
        <StatRow label="Médiane passages" value={`${fmt(stats.median_visits)}×`} />
        <StatRow label="Moy. passages"    value={`${fmt(stats.avg_visits, 1)}×`} />
      </PanelSection>

      <PanelSection title="Récence">
        <div className="py-1.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="hw-text-label">Taux de nouveauté</span>
            <span className="hw-text-data font-semibold text-moss">{fmtPct(stats.novelty_percent)}</span>
          </div>
          <ProgressBar value={stats.novelty_percent ?? 0} max={100} color="#6DAA75" />
        </div>
        <StatRow label="4 dernières sem."  value={`${fmt(stats.recent_4w)} zones`} />
        <StatRow label="12 dernières sem." value={`${fmt(stats.recent_12w)} zones`} />
        <StatRow label="12 derniers mois"  value={`${fmt(stats.recent_52w)} zones`} />
        {stats.rotation_activity != null && (
          <div className="pt-1.5 mt-0.5 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-glacier animate-pulse shrink-0" />
            <span className="hw-text-label">Rotation terrain</span>
            <span className="hw-text-caption text-glacier/80 ml-auto">{fmtPct(stats.rotation_activity)}</span>
          </div>
        )}
      </PanelSection>
    </div>
  );
}

// ── Grands territoires ────────────────────────────────────────────────────────
function LargestTerritoriesSection({ territories, isComputing }: { territories: TerritoryLargest[]; isComputing: boolean }) {
  if (isComputing) return (
    <div className="flex items-center gap-3">
      <Spinner size="sm" fullPage={false} />
      <span className="hw-text-label text-muted tracking-[2px]">Calcul des territoires...</span>
    </div>
  );
  if (!territories.length) return null;

  const maxSurface = Math.max(...territories.map(t => t.surface_km2));

  return (
    <div>
      <div className="hw-section-sep mb-4 relative">
        <span className="hw-text-label text-muted tracking-[2px]">Tes plus grands territoires</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {territories.map((t) => {
          const location = [t.city, t.region].filter(Boolean).join(', ');
          const country = t.country ?? '';
          const pct = Math.round((t.surface_km2 / maxSurface) * 100);
          return (
            <div key={t.rank} className="hw-card-dark p-4 flex flex-col gap-3">
              <span className="hw-br hw-br-tl hw-br-glacier" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="hw-text-label text-steel/40">#{t.rank}</span>
                  <p className="font-heading font-semibold text-mist text-sm mt-0.5 leading-tight">{location || 'Zone inconnue'}</p>
                  {country && <p className="hw-text-caption mt-0.5">{country}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-2xl font-bold text-glacier tabular-nums leading-none">{fmt(t.surface_km2)}</p>
                  <p className="hw-text-caption mt-0.5">km²</p>
                </div>
              </div>
              <div>
                <div className="hw-pb-bg">
                  <div className="hw-pb-fill bg-glacier" style={{ width: `${pct}%` }} />
                </div>
                <p className="hw-text-caption mt-1">{fmt(t.cells_count)} zones hexagonales</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profil Explorateur ────────────────────────────────────────────────────────
function ProfilExplorateur({ stats }: { stats: ExplorationStats }) {
  const score = stats.exploration_score != null ? Math.round(stats.exploration_score * 1000) : null;

  return (
    <div>
      <div className="hw-section-sep mb-4 relative">
        <span className="hw-text-label text-muted tracking-[2px]">Profil Explorateur</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Score */}
        <div className="hw-card-dark p-4 flex flex-col gap-2">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <p className="hw-text-label text-muted tracking-[2px]">Score exploration</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-3xl font-bold text-glacier tabular-nums">{score ?? '—'}</span>
            <span className="hw-text-caption">m²/km</span>
          </div>
          <p className="hw-text-caption text-steel/50 mt-auto">Surface explorée par km parcouru</p>
        </div>

        {/* Archétype — placeholder */}
        <div className="hw-card-dark p-4 flex flex-col gap-2">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <p className="hw-text-label text-muted tracking-[2px]">Archétype</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-glacier/10 border border-glacier/30 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3DB2E0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <p className="font-heading font-semibold text-mist text-sm">Explorateur</p>
              <p className="hw-text-caption">Ancré & curieux</p>
            </div>
          </div>
          <div className="mt-auto flex items-center gap-1.5 border border-steel/15 rounded px-2 py-1 w-fit">
            <div className="w-1 h-1 rounded-full bg-glacier/50" />
            <span className="hw-text-label text-steel/50">Algo en cours</span>
          </div>
        </div>

        {/* Tendances — placeholder */}
        <div className="hw-card-dark p-4 flex flex-col gap-2">
          <span className="hw-br hw-br-tl hw-br-glacier" />
          <p className="hw-text-label text-muted tracking-[2px]">Tendances</p>
          <div className="flex flex-col gap-1.5 mt-1">
            {[
              { label: 'Nouveauté', value: fmtPct(stats.novelty_percent), color: '#6DAA75' },
              { label: 'Ancrage', value: fmtPct((stats.core_ratio ?? 0) * 100), color: '#3DB2E0' },
              { label: 'Récence', value: `${fmt(stats.recent_4w)} zones`, color: '#3DB2E0' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between gap-2">
                <span className="hw-text-label text-muted tracking-[1px]">{label}</span>
                <span className="hw-text-caption font-semibold tabular-nums" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-1.5 border border-steel/15 rounded px-2 py-1 w-fit">
            <div className="w-1 h-1 rounded-full bg-glacier/50" />
            <span className="hw-text-label text-steel/50">Données live</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Graphique exploration ─────────────────────────────────────────────────────
function ExplorationChart() {
  const [data, setData] = useState<ExplorationRateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    explorationApi.getExplorationRates('month', 'all').then(d => {
      setData(d.slice(-18));
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const pad = { top: 12, right: 16, bottom: 32, left: 40 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    ctx.clearRect(0, 0, w, h);

    const rates = data.map(d => d.exploration_rate * 100);
    const newCells = data.map(d => d.new_cells);
    const maxRate = Math.max(...rates, 1);
    const maxCells = Math.max(...newCells, 1);
    const n = data.length;
    const xStep = chartW / (n - 1);

    const xAt = (i: number) => pad.left + i * xStep;
    const yRate = (v: number) => pad.top + chartH - (v / maxRate) * chartH;
    const _yCell = (v: number) => pad.top + chartH - (v / maxCells) * chartH; void _yCell;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + chartW, y); ctx.stroke();
    }

    // Bars — nouvelles zones
    const barW = Math.max(2, xStep * 0.45);
    ctx.fillStyle = 'rgba(61,178,224,0.15)';
    data.forEach((d, i) => {
      const bh = (d.new_cells / maxCells) * chartH;
      ctx.fillRect(xAt(i) - barW / 2, pad.top + chartH - bh, barW, bh);
    });

    // Line — taux d'exploration
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xAt(i), y = yRate(d.exploration_rate * 100);
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.strokeStyle = '#3DB2E0';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Area fill under line
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = xAt(i), y = yRate(d.exploration_rate * 100);
      if (i === 0) { ctx.moveTo(x, y); } else { ctx.lineTo(x, y); }
    });
    ctx.lineTo(xAt(n - 1), pad.top + chartH);
    ctx.lineTo(xAt(0), pad.top + chartH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, 'rgba(61,178,224,0.25)');
    grad.addColorStop(1, 'rgba(61,178,224,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Dots on line
    data.forEach((d, i) => {
      ctx.beginPath();
      ctx.arc(xAt(i), yRate(d.exploration_rate * 100), 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#3DB2E0';
      ctx.fill();
    });

    // X labels — every 3 months
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `${9 * window.devicePixelRatio / window.devicePixelRatio}px "JetBrains Mono", monospace`;
    ctx.textAlign = 'center';
    data.forEach((d, i) => {
      if (i % 3 !== 0) return;
      ctx.fillText(d.period_label.slice(0, 7), xAt(i), pad.top + chartH + 18);
    });

    // Y axis label
    ctx.fillStyle = 'rgba(61,178,224,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText(`${maxRate.toFixed(0)}%`, pad.left - 6, pad.top + 8);
    ctx.fillText('0%', pad.left - 6, pad.top + chartH);
  }, [data]);

  return (
    <div>
      <div className="hw-section-sep mb-4 relative">
        <span className="hw-text-label text-muted tracking-[2px]">Évolution de l'exploration</span>
      </div>
      <div className="hw-card-dark p-4">
        <span className="hw-br hw-br-tl hw-br-glacier" />
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-[2px] bg-glacier rounded" />
            <span className="hw-text-label text-muted tracking-[1px]">Taux d'exploration</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-glacier/20" />
            <span className="hw-text-label text-muted tracking-[1px]">Nouvelles zones</span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-[180px]">
            <Spinner size="sm" fullPage={false} />
          </div>
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-[180px]">
            <p className="hw-text-caption">Pas encore de données</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-[180px]" />
        )}
      </div>
    </div>
  );
}

// ── Zones fétiches ────────────────────────────────────────────────────────────
function ZonesFetichesSection({ data: geoData }: { data: { features: { properties: { h3_id: string; activity_count: number; sports: string[]; first_seen: string | null; last_seen: string | null } }[] } | null }) {
  const [period, setPeriod] = useState<string>('3m');

  const zones = useMemo(() => {
    if (!geoData) return [];
    const now = new Date();
    const cutoff = new Date(now);
    if (period === '3m') cutoff.setMonth(now.getMonth() - 3);
    else if (period === '6m') cutoff.setMonth(now.getMonth() - 6);
    else if (period === '1y') cutoff.setFullYear(now.getFullYear() - 1);
    else cutoff.setFullYear(2000);

    return [...geoData.features]
      .filter(f => {
        if (period === 'all') return true;
        const last = f.properties.last_seen ? new Date(f.properties.last_seen) : null;
        return last && last >= cutoff;
      })
      .sort((a, b) => b.properties.activity_count - a.properties.activity_count)
      .slice(0, 10);
  }, [geoData, period]);

  const maxCount = zones[0]?.properties.activity_count ?? 1;

  return (
    <div>
      <div className="hw-section-sep mb-4 relative">
        <span className="hw-text-label text-muted tracking-[2px]">Zones fétiches</span>
      </div>
      <div className="hw-card-dark p-4">
        <span className="hw-br hw-br-tl hw-br-glacier" />

        {/* Period filter */}
        <div className="flex items-center gap-1 mb-4">
          {HOTSPOT_PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`hw-text-label px-3 py-1.5 rounded border transition-all ${
                period === p.value
                  ? 'bg-glacier/15 border-glacier/50 text-glacier'
                  : 'bg-transparent border-steel/20 text-muted hover:border-steel/40 hover:text-mist/60'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {zones.length === 0 ? (
          <p className="hw-text-caption py-4 text-center">Aucune zone sur cette période</p>
        ) : (
          <div className="flex flex-col gap-2">
            {zones.map((z, i) => {
              const p = z.properties;
              const pct = Math.round((p.activity_count / maxCount) * 100);
              const lastDate = p.last_seen ? new Date(p.last_seen).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—';
              return (
                <div key={p.h3_id} className="flex items-center gap-3">
                  <span className="hw-text-label text-steel/40 w-4 shrink-0 text-right">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="hw-text-caption text-steel/50 truncate">{p.h3_id.slice(0, 12)}…</span>
                      <span className="hw-text-caption font-bold text-mist/80 tabular-nums shrink-0">{p.activity_count}×</span>
                    </div>
                    <div className="hw-pb-bg">
                      <div className="hw-pb-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#3DB2E0' : 'rgba(61,178,224,0.6)' }} />
                    </div>
                  </div>
                  <span className="hw-text-label text-steel/40 shrink-0 w-16 text-right">{lastDate}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function ExplorationPage() {
  const { data, stats, isLoading, isFetching, error, sportFilter, setSportFilter, selectedYear, setSelectedYear } = useExploration();
  const { largest, isLoading: territoriesLoading, isComputing } = useTerritories();
  const [showCoreOnly, setShowCoreOnly] = useState(false);
  const coreThreshold = stats?.core_threshold ?? 10;
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 5 }, (_, i) => currentYear - i), [currentYear]);

  if (isLoading) return (
    <div className="max-w-7xl mx-auto px-6">
      <SectionTitle icon={<GlobeIcon />} title="Exploration du Territoire" />
      <div className="flex items-center justify-center py-24"><Spinner message="Chargement de la carte..." /></div>
    </div>
  );

  if (error) return (
    <div className="max-w-7xl mx-auto px-6">
      <div className="mb-8"><SectionTitle icon={<GlobeIcon />} title="Exploration du Territoire" /></div>
      <div className="hw-card-dark p-6 flex flex-col items-center gap-3 text-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="hw-text-data text-muted uppercase tracking-wider">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col px-6 pt-6 pb-8 gap-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 shrink-0">
        <SectionTitle icon={<GlobeIcon />} title="Exploration du Territoire" />
        <div className="flex items-center gap-2">
          {isFetching && <Spinner size="sm" fullPage={false} />}
          <div className="flex items-center gap-1">
            {SPORT_FILTERS.map(f => (
              <button key={f.value} onClick={() => setSportFilter(f.value)}
                className={`hw-text-label px-3 py-1.5 rounded border transition-all ${
                  sportFilter === f.value ? 'bg-glacier/15 border-glacier/50 text-glacier' : 'bg-transparent border-steel/20 text-muted hover:border-steel/40 hover:text-mist/60'
                }`}>{f.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setSelectedYear(null)}
              className={`hw-text-label px-3 py-1.5 rounded border transition-all ${
                !selectedYear ? 'bg-glacier/15 border-glacier/50 text-glacier' : 'bg-transparent border-steel/20 text-muted hover:border-steel/40 hover:text-mist/60'
              }`}>Tout</button>
            {years.map(y => (
              <button key={y} onClick={() => setSelectedYear(y)}
                className={`hw-text-label px-3 py-1.5 rounded border transition-all ${
                  selectedYear === y ? 'bg-glacier/15 border-glacier/50 text-glacier' : 'bg-transparent border-steel/20 text-muted hover:border-steel/40 hover:text-mist/60'
                }`}>{y}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Stats panel */}
      {data && (
        <div className="flex gap-4 h-[calc(100vh-140px)]">
          <div className="flex-1 relative bg-charcoal border border-steel/30 rounded-lg overflow-hidden">
            <span className="hw-br hw-br-tl hw-br-glacier" />
            <span className="hw-br hw-br-br hw-br-glacier-dim" />
            <ExplorationMap data={data} className="h-full" coreThreshold={coreThreshold} showCoreOnly={showCoreOnly} />
            {data.features.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-mono text-xs text-muted">Aucune zone explorée trouvée</p>
              </div>
            )}
          </div>
          {stats && (
            <div className="w-[300px] shrink-0 overflow-y-auto">
              <StatsPanel stats={stats} showCoreOnly={showCoreOnly} onToggleCoreOnly={() => setShowCoreOnly(v => !v)} coreThreshold={coreThreshold} />
            </div>
          )}
        </div>
      )}

      {/* Sections below the map */}
      {stats && <ProfilExplorateur stats={stats} />}

      <LargestTerritoriesSection territories={largest} isComputing={isComputing && !territoriesLoading} />

      <ExplorationChart />

      <ZonesFetichesSection data={data} />

    </div>
  );
}
