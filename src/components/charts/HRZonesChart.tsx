import { useMemo } from "react";
import type { Activity, ActivityStream } from "@/types";
import { sportColor } from '@/services/utils/constants';

interface HRZonesChartProps {
  activity: Activity;
  streams: ActivityStream[];
  maxHr?: number | null;
}

const DEFAULT_FC_MAX = 190;

const ZONE_DEFS = [
  { name: "Z1", label: "Récupération", range: "50-60%", pctMin: 0.50, pctMax: 0.60, color: "#3DB2E0" },
  { name: "Z2", label: "Endurance",    range: "60-70%", pctMin: 0.60, pctMax: 0.70, color: "#4CAF50" },
  { name: "Z3", label: "Tempo",        range: "70-80%", pctMin: 0.70, pctMax: 0.80, color: "#FFC107" },
  { name: "Z4", label: "Seuil",        range: "80-90%", pctMin: 0.80, pctMax: 0.90, color: "#FF9800" },
  { name: "Z5", label: "VO2max",       range: "90-100%",pctMin: 0.90, pctMax: 1.00, color: "#E84242" },
];

function getHRZones(fcMax: number) {
  return ZONE_DEFS.map(z => ({ ...z, min: Math.round(fcMax * z.pctMin), max: Math.round(fcMax * z.pctMax) }));
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`;
  return `${m}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
};

export function HRZonesChart({ activity, streams, maxHr }: HRZonesChartProps) {
  const color = sportColor(activity.sport_type);

  const fcMax = maxHr && maxHr > 0 ? maxHr : DEFAULT_FC_MAX;

  const HR_ZONES = useMemo(() => getHRZones(fcMax), [fcMax]);

  const hrZones = useMemo(() => {
    const hrData = streams.filter(s => s.heartrate != null);
    if (hrData.length === 0) return null;
    const counts = HR_ZONES.map(() => 0);
    hrData.forEach(s => {
      const hr = s.heartrate!;
      const zoneIdx = HR_ZONES.findIndex(z => hr >= z.min && hr < z.max);
      if (zoneIdx >= 0) counts[zoneIdx]++;
    });
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return HR_ZONES.map((zone, i) => ({
      ...zone,
      percentage: (counts[i] / total) * 100,
      time: (counts[i] / total) * activity.moving_time,
    }));
  }, [streams, activity.moving_time, HR_ZONES]);

  if (!hrZones) {
    return (
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Zones FC</div>
        <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace' }}>Pas de données de fréquence cardiaque</div>
      </div>
    );
  }

  const avgHR = activity.average_heartrate ? Math.round(activity.average_heartrate) : '--';

  return (
    <div>
      {/* Title + subtitle */}
      <div style={{ fontSize: '10px', fontWeight: 600, color: 'rgba(242,242,242,0.7)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>Zones FC</div>
      <div style={{ fontSize: '9px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', marginBottom: '14px' }}>
        FC max {fcMax} · moy. {avgHR} bpm
      </div>

      {/* HR zone rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {hrZones.map((zone, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '9px', color: zone.color, fontFamily: 'JetBrains Mono, monospace', width: '20px', flexShrink: 0 }}>{zone.name}</span>
            <div style={{ flex: 1, height: '6px', background: 'rgba(58,63,71,0.3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${zone.percentage}%`, background: zone.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontSize: '9px', color: '#F2F2F2', fontFamily: 'JetBrains Mono, monospace', width: '32px', textAlign: 'right', flexShrink: 0 }}>{formatTime(zone.time)}</span>
            <span style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', width: '28px', textAlign: 'right', flexShrink: 0 }}>{zone.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* FC max input hint */}
      <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(58,63,71,0.2)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Couleur : {color === '#E8832A' ? 'sport' : 'sport'}
        </span>
        <span style={{ fontSize: '8px', color: '#3A3F47', fontFamily: 'JetBrains Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>
          FC MAX {fcMax} BPM
        </span>
      </div>
    </div>
  );
}
