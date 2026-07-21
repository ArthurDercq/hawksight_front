import { useState, useEffect, useCallback } from 'react';
import { efApi } from '@/services/api';
import { cache } from '@/services/cache';
import type { EfAnalysis } from '@/types/ef';

const efAnalysisCacheKey = (id: number) => `ef-analysis-${id}`;

interface UseEfAnalysisReturn {
  efAnalysis: EfAnalysis | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEfAnalysis(activityId: number | null): UseEfAnalysisReturn {
  const [efAnalysis, setEfAnalysis] = useState<EfAnalysis | null>(() => {
    if (!activityId) return null;
    return cache.get<EfAnalysis>(efAnalysisCacheKey(activityId)) ?? null;
  });
  const [isLoading, setIsLoading] = useState(() =>
    activityId ? cache.get<EfAnalysis>(efAnalysisCacheKey(activityId)) === null : false
  );
  const [error, setError] = useState<string | null>(null);

  const fetchEfAnalysis = useCallback(async () => {
    if (!activityId) {
      setIsLoading(false);
      return;
    }

    setError(null);

    try {
      const { data } = await cache.fetch<EfAnalysis>(
        efAnalysisCacheKey(activityId),
        () => efApi.getActivityEfAnalysis(activityId),
        { onBackground: (fresh) => setEfAnalysis(fresh) },
      );
      setEfAnalysis(data);
    } catch (err) {
      // 404 = pas encore analysée (sortie trop courte, historique insuffisant)
      // — état normal, pas une erreur à afficher, la page ne montre
      // simplement pas les cards EF (pattern déjà en place pour
      // trailStats/surfaceClassification optionnels).
      const status = (err as { response?: { status: number } })?.response?.status;
      if (status !== 404) {
        console.error('Error fetching EF analysis:', err);
        setError('Erreur lors du chargement de l\'analyse EF');
      }
      setEfAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    fetchEfAnalysis();
  }, [fetchEfAnalysis]);

  return { efAnalysis, isLoading, error, refetch: fetchEfAnalysis };
}
