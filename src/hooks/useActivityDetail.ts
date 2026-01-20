import { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '@/services/api';
import type { Activity, ActivityStream } from '@/types';

interface UseActivityDetailReturn {
  activity: Activity | null;
  streams: ActivityStream[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useActivityDetail(activityId: number | null): UseActivityDetailReturn {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [streams, setStreams] = useState<ActivityStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityDetail = useCallback(async () => {
    if (!activityId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await activitiesApi.getActivityDetail(activityId);
      setActivity(data.activity);
      setStreams(data.streams || []);
    } catch (err) {
      console.error('Error fetching activity detail:', err);
      setError('Erreur lors du chargement des détails de l\'activité');
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchActivityDetail();
  }, [fetchActivityDetail]);

  return {
    activity,
    streams,
    isLoading,
    error,
    refetch: fetchActivityDetail,
  };
}
