/**
 * EfCurveChart — courbe EF + silhouette d'altitude en fond
 * =========================================================
 * Scope de ce chantier (§14.3 méthodo) : silhouette d'altitude + courbe EF de
 * base uniquement. Le reste de la Phase 5 (baseline, seuil effondrement -12%,
 * zones ravito, annotations micro-arrêts) est un chantier séparé — voir
 * docs/PLAN_IMPLEMENTATION_ANALYSE_EF.md Phase 5.
 *
 * Pattern SVG réutilisé de EfficiencyDriftChart.tsx (silhouette d'altitude en
 * aplat gris derrière une courbe) — pas de lib de charting pour ce type de
 * composant dans ce repo.
 */
import { useRef, useMemo } from 'react';
import type { EfSeriesPoint } from '@/types/ef';
import type { ActivityStream } from '@/types';

const ActivityIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

interface EfCurveChartProps {
  efSeries: EfSeriesPoint[];
  streams: ActivityStream[];
  color?: string;
}

const CHART_X0 = 40;
const CHART_X1 = 360;
const CHART_Y0 = 20;
const CHART_Y1 = 200;
// Axe jumeau compressé ~1.5x l'amplitude (méthodo §14.3) — l'altitude reste
// visuellement basse en fond, ne domine pas la lecture de la courbe EF.
const ALTITUDE_AMPLITUDE_COMPRESSION = 1.5;

export function EfCurveChart({ efSeries, streams, color = '#3DB2E0' }: EfCurveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const { efPath, altitudePath, maxMinute } = useMemo(() => {
    if (efSeries.length === 0) {
      return { efPath: '', altitudePath: '', maxMinute: 1 };
    }

    const minutes = efSeries.map((p) => p.m);
    const efVals = efSeries.map((p) => p.ef_roll);
    const maxM = Math.max(...minutes) || 1;
    const minEf = Math.min(...efVals) * 0.9;
    const maxEf = Math.max(...efVals) * 1.1;
    const efRange = maxEf - minEf || 1;

    let ef = '';
    efSeries.forEach((point, i) => {
      const x = CHART_X0 + (point.m / maxM) * (CHART_X1 - CHART_X0);
      const y = CHART_Y0 + ((maxEf - point.ef_roll) / efRange) * (CHART_Y1 - CHART_Y0);
      ef += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    // Silhouette d'altitude — dérivée des streams (altitude par time_s),
    // reprojetée sur le même axe X (minutes) que la courbe EF.
    let alt = '';
    const altStreams = streams.filter((s) => s.altitude != null);
    if (altStreams.length > 0) {
      const alts = altStreams.map((s) => s.altitude as number);
      const minAlt = Math.min(...alts);
      const maxAlt = Math.max(...alts);
      const altRange = (maxAlt - minAlt) * ALTITUDE_AMPLITUDE_COMPRESSION || 1;
      const maxTimeS = Math.max(...altStreams.map((s) => s.time_s)) || 1;

      altStreams.forEach((s, i) => {
        const x = CHART_X0 + (s.time_s / maxTimeS) * (CHART_X1 - CHART_X0);
        const y = CHART_Y1 - (((s.altitude as number) - minAlt) / altRange) * (CHART_Y1 - CHART_Y0);
        alt += i === 0 ? `M ${CHART_X0} ${CHART_Y1} L ${x} ${y}` : ` L ${x} ${y}`;
      });
      alt += ` L ${CHART_X1} ${CHART_Y1} Z`;
    }

    return { efPath: ef, altitudePath: alt, maxMinute: maxM };
  }, [efSeries, streams]);

  if (efSeries.length === 0) {
    return (
      <div className="hw-card-dark-lg">
        <div className="flex items-center gap-3 pb-3 border-b border-steel/25 mb-3.5">
          <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
            <ActivityIcon color={color} />
          </div>
          <div>
            <div className="text-sm font-semibold text-mist">Courbe d'efficacité (EF)</div>
            <div className="hw-text-caption text-steel mt-0.5">Pas encore d'analyse disponible</div>
          </div>
        </div>
        <div className="flex items-center justify-center h-40 hw-text-caption text-steel">
          Données insuffisantes pour cette activité
        </div>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="hw-card-dark-lg">
      <div className="flex items-center gap-3 pb-3 border-b border-steel/25 mb-3.5">
        <div className="p-2 bg-glacier/10 border border-glacier/30 rounded-lg text-glacier shrink-0">
          <ActivityIcon color={color} />
        </div>
        <div>
          <div className="text-sm font-semibold text-mist">Courbe d'efficacité (EF)</div>
          <div className="hw-text-caption text-steel mt-0.5">GAP personnel / FC — lissage 11 min</div>
        </div>
      </div>

      <div className="relative border border-steel/20 rounded overflow-hidden bg-charcoal-light">
        <svg viewBox="0 0 400 220" className="w-full h-auto">
          {/* Silhouette d'altitude en fond */}
          {altitudePath && <path d={altitudePath} fill="#3A3F47" opacity="0.2" />}

          {/* Grid horizontal */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1={CHART_X0} y1={CHART_Y0 + (pct / 100) * (CHART_Y1 - CHART_Y0)}
              x2={CHART_X1} y2={CHART_Y0 + (pct / 100) * (CHART_Y1 - CHART_Y0)}
              stroke="#9CA3AF" strokeWidth="0.5" opacity="0.15"
            />
          ))}

          {/* Courbe EF */}
          <path d={efPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Axe X */}
          <text x={CHART_X0} y="212" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">0 min</text>
          <text x="200" y="212" textAnchor="middle" className="font-mono text-[9px]" fill="#6B7280">{Math.round(maxMinute / 2)} min</text>
          <text x={CHART_X1} y="212" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">{Math.round(maxMinute)} min</text>
        </svg>

        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
      </div>

      {/* TODO Phase 5 complète : baseline, seuil effondrement -12%, zones ravito, annotations micro-arrêts */}
    </div>
  );
}
