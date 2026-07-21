import { apiClient } from './client';
import type { EfAnalysis, UserBaseline } from '@/types/ef';

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

  /**
   * Socle personnel EF (gap_curve, régression, règles, historique des
   * baselines, sorties longues) — alimente PerformancePage. 404 si aucun
   * recompute_user_baseline n'a encore eu lieu pour l'utilisateur.
   */
  async getMyEfBaseline(): Promise<UserBaseline> {
    const response = await apiClient.get<UserBaseline>('/me/ef-baseline');
    return response.data;
  },
};
