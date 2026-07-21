import { apiClient } from './client';
import type { EfAnalysis } from '@/types/ef';

export const efApi = {
  /**
   * Analyse EF (Efficiency Factor) d'une activité — scalaires, ef_series,
   * ef_signals (critical_window, climbs), règle Pacing citée, flags.
   * 404 si l'activité n'a jamais été analysée (sortie trop courte, pas de
   * stream exploitable) ou n'appartient pas à l'utilisateur connecté.
   */
  async getActivityEfAnalysis(activityId: number): Promise<EfAnalysis> {
    const response = await apiClient.get<EfAnalysis>(`/activities/${activityId}/ef-analysis`);
    return response.data;
  },
};
