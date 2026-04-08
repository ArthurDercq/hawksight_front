import type { TrailStats } from '@/types';

interface Props { trailStats: TrailStats; sportColor: string; }

function Kpi({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <span style={{ fontSize: '8px', color: '#3A3F47', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 600, color: color ?? '#F2F2F2', lineHeight: 1.2 }}>{value}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <div style={{ flex: 1, height: '1px', background: 'rgba(58,63,71,0.2)' }} />
      <span style={{ fontSize: '8px', color: 'rgba(58,63,71,0.7)', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(58,63,71,0.2)' }} />
    </div>
  );
}

export function TrailStatsCard({ trailStats: t, sportColor }: Props) {
  const { run_walk: rw, climbs_summary: cs } = t;

  return (
    <div style={{
      background: '#0B0C10', border: '1px solid rgba(58,63,71,0.3)', borderRadius: '10px',
      padding: '18px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: '120px', height: '120px', background: `${sportColor}0D`, borderRadius: '50%', filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(58,63,71,0.25)' }}>
        <div style={{ padding: '8px', background: `${sportColor}1A`, border: `1px solid ${sportColor}4D`, borderRadius: '7px', color: sportColor, flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3L4 15l8-4 8 4-4-12" /><line x1="12" y1="11" x2="12" y2="21" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#F2F2F2' }}>Analyse Trail</div>
          <div style={{ fontSize: '10px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
            GAP {t.avg_gap_pace_formatted} · {t.avg_gap_kmh.toFixed(1)} km/h
          </div>
        </div>
      </div>

      {/* Course / Marche */}
      <div>
        <SectionLabel>Course / Marche</SectionLabel>
        <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(58,63,71,0.3)', overflow: 'hidden', margin: '6px 0' }}>
          <div style={{ height: '100%', width: `${rw.run_percent}%`, background: sportColor, borderRadius: '3px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Kpi label={`Course ${rw.run_percent.toFixed(0)}%`} value={rw.run_formatted} color={sportColor} />
          <div style={{ textAlign: 'right' }}>
            <Kpi label={`Marche ${rw.walk_percent.toFixed(0)}%`} value={rw.walk_formatted} />
          </div>
        </div>
      </div>

      {/* Montées / Descentes */}
      <div>
        <SectionLabel>Montées · Descentes</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <Kpi label="Total" value={`${cs.total}`} />
          <Kpi label="Côtes" value={`${cs.cotes}`} />
          <Kpi label="Ondulations" value={`${cs.ondulations}`} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Montées */}
          <div style={{ background: '#111318', border: '1px solid rgba(58,63,71,0.2)', borderRadius: '7px', padding: '10px 12px' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', color: sportColor, marginBottom: '8px' }}>↑ Montées</div>
            <div style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px', marginTop: '8px' }}>Plus longue</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Kpi label="Durée" value={t.longest_climb.duration_formatted} />
              <Kpi label="D+" value={`${t.longest_climb.dplus_m} m`} color={sportColor} />
              {t.longest_climb.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(t.longest_climb.vap_m_per_hour)} m/h`} />}
            </div>
            <div style={{ height: '1px', background: 'rgba(58,63,71,0.2)', margin: '6px 0' }} />
            <div style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Plus grande</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Kpi label="Durée" value={t.biggest_climb.duration_formatted} />
              <Kpi label="D+" value={`${t.biggest_climb.dplus_m} m`} color={sportColor} />
              {t.biggest_climb.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(t.biggest_climb.vap_m_per_hour)} m/h`} />}
            </div>
          </div>
          {/* Descentes */}
          <div style={{ background: '#111318', border: '1px solid rgba(58,63,71,0.2)', borderRadius: '7px', padding: '10px 12px' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', color: '#3DB2E0', marginBottom: '8px' }}>↓ Descentes</div>
            <div style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px', marginTop: '8px' }}>Plus longue</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Kpi label="Durée" value={t.longest_descent.duration_formatted} />
              <Kpi label="D-" value={`${t.longest_descent.dminus_m} m`} color="#3DB2E0" />
            </div>
            <div style={{ height: '1px', background: 'rgba(58,63,71,0.2)', margin: '6px 0' }} />
            <div style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Plus grande</div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Kpi label="Durée" value={t.biggest_descent.duration_formatted} />
              <Kpi label="D-" value={`${t.biggest_descent.dminus_m} m`} color="#3DB2E0" />
            </div>
          </div>
        </div>
      </div>

      {/* Segments les + difficiles */}
      <div>
        <SectionLabel>Segments les + difficiles</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Montée */}
          <div style={{ background: '#111318', border: '1px solid rgba(58,63,71,0.2)', borderRadius: '7px', padding: '10px 12px' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', color: sportColor, marginBottom: '8px' }}>↑ Montée</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <Kpi label="Dist." value={`${(t.hardest_up.distance_m / 1000).toFixed(1)} km`} />
              <Kpi label="Durée" value={t.hardest_up.duration_formatted} />
              <Kpi label="D+" value={`${t.hardest_up.dplus_m} m`} color={sportColor} />
              <Kpi label="Pente" value={`${Math.abs(t.hardest_up.avg_grade).toFixed(1)}%`} />
              {t.hardest_up.vap_m_per_hour && <Kpi label="VAP" value={`${Math.round(t.hardest_up.vap_m_per_hour)} m/h`} color={sportColor} />}
              {t.hardest_up.avg_hr && <Kpi label="FC moy." value={`${t.hardest_up.avg_hr} bpm`} />}
            </div>
          </div>
          {/* Descente */}
          <div style={{ background: '#111318', border: '1px solid rgba(58,63,71,0.2)', borderRadius: '7px', padding: '10px 12px' }}>
            <div style={{ fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px', fontFamily: 'JetBrains Mono, monospace', color: '#3DB2E0', marginBottom: '8px' }}>↓ Descente</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {t.aid_stations.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#111318', border: '1px solid rgba(58,63,71,0.2)', borderRadius: '5px', padding: '6px 10px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#F2F2F2' }}>{s.name}</div>
                  <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginTop: '1px' }}>km {s.km_point.toFixed(1)}</div>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: sportColor, fontFamily: 'JetBrains Mono, monospace' }}>{s.duration_min.toFixed(0)} min</div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '10px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', fontStyle: 'italic' }}>Aucun arrêt détecté</p>
        )}
      </div>
    </div>
  );
}
