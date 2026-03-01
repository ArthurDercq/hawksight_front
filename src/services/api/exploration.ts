import { apiClient } from './client';
import type { ExplorationGeoJSON, ExplorationStats, ActivityExplorationRate, SportFilter } from '@/types';

interface ExplorationParams {
  sport?: SportFilter;
  year?: number;
}

export interface ExplorationRateItem {
  period_label: string;
  exploration_rate: number;
  new_cells: number;
  total_cells: number;
}

export const explorationApi = {
  /**
   * Get exploration GeoJSON for the world map.
   * Returns H3 hexagonal cells as GeoJSON FeatureCollection.
   */
  async getExploration(params?: ExplorationParams): Promise<ExplorationGeoJSON> {
    const queryParams: Record<string, string | number> = {};

    if (params?.sport && params.sport !== 'all') {
      queryParams.sport = params.sport;
    }
    if (params?.year) {
      queryParams.year = params.year;
    }

    const response = await apiClient.get<ExplorationGeoJSON>('/exploration/', { params: queryParams });
    return response.data;
  },

  /**
   * Get exploration statistics only (lighter endpoint).
   */
  async getStats(year?: number): Promise<ExplorationStats> {
    const params = year ? { year } : {};
    const response = await apiClient.get<ExplorationStats>('/exploration/stats', { params });
    return response.data;
  },

  /**
   * Get exploration rate for a specific activity.
   */
  async getActivityExplorationRate(activityId: number): Promise<ActivityExplorationRate> {
    const response = await apiClient.get<ActivityExplorationRate>(`/exploration/activity/${activityId}`);
    return response.data;
  },

  /**
   * Get exploration rates aggregated by period.
   */
  async getExplorationRates(period: 'week' | 'month' | 'year' = 'week', sport: string = 'all', year?: number): Promise<ExplorationRateItem[]> {
    const params: Record<string, string | number> = { period, sport };
    if (year) params.year = year;
    const response = await apiClient.get<ExplorationRateItem[]>('/exploration/rates', { params });
    return response.data;
  },
};
