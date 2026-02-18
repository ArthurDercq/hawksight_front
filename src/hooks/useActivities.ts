import { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '@/services/api';
import type { Activity, ActivityFormData } from '@/types';

interface UseActivitiesReturn {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  mutationError: string | null;
  refetch: () => void;
  createActivity: (data: ActivityFormData) => Promise<boolean>;
  updateActivity: (id: number, data: ActivityFormData, adjustStreams?: boolean) => Promise<boolean>;
  deleteActivity: (id: number) => Promise<boolean>;
}

export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (cancelled?: { current: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await activitiesApi.getActivities();
      if (cancelled?.current) return;
      // Sort by date descending (most recent first)
      const sorted = data.sort((a, b) =>
        new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      );
      setActivities(sorted);
    } catch (err) {
      if (cancelled?.current) return;
      console.error('Error fetching activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      if (!cancelled?.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchActivities(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchActivities]);

  const refetch = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = useCallback(async (data: ActivityFormData): Promise<boolean> => {
    setMutationError(null);
    try {
      await activitiesApi.createActivity(data);
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('Error creating activity:', err);
      setMutationError("Erreur lors de la création de l'activité");
      return false;
    }
  }, [fetchActivities]);

  const updateActivity = useCallback(async (
    id: number,
    data: ActivityFormData,
    adjustStreams: boolean = false
  ): Promise<boolean> => {
    setMutationError(null);
    try {
      await activitiesApi.updateActivity(id, data, adjustStreams);
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('Error updating activity:', err);
      setMutationError("Erreur lors de la modification de l'activité");
      return false;
    }
  }, [fetchActivities]);

  const deleteActivity = useCallback(async (id: number): Promise<boolean> => {
    setMutationError(null);
    try {
      await activitiesApi.deleteActivity(id);
      await fetchActivities();
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      setMutationError("Erreur lors de la suppression de l'activité");
      return false;
    }
  }, [fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    mutationError,
    refetch,
    createActivity,
    updateActivity,
    deleteActivity,
  };
}
