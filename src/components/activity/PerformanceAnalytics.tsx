import { useState, useRef } from "react";

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ActivityIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3A3F47" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const TrendingUpIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </svg>
);

const HeartIcon = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

type ActivityType = "run" | "trail" | "bike";

interface ActivityData {
  id: number;
  date: string;
  name: string;
  type: ActivityType;
  distance: number;
  duration: number;
  avgPace: string;
  avgHeartRate: number;
  avgCadence: number;
}

const activityColors = {
  run: "#E8832A",
  trail: "#C96A1A",
  bike: "#3DB2E0",
};

const activities: ActivityData[] = [
  {
    id: 1,
    date: "15 Jan 2024",
    name: "Course matinale au parc",
    type: "run",
    distance: 10.5,
    duration: 3240,
    avgPace: "5:09",
    avgHeartRate: 158,
    avgCadence: 176,
  },
  {
    id: 2,
    date: "18 Jan 2024",
    name: "Trail des collines",
    type: "trail",
    distance: 15.2,
    duration: 6300,
    avgPace: "6:54",
    avgHeartRate: 165,
    avgCadence: 168,
  },
  {
    id: 3,
    date: "20 Jan 2024",
    name: "Sortie vélo lac",
    type: "bike",
    distance: 42.0,
    duration: 7200,
    avgPace: "2:51",
    avgHeartRate: 142,
    avgCadence: 85,
  },
];

// Génère les données de zones de fréquence cardiaque
const generateHRZones = (activity: ActivityData) => {
  const zones = [
    { name: "Z1", label: "Récupération", range: "50-60%", min: 98, max: 117, color: "#3DB2E0" },
    { name: "Z2", label: "Endurance", range: "60-70%", min: 117, max: 137, color: "#4CAF50" },
    { name: "Z3", label: "Tempo", range: "70-80%", min: 137, max: 156, color: "#FFC107" },
    { name: "Z4", label: "Seuil", range: "80-90%", min: 156, max: 176, color: "#FF9800" },
    { name: "Z5", label: "VO2max", range: "90-100%", min: 176, max: 195, color: "#E8832A" },
  ];

  // Génère des pourcentages réalistes basés sur le HR moyen
  const avgHR = activity.avgHeartRate;
  const seed = activity.id * 999;
  const random = (i: number) => {
    const val = Math.sin(seed + i * 54321) * 10000;
    return val - Math.floor(val);
  };

  // Distribution basée sur le HR moyen
  let percentages = zones.map((zone, i) => {
    const isMainZone = avgHR >= zone.min && avgHR <= zone.max;
    if (isMainZone) {
      return 35 + random(i) * 15; // 35-50% dans la zone principale
    } else {
      const distance = Math.abs(avgHR - (zone.min + zone.max) / 2);
      const proximity = Math.max(0, 50 - distance);
      return proximity * 0.3 * random(i + 10);
    }
  });

  // Normalise pour que la somme = 100%
  const total = percentages.reduce((sum, p) => sum + p, 0);
  percentages = percentages.map(p => (p / total) * 100);

  return zones.map((zone, i) => ({
    ...zone,
    percentage: percentages[i],
    time: (activity.duration * percentages[i]) / 100,
  }));
};

