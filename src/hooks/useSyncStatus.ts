import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/services/api';
import type { StravaSyncStatus } from '@/types';

export interface JobSyncStatus {
  is_syncing: boolean;
  current_job: { type: string; status: string; progress: number } | null;
  last_completed: { type: string; finished_at: string } | null;
  has_error: boolean;
}

const POLL_INTERVAL = 5000;

export function useSyncStatus() {
  const [jobStatus, setJobStatus] = useState<JobSyncStatus | null>(null);
  const [activitiesCount, setActivitiesCount] = useState<number | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchStatus = async () => {
      try {
        // Fetch both in parallel
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
    };

    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, POLL_INTERVAL);

    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Stop polling once sync is done and activities exist
  useEffect(() => {
    if (jobStatus && !jobStatus.is_syncing && activitiesCount !== null && activitiesCount > 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [jobStatus, activitiesCount]);

  return { status: jobStatus, activitiesCount, hasFetched };
}
