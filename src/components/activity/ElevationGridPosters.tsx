import { useState, useRef } from "react";

// SVG Icons
const ElevationIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

type ActivityType = "run" | "trail" | "bike";

interface Activity {
  index: number;
  type: ActivityType;
}

const elevationColors = {
  run: { stroke: "#6DAA75", fill: "#6DAA75" },
  trail: { stroke: "#9477D9", fill: "#9477D9" },
  bike: { stroke: "#3DB2E0", fill: "#3DB2E0" },
};

const activityLabels = {
  run: "Run",
  trail: "Trail",
  bike: "Vélo",
};

const availableYears = ["2024", "2023", "2022", "2021"];

// Génère un profil d'altitude réaliste basé sur des sinusoïdes
const generateElevationProfile = (seed: number): string => {
  const random = (i: number) => {
    const val = Math.sin(seed * 7777 + i * 54321) * 10000;
    return val - Math.floor(val);
  };

  const numPoints = 40;
  const points: { x: number; y: number }[] = [];

  // Paramètres de sinusoïdes pour un terrain réaliste
  const numWaves = 2 + Math.floor(random(0) * 3);
  const waves = Array.from({ length: numWaves }, (_, i) => ({
    amplitude: 10 + random(i * 3 + 1) * 25,
    frequency: 0.5 + random(i * 3 + 2) * 3,
    phase: random(i * 3 + 3) * Math.PI * 2,
  }));

  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * 100;
    let y = 50; // base

    for (const wave of waves) {
      y += wave.amplitude * Math.sin(wave.frequency * (x / 100) * Math.PI * 2 + wave.phase);
    }

    points.push({ x, y });
  }

  // Normaliser y entre 15 et 85
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  const range = maxY - minY || 1;

  for (const p of points) {
    p.y = 85 - ((p.y - minY) / range) * 70; // Inversé car SVG y=0 est en haut
  }

  // Créer le path de la ligne
  let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) {
    linePath += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  }

  return linePath;
};

