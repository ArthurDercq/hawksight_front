import { useState, useEffect, useCallback } from 'react';
import { trailApi } from '@/services/api';
import type { TrailProfile, TrailProfileHistory, TrailReferenceProfile } from '@/types';

interface UseTrailProfileReturn {
  profile: TrailProfile | null;
  history: TrailProfileHistory[];
  references: TrailReferenceProfile[];
  isLoading: boolean;
  isComputing: boolean;
  error: string | null;
  compute: () => Promise<void>;
  refetch: () => void;
}

export function useTrailProfile(): UseTrailProfileReturn {
  const [profile, setProfile] = useState<TrailProfile | null>(null);
  const [history, setHistory] = useState<TrailProfileHistory[]>([]);
  const [references, setReferences] = useState<TrailReferenceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setError(null);
    try {
      const [profileData, historyData, refsData] = await Promise.allSettled([
        trailApi.getProfile(),
        trailApi.getHistory(52),
        trailApi.getReferences(),
      ]);

      if (profileData.status === 'fulfilled') setProfile(profileData.value);
      else if ((profileData.reason as { response?: { status: number } })?.response?.status !== 404) {
        setError('Erreur lors du chargement du profil trail');
      }

      if (historyData.status === 'fulfilled') setHistory(historyData.value);
      if (refsData.status === 'fulfilled') setReferences(refsData.value);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const compute = useCallback(async () => {
    setIsComputing(true);
    setError(null);
    try {
      await trailApi.compute();
      await fetchAll();
    } catch {
      setError('Erreur lors du calcul du profil trail');
    } finally {
      setIsComputing(false);
    }
  }, [fetchAll]);

  return {
    profile,
    history,
    references,
    isLoading,
    isComputing,
    error,
    compute,
    refetch: fetchAll,
  };
}
