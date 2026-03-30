import { apiClient } from './client';
import type { TrailProfile, TrailProfileHistory, TrailReferenceProfile } from '@/types';

export const trailApi = {
  async getProfile(): Promise<TrailProfile> {
    const response = await apiClient.get<TrailProfile>('/trail/profile');
    return response.data;
  },

  async compute(): Promise<void> {
    await apiClient.post('/trail/compute/sync');
    apiClient.clearCache(/\/trail\//);
  },

  async getHistory(weeks = 52): Promise<TrailProfileHistory[]> {
    const response = await apiClient.fetchWithCache<TrailProfileHistory[]>(
      '/trail/history',
      { params: { weeks } },
      600000
    );
    return response;
  },

  async getReferences(): Promise<TrailReferenceProfile[]> {
    const response = await apiClient.fetchWithCache<TrailReferenceProfile[]>(
      '/trail/references',
      undefined,
      3600000 // 1h — données statiques
    );
    return response;
  },
};
