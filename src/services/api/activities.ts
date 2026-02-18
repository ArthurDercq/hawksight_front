import { apiClient } from './client';
import type { Activity, ActivityDetail, ActivityFormData } from '@/types';

export const activitiesApi = {
  async getActivities(): Promise<Activity[]> {
    return apiClient.fetchWithCache<Activity[]>('/activities/activities');
  },

  async getActivity(id: number): Promise<Activity> {
    const response = await apiClient.get<Activity>(`/activities/activities/${id}`);
    return response.data;
  },

  async getActivityDetail(id: number): Promise<ActivityDetail> {
    const response = await apiClient.get<ActivityDetail>(`/activities/activity_detail/${id}`);
    return response.data;
  },

  async createActivity(data: ActivityFormData): Promise<Activity> {
    const response = await apiClient.post<Activity>('/activities/activities', data);
    apiClient.clearCache(/activities/);
    apiClient.clearCache(/kpi/);
    apiClient.clearCache(/plot/);
    window.dispatchEvent(new Event('activities-updated'));
    return response.data;
  },

  async updateActivity(id: number, data: ActivityFormData, adjustStreams: boolean = false): Promise<Activity> {
    const response = await apiClient.put<Activity>(
      `/activities/activities/${id}`,
      data,
      { params: { adjust_streams: adjustStreams } }
    );
    apiClient.clearCache(/activities/);
    apiClient.clearCache(/kpi/);
    apiClient.clearCache(/plot/);
    window.dispatchEvent(new Event('activities-updated'));
    return response.data;
  },

  async deleteActivity(id: number, deleteStreams: boolean = true): Promise<void> {
    await apiClient.delete(`/activities/activities/${id}`, {
      params: { delete_streams: deleteStreams },
    });
    apiClient.clearCache(/activities/);
    apiClient.clearCache(/kpi/);
    apiClient.clearCache(/plot/);
    window.dispatchEvent(new Event('activities-updated'));
  },

  async filterActivities(startDate: string, endDate: string, sportType?: string): Promise<Activity[]> {
    return apiClient.fetchWithCache<Activity[]>('/activities/filter_activities', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(sportType && { sport_type: sportType }),
      },
    });
  },

  async syncActivities(): Promise<void> {
    await apiClient.post('/activities/update_db');
  },

  async syncStreams(): Promise<void> {
    // Timeout de 30 secondes pour les streams
    await apiClient.post('/activities/update_streams', {}, { timeout: 30000 });
  },

  async syncAll(): Promise<void> {
    // D'abord synchroniser les activités, puis les streams
    await this.syncActivities();
    await this.syncStreams();
  },
};