// Génère le profil d'allure (pace over distance)
const generatePaceProfile = (activity: ActivityData) => {
  const numPoints = 50;
  const seed = activity.id * 777;

  const random = (i: number) => {
    const val = Math.sin(seed + i * 98765) * 10000;
    return val - Math.floor(val);
  };

  // Parse pace string (format "5:09" en secondes par km)
  const [mins, secs] = activity.avgPace.split(":").map(Number);
  const avgPaceSeconds = mins * 60 + secs;

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const distance = activity.distance * progress;

    // Crée de la variation naturelle autour de la moyenne
    const variation = (random(i) - 0.5) * 60; // +/- 30 seconds
    const fatigue = progress * 15; // Fatigue progressive
    const paceSeconds = avgPaceSeconds + variation + fatigue;

    points.push({
      distance: parseFloat(distance.toFixed(2)),
      paceSeconds,
      paceDisplay: `${Math.floor(paceSeconds / 60)}:${(Math.floor(paceSeconds % 60)).toString().padStart(2, '0')}`,
    });
  }

  return points;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function PerformanceAnalytics() {
  const [selectedActivity, setSelectedActivity] = useState(activities[0]);
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);

  const color = activityColors[selectedActivity.type];
  const hrZones = generateHRZones(selectedActivity);
  const paceProfile = generatePaceProfile(selectedActivity);

  const exportChart = async (ref: React.RefObject<HTMLDivElement>, name: string, format: 'png' | 'svg') => {
    if (!ref.current) return;

    try {
      if (format === 'png') {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(ref.current, {
          backgroundColor: '#0B0C10',
          scale: 3,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `hawksight-${name}-${selectedActivity.id}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        });
      } else {
        const svgData = ref.current.innerHTML;
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hawksight-${name}-${selectedActivity.id}.svg`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Activity Selector */}
      <div className="flex items-center gap-3">
        <ActivityIcon />
        <select
          value={selectedActivity.id}
          onChange={(e) => {
            const activity = activities.find(a => a.id === parseInt(e.target.value));
            if (activity) setSelectedActivity(activity);
          }}
          className="flex-1 max-w-md px-4 py-2 bg-[#0B0C10] border border-[#3A3F47]/30 text-[#F2F2F2] rounded font-['Inter'] text-sm focus:outline-none focus:border-[#E8832A]/50"
        >
          {activities.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.date} - {activity.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {/* Chart 1: Heart Rate Zones */}
        <div
          ref={chart1Ref}
          className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
        >
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8832A]/5 rounded-full blur-3xl" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 border rounded"
                  style={{
                    backgroundColor: `${color}10`,
                    borderColor: `${color}30`
                  }}
                >
                  <HeartIcon color={color} />
                </div>
                <div>
                  <h3 className="font-heading text-[#F2F2F2]">
                    Zones de Fréquence Cardiaque
                  </h3>
                  <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                    Distribution du temps par zone
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => exportChart(chart1Ref, 'hr-zones', 'png')}
                  className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all"
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>

            {/* HR Zones Chart */}
            <div className="space-y-4">
              {hrZones.map((zone, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-['JetBrains_Mono'] text-xs text-[#F2F2F2]">
                        {zone.name}
                      </span>
                      <span className="font-['Inter'] text-xs text-[#3A3F47]">
                        {zone.label}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-[10px] text-[#3A3F47]/60">
                        {zone.range}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-['JetBrains_Mono'] text-xs text-[#3A3F47]">
                        {formatTime(zone.time)}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-sm" style={{ color: zone.color }}>
                        {zone.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Bar */}
                  <div className="relative h-8 bg-[#0B0C10] border border-[#3A3F47]/20 rounded overflow-hidden">
                    {/* Grid background */}
                    <div
                      className="absolute inset-0 opacity-[0.03]"
                      style={{
                        backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px)`,
                        backgroundSize: '20px 100%'
                      }}
                    />

                    {/* Bar fill */}
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500"
                      style={{
                        width: `${zone.percentage}%`,
                        backgroundColor: `${zone.color}20`,
                        borderRight: `2px solid ${zone.color}`
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${zone.color}40)`
                        }}
                      />
                    </div>

                    {/* Tracking markers */}
                    {[25, 50, 75].map((mark) => (
                      <div
                        key={mark}
                        className="absolute inset-y-0 w-px bg-[#3A3F47]/20"
                        style={{ left: `${mark}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer stats */}
            <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                  HR_ANALYSIS
                </span>
              </div>
              <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                AVG: {selectedActivity.avgHeartRate} BPM
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Pace Profile */}
        <div
          ref={chart2Ref}
          className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
        >
          {/* Background effects */}
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
              <div className="flex items-start gap-3">
                <div
                  className="p-2 border rounded"
                  style={{
                    backgroundColor: `${color}10`,
                    borderColor: `${color}30`
                  }}
                >
                  <TrendingUpIcon color={color} />
                </div>
                <div>
                  <h3 className="font-heading text-[#F2F2F2]">
                    Profil d'Allure
                  </h3>
                  <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                    Évolution de la vitesse sur le parcours
                  </p>
                </div>
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => exportChart(chart2Ref, 'pace-profile', 'png')}
                  className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all"
                >
                  <DownloadIcon />
                </button>
              </div>
            </div>

            {/* Pace Chart */}
            <div className="relative aspect-[2/1] border border-[#3A3F47]/20 rounded overflow-hidden bg-[#0B0C10]">
              {/* Grid background */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #F2F2F2 1px, transparent 1px),
                    linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 20px'
                }}
              />

              {/* Y-axis labels */}
              <div className="absolute left-2 top-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                Rapide
              </div>
              <div className="absolute left-2 bottom-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                Lent
              </div>

              {/* X-axis labels */}
              <div className="absolute bottom-2 left-12 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                0 km
              </div>
              <div className="absolute bottom-2 right-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                {selectedActivity.distance} km
              </div>

              {/* SVG Chart */}
              <svg viewBox="0 0 400 200" className="w-full h-full">
                <defs>
                  <linearGradient id="paceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <line
                    key={`h-${percent}`}
                    x1="20"
                    y1={(percent / 100) * 180 + 10}
                    x2="390"
                    y2={(percent / 100) * 180 + 10}
                    stroke="#3A3F47"
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                ))}

                {/* Calculate min/max pace for scaling */}
                {(() => {
                  const paces = paceProfile.map(p => p.paceSeconds);
                  const minPace = Math.min(...paces);
                  const maxPace = Math.max(...paces);
                  const range = maxPace - minPace;

                  // Create path
                  const pathData = paceProfile.map((point, i) => {
                    const x = 20 + (i / (paceProfile.length - 1)) * 370;
                    const normalizedPace = (point.paceSeconds - minPace) / range;
                    const y = 180 - normalizedPace * 160 + 10;
                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                  }).join(' ');

                  // Create area path
                  const areaData = pathData + ` L 390 190 L 20 190 Z`;

                  return (
                    <>
                      {/* Area under curve */}
                      <path
                        d={areaData}
                        fill="url(#paceGradient)"
                      />

                      {/* Main line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glow)"
                      />

                      {/* Data points every 10th */}
                      {paceProfile
                        .filter((_, i) => i % 10 === 0)
                        .map((point, idx) => {
                          const i = idx * 10;
                          const x = 20 + (i / (paceProfile.length - 1)) * 370;
                          const normalizedPace = (point.paceSeconds - minPace) / range;
                          const y = 180 - normalizedPace * 160 + 10;

                          return (
                            <g key={i}>
                              <circle
                                cx={x}
                                cy={y}
                                r="3"
                                fill={color}
                                opacity="0.6"
                              />
                              <circle
                                cx={x}
                                cy={y}
                                r="1.5"
                                fill="#F2F2F2"
                              />
                            </g>
                          );
                        })}
                    </>
                  );
                })()}
              </svg>

              {/* Technical overlay corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20" style={{ borderColor: color }} />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20" style={{ borderColor: color }} />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20" style={{ borderColor: color }} />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20" style={{ borderColor: color }} />
            </div>

            {/* Footer stats */}
            <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                  PACE_ANALYSIS
                </span>
              </div>
              <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                AVG: {selectedActivity.avgPace} /km
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
