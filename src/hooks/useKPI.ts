import { useState, useEffect, useCallback } from 'react';
import { kpiApi } from '@/services/api';
import type { KPIData, RecordsData } from '@/types';

interface UseKPIReturn {
  kpis: KPIData | null;
  records: RecordsData | null;
  selectedYear: number | null;
  isLoading: boolean;
  error: string | null;
  setSelectedYear: (year: number | null) => void;
  refetch: () => void;
}

export function useKPI(): UseKPIReturn {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [records, setRecords] = useState<RecordsData | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (cancelled: { current: boolean }) => {
    setIsLoading(true);
    setError(null);

    try {
      const [kpiData, recordsData] = await Promise.all([
        kpiApi.getKPIs(selectedYear || undefined),
        kpiApi.getRecords(),
      ]);
      if (!cancelled.current) {
        setKpis(kpiData);
        setRecords(recordsData);
      }
    } catch (err) {
      if (!cancelled.current) {
        console.error('Error fetching KPIs:', err);
        setError('Erreur lors du chargement des statistiques');
      }
    } finally {
      if (!cancelled.current) {
        setIsLoading(false);
      }
    }
  }, [selectedYear]);

  useEffect(() => {
    const cancelled = { current: false };
    fetchData(cancelled);
    return () => { cancelled.current = true; };
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData({ current: false });
  }, [fetchData]);

  return {
    kpis,
    records,
    selectedYear,
    isLoading,
    error,
    setSelectedYear,
    refetch,
  };
}
