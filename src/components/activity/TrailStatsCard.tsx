import type { TrailStats } from '@/types';

interface Props { trailStats: TrailStats; sportColor: string; }

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-mono text-[8px] text-steel uppercase tracking-[1.5px]">{label}</span>
      <span className="text-[13px] font-semibold leading-tight" style={{ color: color ?? '#F2F2F2' }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <div className="flex-1 h-px bg-steel/20" />
      <span className="font-mono text-[8px] text-steel/70 uppercase tracking-[2px] whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-steel/20" />
    </div>
  );
}

function ClimbBox({ color, label, data }: {
  color: string;
  label: string;
  data: { longest: { duration: string; dplus?: number; dminus?: number; vap?: number }; biggest: { duration: string; dplus?: number; dminus?: number; vap?: number } };
}) {
  return (
    <div className="bg-[#111318] border border-steel/20 rounded-lg px-3 py-2.5">
      <div className="font-mono text-[8px] uppercase tracking-[1.5px] mb-2" style={{ color }}>{label}</div>
      <div className="font-mono text-[8px] text-steel mb-1 mt-2">Plus longue</div>
      <div className="flex gap-3">
        <Kpi label="Durée" value={data.longest.duration} />
        {data.longest.dplus != null && <Kpi label="D+" value={`${data.longest.dplus} m`} color={color} />}
        {data.longest.dminus != null && <Kpi label="D-" value={`${data.longest.dminus} m`} color={color} />}
        {data.longest.vap != null && <Kpi label="VAP" value={`${Math.round(data.longest.vap)} m/h`} />}
      </div>
      <div className="h-px bg-steel/20 my-1.5" />
      <div className="font-mono text-[8px] text-steel mb-1">Plus grande</div>
      <div className="flex gap-3">
        <Kpi label="Durée" value={data.biggest.duration} />
        {data.biggest.dplus != null && <Kpi label="D+" value={`${data.biggest.dplus} m`} color={color} />}
        {data.biggest.dminus != null && <Kpi label="D-" value={`${data.biggest.dminus} m`} color={color} />}
        {data.biggest.vap != null && <Kpi label="VAP" value={`${Math.round(data.biggest.vap)} m/h`} />}
      </div>
    </div>
  );
}

export function TrailStatsCard({ trailStats: t, sportColor }: Props) {
  const { run_walk: rw, climbs_summary: cs } = t;

  return (
    <div className="hw-card-dark-lg flex flex-col gap-4">
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-[120px] h-[120px] rounded-full blur-[40px] pointer-events-none"
        style={{ background: `${sportColor}0D` }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 pb-3.5 border-b border-steel/25">
        <div className="p-2 rounded-lg shrink-0" style={{ background: `${sportColor}1A`, border: `1px solid ${sportColor}4D`, color: sportColor }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3L4 15l8-4 8 4-4-12" /><line x1="12" y1="11" x2="12" y2="21" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-mist">Analyse Trail</div>
          <div className="font-mono text-[10px] text-steel mt-0.5">
            GAP {t.avg_gap_pace_formatted} · {t.avg_gap_kmh.toFixed(1)} km/h
          </div>
        </div>
      </div>

      {/* Course / Marche */}
      <div>
        <SectionLabel>Course / Marche</SectionLabel>
        <div className="h-1.5 rounded-full bg-steel/30 overflow-hidden my-1.5">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${rw.run_percent}%`, background: sportColor }}
          />
        </div>
        <div className="flex justify-between">
          <Kpi label={`Course ${rw.run_percent.toFixed(0)}%`} value={rw.run_formatted} color={sportColor} />
          <div className="text-right">
            <Kpi label={`Marche ${rw.walk_percent.toFixed(0)}%`} value={rw.walk_formatted} />
          </div>
        </div>
      </div>

      {/* Montées / Descentes */}
      <div>
        <SectionLabel>Montées · Descentes</SectionLabel>
        <div className="grid grid-cols-3 gap-2.5 mb-2.5">
          <Kpi label="Total" value={`${cs.total}`} />
          <Kpi label="Côtes" value={`${cs.cotes}`} />
          <Kpi label="Ondulations" value={`${cs.ondulations}`} />
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <ClimbBox
            color={sportColor}
            label="↑ Montées"
            data={{
              longest: { duration: t.longest_climb.duration_formatted, dplus: t.longest_climb.dplus_m, vap: t.longest_climb.vap_m_per_hour ?? undefined },
              biggest: { duration: t.biggest_climb.duration_formatted, dplus: t.biggest_climb.dplus_m, vap: t.biggest_climb.vap_m_per_hour ?? undefined },
            }}
          />
          <ClimbBox
            color="#3DB2E0"
            label="↓ Descentes"
            data={{
              longest: { duration: t.longest_descent.duration_formatted, dminus: t.longest_descent.dminus_m },
              biggest: { duration: t.biggest_descent.duration_formatted, dminus: t.biggest_descent.dminus_m },
            }}
          />
        </div>
      </div>

      {/* Segments les + difficiles */}
      <div>
        <SectionLabel>Segments les + difficiles</SectionLabel>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-[#111318] border border-steel/20 rounded-lg px-3 py-2.5">
            <div className="font-mono text-[8px] uppercase tracking-[1.5px] mb-2" style={{ color: sportColor }}>↑ Montée</div>
            <div className="grid grid-cols-2 gap-1.5">
              <Kpi label="Dist." value={`${(t.hardest_up.distance_m / 1000).toFixed(1)} km`} />
              <Kpi label="Durée" value={t.hardest_up.duration_formatted} />
              <Kpi label="D+" value={`${t.hardest_up.dplus_m} m`} color={sportColor} />
              <Kpi label="Pente" value={`${Math.abs(t.hardest_up.avg_grade).toFixed(1)}%`} />
              {t.hardest_up.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(t.hardest_up.vap_m_per_hour)} m/h`} color={sportColor} />}
              {t.hardest_up.avg_hr && <Kpi label="FC moy." value={`${t.hardest_up.avg_hr} bpm`} />}
            </div>
          </div>
          <div className="bg-[#111318] border border-steel/20 rounded-lg px-3 py-2.5">
            <div className="font-mono text-[8px] text-glacier uppercase tracking-[1.5px] mb-2">↓ Descente</div>
            <div className="grid grid-cols-2 gap-1.5">
              <Kpi label="Dist." value={`${(t.hardest_down.distance_m / 1000).toFixed(1)} km`} />
              <Kpi label="Durée" value={t.hardest_down.duration_formatted} />
              <Kpi label="D-" value={`${t.hardest_down.dminus_m} m`} color="#3DB2E0" />
              <Kpi label="Pente" value={`${Math.abs(t.hardest_down.avg_grade).toFixed(1)}%`} />
            </div>
          </div>
        </div>
      </div>

      {/* Arrêts / Ravitaillements */}
      <div>
        <SectionLabel>Arrêts / Ravitaillements</SectionLabel>
        {t.aid_stations.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {t.aid_stations.map((s, i) => (
              <div key={i} className="flex items-center justify-between bg-[#111318] border border-steel/20 rounded px-2.5 py-1.5">
                <div>
                  <div className="text-xs text-mist">{s.name}</div>
                  <div className="font-mono text-[9px] text-steel mt-0.5">km {s.km_point.toFixed(1)}</div>
                </div>
                <div className="font-mono text-sm font-bold" style={{ color: sportColor }}>{s.duration_min.toFixed(0)} min</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="font-mono text-[10px] text-steel italic">Aucun arrêt détecté</p>
        )}
      </div>
    </div>
  );
}
