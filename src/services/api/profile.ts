import { apiClient } from './client';
import type { UserProfile } from '@/types';

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/auth/strava/me`);
    return response.data;
  },
};
