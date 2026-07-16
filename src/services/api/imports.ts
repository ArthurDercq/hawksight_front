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

export interface FitImportRunResult {
  files_count: number;
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

  /**
   * Importe des fichiers .fit isolés (pas d'export Strava) — pipeline
   * complet identique à un import CSV ou un sync live : activites (id
   * synthétique), activity_features, records, H3, analyse EF. Dédoublonnage
   * par (start_time ±5 min, distance ±2%) côté backend, pas par Activity ID
   * Strava (inexistant pour cette voie).
   */
  async importFitFiles(files: File[]): Promise<FitImportRunResult> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f, f.name));

    const response = await apiClient.post<FitImportRunResult>(
      '/imports/fit',
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      },
    );
    return response.data;
  },
};
