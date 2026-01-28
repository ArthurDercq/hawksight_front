import { useState, useRef } from "react";

// SVG Icons (inline to avoid lucide-react dependency)
const MapIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
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

// Types d'activités avec leurs couleurs
type ActivityType = "run" | "trail" | "bike";

interface Activity {
  index: number;
  type: ActivityType;
}

const activityColors = {
  run: "#E8832A",      // Orange
  trail: "#C96A1A",    // Orange foncé
  bike: "#3DB2E0",     // Bleu glacier
};

const activityLabels = {
  run: "Run",
  trail: "Trail",
  bike: "Vélo",
};

// Années disponibles
const availableYears = ["2024", "2023", "2022", "2021"];

// Génère une trace GPS aléatoire pour simuler un parcours
const generateActivityPath = (seed: number) => {
  const points: { x: number; y: number }[] = [];
  let x = 50;
  let y = 50;

  // Utilise le seed pour générer des parcours différents mais déterministes
  const random = (i: number) => {
    const val = Math.sin(seed * 9999 + i * 12345) * 10000;
    return val - Math.floor(val);
  };

  points.push({ x, y });

  // Génère entre 15 et 30 points pour chaque trace
  const numPoints = 15 + Math.floor(random(0) * 15);

  for (let i = 0; i < numPoints; i++) {
    const angle = random(i * 2) * Math.PI * 2;
    const distance = 5 + random(i * 2 + 1) * 15;

    x += Math.cos(angle) * distance;
    y += Math.sin(angle) * distance;

    // Garde les points dans les limites
    x = Math.max(10, Math.min(90, x));
    y = Math.max(10, Math.min(90, y));

    points.push({ x, y });
  }

  // Convertit les points en path SVG
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    path += ` L ${points[i].x} ${points[i].y}`;
  }

  return path;
};

