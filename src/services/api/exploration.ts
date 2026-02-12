import { apiClient } from './client';
import type { ExplorationGeoJSON, ExplorationStats, SportFilter } from '@/types';

interface ExplorationParams {
  sport?: SportFilter;
  year?: number;
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
};
