import { apiClient } from './client';
import { cache } from '@/services/cache';
import type { UserProfile } from '@/types';

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/auth/strava/profile`);
    return response.data;
  },

  async updateMaxHr(maxHr: number): Promise<void> {
    await apiClient.patch(`/auth/strava/profile`, { max_hr: maxHr });
    cache.invalidate('profile:me');
  },
};
