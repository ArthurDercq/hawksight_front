import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { explorationApi } from '@/services/api';
import type { ExplorationGeoJSON, ExplorationStats, ExplorationFeature, SportFilter } from '@/types';

// H3 resolution 6 cell area in km²
const H3_RES6_AREA_KM2 = 0.7373;

interface UseExplorationReturn {
  data: ExplorationGeoJSON | null;
  stats: ExplorationStats | null;
  isLoading: boolean;
  isFetching: boolean;
  error: string | null;
  sportFilter: SportFilter;
  setSportFilter: (filter: SportFilter) => void;
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
  refetch: () => void;
}

// Maps frontend filter values to actual DB sport values (PascalCase from Strava normalization)
const SPORT_FILTER_MAP: Record<string, string[]> = {
  run:   ['Run'],
  trail: ['Trail', 'TrailRun'],
  bike:  ['bike'],
  other: ['Walk', 'Hike'],
};

const ALL_KNOWN_SPORTS = Object.values(SPORT_FILTER_MAP).flat();

function matchesSport(feature: ExplorationFeature, filter: SportFilter): boolean {
  if (filter === 'all') return true;
  const sports = feature.properties.sports ?? [];
  if (filter === 'other') return sports.every((s) => !ALL_KNOWN_SPORTS.includes(s));
  return (SPORT_FILTER_MAP[filter] ?? []).some((s) => sports.includes(s));
}

function computeStats(
  features: ExplorationFeature[],
  baseStats: ExplorationStats
): ExplorationStats {
  const currentYear = new Date().getFullYear();
  const totalCells = features.length;
  const newThisYear = features.filter((f) => {
    const firstSeen = f.properties.first_seen;
    return firstSeen && new Date(firstSeen).getFullYear() === currentYear;
  }).length;

  const surface = totalCells * H3_RES6_AREA_KM2;
  const noveltyPercent = totalCells > 0 ? (newThisYear / totalCells) * 100 : 0;

  // exploration_score and new_cells_per_month come from the backend (need all-time data)
  // we scale them proportionally to the filtered subset
  const ratio = baseStats.total_cells > 0 ? totalCells / baseStats.total_cells : 0;

  return {
    total_cells: totalCells,
    surface_km2: surface,
    new_this_year: newThisYear,
    novelty_percent: noveltyPercent,
    exploration_score: baseStats.exploration_score * ratio,
    new_cells_per_month: baseStats.new_cells_per_month * ratio,
  };
}

export function useExploration(): UseExplorationReturn {
  const [allData, setAllData] = useState<ExplorationGeoJSON | null>(null);
  const [baseStats, setBaseStats] = useState<ExplorationStats | null>(null);
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const fetchData = useCallback(async () => {
    if (hasLoadedOnce.current) {
      setIsFetching(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const geojson = await explorationApi.getExploration({
        year: selectedYear || undefined,
      });
      setAllData(geojson);
      setBaseStats(geojson.stats);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error fetching exploration data:', err);
      setError("Erreur lors du chargement des données d'exploration");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredData = useMemo<ExplorationGeoJSON | null>(() => {
    if (!allData) return null;
    if (sportFilter === 'all') return allData;
    return {
      ...allData,
      features: allData.features.filter((f) => matchesSport(f, sportFilter)),
    };
  }, [allData, sportFilter]);

  const stats = useMemo<ExplorationStats | null>(() => {
    if (!filteredData || !baseStats) return null;
    if (sportFilter === 'all') return baseStats;
    return computeStats(filteredData.features, baseStats);
  }, [filteredData, baseStats, sportFilter]);

  return {
    data: filteredData,
    stats,
    isLoading,
    isFetching,
    error,
    sportFilter,
    setSportFilter,
    selectedYear,
    setSelectedYear,
    refetch: fetchData,
  };
}
