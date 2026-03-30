import type { TrailStats } from '@/types';

interface Props { trailStats: TrailStats; sportColor: string; }

function Kpi({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-wider text-[#3A3F47]">{label}</span>
      <span className="font-heading text-sm leading-tight" style={{ color: color ?? '#F2F2F2' }}>{value}</span>
      {sub && <span className="font-['JetBrains_Mono'] text-[9px] text-[#3A3F47]">{sub}</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="h-px flex-1 bg-[#3A3F47]/20" />
      <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-widest text-[#3A3F47]/60">{children}</span>
      <div className="h-px flex-1 bg-[#3A3F47]/20" />
    </div>
  );
}

function SegmentBlock({ title, segment, color }: { title: string; segment: TrailStats['hardest_up']; color: string }) {
  const isUp = segment.dplus_m >= segment.dminus_m;
  return (
    <div className="flex-1 bg-[#111318] rounded-lg p-3 border border-[#3A3F47]/20 space-y-2">
      <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-wider" style={{ color }}>{title}</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        <Kpi label="Dist." value={`${(segment.distance_m / 1000).toFixed(1)} km`} />
        <Kpi label="Durée" value={segment.duration_formatted} />
        <Kpi label={isUp ? 'D+' : 'D-'} value={`${isUp ? segment.dplus_m : segment.dminus_m} m`} />
        <Kpi label="Pente" value={`${Math.abs(segment.avg_grade).toFixed(1)}%`} />
        {segment.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(segment.vap_m_per_hour)} m/h`} color={color} />}
        {segment.avg_hr && <Kpi label="FC moy." value={`${segment.avg_hr} bpm`} />}
      </div>
    </div>
  );
}

export function TrailStatsCard({ trailStats: t, sportColor }: Props) {
  const { run_walk: rw, climbs_summary: cs } = t;

  return (
    <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-4 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl" style={{ backgroundColor: `${sportColor}08` }} />
      <div className="relative space-y-4">

        {/* Header */}
        <div className="flex items-start gap-3 pb-4 border-b border-[#3A3F47]/30">
          <div className="p-2 border rounded" style={{ backgroundColor: `${sportColor}10`, borderColor: `${sportColor}30` }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sportColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3L4 15l8-4 8 4-4-12" /><line x1="12" y1="11" x2="12" y2="21" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading text-[#F2F2F2]">Analyse Trail</h3>
            <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">GAP {t.avg_gap_pace_formatted} · {t.avg_gap_kmh.toFixed(1)} km/h</p>
          </div>
        </div>

        {/* Run/Walk bar */}
        <div>
          <SectionLabel>Course / Marche</SectionLabel>
          <div className="flex rounded-full overflow-hidden h-2 mb-2">
            <div className="h-full transition-all" style={{ width: `${rw.run_percent}%`, backgroundColor: sportColor }} />
            <div className="h-full flex-1 bg-[#3A3F47]/30" />
          </div>
          <div className="flex justify-between">
            <Kpi label={`Course ${rw.run_percent.toFixed(0)}%`} value={rw.run_formatted} color={sportColor} />
            <Kpi label={`Marche ${rw.walk_percent.toFixed(0)}%`} value={rw.walk_formatted} />
          </div>
        </div>

        {/* Climbs summary + longest/biggest */}
        <div>
          <SectionLabel>Montées · Descentes</SectionLabel>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Kpi label="Total" value={`${cs.total}`} sub="segments" />
            <Kpi label="Côtes" value={`${cs.cotes}`} />
            <Kpi label="Ondulations" value={`${cs.ondulations}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {/* Climbs */}
            <div className="bg-[#111318] rounded-lg p-3 border border-[#3A3F47]/20 space-y-2">
              <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-wider mb-1" style={{ color: sportColor }}>↑ Montées</div>
              <div>
                <div className="text-[#3A3F47] font-['JetBrains_Mono'] text-[9px] mb-1">Plus longue</div>
                <div className="flex gap-3">
                  <Kpi label="Durée" value={t.longest_climb.duration_formatted} />
                  <Kpi label="D+" value={`${t.longest_climb.dplus_m} m`} color={sportColor} />
                  {t.longest_climb.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(t.longest_climb.vap_m_per_hour)} m/h`} />}
                </div>
              </div>
              <div className="border-t border-[#3A3F47]/20 pt-2">
                <div className="text-[#3A3F47] font-['JetBrains_Mono'] text-[9px] mb-1">Plus grande</div>
                <div className="flex gap-3">
                  <Kpi label="Durée" value={t.biggest_climb.duration_formatted} />
                  <Kpi label="D+" value={`${t.biggest_climb.dplus_m} m`} color={sportColor} />
                  {t.biggest_climb.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(t.biggest_climb.vap_m_per_hour)} m/h`} />}
                </div>
              </div>
            </div>
            {/* Descents */}
            <div className="bg-[#111318] rounded-lg p-3 border border-[#3A3F47]/20 space-y-2">
              <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-wider text-[#3DB2E0] mb-1">↓ Descentes</div>
              <div>
                <div className="text-[#3A3F47] font-['JetBrains_Mono'] text-[9px] mb-1">Plus longue</div>
                <div className="flex gap-3">
                  <Kpi label="Durée" value={t.longest_descent.duration_formatted} />
                  <Kpi label="D-" value={`${t.longest_descent.dminus_m} m`} color="#3DB2E0" />
                </div>
              </div>
              <div className="border-t border-[#3A3F47]/20 pt-2">
                <div className="text-[#3A3F47] font-['JetBrains_Mono'] text-[9px] mb-1">Plus grande</div>
                <div className="flex gap-3">
                  <Kpi label="Durée" value={t.biggest_descent.duration_formatted} />
                  <Kpi label="D-" value={`${t.biggest_descent.dminus_m} m`} color="#3DB2E0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hardest segments */}
        <div>
          <SectionLabel>Segments les + difficiles</SectionLabel>
          <div className="flex gap-2">
            <SegmentBlock title="↑ Montée" segment={t.hardest_up} color={sportColor} />
            <SegmentBlock title="↓ Descente" segment={t.hardest_down} color="#3DB2E0" />
          </div>
        </div>

        {/* Aid stations */}
        <div>
          <SectionLabel>Arrêts / Ravitaillements</SectionLabel>
          {t.aid_stations.length > 0 ? (
            <div className="space-y-1">
              {t.aid_stations.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-[#111318] rounded px-3 py-2 border border-[#3A3F47]/20">
                  <span className="font-['Inter'] text-xs text-[#F2F2F2] truncate">{s.name}
                    <span className="text-[#3A3F47] text-[10px] ml-2">km {s.km_point.toFixed(1)}</span>
                  </span>
                  <span className="font-heading text-xs ml-2 shrink-0" style={{ color: sportColor }}>{s.duration_min.toFixed(0)} min</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-['JetBrains_Mono'] text-[10px] text-[#3A3F47] italic">Aucun arrêt détecté</p>
          )}
        </div>

      </div>
    </div>
  );
}