// Composant pour un profil d'altitude individuel
const ElevationTrace = ({ activity }: { activity: Activity }) => {
  const linePath = generateElevationProfile(activity.index);
  const colors = elevationColors[activity.type];

  // Créer le path rempli (area) en fermant vers le bas
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div className="aspect-square border border-steel/40 relative overflow-hidden bg-charcoal rounded">
      {/* Grille de fond */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #F2F2F2 1px, transparent 1px),
            linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
          `,
          backgroundSize: '10px 10px'
        }}
      />

      <svg viewBox="0 0 100 100" className="w-full h-full relative" preserveAspectRatio="none">
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`elev-grad-${activity.index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.fill} stopOpacity="0.4" />
            <stop offset="100%" stopColor={colors.fill} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path
          d={areaPath}
          fill={`url(#elev-grad-${activity.index})`}
        />

        {/* Line stroke */}
        <path
          d={linePath}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </svg>

      {/* Technical overlay corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t opacity-30" style={{ borderColor: colors.stroke }} />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t opacity-30" style={{ borderColor: colors.stroke }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b opacity-30" style={{ borderColor: colors.stroke }} />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-30" style={{ borderColor: colors.stroke }} />
    </div>
  );
};

export function ElevationGridPosters() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [activeFilters, setActiveFilters] = useState<ActivityType[]>(["run", "trail", "bike"]);
  const posterRef = useRef<HTMLDivElement>(null);

  // Génère 81 activités (même logique que ActivityGridPosters)
  const allActivities: Activity[] = Array.from({ length: 81 }, (_, i) => {
    const rand = Math.sin(i * 7.919 + parseInt(selectedYear)) * 10000;
    const normalized = rand - Math.floor(rand);

    let type: ActivityType;
    if (normalized < 0.5) {
      type = "run";
    } else if (normalized < 0.75) {
      type = "trail";
    } else {
      type = "bike";
    }

    return { index: i, type };
  });

  const filteredActivities = allActivities.filter(activity =>
    activeFilters.includes(activity.type)
  );

  const counts = allActivities.reduce((acc, activity) => {
    acc[activity.type] = (acc[activity.type] || 0) + 1;
    return acc;
  }, {} as Record<ActivityType, number>);

  const toggleFilter = (type: ActivityType) => {
    setActiveFilters(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const exportAsSVG = () => {
    if (!posterRef.current) return;

    const svgData = posterRef.current.innerHTML;
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hawksight-elevation-${selectedYear}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = async () => {
    if (!posterRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#0B0C10',
        scale: 3,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hawksight-elevation-${selectedYear}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error exporting PNG:', error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Year Selector */}
        <div className="flex items-center gap-3">
          <span className="text-muted font-body text-sm">Année</span>
          <div className="flex gap-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`
                  px-4 py-2 rounded border font-mono text-sm transition-all
                  ${selectedYear === year
                    ? 'bg-[#6DAA75]/10 border-[#6DAA75] text-[#6DAA75]'
                    : 'bg-charcoal border-steel/30 text-[#F2F2F2]/60 hover:border-steel'
                  }
                `}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportAsPNG}
            className="flex items-center gap-2 px-4 py-2 bg-[#6DAA75]/10 border border-[#6DAA75]/30 text-[#6DAA75] rounded hover:bg-[#6DAA75]/20 transition-all font-body text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportAsSVG}
            className="flex items-center gap-2 px-4 py-2 bg-[#3DB2E0]/10 border border-[#3DB2E0]/30 text-[#3DB2E0] rounded hover:bg-[#3DB2E0]/20 transition-all font-body text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            SVG
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <FilterIcon className="w-4 h-4 text-muted" />
        <span className="text-muted font-body text-sm">Filtrer par type</span>
        <div className="flex gap-2">
          {(Object.keys(elevationColors) as ActivityType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`
                px-3 py-1.5 rounded border text-xs font-body transition-all
                ${activeFilters.includes(type)
                  ? 'border-opacity-100 opacity-100'
                  : 'border-opacity-30 opacity-40'
                }
              `}
              style={{
                backgroundColor: activeFilters.includes(type)
                  ? `${elevationColors[type].stroke}10`
                  : 'transparent',
                borderColor: elevationColors[type].stroke,
                color: elevationColors[type].stroke,
              }}
            >
              {activityLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Poster Container */}
      <div
        ref={posterRef}
        className="bg-charcoal border border-steel/30 rounded-lg p-8 relative overflow-hidden max-w-3xl mx-auto"
      >
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#6DAA75]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#9477D9]/5 rounded-full blur-3xl" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-steel/30">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#6DAA75]/20 blur-lg" />
                <div className="relative p-2 bg-[#6DAA75]/10 border border-[#6DAA75]/30 rounded">
                  <ElevationIcon className="w-5 h-5 text-[#6DAA75]" />
                </div>
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-[#F2F2F2]">Dénivelés {selectedYear}</h3>
                <p className="text-muted font-body text-sm">
                  {filteredActivities.length} profils affichés
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-[#6DAA75]"
                    style={{ opacity: 1 - (i * 0.3) }}
                  />
                ))}
              </div>
              <span className="text-muted font-mono text-xs">
                HAWKSIGHT_ELEVATION
              </span>
            </div>
          </div>

          {/* Grid of elevation profiles */}
          <div className="grid grid-cols-9 gap-1">
            {allActivities.map((activity) => (
              activeFilters.includes(activity.type) ? (
                <ElevationTrace key={activity.index} activity={activity} />
              ) : (
                <div key={activity.index} className="aspect-square border border-steel/20 bg-charcoal/50" />
              )
            ))}
          </div>

          {/* Footer with stats and legend */}
          <div className="space-y-4 pt-4 border-t border-steel/30">
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-muted font-body text-sm">D+ total</div>
                  <div className="text-[#6DAA75] font-mono">23,450 m</div>
                </div>
                <div>
                  <div className="text-muted font-body text-sm">D- total</div>
                  <div className="text-[#9477D9] font-mono">22,890 m</div>
                </div>
                <div>
                  <div className="text-muted font-body text-sm">Alt. max</div>
                  <div className="text-[#3DB2E0] font-mono">2,847 m</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6DAA75] animate-pulse" />
                <span className="text-muted font-mono text-xs">
                  COMPLETE
                </span>
              </div>
            </div>

            {/* Mini Legend */}
            <div className="flex items-center gap-6 pt-2">
              <span className="text-muted font-body text-xs uppercase tracking-wide">
                Légende
              </span>
              <div className="flex items-center gap-4">
                {(Object.keys(elevationColors) as ActivityType[]).map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-3 h-0.5 rounded-full"
                      style={{ backgroundColor: elevationColors[type].stroke }}
                    />
                    <span className="text-[#F2F2F2]/60 font-body text-xs">
                      {activityLabels[type]}
                    </span>
                    <span className="text-muted font-mono text-xs">
                      ({counts[type] || 0})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
