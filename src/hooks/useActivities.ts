import { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '@/services/api';
import type { Activity, ActivityFormData } from '@/types';

interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createActivity: (data: ActivityFormData) => Promise<boolean>;
  updateActivity: (id: number, data: ActivityFormData, adjustStreams?: boolean) => Promise<boolean>;
  deleteActivity: (id: number) => Promise<boolean>;
}

export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await activitiesApi.getActivities();
      // Sort by date descending (most recent first)
      const sorted = data.sort((a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      setActivities(sorted);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = useCallback(async (data: ActivityFormData): Promise<boolean> => {
    try {
      await activitiesApi.createActivity(data);
      await fetchActivities(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error creating activity:', err);
      return false;
    }
  }, [fetchActivities]);

  const updateActivity = useCallback(async (
    id: number,
    data: ActivityFormData,
    adjustStreams: boolean = false
  ): Promise<boolean> => {
    try {
      await activitiesApi.updateActivity(id, data, adjustStreams);
      await fetchActivities(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error updating activity:', err);
      return false;
    }
  }, [fetchActivities]);

  const deleteActivity = useCallback(async (id: number): Promise<boolean> => {
    try {
      await activitiesApi.deleteActivity(id);
      await fetchActivities(); // Refresh the list
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      return false;
    }
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    refetch: fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}
