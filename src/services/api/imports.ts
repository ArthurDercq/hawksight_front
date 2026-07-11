/**
 * Import bulk d'activités depuis l'export "Download your data" de Strava.
 */
import { apiClient } from './client';

export interface StravaExportDiffResult {
  new_activities_count: number;
  files_needed: string[];
}

export interface StravaExportRunResult {
  new_activities_count: number;
  job_id?: number;
}

export const importsApi = {
  /**
   * Calcule les activités du CSV absentes de la base — rapide, ne touche
   * à aucun fichier stream. Retourne les Filename à envoyer à `runImport`.
   */
  async diffStravaExport(csvFile: File): Promise<StravaExportDiffResult> {
    const formData = new FormData();
    formData.append('csv_file', csvFile);

    const response = await apiClient.post<StravaExportDiffResult>(
      '/imports/strava-export/diff',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /**
   * Envoie le CSV + les fichiers stream nécessaires (déjà filtrés via
   * `files_needed` de `diffStravaExport`) et lance l'import.
   *
   * `relativePaths` doit contenir, dans le même ordre que `files`, le
   * chemin attendu par le backend (ex. "activities/123.gpx" — SANS le
   * dossier racine de l'export, contrairement à webkitRelativePath qui
   * l'inclut) : c'est ce chemin que import_service.py va chercher sur
   * disque en le comparant au Filename du CSV.
   */
  async runStravaExportImport(csvFile: File, files: File[], relativePaths: string[]): Promise<StravaExportRunResult> {
    const formData = new FormData();
    formData.append('csv_file', csvFile);
    files.forEach((f, i) => formData.append('files', f, relativePaths[i] || f.name));

    const response = await apiClient.post<StravaExportRunResult>(
      '/imports/strava-export/run',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      },
    );
    return response.data;
  },
};
