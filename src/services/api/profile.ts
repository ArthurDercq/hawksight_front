import { apiClient } from './client';
import type { UserProfile } from '@/types';

export const profileApi = {
  async getProfile(userId: number = 1): Promise<UserProfile> {
    const response = await apiClient.get<UserProfile>(`/auth/strava/profile`, {
      params: { user_id: userId },
    });
    return response.data;
  },
};
