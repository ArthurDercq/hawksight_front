import { useState, useEffect, useCallback, useRef } from 'react';
import { kpiApi } from '@/services/api';
import { cache } from '@/services/cache';
import type { KPIData, RecordsData } from '@/types';

const KPI_TTL = 5 * 60 * 1000; // 5 min

function cacheKey(year: number | null) {
  return `kpi:${year ?? 'all'}`;
}

interface UseKPIReturn {
  kpis: KPIData | null;
  records: RecordsData | null;
  selectedYear: number | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;
  setSelectedYear: (year: number | null) => void;
  refetch: () => void;
}

export function useKPI(): UseKPIReturn {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Seed from cache immediately
  const [kpis, setKpis] = useState<KPIData | null>(() =>
    cache.get<{ kpis: KPIData; records: RecordsData }>(cacheKey(null))?.kpis ?? null
  );
  const [records, setRecords] = useState<RecordsData | null>(() =>
    cache.get<{ kpis: KPIData; records: RecordsData }>(cacheKey(null))?.records ?? null
  );

  const hasCachedData = kpis !== null || records !== null;
  const [isLoading, setIsLoading] = useState(!hasCachedData);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    setError(null);
    const key = cacheKey(selectedYear);
    const cached = cache.get<{ kpis: KPIData; records: RecordsData }>(key);

    if (cached) {
      // Apply cached data immediately, then background-refresh
      if (cached.kpis) setKpis(cached.kpis);
      if (cached.records) setRecords(cached.records);
      setIsLoading(false);
      setIsRefetching(true);
    } else {
      // Only show full loading screen if we have NO data at all yet
      setIsLoading(kpis === null && records === null);
      if (kpis !== null || records !== null) setIsRefetching(true);
    }

    try {
      const result = await cache.dedupe(key, async () => {
        const [kpiData, recordsData] = await Promise.all([
          kpiApi.getKPIs(selectedYear || undefined),
          kpiApi.getRecords(),
        ]);
        return { kpis: kpiData, records: recordsData };
      }, KPI_TTL);

      if (!isMounted.current) return;
      // Never set to null — only update if we got real data
      if (result.kpis) setKpis(result.kpis);
      if (result.records) setRecords(result.records);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      if (isMounted.current) setError('Erreur lors du chargement des statistiques');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.invalidate(cacheKey(selectedYear));
    fetchData();
  }, [fetchData, selectedYear]);

  return {
    kpis,
    records,
    selectedYear,
    isLoading,
    isRefetching,
    error,
    setSelectedYear,
    refetch,
  };
}
