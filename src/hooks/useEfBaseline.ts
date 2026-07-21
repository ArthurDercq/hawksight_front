import { useState, useEffect, useCallback } from 'react';
import { efApi } from '@/services/api';
import { cache } from '@/services/cache';
import type { UserBaseline } from '@/types/ef';

const EF_BASELINE_CACHE_KEY = 'ef-baseline';

interface UseEfBaselineReturn {
  baseline: UserBaseline | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEfBaseline(): UseEfBaselineReturn {
  const [baseline, setBaseline] = useState<UserBaseline | null>(
    () => cache.get<UserBaseline>(EF_BASELINE_CACHE_KEY) ?? null
  );
  const [isLoading, setIsLoading] = useState(
    () => cache.get<UserBaseline>(EF_BASELINE_CACHE_KEY) === null
  );
  const [error, setError] = useState<string | null>(null);

  const fetchBaseline = useCallback(async () => {
    setError(null);

    try {
      const { data } = await cache.fetch<UserBaseline>(
        EF_BASELINE_CACHE_KEY,
        () => efApi.getMyEfBaseline(),
        { onBackground: (fresh) => setBaseline(fresh) },
      );
      setBaseline(data);
    } catch (err) {
      // 404 = historique insuffisant (aucun recompute_user_baseline encore
      // eu lieu) — état normal, pas une panne : PerformancePage affiche
      // simplement son état vide plutôt qu'une erreur.
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status !== 404) {
        console.error('Error fetching EF baseline:', err);
        setError("Erreur lors du chargement du socle d'analyse");
      }
      setBaseline(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBaseline();
  }, [fetchBaseline]);

  return { baseline, isLoading, error, refetch: fetchBaseline };
}
