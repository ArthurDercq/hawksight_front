/**
 * EfCurveChart — courbe EF complète : silhouette d'altitude, baseline, seuil
 * d'effondrement -12%, zones ravito, annotations micro-arrêts.
 *
 * SVG maison suivant le gabarit PaceProfileChart (viewBox/marges/hover) —
 * cf. hawksight-charts skill, Partie A.6. Le plus riche des 3 composants
 * SVG maison : plusieurs couches superposées (silhouette, zones, seuils,
 * annotations) qu'un chart Chart.js standard ne gère pas nativement.
 */
import { useId, useMemo, useRef, useState, useCallback } from 'react';
import type { EfSeriesPoint, EfSignals } from '@/types/ef';
import type { ActivityStream } from '@/types';

const SVG_W = 440;
const SVG_H = 180;
const MARGIN = { top: 8, right: 16, bottom: 22, left: 32 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom;
const COLOR = '#3DB2E0';

// Axe jumeau compressé ~1.5x l'amplitude (méthodo §14.3) — l'altitude reste
// visuellement basse en fond, ne domine pas la lecture de la courbe EF.
const ALTITUDE_AMPLITUDE_COMPRESSION = 1.5;
// -12% : seuil d'effondrement (méthodo §4) — la vraie bascule, pas les
// -5/-8% qui détectent seulement la dérive cardiaque universelle de l'ultra.
const COLLAPSE_THRESHOLD_RATIO = 0.88;
const MIN_STOP_RECT_WIDTH_PX = 1.5;

interface EfCurveChartProps {
  efSeries: EfSeriesPoint[];
  streams: ActivityStream[];
  efSignals: EfSignals;
  efBaseline: number | null;
}

export function EfCurveChart({ efSeries, streams, efSignals, efBaseline }: EfCurveChartProps) {
  const uid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; minute: number; ef: number } | null>(null);

  const chart = useMemo(() => {
    if (efSeries.length === 0) return null;

    const minutes = efSeries.map((p) => p.m);
    const efVals = efSeries.map((p) => p.ef_roll);
    const maxM = Math.max(...minutes) || 1;
    let minEf = Math.min(...efVals) * 0.9;
    let maxEf = Math.max(...efVals) * 1.1;
    if (efBaseline != null) {
      minEf = Math.min(minEf, efBaseline * COLLAPSE_THRESHOLD_RATIO * 0.95);
      maxEf = Math.max(maxEf, efBaseline * 1.05);
    }
    const efRange = maxEf - minEf || 1;
    const toX = (min: number) => MARGIN.left + (min / maxM) * CHART_W;
    const toY = (ef: number) => MARGIN.top + CHART_H - ((ef - minEf) / efRange) * CHART_H;

    const efPath = efSeries.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(p.m).toFixed(1)} ${toY(p.ef_roll).toFixed(1)}`).join(' ');
    const lastX = toX(efSeries[efSeries.length - 1].m);
    const areaPath = `${efPath} L ${lastX.toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} L ${MARGIN.left} ${(MARGIN.top + CHART_H).toFixed(1)} Z`;

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
        const x = MARGIN.left + (s.time_s / maxTimeS) * CHART_W;
        const y = MARGIN.top + CHART_H - (((s.altitude as number) - minAlt) / altRange) * CHART_H;
        altitudePath += i === 0 ? `M ${MARGIN.left} ${MARGIN.top + CHART_H} L ${x} ${y}` : ` L ${x} ${y}`;
      });
      altitudePath += ` L ${lastX} ${MARGIN.top + CHART_H} Z`;
    }

    const baselineY = efBaseline != null ? toY(efBaseline) : null;
    const thresholdY = efBaseline != null ? toY(efBaseline * COLLAPSE_THRESHOLD_RATIO) : null;

    const stopRects = efSignals.stops.map((s) => {
      const x0 = toX(s.start_s / 60);
      const x1 = toX(s.end_s / 60);
      return { x0, width: Math.max(MIN_STOP_RECT_WIDTH_PX, x1 - x0) };
    });

    const microstopXs = efSignals.microstop_times_s.map((t) => toX(t / 60));

    return { efSeries, efPath, areaPath, altitudePath, maxMinute: maxM, baselineY, thresholdY, stopRects, microstopXs, toX, toY };
  }, [efSeries, streams, efSignals, efBaseline]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !chart) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const chartX = svgX - MARGIN.left;
    if (chartX < 0 || chartX > CHART_W) { setHover(null); return; }
    const targetMinute = (chartX / CHART_W) * chart.maxMinute;
    let closest = chart.efSeries[0];
    let minDiff = Math.abs(chart.efSeries[0].m - targetMinute);
    for (const p of chart.efSeries) {
      const diff = Math.abs(p.m - targetMinute);
      if (diff < minDiff) { minDiff = diff; closest = p; }
    }
    setHover({ x: chart.toX(closest.m), y: chart.toY(closest.ef_roll), minute: closest.m, ef: closest.ef_roll });
  }, [chart]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-glacier" />
      <span className="hw-br hw-br-br hw-br-glacier-dim" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Courbe d'efficacité (EF)</h3>
          <p className="hw-chart-subtitle">GAP personnel / FC — lissage 11 min</p>
        </div>
      </div>

      {!chart ? (
        <div className="hw-chart-empty">Données insuffisantes pour cette activité</div>
      ) : (
        <>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            style={{ width: '100%', height: 'auto' }}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id={`efGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={COLOR} stopOpacity="0.25" />
                <stop offset="100%" stopColor={COLOR} stopOpacity="0.03" />
              </linearGradient>
              <filter id={`efGlow-${uid}`}>
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <clipPath id={`efClip-${uid}`}>
                <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H} />
              </clipPath>
            </defs>

            {/* Silhouette d'altitude en fond */}
            {chart.altitudePath && <path d={chart.altitudePath} fill="#3A3F47" opacity="0.25" clipPath={`url(#efClip-${uid})`} />}

            {/* Zones ravito */}
            {chart.stopRects.map((r, i) => (
              <rect key={i} x={r.x0} y={MARGIN.top} width={r.width} height={CHART_H} fill={COLOR} opacity="0.08" />
            ))}

            {/* Grille horizontale */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
              <line
                key={pct}
                x1={MARGIN.left} y1={MARGIN.top + pct * CHART_H}
                x2={MARGIN.left + CHART_W} y2={MARGIN.top + pct * CHART_H}
                stroke="rgba(255,255,255,0.04)" strokeWidth="1"
              />
            ))}

            {/* Seuil effondrement -12% */}
            {chart.thresholdY != null && (
              <>
                <rect x={MARGIN.left} y={chart.thresholdY} width={CHART_W} height={MARGIN.top + CHART_H - chart.thresholdY} fill="#E84242" opacity="0.05" />
                <line x1={MARGIN.left} y1={chart.thresholdY} x2={MARGIN.left + CHART_W} y2={chart.thresholdY} stroke="#E84242" strokeWidth="1" strokeDasharray="4,3" opacity="0.6" />
              </>
            )}

            {/* Baseline */}
            {chart.baselineY != null && (
              <line x1={MARGIN.left} y1={chart.baselineY} x2={MARGIN.left + CHART_W} y2={chart.baselineY} stroke="#8B95A1" strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
            )}

            <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

            {[0, chart.maxMinute / 2, chart.maxMinute].map((m) => {
              const x = chart.toX(m);
              return (
                <g key={m}>
                  <line x1={x} y1={MARGIN.top + CHART_H} x2={x} y2={MARGIN.top + CHART_H + 3} stroke="rgba(58,63,71,0.6)" strokeWidth="0.8" />
                  <text x={x} y={MARGIN.top + CHART_H + 12} textAnchor={m === 0 ? 'start' : m === chart.maxMinute ? 'end' : 'middle'} fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                    {Math.round(m)} min
                  </text>
                </g>
              );
            })}

            <g clipPath={`url(#efClip-${uid})`}>
              <path d={chart.areaPath} fill={`url(#efGrad-${uid})`} />
              <path d={chart.efPath} fill="none" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#efGlow-${uid})`} />
            </g>

            {/* Annotations micro-arrêts (au-dessus de tout) */}
            {chart.microstopXs.map((x, i) => (
              <line key={i} x1={x} y1={MARGIN.top + CHART_H - 5} x2={x} y2={MARGIN.top + CHART_H} stroke="#E8832A" strokeWidth="2" strokeLinecap="round" />
            ))}

            <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

            {hover && (
              <g>
                <line x1={hover.x} y1={MARGIN.top} x2={hover.x} y2={MARGIN.top + CHART_H} stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
                <circle cx={hover.x} cy={hover.y} r="3.5" fill={COLOR} opacity="0.9" />
                <circle cx={hover.x} cy={hover.y} r="1.5" fill="#F2F2F2" />
                {(() => {
                  const isRight = hover.x > SVG_W * 0.65;
                  const bx = isRight ? hover.x - 80 : hover.x + 6;
                  const by = Math.max(MARGIN.top + 2, Math.min(hover.y - 22, MARGIN.top + CHART_H - 24));
                  return (
                    <g>
                      <rect x={bx} y={by} width="72" height="20" rx="3" fill="#0B0C10" stroke={COLOR} strokeWidth="0.8" opacity="0.95" />
                      <text x={bx + 36} y={by + 8} textAnchor="middle" fill={COLOR} fontSize="8" fontFamily="'JetBrains Mono', monospace">EF {hover.ef.toFixed(2)}</text>
                      <text x={bx + 36} y={by + 16} textAnchor="middle" fill="#3A3F47" fontSize="7" fontFamily="'JetBrains Mono', monospace">{Math.round(hover.minute)} min</text>
                    </g>
                  );
                })()}
              </g>
            )}
          </svg>

          <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-steel/20 flex-wrap">
            {chart.baselineY != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5" style={{ background: '#8B95A1' }} />
                <span className="hw-chart-subtitle">Baseline</span>
              </div>
            )}
            {chart.thresholdY != null && (
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 bg-[#E84242]" />
                <span className="hw-chart-subtitle">Seuil effondrement (-12%)</span>
              </div>
            )}
            {chart.stopRects.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-glacier/20 border border-glacier/40" />
                <span className="hw-chart-subtitle">Ravito</span>
              </div>
            )}
            {chart.microstopXs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-0.5 h-3 bg-amber" />
                <span className="hw-chart-subtitle">Micro-arrêt</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
