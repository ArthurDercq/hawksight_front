import { apiClient } from './client';
import type { TrailProfile, TrailProfileHistory, TrailReferenceProfile } from '@/types';

export const trailApi = {
  async getProfile(): Promise<TrailProfile> {
    const response = await apiClient.get<TrailProfile>('/trail/profile');
    return response.data;
  },

  async compute(): Promise<void> {
    // POST retourne 202 — on poll /trail/profile jusqu'à ce que computed_at change
    const before = await apiClient.get<TrailProfile>('/trail/profile').then(r => r.data.computed_at).catch(() => null);
    await apiClient.post('/trail/compute');
    apiClient.clearCache(/\/trail\//);

    // Poll toutes les 3s, max 2 minutes
    const deadline = Date.now() + 120_000;
    await new Promise<void>(resolve => {
      const tick = async () => {
        try {
          const { data } = await apiClient.get<TrailProfile>('/trail/profile');
          if (data.computed_at !== before || Date.now() > deadline) {
            apiClient.clearCache(/\/trail\//);
            resolve();
            return;
          }
        } catch { /* ignore */ }
        setTimeout(tick, 3000);
      };
      setTimeout(tick, 3000);
    });
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
