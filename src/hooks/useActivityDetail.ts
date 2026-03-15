import { useState, useEffect, useCallback } from 'react';
import { activitiesApi, explorationApi } from '@/services/api';
import type { Activity, ActivityStream, ActivityExplorationRate } from '@/types';

interface UseActivityDetailReturn {
  activity: Activity | null;
  streams: ActivityStream[];
  explorationRate: ActivityExplorationRate | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useActivityDetail(activityId: number | null): UseActivityDetailReturn {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [streams, setStreams] = useState<ActivityStream[]>([]);
  const [explorationRate, setExplorationRate] = useState<ActivityExplorationRate | null>(null);
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
      const [data, expRate] = await Promise.all([
        activitiesApi.getActivityDetail(activityId),
        explorationApi.getActivityExplorationRate(activityId).catch(() => null),
      ]);
      setActivity(data.activity);
      setStreams(data.streams || []);
      setExplorationRate(expRate);
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
    explorationRate,
    isLoading,
    error,
    refetch: fetchActivityDetail,
  };
}
