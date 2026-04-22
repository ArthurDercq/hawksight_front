import { apiClient } from './client';
import type { Activity, ActivityDetail, ActivityFormData } from '@/types';

function invalidateActivities() {
  apiClient.clearCache(/activities/);
  apiClient.clearCache(/kpi/);
  apiClient.clearCache(/plot/);
  window.dispatchEvent(new CustomEvent('activities-updated', { detail: { source: 'api' } }));
}

async function mutate<T>(fn: () => Promise<T>): Promise<T> {
  const result = await fn();
  invalidateActivities();
  return result;
}

function normalizeActivitiesResponse(res: { activities: Activity[] } | Activity[]): Activity[] {
  return Array.isArray(res) ? res : res.activities;
}

export const activitiesApi = {
  async getActivities(): Promise<Activity[]> {
    const res = await apiClient.fetchWithCache<{ activities: Activity[] } | Activity[]>('/activities/activities');
    return normalizeActivitiesResponse(res);
  },

  async getActivity(id: number): Promise<Activity> {
    const response = await apiClient.get<Activity>(`/activities/activities/${id}`);
    return response.data;
  },

  async getActivityDetail(id: number): Promise<ActivityDetail> {
    const response = await apiClient.get<ActivityDetail>(`/activities/activity_detail/${id}`);
    return response.data;
  },

  async filterActivities(startDate: string, endDate: string, sportType?: string): Promise<Activity[]> {
    const res = await apiClient.fetchWithCache<{ activities: Activity[] } | Activity[]>('/activities/filter_activities', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(sportType && { sport_type: sportType }),
      },
    });
    return normalizeActivitiesResponse(res);
  },

  async createActivity(data: ActivityFormData): Promise<Activity> {
    return mutate(async () => {
      const response = await apiClient.post<Activity>('/activities/activities', data);
      return response.data;
    });
  },

  async updateActivity(id: number, data: ActivityFormData, adjustStreams: boolean = false): Promise<Activity> {
    return mutate(async () => {
      const response = await apiClient.put<Activity>(`/activities/activities/${id}`, data, {
        params: { adjust_streams: adjustStreams },
      });
      return response.data;
    });
  },

  async deleteActivity(id: number, deleteStreams: boolean = true): Promise<void> {
    return mutate(async () => {
      await apiClient.delete(`/activities/activities/${id}`, {
        params: { delete_streams: deleteStreams },
      });
    });
  },

  async triggerSync(): Promise<{ job_id: number }> {
    const response = await apiClient.post<{ job_id: number }>('/sync/trigger');
    return response.data;
  },
};
