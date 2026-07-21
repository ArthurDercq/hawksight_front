/**
 * EfCurveChart — courbe EF complète : silhouette d'altitude, baseline, seuil
 * d'effondrement -12%, zones ravito, annotations micro-arrêts.
 *
 * Pattern SVG réutilisé de EfficiencyDriftChart.tsx (silhouette d'altitude en
 * aplat gris derrière une courbe) — pas de lib de charting pour ce type de
 * composant dans ce repo.
 */
import { useRef, useMemo } from 'react';
import type { EfSeriesPoint, EfSignals } from '@/types/ef';
import type { ActivityStream } from '@/types';

const ActivityIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

interface EfCurveChartProps {
  efSeries: EfSeriesPoint[];
  streams: ActivityStream[];
  efSignals: EfSignals;
  efBaseline: number | null;
  color?: string;
}

const CHART_X0 = 40;
const CHART_X1 = 360;
const CHART_Y0 = 20;
const CHART_Y1 = 200;
// Axe jumeau compressé ~1.5x l'amplitude (méthodo §14.3) — l'altitude reste
// visuellement basse en fond, ne domine pas la lecture de la courbe EF.
const ALTITUDE_AMPLITUDE_COMPRESSION = 1.5;
// -12% : seuil d'effondrement (méthodo §4) — la vraie bascule, pas les
// -5/-8% qui détectent seulement la dérive cardiaque universelle de l'ultra.
const COLLAPSE_THRESHOLD_RATIO = 0.88;
const MIN_STOP_RECT_WIDTH_PX = 2;

export function EfCurveChart({ efSeries, streams, efSignals, efBaseline, color = '#3DB2E0' }: EfCurveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const chart = useMemo(() => {
    if (efSeries.length === 0) return null;

    const minutes = efSeries.map((p) => p.m);
    const efVals = efSeries.map((p) => p.ef_roll);
    const maxM = Math.max(...minutes) || 1;
    let minEf = Math.min(...efVals) * 0.9;
    let maxEf = Math.max(...efVals) * 1.1;
    // Élargir l'échelle pour toujours inclure baseline/seuil -12% s'ils
    // existent — sinon ces lignes de référence pourraient sortir du cadre
    // sur une sortie où l'EF réel est resté loin de la baseline attendue.
    if (efBaseline != null) {
      minEf = Math.min(minEf, efBaseline * COLLAPSE_THRESHOLD_RATIO * 0.95);
      maxEf = Math.max(maxEf, efBaseline * 1.05);
    }
    const efRange = maxEf - minEf || 1;
    const xOf = (min: number) => CHART_X0 + (min / maxM) * (CHART_X1 - CHART_X0);
    const yOf = (ef: number) => CHART_Y0 + ((maxEf - ef) / efRange) * (CHART_Y1 - CHART_Y0);

    let efPath = '';
    efSeries.forEach((point, i) => {
      const x = xOf(point.m);
      const y = yOf(point.ef_roll);
      efPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    // Silhouette d'altitude — dérivée des streams (altitude par time_s),
    // reprojetée sur le même axe X (minutes) que la courbe EF.
    let altitudePath = '';
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
        altitudePath += i === 0 ? `M ${CHART_X0} ${CHART_Y1} L ${x} ${y}` : ` L ${x} ${y}`;
      });
      altitudePath += ` L ${CHART_X1} ${CHART_Y1} Z`;
    }

    const baselineY = efBaseline != null ? yOf(efBaseline) : null;
    const thresholdY = efBaseline != null ? yOf(efBaseline * COLLAPSE_THRESHOLD_RATIO) : null;

    // Zones ravito (arrêts exclus de l'analyse) — secondes -> minutes -> X.
    const stopRects = efSignals.stops.map((s) => {
      const x0 = xOf(s.start_s / 60);
      const x1 = xOf(s.end_s / 60);
      return { x0, width: Math.max(MIN_STOP_RECT_WIDTH_PX, x1 - x0) };
    });

    // Annotations micro-arrêts — marqueurs ponctuels sur l'axe X.
    const microstopXs = efSignals.microstop_times_s.map((t) => xOf(t / 60));

    return { efPath, altitudePath, maxMinute: maxM, baselineY, thresholdY, stopRects, microstopXs };
  }, [efSeries, streams, efSignals, efBaseline]);

  if (!chart) {
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

  const { efPath, altitudePath, maxMinute, baselineY, thresholdY, stopRects, microstopXs } = chart;

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

          {/* Zones ravito */}
          {stopRects.map((r, i) => (
            <rect key={i} x={r.x0} y={CHART_Y0} width={r.width} height={CHART_Y1 - CHART_Y0} fill="#3DB2E0" opacity="0.08" />
          ))}

          {/* Grid horizontal */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <line
              key={pct}
              x1={CHART_X0} y1={CHART_Y0 + (pct / 100) * (CHART_Y1 - CHART_Y0)}
              x2={CHART_X1} y2={CHART_Y0 + (pct / 100) * (CHART_Y1 - CHART_Y0)}
              stroke="#9CA3AF" strokeWidth="0.5" opacity="0.15"
            />
          ))}

          {/* Seuil effondrement -12% */}
          {thresholdY != null && (
            <>
              <rect x={CHART_X0} y={thresholdY} width={CHART_X1 - CHART_X0} height={CHART_Y1 - thresholdY} fill="#c0392b" opacity="0.05" />
              <line x1={CHART_X0} y1={thresholdY} x2={CHART_X1} y2={thresholdY} stroke="#c0392b" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
            </>
          )}

          {/* Baseline */}
          {baselineY != null && (
            <line x1={CHART_X0} y1={baselineY} x2={CHART_X1} y2={baselineY} stroke="#9CA3AF" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
          )}

          {/* Courbe EF */}
          <path d={efPath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Annotations micro-arrêts (au-dessus de tout) */}
          {microstopXs.map((x, i) => (
            <line key={i} x1={x} y1={CHART_Y1 - 6} x2={x} y2={CHART_Y1} stroke="#E8832A" strokeWidth="2" strokeLinecap="round" />
          ))}

          {/* Axe X */}
          <text x={CHART_X0} y="212" textAnchor="start" className="font-mono text-[9px]" fill="#6B7280">0 min</text>
          <text x="200" y="212" textAnchor="middle" className="font-mono text-[9px]" fill="#6B7280">{Math.round(maxMinute / 2)} min</text>
          <text x={CHART_X1} y="212" textAnchor="end" className="font-mono text-[9px]" fill="#6B7280">{Math.round(maxMinute)} min</text>
        </svg>

        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
      </div>

      <div className="flex items-center justify-center gap-4 mt-3 flex-wrap">
        {baselineY != null && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-mist/40" style={{ borderTop: '1px dashed' }} />
            <span className="text-mist/40 font-body text-xs">Baseline</span>
          </div>
        )}
        {thresholdY != null && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-[#c0392b]" />
            <span className="text-mist/40 font-body text-xs">Seuil effondrement (-12%)</span>
          </div>
        )}
        {stopRects.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-glacier/20 border border-glacier/40" />
            <span className="text-mist/40 font-body text-xs">Ravito</span>
          </div>
        )}
        {microstopXs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-0.5 h-3 bg-amber" />
            <span className="text-mist/40 font-body text-xs">Micro-arrêt</span>
          </div>
        )}
      </div>
    </div>
  );
}
