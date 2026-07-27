import { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '@/services/api';
import { cache } from '@/services/cache';
import type { Activity, ActivityFormData } from '@/types';

const CACHE_KEY = 'activities:all';

function sortByDate(data: Activity[]): Activity[] {
  return [...data].sort((a, b) =>
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
}

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
  const [activities, setActivities] = useState<Activity[]>(() => {
    const stale = cache.get<Activity[]>(CACHE_KEY);
    return stale ? sortByDate(stale) : [];
  });
  const [isLoading, setIsLoading] = useState(() => cache.get<Activity[]>(CACHE_KEY) === null);
  const [error, setError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const fetchActivities = useCallback(async (cancelled?: { current: boolean }, silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      const { data } = await cache.fetch<Activity[]>(CACHE_KEY, () => activitiesApi.getActivities(), {
        onBackground: (fresh) => {
          if (!cancelled?.current) setActivities(sortByDate(fresh));
        },
      });
      if (cancelled?.current) return;
      setActivities(sortByDate(data));
    } catch (err) {
      if (cancelled?.current) return;
      console.error('Error fetching activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      if (!cancelled?.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cancelled = { current: false };
    fetchActivities(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchActivities]);

  useEffect(() => {
    const onActivitiesUpdated = () => {
      cache.invalidate(CACHE_KEY);
      fetchActivities(undefined, true);
    };
    window.addEventListener('activities-updated', onActivitiesUpdated);
    return () => window.removeEventListener('activities-updated', onActivitiesUpdated);
  }, [fetchActivities]);

  const refetch = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  const createActivity = useCallback(async (data: ActivityFormData): Promise<boolean> => {
    setMutationError(null);
    try {
      await activitiesApi.createActivity(data);
      cache.invalidate(CACHE_KEY);
      await fetchActivities(undefined, true);
      return true;
    } catch (err) {
      console.error('Error creating activity:', err);
      const status = (err as { response?: { status?: number } }).response?.status;
      setMutationError(status === 403
        ? "Action non disponible en mode démo."
        : "Erreur lors de la création de l'activité");
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
      cache.invalidate(CACHE_KEY);
      await fetchActivities(undefined, true);
      return true;
    } catch (err) {
      console.error('Error updating activity:', err);
      const status = (err as { response?: { status?: number } }).response?.status;
      setMutationError(status === 403
        ? "Action non disponible en mode démo."
        : "Erreur lors de la modification de l'activité");
      return false;
    }
  }, [fetchActivities]);

  const deleteActivity = useCallback(async (id: number): Promise<boolean> => {
    setMutationError(null);
    try {
      await activitiesApi.deleteActivity(id);
      cache.invalidate(CACHE_KEY);
      await fetchActivities(undefined, true);
      return true;
    } catch (err) {
      console.error('Error deleting activity:', err);
      const status = (err as { response?: { status?: number } }).response?.status;
      setMutationError(status === 403
        ? "Action non disponible en mode démo."
        : "Erreur lors de la suppression de l'activité");
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