// Composant pour une trace individuelle
const ActivityTrace = ({ activity }: { activity: Activity }) => {
  const path = generateActivityPath(activity.index);
  const color = activityColors[activity.type];

  return (
    <div className="aspect-square border border-[#3A3F47]/40 relative overflow-hidden bg-[#0B0C10] rounded">
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

      <svg viewBox="0 0 100 100" className="w-full h-full relative">
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        {/* Point de départ */}
        <circle cx="50" cy="50" r="2" fill={color} opacity="0.4" />
      </svg>

      {/* Technical overlay corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-l border-t opacity-30" style={{ borderColor: color }} />
      <div className="absolute top-0 right-0 w-2 h-2 border-r border-t opacity-30" style={{ borderColor: color }} />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b opacity-30" style={{ borderColor: color }} />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b opacity-30" style={{ borderColor: color }} />
    </div>
  );
};

export function ActivityGridPosters() {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [activeFilters, setActiveFilters] = useState<ActivityType[]>(["run", "trail", "bike"]);
  const posterRef = useRef<HTMLDivElement>(null);

  // Génère 81 activités avec des types aléatoires mais déterministes
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

  // Filtre les activités selon les filtres actifs
  const filteredActivities = allActivities.filter(activity =>
    activeFilters.includes(activity.type)
  );

  // Compte les activités par type (sur toutes les activités)
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
    link.download = `hawksight-${selectedYear}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = async () => {
    if (!posterRef.current) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(posterRef.current, {
        backgroundColor: '#0B0C10',
        scale: 3, // Haute résolution
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hawksight-${selectedYear}.png`;
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
          <span className="text-[#3A3F47] font-['Inter'] text-sm">Année</span>
          <div className="flex gap-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`
                  px-4 py-2 rounded border font-['JetBrains_Mono'] text-sm transition-all
                  ${selectedYear === year
                    ? 'bg-[#E8832A]/10 border-[#E8832A] text-[#E8832A]'
                    : 'bg-[#0B0C10] border-[#3A3F47]/30 text-[#F2F2F2]/60 hover:border-[#3A3F47]'
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
            className="flex items-center gap-2 px-4 py-2 bg-[#E8832A]/10 border border-[#E8832A]/30 text-[#E8832A] rounded hover:bg-[#E8832A]/20 transition-all font-['Inter'] text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            PNG
          </button>
          <button
            onClick={exportAsSVG}
            className="flex items-center gap-2 px-4 py-2 bg-[#3DB2E0]/10 border border-[#3DB2E0]/30 text-[#3DB2E0] rounded hover:bg-[#3DB2E0]/20 transition-all font-['Inter'] text-sm"
          >
            <DownloadIcon className="w-4 h-4" />
            SVG
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <FilterIcon className="w-4 h-4 text-[#3A3F47]" />
        <span className="text-[#3A3F47] font-['Inter'] text-sm">Filtrer par type</span>
        <div className="flex gap-2">
          {(Object.keys(activityColors) as ActivityType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={`
                px-3 py-1.5 rounded border text-xs font-['Inter'] transition-all
                ${activeFilters.includes(type)
                  ? 'border-opacity-100 opacity-100'
                  : 'border-opacity-30 opacity-40'
                }
              `}
              style={{
                backgroundColor: activeFilters.includes(type)
                  ? `${activityColors[type]}10`
                  : 'transparent',
                borderColor: activityColors[type],
                color: activityColors[type],
              }}
            >
              {activityLabels[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Poster Container - Format Portrait */}
      <div
        ref={posterRef}
        className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-8 relative overflow-hidden max-w-3xl mx-auto"
      >
        {/* Background effects */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#E8832A]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#E8832A]/20 blur-lg" />
                <div className="relative p-2 bg-[#E8832A]/10 border border-[#E8832A]/30 rounded">
                  <MapIcon className="w-5 h-5 text-[#E8832A]" />
                </div>
              </div>
              <div>
                <h3 className="font-['Space_Grotesk'] text-[#F2F2F2]">Année {selectedYear}</h3>
                <p className="text-[#3A3F47] font-['Inter'] text-sm">
                  {filteredActivities.length} activités affichées
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-[#E8832A]"
                    style={{ opacity: 1 - (i * 0.3) }}
                  />
                ))}
              </div>
              <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                HAWKSIGHT_GRID
              </span>
            </div>
          </div>

          {/* Grid of activities */}
          <div className="grid grid-cols-9 gap-1">
            {allActivities.map((activity) => (
              activeFilters.includes(activity.type) ? (
                <ActivityTrace key={activity.index} activity={activity} />
              ) : (
                <div key={activity.index} className="aspect-square border border-[#3A3F47]/20 bg-[#0B0C10]/50" />
              )
            ))}
          </div>

          {/* Footer with stats and legend */}
          <div className="space-y-4 pt-4 border-t border-[#3A3F47]/30">
            {/* Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-[#3A3F47] font-['Inter'] text-sm">Distance totale</div>
                  <div className="text-[#E8832A] font-['JetBrains_Mono']">1,847 km</div>
                </div>
                <div>
                  <div className="text-[#3A3F47] font-['Inter'] text-sm">Temps total</div>
                  <div className="text-[#3DB2E0] font-['JetBrains_Mono']">156h 24min</div>
                </div>
                <div>
                  <div className="text-[#3A3F47] font-['Inter'] text-sm">Dénivelé</div>
                  <div className="text-[#E8832A] font-['JetBrains_Mono']">23,450 m</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#E8832A] animate-pulse" />
                <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                  COMPLETE
                </span>
              </div>
            </div>

            {/* Mini Legend */}
            <div className="flex items-center gap-6 pt-2">
              <span className="text-[#3A3F47] font-['Inter'] text-xs uppercase tracking-wide">
                Légende
              </span>
              <div className="flex items-center gap-4">
                {(Object.keys(activityColors) as ActivityType[]).map((type) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-3 h-0.5 rounded-full"
                      style={{ backgroundColor: activityColors[type] }}
                    />
                    <span className="text-[#F2F2F2]/60 font-['Inter'] text-xs">
                      {activityLabels[type]}
                    </span>
                    <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
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
