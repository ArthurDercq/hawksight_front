import { useState, useEffect, useCallback } from 'react';
import { activitiesApi, explorationApi } from '@/services/api';
import { cache } from '@/services/cache';
import type { Activity, ActivityStream, ActivityExplorationRate, TrailStats, SurfaceClassification, ActivityRecord, ActivityDetail } from '@/types';

const detailCacheKey = (id: number) => `activity-detail-${id}`;

interface CachedDetail {
  detail: ActivityDetail;
  explorationRate: ActivityExplorationRate | null;
}

interface UseActivityDetailReturn {
  activity: Activity | null;
  streams: ActivityStream[];
  explorationRate: ActivityExplorationRate | null;
  trailStats: TrailStats | null;
  surfaceClassification: SurfaceClassification | null;
  race: { id: string; name: string; type: string } | null;
  records: ActivityRecord[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

function applyDetail(
  cached: CachedDetail,
  setActivity: (v: Activity | null) => void,
  setStreams: (v: ActivityStream[]) => void,
  setTrailStats: (v: TrailStats | null) => void,
  setSurfaceClassification: (v: SurfaceClassification | null) => void,
  setRace: (v: { id: string; name: string; type: string } | null) => void,
  setRecords: (v: ActivityRecord[]) => void,
  setExplorationRate: (v: ActivityExplorationRate | null) => void,
) {
  const { detail, explorationRate } = cached;
  setActivity(detail.activity);
  setStreams(detail.streams || []);
  setTrailStats(detail.trail_stats ?? null);
  setSurfaceClassification(detail.surface_classification ?? null);
  setRace(detail.race ?? null);
  setRecords(detail.records ?? []);
  setExplorationRate(explorationRate);
}

export function useActivityDetail(activityId: number | null): UseActivityDetailReturn {
  const [activity, setActivity] = useState<Activity | null>(() => {
    if (!activityId) return null;
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.detail.activity ?? null;
  });
  const [streams, setStreams] = useState<ActivityStream[]>(() => {
    if (!activityId) return [];
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.detail.streams ?? [];
  });
  const [explorationRate, setExplorationRate] = useState<ActivityExplorationRate | null>(() => {
    if (!activityId) return null;
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.explorationRate ?? null;
  });
  const [trailStats, setTrailStats] = useState<TrailStats | null>(() => {
    if (!activityId) return null;
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.detail.trail_stats ?? null;
  });
  const [surfaceClassification, setSurfaceClassification] = useState<SurfaceClassification | null>(() => {
    if (!activityId) return null;
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.detail.surface_classification ?? null;
  });
  const [race, setRace] = useState<{ id: string; name: string; type: string } | null>(() => {
    if (!activityId) return null;
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.detail.race ?? null;
  });
  const [records, setRecords] = useState<ActivityRecord[]>(() => {
    if (!activityId) return [];
    return cache.get<CachedDetail>(detailCacheKey(activityId))?.detail.records ?? [];
  });
  const [isLoading, setIsLoading] = useState(() =>
    activityId ? cache.get<CachedDetail>(detailCacheKey(activityId)) === null : false
  );
  const [error, setError] = useState<string | null>(null);

  const fetchActivityDetail = useCallback(async () => {
    if (!activityId) {
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const { data } = await cache.fetch<CachedDetail>(
        detailCacheKey(activityId),
        async () => {
          const [detail, expRate] = await Promise.all([
            activitiesApi.getActivityDetail(activityId),
            explorationApi.getActivityExplorationRate(activityId).catch(() => null),
          ]);
          return { detail, explorationRate: expRate };
        },
        {
          onBackground: (fresh) => applyDetail(fresh, setActivity, setStreams, setTrailStats, setSurfaceClassification, setRace, setRecords, setExplorationRate),
        }
      );
      applyDetail(data, setActivity, setStreams, setTrailStats, setSurfaceClassification, setRace, setRecords, setExplorationRate);
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
    trailStats,
    surfaceClassification,
    race,
    records,
    isLoading,
    error,
    refetch: fetchActivityDetail,
  };
}
