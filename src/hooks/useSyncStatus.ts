import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/services/api';
import type { StravaSyncStatus } from '@/types';

export interface JobSyncStatus {
  is_syncing: boolean;
  current_job: { id: number; type: string; status: string; progress: number } | null;
  last_completed: { id: number; type: string; finished_at: string } | null;
  has_error: boolean;
  last_error?: string | null;
  last_failed_job_id?: number | null;
}

const POLL_INTERVAL = 5000;

export function useSyncStatus() {
  const [jobStatus, setJobStatus] = useState<JobSyncStatus | null>(null);
  const [activitiesCount, setActivitiesCount] = useState<number | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const fetchStatus = useCallback(async () => {
    try {
      const [{ data: job }, { data: stravaStatus }] = await Promise.all([
        apiClient.get<JobSyncStatus>('/sync/status'),
        apiClient.get<StravaSyncStatus>('/auth/strava/sync-status'),
      ]);
      if (!isMounted.current) return;
      setJobStatus(job);
      setActivitiesCount(stravaStatus.activities_count);
      setHasFetched(true);
    } catch {
      if (isMounted.current) setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL);

    // Relancer un fetch immédiat quand une sync est déclenchée manuellement
    const onActivitiesUpdated = () => fetchStatus();
    window.addEventListener('activities-updated', onActivitiesUpdated);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('activities-updated', onActivitiesUpdated);
    };
  }, [fetchStatus]);

  return { status: jobStatus, activitiesCount, hasFetched, refresh: fetchStatus };
}
