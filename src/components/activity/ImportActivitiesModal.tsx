import { useState, useRef, useCallback, useEffect } from 'react';
import { importsApi } from '@/services/api';
import { useSyncStatus } from '@/hooks/useSyncStatus';

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const FolderIcon = ({ color = '#E8832A' }: { color?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const FileIcon = ({ color = '#3DB2E0' }: { color?: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

type Mode = 'export' | 'fit';
type Step = 'pick' | 'diffing' | 'confirm' | 'uploading' | 'running' | 'done' | 'error';

interface ImportActivitiesModalProps {
  onClose: () => void;
}

// L'objet File du navigateur porte webkitRelativePath quand issu d'un
// <input webkitdirectory> — pas typé dans lib.dom.d.ts par défaut.
type FileWithRelativePath = File & { webkitRelativePath?: string };

export function ImportActivitiesModal({ onClose }: ImportActivitiesModalProps) {
  const [mode, setMode] = useState<Mode>('export');
  const [step, setStep] = useState<Step>('pick');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [newCount, setNewCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fitInputRef = useRef<HTMLInputElement>(null);

  const csvFileRef = useRef<File | null>(null);
  const allFilesRef = useRef<FileWithRelativePath[]>([]);
  const fitFilesRef = useRef<File[]>([]);

  const { status } = useSyncStatus();
  const jobType = mode === 'fit' ? 'import_fit' : 'import_strava_export';
  const isImportJob = status?.current_job?.type === jobType;
  const importProgress = isImportJob ? status?.current_job?.progress ?? 0 : 0;
  // Le backend expose une progression en % (0-100) — on la reconvertit ici
  // en compte brut x/newCount, plus lisible pour un import de quelques
  // dizaines d'activités que le pourcentage seul.
  const processedCount = isImportJob ? Math.min(newCount, Math.round((importProgress / 100) * newCount)) : 0;

  const handleFolderSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []) as FileWithRelativePath[];
    if (fileList.length === 0) return;

    const csvFile = fileList.find((f) => f.name === 'activities.csv') ?? null;
    if (!csvFile) {
      setErrorMessage("Le dossier sélectionné ne contient pas d'activities.csv — vérifiez qu'il s'agit bien du dossier d'export Strava.");
      setStep('error');
      return;
    }

    csvFileRef.current = csvFile;
    allFilesRef.current = fileList;
    setStep('diffing');
    setErrorMessage(null);

    try {
      const diff = await importsApi.diffStravaExport(csvFile);
      setNewCount(diff.new_activities_count);
      if (diff.new_activities_count === 0) {
        setStep('done');
      } else {
        setStep('confirm');
      }
    } catch (err) {
      console.error('Erreur diff import Strava:', err);
      setErrorMessage("Impossible d'analyser le fichier activities.csv.");
      setStep('error');
    }
  }, []);

  const handleFitFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = Array.from(e.target.files ?? []);
    if (fileList.length === 0) return;

    const invalid = fileList.filter((f) => !/\.fit(\.gz)?$/i.test(f.name));
    if (invalid.length > 0) {
      setErrorMessage(`Fichier(s) non supporté(s) : ${invalid.map((f) => f.name).join(', ')} — seuls les .fit/.fit.gz sont acceptés.`);
      setStep('error');
      return;
    }

    fitFilesRef.current = fileList;
    setNewCount(fileList.length);
    setErrorMessage(null);
    setStep('confirm');
  }, []);

  const handleConfirmFitImport = useCallback(async () => {
    const files = fitFilesRef.current;
    if (files.length === 0) return;

    setStep('running');
    try {
      const result = await importsApi.importFitFiles(files);
      setNewCount(result.files_count);
      if (!result.job_id) {
        setStep('done');
        window.dispatchEvent(new Event('activities-updated'));
      }
      // Sinon on reste en 'running' — le useSyncStatus polling détecte la fin ci-dessous.
    } catch (err) {
      console.error('Erreur import .fit:', err);
      setErrorMessage("Échec de l'import — réessayez.");
      setStep('error');
    }
  }, []);

  const handleConfirmImport = useCallback(async () => {
    const csvFile = csvFileRef.current;
    if (!csvFile) return;

    setStep('uploading');
    try {
      // On ne renvoie que les fichiers réellement nécessaires (nouvelles
      // activités) — pas tout le dossier, pour rester léger à chaque
      // réimport une fois l'historique déjà synchronisé.
      const diff = await importsApi.diffStravaExport(csvFile);
      const neededSet = new Set(diff.files_needed);
      const filesWithRelPath = allFilesRef.current
        .map((f) => ({ file: f, relPath: f.webkitRelativePath?.split('/').slice(1).join('/') }))
        .filter((x): x is { file: FileWithRelativePath; relPath: string } => !!x.relPath && neededSet.has(x.relPath));

      setStep('running');
      const result = await importsApi.runStravaExportImport(
        csvFile,
        filesWithRelPath.map((x) => x.file),
        filesWithRelPath.map((x) => x.relPath),
      );
      setNewCount(result.new_activities_count);
      if (!result.job_id) {
        setStep('done');
        window.dispatchEvent(new Event('activities-updated'));
      }
      // Sinon on reste en 'running' — le useSyncStatus polling détecte la fin ci-dessous.
    } catch (err) {
      console.error('Erreur import Strava:', err);
      setErrorMessage("Échec de l'import — réessayez.");
      setStep('error');
    }
  }, []);

  // Détecte la fin du job d'import via le polling déjà en place (useSyncStatus)
  useEffect(() => {
    if (step !== 'running' || !status || status.is_syncing) return;

    if (status.has_error) {
      setErrorMessage(status.last_error || "L'import a échoué.");
      setStep('error');
    } else {
      setStep('done');
      window.dispatchEvent(new Event('activities-updated'));
    }
  }, [step, status]);

  const reset = () => {
    csvFileRef.current = null;
    allFilesRef.current = [];
    fitFilesRef.current = [];
    setStep('pick');
    setErrorMessage(null);
    setNewCount(0);
    if (inputRef.current) inputRef.current.value = '';
    if (fitInputRef.current) fitInputRef.current.value = '';
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    reset();
  };

  // Import en cours : on empêche de fermer la modal (clic hors zone, Escape)
  // pour que l'utilisateur ne perde jamais le fil de la progression — le
  // job continue de toute façon côté serveur, mais sans indicateur visuel
  // il n'y a plus aucun moyen de savoir où ça en est ni quand ça se termine.
  const isBusy = step === 'uploading' || step === 'running';

  // Avertit avant de fermer l'onglet/naviguer ailleurs pendant l'import —
  // le job continuerait côté serveur, mais l'utilisateur perdrait le
  // suivi visuel et pourrait croire à tort que rien ne s'est passé.
  useEffect(() => {
    if (!isBusy) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isBusy]);

  const handleClose = () => { if (!isBusy) onClose(); };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
      onClick={handleClose}
    >
      <div
        className="hw-card-dark p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-1.5 rounded-lg bg-amber/10 border border-amber/30 text-amber">
            <UploadIcon />
          </div>
          <h3 className="font-heading font-semibold text-mist text-sm">Importer des activités</h3>
        </div>

        {step === 'pick' && (
          <div className="space-y-4">
            <div className="hw-btn-group">
              <button
                onClick={() => switchMode('export')}
                className={`hw-btn-group-item flex-1 ${mode === 'export' ? 'bg-amber/10 text-amber' : ''}`}
              >
                Export Strava
              </button>
              <div className="hw-btn-group-divider" />
              <button
                onClick={() => switchMode('fit')}
                className={`hw-btn-group-item flex-1 ${mode === 'fit' ? 'bg-amber/10 text-amber' : ''}`}
              >
                Fichiers .fit
              </button>
            </div>

            {mode === 'export' ? (
              <>
                <p className="hw-text-caption text-mist/60 leading-relaxed">
                  Sélectionnez le dossier d'export Strava complet (contenant <span className="text-mist/80">activities.csv</span> et le sous-dossier <span className="text-mist/80">activities/</span>).
                  Récupérable depuis Strava : Réglages → Mon compte → Télécharger ou supprimer votre compte → Exportation groupée.
                </p>
                <div
                  onClick={() => inputRef.current?.click()}
                  className="relative bg-charcoal border-2 border-dashed border-steel/50 rounded-lg p-8 cursor-pointer hover:border-steel hover:bg-steel/5 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-amber/10 border border-amber/30 rounded-lg">
                      <FolderIcon />
                    </div>
                    <p className="hw-text-data text-mist">Cliquez pour sélectionner le dossier d'export</p>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    // webkitdirectory n'est pas dans les types React/DOM standards
                    {...{ webkitdirectory: 'true', directory: 'true' }}
                    onChange={handleFolderSelect}
                    className="hidden"
                  />
                </div>
                <p className="hw-text-caption text-steel/70 leading-relaxed">
                  Seules les activités absentes de votre compte HawkSight seront importées — les activités déjà synchronisées ne sont jamais retraitées.
                </p>
              </>
            ) : (
              <>
                <p className="hw-text-caption text-mist/60 leading-relaxed">
                  Sélectionnez un ou plusieurs fichiers <span className="text-mist/80">.fit</span> (ou <span className="text-mist/80">.fit.gz</span>) exportés depuis votre montre ou une autre source — sans passer par l'export Strava.
                </p>
                <div
                  onClick={() => fitInputRef.current?.click()}
                  className="relative bg-charcoal border-2 border-dashed border-steel/50 rounded-lg p-8 cursor-pointer hover:border-steel hover:bg-steel/5 transition-all"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-glacier/10 border border-glacier/30 rounded-lg">
                      <FileIcon />
                    </div>
                    <p className="hw-text-data text-mist">Cliquez pour sélectionner un ou plusieurs fichiers .fit</p>
                  </div>
                  <input
                    ref={fitInputRef}
                    type="file"
                    accept=".fit,.fit.gz"
                    multiple
                    onChange={handleFitFilesSelect}
                    className="hidden"
                  />
                </div>
                <p className="hw-text-caption text-steel/70 leading-relaxed">
                  Une activité déjà présente (même date ± 5 min et distance similaire) sera automatiquement ignorée.
                </p>
              </>
            )}
          </div>
        )}

        {step === 'diffing' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-5 h-5 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
            <p className="hw-text-data text-mist/60">Analyse du dossier...</p>
          </div>
        )}

        {step === 'confirm' && mode === 'export' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-amber/10 border border-amber/30 rounded-lg">
              <span className="hw-text-data text-amber font-semibold">{newCount}</span>
              <span className="hw-text-caption text-mist/60">nouvelle{newCount > 1 ? 's' : ''} activité{newCount > 1 ? 's' : ''} à importer</span>
            </div>
            <p className="hw-text-caption text-steel/70 leading-relaxed">
              Strava ne distingue pas les sorties trail dans son export — toutes les courses seront importées en tant que « Run ».
              Vous pourrez recatégoriser manuellement via l'édition d'activité.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={reset} className="hw-btn-ghost">Annuler</button>
              <button onClick={handleConfirmImport} className="hw-btn-amber">Importer</button>
            </div>
          </div>
        )}

        {step === 'confirm' && mode === 'fit' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-glacier/10 border border-glacier/30 rounded-lg">
              <span className="hw-text-data text-glacier font-semibold">{newCount}</span>
              <span className="hw-text-caption text-mist/60">fichier{newCount > 1 ? 's' : ''} .fit sélectionné{newCount > 1 ? 's' : ''}</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={reset} className="hw-btn-ghost">Annuler</button>
              <button onClick={handleConfirmFitImport} className="hw-btn-amber">Importer</button>
            </div>
          </div>
        )}

        {(step === 'uploading' || step === 'running') && (
          <div className="flex flex-col items-center gap-3 py-8 w-full">
            <div className="w-5 h-5 border-2 border-amber/30 border-t-amber rounded-full animate-spin" />
            <p className="hw-text-data text-mist/60">
              {step === 'uploading' ? 'Envoi des fichiers...' : 'Import des activités en cours...'}
            </p>
            {step === 'running' && (
              <div className="w-full flex flex-col items-center gap-2">
                <div className="w-full h-1.5 bg-steel/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber transition-all duration-500"
                    style={{ width: `${isImportJob ? importProgress : 0}%` }}
                  />
                </div>
                <span className="hw-text-caption text-mist/50 font-mono">
                  {isImportJob ? `${processedCount} / ${newCount}` : `0 / ${newCount}`} {mode === 'fit' ? 'fichiers traités' : 'activités traitées'}
                </span>
              </div>
            )}
            <p className="hw-text-caption text-amber/70 mt-2 text-center">
              Ne fermez pas cette fenêtre tant que l'import n'est pas terminé.
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="p-3 bg-moss/10 border border-moss/30 rounded-lg text-moss">
              <CheckIcon />
            </div>
            <p className="hw-text-data text-mist">
              {newCount > 0
                ? mode === 'fit'
                  ? `${newCount} fichier${newCount > 1 ? 's' : ''} traité${newCount > 1 ? 's' : ''}`
                  : `${newCount} activité${newCount > 1 ? 's' : ''} importée${newCount > 1 ? 's' : ''}`
                : 'Aucune nouvelle activité à importer'}
            </p>
            <button onClick={onClose} className="hw-btn-amber mt-2">Fermer</button>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="hw-text-caption text-amber/80">{errorMessage}</p>
            <button onClick={reset} className="hw-btn-ghost">Réessayer</button>
          </div>
        )}
      </div>
    </div>
  );
}
