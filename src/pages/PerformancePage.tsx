import { useState, useRef, useCallback, useMemo } from 'react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useActivities } from '@/hooks/useActivities';
import type { Activity, SportType } from '@/types';

// SVG Icons (inline to avoid lucide-react dependency)
const ChartBarIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

const TrendingUpIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const HeartIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ZapIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const FileIcon = ({ color, size = 48 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const MapPinIcon = ({ color, size = 20 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const DatabaseIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Sport type colors and labels
const SPORT_COLORS: Record<SportType, string> = {
  Run: '#E8832A',
  Trail: '#C96A1A',
  Bike: '#3DB2E0',
  Swim: '#6DAA75',
  Hike: '#6DAA75',
  WeightTraining: '#3A3F47',
};

const SPORT_LABELS: Record<SportType, string> = {
  Run: 'Course',
  Trail: 'Trail',
  Bike: 'Vélo',
  Swim: 'Natation',
  Hike: 'Randonnée',
  WeightTraining: 'Muscu',
};

// Helper: Format date for display
const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper: Get ISO date (YYYY-MM-DD) from date string
const getISODate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// Helper functions
const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  }
  return `${mins}min`;
};

const generateHRZones = (activity: Activity) => {
  const zones = [
    { name: 'Z1', label: 'Récupération', range: '50-60%', min: 98, max: 117, color: '#3DB2E0' },
    { name: 'Z2', label: 'Endurance', range: '60-70%', min: 117, max: 137, color: '#4CAF50' },
    { name: 'Z3', label: 'Tempo', range: '70-80%', min: 137, max: 156, color: '#FFC107' },
    { name: 'Z4', label: 'Seuil', range: '80-90%', min: 156, max: 176, color: '#FF9800' },
    { name: 'Z5', label: 'VO2max', range: '90-100%', min: 176, max: 195, color: '#E8832A' },
  ];

  const avgHR = activity.average_heartrate || 150;
  const seed = activity.id * 999;
  const random = (i: number) => {
    const val = Math.sin(seed + i * 54321) * 10000;
    return val - Math.floor(val);
  };

  let percentages = zones.map((zone, i) => {
    const isMainZone = avgHR >= zone.min && avgHR <= zone.max;
    if (isMainZone) {
      return 35 + random(i) * 15;
    } else {
      const distance = Math.abs(avgHR - (zone.min + zone.max) / 2);
      const proximity = Math.max(0, 50 - distance);
      return proximity * 0.3 * random(i + 10);
    }
  });

  const total = percentages.reduce((sum, p) => sum + p, 0);
  percentages = percentages.map((p) => (p / total) * 100);

  return zones.map((zone, i) => ({
    ...zone,
    percentage: percentages[i],
    time: (activity.moving_time * percentages[i]) / 100,
  }));
};

const generatePaceProfile = (activity: Activity) => {
  const numPoints = 50;
  const seed = activity.id * 777;

  const random = (i: number) => {
    const val = Math.sin(seed + i * 98765) * 10000;
    return val - Math.floor(val);
  };

  // Parse pace from speed_minutes_per_km_hms or calculate from average_speed
  let avgPaceSeconds = 300; // Default 5:00/km
  if (activity.speed_minutes_per_km_hms) {
    const parts = activity.speed_minutes_per_km_hms.split(':').map(Number);
    avgPaceSeconds = parts[0] * 60 + (parts[1] || 0);
  } else if (activity.average_speed && activity.average_speed > 0) {
    avgPaceSeconds = 3600 / activity.average_speed; // Convert km/h to s/km
  }

  const distanceKm = activity.distance_km || activity.distance / 1000;

  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const progress = i / (numPoints - 1);
    const distance = distanceKm * progress;

    const variation = (random(i) - 0.5) * 60;
    const fatigue = progress * 15;
    const paceSeconds = avgPaceSeconds + variation + fatigue;

    points.push({
      distance: parseFloat(distance.toFixed(2)),
      paceSeconds,
      paceDisplay: `${Math.floor(paceSeconds / 60)}:${Math.floor(paceSeconds % 60)
        .toString()
        .padStart(2, '0')}`,
    });
  }

  return points;
};

const generatePerformanceMetrics = (activity: Activity) => {
  const seed = activity.id * 555;
  const random = (i: number) => {
    const val = Math.sin(seed + i * 33333) * 10000;
    return val - Math.floor(val);
  };

  const distanceKm = activity.distance_km || activity.distance / 1000;
  const avgHR = activity.average_heartrate || 150;
  const avgCadence = activity.average_cadence || 170;

  const metrics = [
    {
      label: 'Cadence',
      value: Math.min(100, (avgCadence / 190) * 100),
      color: SPORT_COLORS[activity.sport_type] || '#E8832A',
    },
    {
      label: 'Cardio',
      value: Math.min(100, (avgHR / 195) * 100),
      color: '#E8832A',
    },
    {
      label: 'Allure',
      value: 60 + random(1) * 30,
      color: '#3DB2E0',
    },
    {
      label: 'Endurance',
      value: Math.min(100, (distanceKm / 50) * 100),
      color: '#4CAF50',
    },
    {
      label: 'Intensité',
      value: (avgHR / 195) * 100,
      color: '#FFC107',
    },
  ];

  return metrics;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Play icon for launch button
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export function PerformancePage() {
  // Fetch real activities from API
  const { activities, isLoading, error } = useActivities();

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const chart1Ref = useRef<HTMLDivElement>(null);
  const chart2Ref = useRef<HTMLDivElement>(null);
  const chart3Ref = useRef<HTMLDivElement>(null);

  // Filter activities by selected date
  const filteredActivities = useMemo(() => {
    if (!selectedDate) return activities;
    return activities.filter((activity) => getISODate(activity.start_date) === selectedDate);
  }, [activities, selectedDate]);

  // Get min/max dates for date picker
  const dateRange = useMemo(() => {
    if (activities.length === 0) return { min: '', max: '' };
    const dates = activities.map(a => new Date(a.start_date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0],
    };
  }, [activities]);

  const color = selectedActivity ? SPORT_COLORS[selectedActivity.sport_type] : '#E8832A';
  const hrZones = selectedActivity ? generateHRZones(selectedActivity) : [];
  const paceProfile = selectedActivity ? generatePaceProfile(selectedActivity) : [];
  const performanceMetrics = selectedActivity ? generatePerformanceMetrics(selectedActivity) : [];

  // Check if ready to launch analysis
  const canLaunchAnalysis = selectedActivity !== null || uploadedFile !== null;

  // Handle launching analysis
  const handleLaunchAnalysis = () => {
    setAnalysisStarted(true);
    // Scroll to analysis section after a short delay
    setTimeout(() => {
      analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Reset analysis when changing selection
  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setUploadedFile(null);
    setAnalysisStarted(false);
  };

  const handleReset = () => {
    setSelectedActivity(null);
    setUploadedFile(null);
    setAnalysisStarted(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'gpx' || ext === 'fit') {
        setUploadedFile(file);
        setSelectedActivity(null);
        setAnalysisStarted(false);
      }
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      setSelectedActivity(null);
      setAnalysisStarted(false);
    }
  }, []);

  const exportChart = async (ref: React.RefObject<HTMLDivElement | null>, name: string) => {
    if (!ref.current || !selectedActivity) return;

    try {
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
    } catch (error) {
      console.error('Error exporting chart:', error);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <SectionTitle
        title="Analyse de Performance"
        subtitle="Analyse approfondie de vos activités sportives"
        icon={<ChartBarIcon color="#E8832A" />}
      />

      {/* Selection Interface - Always visible */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Import File */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UploadIcon className="w-5 h-5 text-[#F2F2F2]" />
            <h2 className="font-heading text-lg text-[#F2F2F2]">Importer un fichier</h2>
          </div>

          {/* Drop Zone or Selected File */}
          {uploadedFile ? (
            <div className="relative bg-[#0B0C10] border-2 border-[#4CAF50]/50 rounded-lg p-8">
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#4CAF50]/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#4CAF50]/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#4CAF50]/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#4CAF50]/30" />

              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-[#4CAF50]/10 border border-[#4CAF50]/30 rounded-lg">
                  <CheckIcon className="text-[#4CAF50]" />
                </div>
                <div className="text-center">
                  <p className="text-[#F2F2F2] font-['Inter'] font-medium">
                    Fichier sélectionné
                  </p>
                  <p className="text-[#4CAF50] font-['JetBrains_Mono'] text-sm mt-1">
                    {uploadedFile.name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setUploadedFile(null);
                    setAnalysisStarted(false);
                  }}
                  className="text-[#3A3F47] hover:text-[#E8832A] font-['Inter'] text-sm transition-colors"
                >
                  Changer de fichier
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative bg-[#0B0C10] border-2 border-dashed rounded-lg p-12
                cursor-pointer transition-all duration-300
                ${isDragging
                  ? 'border-[#E8832A] bg-[#E8832A]/5'
                  : 'border-[#3A3F47]/50 hover:border-[#3A3F47] hover:bg-[#3A3F47]/5'
                }
              `}
            >
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-[#3A3F47]/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-[#3A3F47]/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-[#3A3F47]/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-[#3A3F47]/30" />

              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-[#E8832A]/10 border border-[#E8832A]/30 rounded-lg">
                  <FileIcon color="#E8832A" />
                </div>
                <div className="text-center">
                  <p className="text-[#F2F2F2] font-['Inter']">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="text-[#3A3F47] font-['Inter'] text-sm mt-1">
                    ou cliquez pour sélectionner
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-[#E8832A]/10 border border-[#E8832A]/30 text-[#E8832A] rounded font-['JetBrains_Mono'] text-xs">
                    .GPX
                  </span>
                  <span className="px-3 py-1.5 bg-[#3DB2E0]/10 border border-[#3DB2E0]/30 text-[#3DB2E0] rounded font-['JetBrains_Mono'] text-xs">
                    .FIT
                  </span>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".gpx,.fit"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}

          {/* Info Box */}
          <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ZapIcon color="#E8832A" size={20} />
              <div>
                <p className="text-[#E8832A] font-['Inter'] text-sm font-medium">
                  Formats supportés
                </p>
                <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                  Les fichiers GPX et FIT contiennent les données GPS, cardio, cadence et élévation
                  nécessaires pour une analyse complète.
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Right Column: Select Activity */}
          <div className="space-y-4">
            {/* Header with date picker inline */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <TrendingUpIcon color="#F2F2F2" size={20} />
                <h2 className="font-heading text-lg text-[#F2F2F2]">Sélectionner une activité</h2>
              </div>
              {/* Compact Date Picker */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={dateRange.min}
                  max={dateRange.max}
                  className="bg-[#3A3F47]/20 border border-[#3A3F47]/50 rounded px-2 py-1
                    text-[#F2F2F2] font-['JetBrains_Mono'] text-xs
                    focus:outline-none focus:border-[#E8832A]/50
                    [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert
                    cursor-pointer w-[130px]"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="p-1 bg-[#3A3F47]/20 hover:bg-[#E8832A]/20 border border-[#3A3F47]/50
                      hover:border-[#E8832A]/30 rounded transition-all duration-200"
                    title="Effacer le filtre"
                  >
                    <XIcon className="text-[#3A3F47] hover:text-[#E8832A]" />
                  </button>
                )}
              </div>
            </div>

            {/* Activity count info */}
            {selectedDate && (
              <div className="text-[#E8832A] font-['Inter'] text-xs">
                {filteredActivities.length === 0
                  ? 'Aucune activité à cette date'
                  : `${filteredActivities.length} activité${filteredActivities.length > 1 ? 's' : ''}`
                }
              </div>
            )}

            {/* Activities List */}
            <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg overflow-hidden flex flex-col" style={{ height: uploadedFile ? '280px' : '340px' }}>
              {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-[#E8832A]/30 border-t-[#E8832A] rounded-full animate-spin mx-auto" />
                    <p className="text-[#3A3F47] font-['Inter'] text-sm mt-3">Chargement...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-red-400 font-['Inter'] text-sm">{error}</p>
                </div>
              ) : filteredActivities.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <CalendarIcon className="w-10 h-10 mx-auto text-[#3A3F47]/50 mb-2" />
                    <p className="text-[#3A3F47] font-['Inter'] text-sm">
                      {selectedDate ? 'Aucune activité à cette date' : 'Aucune activité'}
                    </p>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate('')}
                        className="mt-2 text-[#E8832A] font-['Inter'] text-xs hover:underline"
                      >
                        Voir toutes les activités
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-[#3A3F47]/50 scrollbar-track-transparent">
                  {filteredActivities.map((activity) => {
                    const isSelected = selectedActivity?.id === activity.id;
                    const sportColor = SPORT_COLORS[activity.sport_type] || '#E8832A';
                    const distanceKm = activity.distance_km || activity.distance / 1000;
                    return (
                      <button
                        key={activity.id}
                        onClick={() => handleActivitySelect(activity)}
                        className={`w-full bg-[#0B0C10] border rounded-lg p-3
                          transition-all duration-200 flex items-center justify-between group
                          ${isSelected
                            ? 'border-[#4CAF50]/50 bg-[#4CAF50]/5'
                            : 'border-[#3A3F47]/30 hover:border-[#3A3F47] hover:bg-[#3A3F47]/5'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="p-1.5 rounded"
                            style={{
                              backgroundColor: `${sportColor}15`,
                              border: `1px solid ${sportColor}30`
                            }}
                          >
                            {isSelected ? (
                              <CheckIcon className="text-[#4CAF50]" />
                            ) : (
                              <MapPinIcon color={sportColor} size={16} />
                            )}
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-[#F2F2F2] font-['Inter'] text-sm font-medium line-clamp-1">
                                {activity.name}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] shrink-0"
                                style={{
                                  backgroundColor: `${sportColor}20`,
                                  color: sportColor
                                }}
                              >
                                {SPORT_LABELS[activity.sport_type]}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                              <span>{formatDateDisplay(activity.start_date)}</span>
                              <span className="text-[#3A3F47]/50">•</span>
                              <span>{distanceKm.toFixed(1)} km</span>
                              <span className="text-[#3A3F47]/50">•</span>
                              <span>{activity.moving_time_hms || formatDuration(activity.moving_time)}</span>
                            </div>
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckIcon className="w-4 h-4 text-[#4CAF50] shrink-0" />
                        ) : (
                          <ChevronRightIcon className="w-4 h-4 text-[#3A3F47] group-hover:text-[#F2F2F2] transition-colors shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <DatabaseIcon color="#E8832A" size={16} />
                <div>
                  <p className="text-[#E8832A] font-['Inter'] text-xs font-medium">
                    {activities.length} activité{activities.length > 1 ? 's' : ''} enregistrée{activities.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-[#3A3F47] font-['Inter'] text-[10px] mt-0.5">
                    Sélectionnez une activité pour lancer l'analyse.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Launch Analysis Button */}
      <div className="flex flex-col items-center gap-4 py-6 border-t border-b border-[#3A3F47]/30">
        {canLaunchAnalysis ? (
          <>
            <div className="flex items-center gap-3 text-sm">
              <CheckIcon className="text-[#4CAF50]" />
              <span className="text-[#F2F2F2] font-['Inter']">
                {selectedActivity
                  ? `Activité sélectionnée : ${selectedActivity.name}`
                  : `Fichier sélectionné : ${uploadedFile?.name}`
                }
              </span>
              <button
                onClick={handleReset}
                className="text-[#3A3F47] hover:text-[#E8832A] font-['Inter'] transition-colors"
              >
                (modifier)
              </button>
            </div>
            {!analysisStarted ? (
              <button
                onClick={handleLaunchAnalysis}
                className="flex items-center gap-3 px-8 py-3 bg-[#E8832A] hover:bg-[#E8832A]/90
                  text-[#0B0C10] font-['Inter'] font-medium rounded-lg
                  transition-all duration-300 hover:-translate-y-0.5
                  hover:shadow-[0_4px_20px_rgba(232,131,42,0.4)]"
              >
                <PlayIcon className="w-5 h-5" />
                Lancer l'analyse
              </button>
            ) : (
              <div className="flex items-center gap-2 text-[#4CAF50] font-['Inter'] text-sm">
                <CheckIcon className="w-4 h-4" />
                Analyse en cours d'affichage
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-[#3A3F47] font-['Inter'] text-sm">
              Sélectionnez une activité ou importez un fichier pour lancer l'analyse
            </p>
          </div>
        )}
      </div>

      {/* Analysis View - Only show when analysis is started */}
      {analysisStarted && selectedActivity && (
        <div ref={analysisRef} className="space-y-6 pt-4">
          {/* Activity info header */}
          <div className="flex items-center justify-between bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: `${color}15`,
                  border: `1px solid ${color}30`
                }}
              >
                <TrendingUpIcon color={color} size={20} />
              </div>
              <div>
                <h3 className="text-[#F2F2F2] font-heading">{selectedActivity.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-['JetBrains_Mono']"
                    style={{
                      backgroundColor: `${color}20`,
                      color: color
                    }}
                  >
                    {SPORT_LABELS[selectedActivity.sport_type]}
                  </span>
                  <span className="text-[#3A3F47] font-['Inter'] text-sm">
                    {formatDateDisplay(selectedActivity.start_date)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
              <span>{(selectedActivity.distance_km || selectedActivity.distance / 1000).toFixed(1)} km</span>
              <span className="text-[#3A3F47]/50">•</span>
              <span>{selectedActivity.moving_time_hms || formatDuration(selectedActivity.moving_time)}</span>
              <span className="text-[#3A3F47]/50">•</span>
              <span>{Math.round(selectedActivity.total_elevation_gain || 0)}m D+</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Heart Rate Zones */}
            <div
              ref={chart1Ref}
              className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8832A]/5 rounded-full blur-3xl" />

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 border rounded"
                      style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                      }}
                    >
                      <HeartIcon color={color} />
                    </div>
                    <div>
                      <h3 className="font-heading text-[#F2F2F2]">Zones de Fréquence Cardiaque</h3>
                      <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                        Distribution du temps par zone
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => exportChart(chart1Ref, 'hr-zones')}
                    className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all"
                  >
                    <DownloadIcon className="text-[#3A3F47]" />
                  </button>
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
                          <span className="font-['Inter'] text-xs text-[#3A3F47]">{zone.label}</span>
                          <span className="font-['JetBrains_Mono'] text-[10px] text-[#3A3F47]/60">
                            {zone.range}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-['JetBrains_Mono'] text-xs text-[#3A3F47]">
                            {formatTime(zone.time)}
                          </span>
                          <span
                            className="font-['JetBrains_Mono'] text-sm"
                            style={{ color: zone.color }}
                          >
                            {zone.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="relative h-8 bg-[#0B0C10] border border-[#3A3F47]/20 rounded overflow-hidden">
                        <div
                          className="absolute inset-0 opacity-[0.03]"
                          style={{
                            backgroundImage: `linear-gradient(to right, #F2F2F2 1px, transparent 1px)`,
                            backgroundSize: '20px 100%',
                          }}
                        />

                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-500"
                          style={{
                            width: `${zone.percentage}%`,
                            backgroundColor: `${zone.color}20`,
                            borderRight: `2px solid ${zone.color}`,
                          }}
                        >
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              background: `linear-gradient(90deg, transparent, ${zone.color}40)`,
                            }}
                          />
                        </div>

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
                    <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">HR_ANALYSIS</span>
                  </div>
                  <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                    AVG: {selectedActivity.average_heartrate || '--'} BPM
                  </span>
                </div>
              </div>
            </div>

            {/* Chart 2: Pace Profile */}
            <div
              ref={chart2Ref}
              className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden"
            >
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3DB2E0]/5 rounded-full blur-3xl" />

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 border rounded"
                      style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                      }}
                    >
                      <TrendingUpIcon color={color} size={16} />
                    </div>
                    <div>
                      <h3 className="font-heading text-[#F2F2F2]">Profil d'Allure</h3>
                      <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                        Évolution de la vitesse sur le parcours
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => exportChart(chart2Ref, 'pace-profile')}
                    className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all"
                  >
                    <DownloadIcon className="text-[#3A3F47]" />
                  </button>
                </div>

                {/* Pace Chart */}
                <div className="relative aspect-[2/1] border border-[#3A3F47]/20 rounded overflow-hidden bg-[#0B0C10]">
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, #F2F2F2 1px, transparent 1px),
                        linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
                      `,
                      backgroundSize: '40px 20px',
                    }}
                  />

                  <div className="absolute left-2 top-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                    Rapide
                  </div>
                  <div className="absolute left-2 bottom-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                    Lent
                  </div>

                  <div className="absolute bottom-2 left-12 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                    0 km
                  </div>
                  <div className="absolute bottom-2 right-2 text-[#3A3F47] font-['JetBrains_Mono'] text-[10px]">
                    {(selectedActivity.distance_km || selectedActivity.distance / 1000).toFixed(1)} km
                  </div>

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

                    {(() => {
                      const paces = paceProfile.map((p) => p.paceSeconds);
                      const minPace = Math.min(...paces);
                      const maxPace = Math.max(...paces);
                      const range = maxPace - minPace;

                      const pathData = paceProfile
                        .map((point, i) => {
                          const x = 20 + (i / (paceProfile.length - 1)) * 370;
                          const normalizedPace = (point.paceSeconds - minPace) / range;
                          const y = 180 - normalizedPace * 160 + 10;
                          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                        })
                        .join(' ');

                      const areaData = pathData + ` L 390 190 L 20 190 Z`;

                      return (
                        <>
                          <path d={areaData} fill="url(#paceGradient)" />
                          <path
                            d={pathData}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            filter="url(#glow)"
                          />
                          {paceProfile
                            .filter((_, i) => i % 10 === 0)
                            .map((point, idx) => {
                              const i = idx * 10;
                              const x = 20 + (i / (paceProfile.length - 1)) * 370;
                              const normalizedPace = (point.paceSeconds - minPace) / range;
                              const y = 180 - normalizedPace * 160 + 10;

                              return (
                                <g key={i}>
                                  <circle cx={x} cy={y} r="3" fill={color} opacity="0.6" />
                                  <circle cx={x} cy={y} r="1.5" fill="#F2F2F2" />
                                </g>
                              );
                            })}
                        </>
                      );
                    })()}
                  </svg>

                  <div
                    className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 opacity-20"
                    style={{ borderColor: color }}
                  />
                  <div
                    className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 opacity-20"
                    style={{ borderColor: color }}
                  />
                  <div
                    className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 opacity-20"
                    style={{ borderColor: color }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 opacity-20"
                    style={{ borderColor: color }}
                  />
                </div>

                {/* Footer stats */}
                <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">PACE_ANALYSIS</span>
                  </div>
                  <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                    AVG: {selectedActivity.speed_minutes_per_km_hms || '--'} /km
                  </span>
                </div>
              </div>
            </div>

            {/* Chart 3: Performance Radar */}
            <div
              ref={chart3Ref}
              className="bg-[#0B0C10] border border-[#3A3F47]/30 rounded-lg p-6 relative overflow-hidden lg:col-span-2"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#E8832A]/5 rounded-full blur-3xl" />

              <div className="relative space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#3A3F47]/30">
                  <div className="flex items-start gap-3">
                    <div
                      className="p-2 border rounded"
                      style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                      }}
                    >
                      <ZapIcon color={color} />
                    </div>
                    <div>
                      <h3 className="font-heading text-[#F2F2F2]">
                        Analyse de Performance Multi-Dimensionnelle
                      </h3>
                      <p className="text-[#3A3F47] font-['Inter'] text-xs mt-1">
                        Visualisation radar des métriques clés normalisées
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => exportChart(chart3Ref, 'performance-radar')}
                    className="p-1.5 hover:bg-[#3A3F47]/20 rounded transition-all"
                  >
                    <DownloadIcon className="text-[#3A3F47]" />
                  </button>
                </div>

                {/* Radar Chart + Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Radar Chart */}
                  <div className="relative aspect-square border border-[#3A3F47]/20 rounded overflow-hidden bg-[#0B0C10]">
                    <div
                      className="absolute inset-0 opacity-[0.02]"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #F2F2F2 1px, transparent 1px),
                          linear-gradient(to bottom, #F2F2F2 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px',
                      }}
                    />

                    <svg viewBox="0 0 300 300" className="w-full h-full">
                      <defs>
                        <filter id="radarGlow">
                          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <circle cx="150" cy="150" r="2" fill="#3A3F47" opacity="0.5" />

                      {[20, 40, 60, 80, 100].map((radius) => (
                        <circle
                          key={radius}
                          cx="150"
                          cy="150"
                          r={radius}
                          fill="none"
                          stroke="#3A3F47"
                          strokeWidth="0.5"
                          opacity="0.3"
                        />
                      ))}

                      {performanceMetrics.map((_, i) => {
                        const angle = (i * 2 * Math.PI) / performanceMetrics.length - Math.PI / 2;
                        const x = 150 + Math.cos(angle) * 100;
                        const y = 150 + Math.sin(angle) * 100;

                        return (
                          <line
                            key={i}
                            x1="150"
                            y1="150"
                            x2={x}
                            y2={y}
                            stroke="#3A3F47"
                            strokeWidth="0.5"
                            opacity="0.3"
                          />
                        );
                      })}

                      <polygon
                        points={performanceMetrics
                          .map((metric, i) => {
                            const angle = (i * 2 * Math.PI) / performanceMetrics.length - Math.PI / 2;
                            const radius = metric.value;
                            const x = 150 + Math.cos(angle) * radius;
                            const y = 150 + Math.sin(angle) * radius;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                        fill={color}
                        fillOpacity="0.2"
                        stroke={color}
                        strokeWidth="2"
                        filter="url(#radarGlow)"
                      />

                      {performanceMetrics.map((metric, i) => {
                        const angle = (i * 2 * Math.PI) / performanceMetrics.length - Math.PI / 2;
                        const radius = metric.value;
                        const x = 150 + Math.cos(angle) * radius;
                        const y = 150 + Math.sin(angle) * radius;

                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="4" fill={metric.color} opacity="0.8" />
                            <circle cx={x} cy={y} r="2" fill="#F2F2F2" />
                          </g>
                        );
                      })}

                      {performanceMetrics.map((metric, i) => {
                        const angle = (i * 2 * Math.PI) / performanceMetrics.length - Math.PI / 2;
                        const labelRadius = 120;
                        const x = 150 + Math.cos(angle) * labelRadius;
                        const y = 150 + Math.sin(angle) * labelRadius;

                        return (
                          <text
                            key={i}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="font-['Inter'] text-[10px]"
                            fill="#F2F2F2"
                          >
                            {metric.label}
                          </text>
                        );
                      })}
                    </svg>

                    <div
                      className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 opacity-20"
                      style={{ borderColor: color }}
                    />
                    <div
                      className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 opacity-20"
                      style={{ borderColor: color }}
                    />
                    <div
                      className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 opacity-20"
                      style={{ borderColor: color }}
                    />
                    <div
                      className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 opacity-20"
                      style={{ borderColor: color }}
                    />
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="space-y-4">
                    {performanceMetrics.map((metric, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: metric.color }}
                            />
                            <span className="font-['Inter'] text-sm text-[#F2F2F2]">{metric.label}</span>
                          </div>
                          <span
                            className="font-['JetBrains_Mono'] text-sm"
                            style={{ color: metric.color }}
                          >
                            {metric.value.toFixed(1)}%
                          </span>
                        </div>

                        <div className="relative h-2 bg-[#0B0C10] border border-[#3A3F47]/20 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                            style={{
                              width: `${metric.value}%`,
                              backgroundColor: metric.color,
                              boxShadow: `0 0 10px ${metric.color}40`,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Performance Score */}
                    <div className="mt-6 p-4 border border-[#3A3F47]/30 rounded-lg bg-[#0B0C10]">
                      <div className="flex items-center justify-between">
                        <span className="font-['Inter'] text-sm text-[#3A3F47]">
                          Score de Performance Global
                        </span>
                        <div className="text-right">
                          <div className="font-['JetBrains_Mono'] text-2xl" style={{ color }}>
                            {(
                              performanceMetrics.reduce((sum, m) => sum + m.value, 0) /
                              performanceMetrics.length
                            ).toFixed(1)}
                          </div>
                          <div className="font-['Inter'] text-xs text-[#3A3F47]">/ 100</div>
                        </div>
                      </div>
                    </div>

                    {/* Activity Info */}
                    <div className="mt-4 pt-4 border-t border-[#3A3F47]/30 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[#3A3F47] font-['Inter']">Distance</div>
                        <div className="font-['JetBrains_Mono'] text-[#F2F2F2]">
                          {(selectedActivity.distance_km || selectedActivity.distance / 1000).toFixed(1)} km
                        </div>
                      </div>
                      <div>
                        <div className="text-[#3A3F47] font-['Inter']">Durée</div>
                        <div className="font-['JetBrains_Mono'] text-[#F2F2F2]">
                          {selectedActivity.moving_time_hms || formatDuration(selectedActivity.moving_time)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#3A3F47] font-['Inter']">Cadence moy.</div>
                        <div className="font-['JetBrains_Mono'] text-[#F2F2F2]">
                          {selectedActivity.average_cadence || '--'} spm
                        </div>
                      </div>
                      <div>
                        <div className="text-[#3A3F47] font-['Inter']">FC moy.</div>
                        <div className="font-['JetBrains_Mono'] text-[#F2F2F2]">
                          {selectedActivity.average_heartrate || '--'} bpm
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-[#3A3F47]/30">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full animate-pulse"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                      MULTI_METRIC_ANALYSIS
                    </span>
                  </div>
                  <span className="text-[#3A3F47] font-['JetBrains_Mono'] text-xs">
                    {formatDateDisplay(selectedActivity.start_date).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
