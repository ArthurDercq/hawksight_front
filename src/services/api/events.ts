import { apiClient } from './client';
import type { TrainingEvent, EventFormData } from '@/types';

export const eventsApi = {
  async getEvents(): Promise<TrainingEvent[]> {
    return apiClient.fetchWithCache<TrainingEvent[]>('/events/');
  },

  async createEvent(data: EventFormData): Promise<TrainingEvent> {
    const response = await apiClient.post<TrainingEvent>('/events/', data);
    apiClient.clearCache(/\/events/);
    window.dispatchEvent(new Event('events-updated'));
    return response.data;
  },

  async updateEvent(id: string, data: Partial<EventFormData>): Promise<TrainingEvent> {
    const response = await apiClient.put<TrainingEvent>(`/events/${id}`, data);
    apiClient.clearCache(/\/events/);
    window.dispatchEvent(new Event('events-updated'));
    return response.data;
  },

  async deleteEvent(id: string): Promise<void> {
    await apiClient.delete(`/events/${id}`);
    apiClient.clearCache(/\/events/);
    window.dispatchEvent(new Event('events-updated'));
  },

  async markCompleted(id: string, is_completed: boolean): Promise<TrainingEvent> {
    const response = await apiClient.put<TrainingEvent>(`/events/${id}`, { is_completed });
    apiClient.clearCache(/\/events/);
    window.dispatchEvent(new Event('events-updated'));
    return response.data;
  },

  async linkActivity(eventId: string, activityId: number): Promise<TrainingEvent> {
    const response = await apiClient.put<TrainingEvent>(`/events/${eventId}/link`, { activity_id: Math.round(activityId) });
    apiClient.clearCache(/\/events/);
    window.dispatchEvent(new Event('events-updated'));
    return response.data;
  },

  async unlinkActivity(eventId: string): Promise<TrainingEvent> {
    const response = await apiClient.put<TrainingEvent>(`/events/${eventId}/link`, { activity_id: null });
    apiClient.clearCache(/\/events/);
    window.dispatchEvent(new Event('events-updated'));
    return response.data;
  },
};
