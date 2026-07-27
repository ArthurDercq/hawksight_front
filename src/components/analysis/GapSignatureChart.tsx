/**
 * GapSignatureChart — signature GAP personnelle actuelle : vitesse relative
 * au plat en fonction de la pente. Scope réduit (décision produit) : courbe
 * actuelle seule, pas de comparaison à une période antérieure (nécessiterait
 * d'historiser gap_curve, hors scope — user_baseline n'a qu'une ligne par
 * user, toujours écrasée au recompute).
 *
 * SVG maison suivant le gabarit PaceProfileChart (viewBox/marges/hover) —
 * cf. hawksight-charts skill, Partie A.6.
 */
import { useId, useMemo, useRef, useState, useCallback } from 'react';
import { InfoTooltip } from '@/components/ui';
import type { GapCurve } from '@/types/ef';

const SVG_W = 440;
const SVG_H = 180;
const MARGIN = { top: 8, right: 16, bottom: 22, left: 32 };
const CHART_W = SVG_W - MARGIN.left - MARGIN.right;
const CHART_H = SVG_H - MARGIN.top - MARGIN.bottom;
const COLOR = '#3DB2E0';

interface GapSignatureChartProps {
  gapCurve: GapCurve | null;
}

export function GapSignatureChart({ gapCurve }: GapSignatureChartProps) {
  const uid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{ x: number; grade: number; r: number } | null>(null);

  const points = useMemo(() => {
    if (!gapCurve || gapCurve.gmids.length === 0) return null;
    return gapCurve.gmids.map((grade, i) => ({ grade, r: gapCurve.rvals[i] }));
  }, [gapCurve]);

  const scales = useMemo(() => {
    if (!points) return null;
    const grades = points.map((p) => p.grade);
    const rvals = points.map((p) => p.r);
    const minGrade = Math.min(...grades);
    const maxGrade = Math.max(...grades);
    const gradeRange = maxGrade - minGrade || 1;
    const minR = Math.min(...rvals) * 0.9;
    const maxR = Math.max(...rvals) * 1.1;
    const rRange = maxR - minR || 1;
    const toX = (grade: number) => MARGIN.left + ((grade - minGrade) / gradeRange) * CHART_W;
    const toY = (r: number) => MARGIN.top + CHART_H - ((r - minR) / rRange) * CHART_H;
    return { minGrade, maxGrade, minR, maxR, toX, toY };
  }, [points]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !points || !scales) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const chartX = svgX - MARGIN.left;
    if (chartX < 0 || chartX > CHART_W) { setHover(null); return; }
    const targetGrade = scales.minGrade + (chartX / CHART_W) * (scales.maxGrade - scales.minGrade);
    let closest = points[0];
    let minDiff = Math.abs(points[0].grade - targetGrade);
    for (const p of points) {
      const diff = Math.abs(p.grade - targetGrade);
      if (diff < minDiff) { minDiff = diff; closest = p; }
    }
    setHover({ x: scales.toX(closest.grade), grade: closest.grade, r: closest.r });
  }, [points, scales]);

  return (
    <div className="hw-chart-card">
      <span className="hw-br hw-br-tl hw-br-glacier" />
      <span className="hw-br hw-br-br hw-br-glacier-dim" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="hw-chart-title">Signature GAP actuelle</h3>
          <p className="hw-chart-subtitle">Vitesse relative au plat selon la pente</p>
        </div>
        <InfoTooltip>
          Votre courbe GAP personnelle, apprise sur vos sorties Run/Trail des 24 derniers mois (pas la
          courbe Minetti de laboratoire, qui sur-crédite les descentes trail). r=1 au plat ; en dessous
          de 1, vous êtes plus lent qu'au plat à effort égal ; au-dessus, plus rapide (descentes
          modérées typiquement).
        </InfoTooltip>
      </div>

      {!points || !scales ? (
        <div className="hw-chart-empty">Courbe personnelle non calculable — historique Run/Trail encore insuffisant</div>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{ width: '100%', height: 'auto' }}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={`gapGrad-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={COLOR} stopOpacity="0.25" />
              <stop offset="100%" stopColor={COLOR} stopOpacity="0.03" />
            </linearGradient>
            <filter id={`gapGlow-${uid}`}>
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
              <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id={`gapClip-${uid}`}>
              <rect x={MARGIN.left} y={MARGIN.top} width={CHART_W} height={CHART_H} />
            </clipPath>
          </defs>

          {[scales.minR, (scales.minR + scales.maxR) / 2, scales.maxR].map((tick) => {
            const y = scales.toY(tick);
            return (
              <g key={tick}>
                <line x1={MARGIN.left} y1={y} x2={MARGIN.left + CHART_W} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                <text x={MARGIN.left - 4} y={y} textAnchor="end" dominantBaseline="middle" fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                  {tick.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Repère r=1 (plat) */}
          <line
            x1={MARGIN.left} y1={scales.toY(1)} x2={MARGIN.left + CHART_W} y2={scales.toY(1)}
            stroke="#E8832A" strokeWidth="1" strokeDasharray="4,3" opacity="0.6"
          />

          {/* Repère pente 0% */}
          {scales.minGrade < 0 && scales.maxGrade > 0 && (
            <line x1={scales.toX(0)} y1={MARGIN.top} x2={scales.toX(0)} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />
          )}

          <line x1={MARGIN.left} y1={MARGIN.top + CHART_H} x2={MARGIN.left + CHART_W} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

          {[scales.minGrade, 0, scales.maxGrade].filter((v, i, arr) => arr.indexOf(v) === i).map((grade) => {
            const x = scales.toX(grade);
            return (
              <g key={grade}>
                <line x1={x} y1={MARGIN.top + CHART_H} x2={x} y2={MARGIN.top + CHART_H + 3} stroke="rgba(58,63,71,0.6)" strokeWidth="0.8" />
                <text x={x} y={MARGIN.top + CHART_H + 12} textAnchor="middle" fill="#3A3F47" fontSize="8" fontFamily="'JetBrains Mono', monospace">
                  {Math.round(grade)}%
                </text>
              </g>
            );
          })}

          <g clipPath={`url(#gapClip-${uid})`}>
            <path
              d={`${points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scales.toX(p.grade).toFixed(1)} ${scales.toY(p.r).toFixed(1)}`).join(' ')} L ${scales.toX(points[points.length - 1].grade).toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} L ${scales.toX(points[0].grade).toFixed(1)} ${(MARGIN.top + CHART_H).toFixed(1)} Z`}
              fill={`url(#gapGrad-${uid})`}
            />
            <path
              d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${scales.toX(p.grade).toFixed(1)} ${scales.toY(p.r).toFixed(1)}`).join(' ')}
              fill="none" stroke={COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter={`url(#gapGlow-${uid})`}
            />
          </g>

          <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + CHART_H} stroke="rgba(58,63,71,0.4)" strokeWidth="0.5" />

          {hover && (
            <g>
              <line x1={hover.x} y1={MARGIN.top} x2={hover.x} y2={MARGIN.top + CHART_H} stroke="#F2F2F2" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.3" />
              <circle cx={hover.x} cy={scales.toY(hover.r)} r="3.5" fill={COLOR} opacity="0.9" />
              <circle cx={hover.x} cy={scales.toY(hover.r)} r="1.5" fill="#F2F2F2" />
              {(() => {
                const isRight = hover.x > SVG_W * 0.65;
                const bx = isRight ? hover.x - 80 : hover.x + 6;
                const hoverY = scales.toY(hover.r);
                const by = Math.max(MARGIN.top + 2, Math.min(hoverY - 22, MARGIN.top + CHART_H - 24));
                return (
                  <g>
                    <rect x={bx} y={by} width="72" height="20" rx="3" fill="#0B0C10" stroke={COLOR} strokeWidth="0.8" opacity="0.95" />
                    <text x={bx + 36} y={by + 8} textAnchor="middle" fill={COLOR} fontSize="8" fontFamily="'JetBrains Mono', monospace">r = {hover.r.toFixed(2)}</text>
                    <text x={bx + 36} y={by + 16} textAnchor="middle" fill="#3A3F47" fontSize="7" fontFamily="'JetBrains Mono', monospace">{hover.grade.toFixed(1)}% pente</text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      )}
    </div>
  );
}
