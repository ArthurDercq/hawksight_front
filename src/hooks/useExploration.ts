import { useState, useEffect, useCallback } from 'react';
import { explorationApi } from '@/services/api';
import type { ExplorationGeoJSON, ExplorationStats, SportFilter } from '@/types';

interface UseExplorationReturn {
  data: ExplorationGeoJSON | null;
  stats: ExplorationStats | null;
  isLoading: boolean;
  error: string | null;
  sportFilter: SportFilter;
  setSportFilter: (filter: SportFilter) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  refetch: () => void;
}

export function useExploration(): UseExplorationReturn {
  const [data, setData] = useState<ExplorationGeoJSON | null>(null);
  const [stats, setStats] = useState<ExplorationStats | null>(null);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const geojson = await explorationApi.getExploration({
        sport: sportFilter,
        year: selectedYear || undefined,
      });
      setData(geojson);
      setStats(geojson.stats);
    } catch (err) {
      console.error('Error fetching exploration data:', err);
      setError("Erreur lors du chargement des données d'exploration");
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    stats,
    isLoading,
    error,
    sportFilter,
    setSportFilter,
    selectedYear,
    setSelectedYear,
    refetch: fetchData,
  };
}
