import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useActivities } from '@/hooks/useActivities';
import { TrailAnalysisDashboard } from '@/components/analysis';
import { analysisApi } from '@/services/api/analysis';
import type { Activity } from '@/types';
import { sportColor, sportLabel } from '@/services/utils/constants';
import type { TrailAnalysisResult, AnalysisStatus } from '@/types/analysis';

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

const formatDateDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
};

const getISODate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins.toString().padStart(2, '0')}min`;
  return `${mins}min`;
};

export function PerformancePage() {
  const { activities, isLoading, error } = useActivities();

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('idle');
  const [analysisResult, setAnalysisResult] = useState<TrailAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const filteredActivities = useMemo(() => {
    if (!selectedDate) return activities;
    return activities.filter((activity) => getISODate(activity.start_date) === selectedDate);
  }, [activities, selectedDate]);

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

  const color = selectedActivity ? sportColor(selectedActivity.sport_type) : '#E8832A';
  const canLaunchAnalysis = selectedActivity !== null || uploadedFile !== null;

  const handleLaunchAnalysis = async () => {
    setAnalysisStarted(true);
    setAnalysisStatus('loading');
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      let result: TrailAnalysisResult;

      if (uploadedFile) {
        result = await analysisApi.analyzeFile(uploadedFile);
      } else if (selectedActivity) {
        result = await analysisApi.analyzeActivity(selectedActivity.id);
      } else {
        throw new Error('Aucune activité ou fichier sélectionné');
      }

      setAnalysisResult(result);
      setAnalysisStatus('success');

      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      console.error('Analysis error:', err);
      let message = 'Erreur lors de l\'analyse';
      if (err && typeof err === 'object') {
        const axiosErr = err as { code?: string; message?: string };
        if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
          message = 'L\'analyse a pris trop de temps. Réessayez ou choisissez une activité plus courte.';
        } else if (axiosErr.message === 'Network Error') {
          message = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
        } else if (axiosErr.message) {
          message = axiosErr.message;
        }
      }
      setAnalysisError(message);
      setAnalysisStatus('error');
    }
  };

  const handleActivitySelect = (activity: Activity) => {
    setSelectedActivity(activity);
    setUploadedFile(null);
    setAnalysisStarted(false);
  };

  const handleReset = () => {
    setSelectedActivity(null);
    setUploadedFile(null);
    setAnalysisStarted(false);
    setAnalysisStatus('idle');
    setAnalysisResult(null);
    setAnalysisError(null);
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

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* Header */}
      <SectionTitle
        title="Analyse de Performance"
        subtitle="Analyse approfondie de vos activités sportives"
        icon={<ChartBarIcon color="#E8832A" />}
      />

      {/* Selection Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Import File */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UploadIcon className="w-5 h-5 text-mist" />
            <h2 className="font-heading text-lg text-mist">Importer un fichier</h2>
          </div>

          {/* Drop Zone or Selected File */}
          {uploadedFile ? (
            <div className="relative bg-charcoal border-2 border-moss/50 rounded-lg p-8">
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-moss/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-moss/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-moss/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-moss/30" />

              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-moss/10 border border-moss/30 rounded-lg">
                  <CheckIcon className="text-moss" />
                </div>
                <div className="text-center">
                  <p className="text-mist font-medium">Fichier sélectionné</p>
                  <p className="text-moss font-mono text-sm mt-1">{uploadedFile.name}</p>
                </div>
                <button
                  onClick={() => { setUploadedFile(null); setAnalysisStarted(false); }}
                  className="text-steel hover:text-amber text-sm transition-colors"
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
              className={`relative bg-charcoal border-2 border-dashed rounded-lg p-12 cursor-pointer transition-all duration-300 ${
                isDragging ? 'border-amber bg-amber/5' : 'border-steel/50 hover:border-steel hover:bg-steel/5'
              }`}
            >
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-steel/30" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-steel/30" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-steel/30" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-steel/30" />

              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-amber/10 border border-amber/30 rounded-lg">
                  <FileIcon color="#E8832A" />
                </div>
                <div className="text-center">
                  <p className="text-mist">Glissez-déposez votre fichier ici</p>
                  <p className="text-steel text-sm mt-1">ou cliquez pour sélectionner</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1.5 bg-amber/10 border border-amber/30 text-amber rounded font-mono text-xs">.GPX</span>
                  <span className="px-3 py-1.5 bg-glacier/10 border border-glacier/30 text-glacier rounded font-mono text-xs">.FIT</span>
                </div>
              </div>

              <input ref={fileInputRef} type="file" accept=".gpx,.fit" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {/* Info Box */}
          <div className="hw-card-dark p-4">
            <div className="flex items-start gap-3">
              <ZapIcon color="#E8832A" size={20} />
              <div>
                <p className="text-amber text-sm font-medium">Formats supportés</p>
                <p className="text-steel text-xs mt-1">
                  Les fichiers GPX et FIT contiennent les données GPS, cardio, cadence et élévation nécessaires pour une analyse complète.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Select Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon color="#F2F2F2" size={20} />
              <h2 className="font-heading text-lg text-mist">Sélectionner une activité</h2>
            </div>
            {/* Compact Date Picker */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={dateRange.min}
                max={dateRange.max}
                className="bg-steel/20 border border-steel/50 rounded px-2 py-1 text-mist font-mono text-xs focus:outline-none focus:border-amber/50 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert cursor-pointer w-[130px]"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="p-1 bg-steel/20 hover:bg-amber/20 border border-steel/50 hover:border-amber/30 rounded transition-all duration-200"
                  title="Effacer le filtre"
                >
                  <XIcon className="text-steel hover:text-amber" />
                </button>
              )}
            </div>
          </div>

          {selectedDate && (
            <div className="text-amber text-xs">
              {filteredActivities.length === 0
                ? 'Aucune activité à cette date'
                : `${filteredActivities.length} activité${filteredActivities.length > 1 ? 's' : ''}`
              }
            </div>
          )}

          {/* Activities List */}
          <div
            className="bg-charcoal border border-steel/30 rounded-lg overflow-hidden flex flex-col"
            style={{ height: uploadedFile ? '280px' : '340px' }}
          >
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-amber/30 border-t-amber rounded-full animate-spin mx-auto" />
                  <p className="text-steel text-sm mt-3">Chargement...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <CalendarIcon className="w-10 h-10 mx-auto text-steel/50 mb-2" />
                  <p className="text-steel text-sm">
                    {selectedDate ? 'Aucune activité à cette date' : 'Aucune activité'}
                  </p>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="mt-2 text-amber text-xs hover:underline"
                    >
                      Voir toutes les activités
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filteredActivities.map((activity) => {
                  const isSelected = selectedActivity?.id === activity.id;
                  const activityColor = sportColor(activity.sport_type);
                  const distanceKm = activity.distance_km || activity.distance;
                  return (
                    <button
                      key={activity.id}
                      onClick={() => handleActivitySelect(activity)}
                      className={`w-full bg-charcoal border rounded-lg p-3 transition-all duration-200 flex items-center justify-between group ${
                        isSelected ? 'border-moss/50 bg-moss/5' : 'border-steel/30 hover:border-steel hover:bg-steel/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="p-1.5 rounded"
                          style={{ backgroundColor: `${activityColor}15`, border: `1px solid ${activityColor}30` }}
                        >
                          {isSelected ? (
                            <CheckIcon className="text-moss" />
                          ) : (
                            <MapPinIcon color={activityColor} size={16} />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-mist text-sm font-medium line-clamp-1">{activity.name}</span>
                            <span
                              className="px-1.5 py-0.5 rounded font-mono text-[9px] shrink-0"
                              style={{ backgroundColor: `${activityColor}20`, color: activityColor }}
                            >
                              {sportLabel(activity.sport_type)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-steel font-mono text-[10px]">
                            <span>{formatDateDisplay(activity.start_date)}</span>
                            <span className="text-steel/50">•</span>
                            <span>{distanceKm.toFixed(1)} km</span>
                            <span className="text-steel/50">•</span>
                            <span>{activity.moving_time_hms || formatDuration(activity.moving_time)}</span>
                          </div>
                        </div>
                      </div>
                      {isSelected ? (
                        <CheckIcon className="w-4 h-4 text-moss shrink-0" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-steel group-hover:text-mist transition-colors shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="hw-card-dark p-3">
            <div className="flex items-start gap-2">
              <DatabaseIcon color="#E8832A" size={16} />
              <div>
                <p className="text-amber text-xs font-medium">
                  {activities.length} activité{activities.length > 1 ? 's' : ''} enregistrée{activities.length > 1 ? 's' : ''}
                </p>
                <p className="text-steel text-[10px] mt-0.5">Sélectionnez une activité pour lancer l'analyse.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Launch Analysis Button */}
      <div className="flex flex-col items-center gap-4 py-6 border-t border-b border-steel/30">
        {canLaunchAnalysis ? (
          <>
            <div className="flex items-center gap-3 text-sm">
              <CheckIcon className="text-moss" />
              <span className="text-mist">
                {selectedActivity ? `Activité sélectionnée : ${selectedActivity.name}` : `Fichier sélectionné : ${uploadedFile?.name}`}
              </span>
              <button onClick={handleReset} className="text-steel hover:text-amber transition-colors">
                (modifier)
              </button>
            </div>
            {!analysisStarted ? (
              <button
                onClick={handleLaunchAnalysis}
                className="flex items-center gap-3 px-8 py-3 bg-amber hover:bg-amber/90 text-charcoal font-medium rounded-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(232,131,42,0.4)]"
              >
                <PlayIcon className="w-5 h-5" />
                Lancer l'analyse
              </button>
            ) : (
              <div className="flex items-center gap-2 text-moss text-sm">
                <CheckIcon className="w-4 h-4" />
                Analyse en cours d'affichage
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-steel text-sm">
              Sélectionnez une activité ou importez un fichier pour lancer l'analyse
            </p>
          </div>
        )}
      </div>

      {/* Analysis View */}
      {analysisStarted && (
        <div ref={analysisRef} className="space-y-6 pt-4">
          {analysisStatus === 'loading' && (
            <AnalysisLoader
              activityName={uploadedFile ? uploadedFile.name : selectedActivity?.name}
              isFile={!!uploadedFile}
            />
          )}

          {analysisStatus === 'error' && (
            <div className="hw-card-dark p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-red-400 font-medium">Erreur lors de l'analyse</p>
                  <p className="text-steel text-sm mt-1">{analysisError || 'Une erreur inattendue s\'est produite'}</p>
                </div>
                <button
                  onClick={handleLaunchAnalysis}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {analysisStatus === 'success' && analysisResult && (
            <TrailAnalysisDashboard data={analysisResult} color={color} />
          )}
        </div>
      )}
    </div>
  );
}

const ANALYSIS_STEPS = [
  'Chargement des données GPS...',
  'Analyse des segments de course et marche...',
  'Calcul du profil d\'effort et VAM...',
  'Détection des ravitaillements...',
  'Analyse du découplage cardiaque...',
  'Finalisation du rapport...',
];

function AnalysisLoader({ activityName, isFile }: { activityName?: string; isFile: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stepIndex < ANALYSIS_STEPS.length - 1) {
      const delay = 3000 + Math.random() * 4000;
      const timer = setTimeout(() => setStepIndex((i) => i + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [stepIndex]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

  return (
    <div className="hw-card-dark p-12">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-steel/30 border-t-amber rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ChartBarIcon color="#E8832A" size={24} />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-mist font-medium">Analyse en cours...</p>
          <p className="text-amber text-sm font-medium">{ANALYSIS_STEPS[stepIndex]}</p>
          <p className="text-steel text-sm">{isFile ? `Traitement de ${activityName}` : `Analyse de ${activityName}`}</p>
          <p className="font-mono text-xs text-steel/60 mt-2">{timeStr}</p>
          {elapsed >= 15 && (
            <p className="text-steel text-xs mt-1">L'analyse peut prendre jusqu'à 2 minutes pour les activités longues</p>
          )}
        </div>
      </div>
    </div>
  );
}
