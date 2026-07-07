import { useState, useEffect, useCallback, useRef } from 'react';
import { dashboardApi, type ChartData } from '@/services/api';
import { explorationApi, type ExplorationRateItem } from '@/services/api/exploration';
import { cache } from '@/services/cache';
import { formatNumber } from '@/services/utils/formatters';

const CHART_TTL = 5 * 60 * 1000; // 5 min

// Raw API response types
interface WeeklyBarItem {
  period: string;
  moving_time?: number;
  distance?: number;
  total_elevation_gain?: number;
}

interface WeeklyPaceItem {
  period: string;
  pace_min_km: number;
}

interface RepartitionResponse {
  labels: string[];
  values: number[];
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

interface UseDashboardChartsReturn {
  dailyHoursData: ChartData | null;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  weekLabel: string;
  weekStats: { distance: number; elevation: number; time: string } | null;

  weeklyHoursData: ChartData | null;
  weeklyHoursAverage: string;

  weeklyDistanceData: ChartData | null;
  distanceSport: string;
  setDistanceSport: (sport: string) => void;
  weeklyDistanceAverage: string;

  repartitionData: ChartData | null;
  repartitionSport: string;
  setRepartitionSport: (sport: string) => void;
  repartitionWeeks: number;
  setRepartitionWeeks: (weeks: number) => void;

  weeklyPaceData: ChartData | null;
  paceSport: string;
  setPaceSport: (sport: string) => void;
  weeklyPaceAverage: string;

  conqueteData: ChartData | null;
  conqueteAverage: string;

  weeklyElevationAverage: string;

  globalOffset: number;
  setGlobalOffset: (offset: number) => void;

  isLoading: boolean;
  /** Per-chart refetching flags — use for overlay opacity, not for hiding data */
  isRefetchingDailyHours: boolean;
  isRefetchingWeeklyHours: boolean;
  isRefetchingWeeklyDistance: boolean;
  isRefetchingRepartition: boolean;
  isRefetchingWeeklyPace: boolean;
  isRefetchingConquete: boolean;
  error: string | null;
}

export function useDashboardCharts(): UseDashboardChartsReturn {
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // ── Daily hours ────────────────────────────────────────────────────────────
  const [dailyHoursData, setDailyHoursData] = useState<ChartData | null>(() =>
    cache.get<ChartData>('chart:dailyHours:0')
  );
  const [weekLabel, setWeekLabel] = useState('Semaine en cours');
  const [weekStats, setWeekStats] = useState<{ distance: number; elevation: number; time: string } | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isRefetchingDailyHours, setIsRefetchingDailyHours] = useState(false);

  // ── Weekly hours ───────────────────────────────────────────────────────────
  const [weeklyHoursData, setWeeklyHoursData] = useState<ChartData | null>(() =>
    cache.get<ChartData>('chart:weeklyHours:0')
  );
  const [weeklyHoursAverage, setWeeklyHoursAverage] = useState('-');
  const [isRefetchingWeeklyHours, setIsRefetchingWeeklyHours] = useState(false);

  // ── Weekly distance ────────────────────────────────────────────────────────
  const [weeklyDistanceData, setWeeklyDistanceData] = useState<ChartData | null>(() =>
    cache.get<ChartData>('chart:weeklyDistance:Run,Trail:0')
  );
  const [distanceSport, setDistanceSport] = useState('Run,Trail');
  const [weeklyDistanceAverage, setWeeklyDistanceAverage] = useState('-');
  const [weeklyElevationAverage, setWeeklyElevationAverage] = useState('-');
  const [isRefetchingWeeklyDistance, setIsRefetchingWeeklyDistance] = useState(false);

  // ── Repartition ────────────────────────────────────────────────────────────
  const [repartitionData, setRepartitionData] = useState<ChartData | null>(() =>
    cache.get<ChartData>('chart:repartition:Run,Trail:4')
  );
  const [repartitionSport, setRepartitionSport] = useState('Run,Trail');
  const [repartitionWeeks, setRepartitionWeeks] = useState(4);
  const [isRefetchingRepartition, setIsRefetchingRepartition] = useState(false);

  // ── Weekly pace ────────────────────────────────────────────────────────────
  const [weeklyPaceData, setWeeklyPaceData] = useState<ChartData | null>(() =>
    cache.get<ChartData>('chart:weeklyPace:Run,Trail:0')
  );
  const [paceSport, setPaceSport] = useState('Run,Trail');
  const [weeklyPaceAverage, setWeeklyPaceAverage] = useState('-');
  const [isRefetchingWeeklyPace, setIsRefetchingWeeklyPace] = useState(false);

  // ── Conquête ───────────────────────────────────────────────────────────────
  const [conqueteData, setConqueteData] = useState<ChartData | null>(() =>
    cache.get<ChartData>('chart:conquete:0')
  );
  const [conqueteAverage, setConqueteAverage] = useState('-');
  const [isRefetchingConquete, setIsRefetchingConquete] = useState(false);

  // ── Global offset ──────────────────────────────────────────────────────────
  const [globalOffset, setGlobalOffset] = useState(0);

  const [isLoading, setIsLoading] = useState(
    // Only show global loading if none of the charts have cached data
    dailyHoursData === null &&
    weeklyHoursData === null &&
    weeklyDistanceData === null &&
    repartitionData === null &&
    weeklyPaceData === null
  );
  const [error] = useState<string | null>(null);

  // ── Generic SWR fetch helper ───────────────────────────────────────────────
  // Pattern: show cached data immediately, always fetch fresh in background,
  // call apply(freshData) when done. Never sets state to null.

  const swrFetch = useCallback(async <T>(
    key: string,
    fetcher: () => Promise<T>,
    apply: (data: T) => void,
    setRefetching: (v: boolean) => void,
    label: string,
  ) => {
    // Afficher les données stale immédiatement si en cache
    const stale = cache.get<T>(key);
    if (stale !== null && isMounted.current) {
      apply(stale);
      setRefetching(true);
    }
    // Toujours fetcher du frais (dédupliqué si in-flight) — force=true pour ignorer le TTL et avoir la data fraîche
    try {
      const data = await cache.dedupe(key, fetcher, CHART_TTL);
      if (isMounted.current) {
        apply(data);
        setRefetching(false);
      }
    } catch (err) {
      console.error(`Error fetching ${label}:`, err);
      if (isMounted.current) setRefetching(false);
    }
  }, []);

  // ── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchDailyHours = useCallback(async () => {
    const key = `chart:dailyHours:${weekOffset}`;
    await swrFetch(
      key,
      () => dashboardApi.getDailyHours(weekOffset),
      (data) => {
        if (!isMounted.current) return;
        const datasetsInMinutes = (data.datasets || []).map((ds: { label: string; data: number[] }) => ({
          ...ds,
          data: ds.data.map((minutes: number) => Math.round(minutes)),
        }));
        // Générer les labels avec la date réelle de chaque jour de la semaine
        const DAY_ABBR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
        const today = new Date();
        // Lundi de la semaine courante
        const dayOfWeek = today.getDay(); // 0=dim, 1=lun...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + mondayOffset - weekOffset * 7);
        const weekLabels = DAY_ABBR.map((abbr, i) => {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          return `${abbr} ${d.getDate()}/${d.getMonth() + 1}`;
        });
        const chartData: ChartData = {
          labels: weekLabels,
          datasets: datasetsInMinutes,
          week_range: data.week_range,
          stats: data.stats,
        };
        setDailyHoursData(chartData);
        if (data.week_range) setWeekLabel(weekOffset === 0 ? 'Semaine en cours' : data.week_range);
        if (data.stats) setWeekStats({ distance: data.stats.distance || 0, elevation: data.stats.elevation || 0, time: data.stats.time || '-' });
      },
      setIsRefetchingDailyHours,
      'daily hours',
    );
  }, [weekOffset, swrFetch]);

  const applyWeeklyHours = useCallback((rawData: WeeklyBarItem[]) => {
    if (!isMounted.current) return;
    const totalWeeks = rawData.length;
    const endIndex = totalWeeks - globalOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = rawData.slice(startIndex, endIndex);
    const labels = weekData.map(d => formatDateLabel(d.period));
    const hours = weekData.map(d => (d.moving_time || 0) / 60);
    const avgH = Math.floor(hours.reduce((s, h) => s + h, 0) / (hours.length || 1));
    const avgM = Math.round((hours.reduce((s, h) => s + h, 0) / (hours.length || 1) - avgH) * 60);
    setWeeklyHoursAverage(`${avgH}h${avgM.toString().padStart(2, '0')}/sem`);
    setWeeklyHoursData({ labels, datasets: [{ label: 'Heures', data: hours }] });
  }, [globalOffset]);

  const fetchWeeklyHours = useCallback(async () => {
    await swrFetch(
      `chart:weeklyHours:${globalOffset}`,
      () => dashboardApi.getWeeklyHours(globalOffset) as unknown as Promise<WeeklyBarItem[]>,
      applyWeeklyHours,
      setIsRefetchingWeeklyHours,
      'weekly hours',
    );
  }, [globalOffset, swrFetch, applyWeeklyHours]);

  const applyWeeklyDistance = useCallback((rawData: WeeklyBarItem[]) => {
    if (!isMounted.current) return;
    const totalWeeks = rawData.length;
    const endIndex = totalWeeks - globalOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = rawData.slice(startIndex, endIndex);
    const labels = weekData.map(d => formatDateLabel(d.period));
    const distances = weekData.map(d => d.distance || 0);
    const elevations = weekData.map(d => d.total_elevation_gain || 0);
    setWeeklyDistanceAverage(`${(distances.reduce((s, d) => s + d, 0) / (distances.length || 1)).toFixed(1)} km/sem`);
    setWeeklyElevationAverage(`${formatNumber(elevations.reduce((s, e) => s + e, 0) / (elevations.length || 1))} m D+/sem`);
    setWeeklyDistanceData({ labels, datasets: [{ label: 'Distance', data: distances }, { label: 'D+', data: elevations }] });
  }, [globalOffset]);

  const fetchWeeklyDistance = useCallback(async () => {
    await swrFetch(
      `chart:weeklyDistance:${distanceSport}:${globalOffset}`,
      () => dashboardApi.getWeeklyDistance(distanceSport, globalOffset) as unknown as Promise<WeeklyBarItem[]>,
      applyWeeklyDistance,
      setIsRefetchingWeeklyDistance,
      'weekly distance',
    );
  }, [distanceSport, globalOffset, swrFetch, applyWeeklyDistance]);

  const applyConquete = useCallback((rawData: ExplorationRateItem[]) => {
    if (!isMounted.current) return;
    const totalWeeks = rawData.length;
    const endIndex = totalWeeks - globalOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = rawData.slice(startIndex, endIndex);
    const labels = weekData.map(d => {
      const match = d.period_label.match(/^(\d{4})-W(\d{2})$/);
      if (!match) return d.period_label;
      const year = parseInt(match[1]);
      const week = parseInt(match[2]);
      const jan4 = new Date(year, 0, 4);
      const monday = new Date(jan4);
      monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7) + (week - 1) * 7);
      return `${monday.getDate().toString().padStart(2, '0')}/${(monday.getMonth() + 1).toString().padStart(2, '0')}`;
    });
    const newCells = weekData.map(d => d.new_cells);
    const avg = newCells.reduce((s, v) => s + v, 0) / (newCells.length || 1);
    setConqueteAverage(`${formatNumber(avg)} territoires/sem`);
    setConqueteData({ labels, datasets: [{ label: 'Nouveaux territoires', data: newCells }] });
  }, [globalOffset]);

  const fetchConquete = useCallback(async () => {
    await swrFetch(
      `chart:conquete:${globalOffset}`,
      () => explorationApi.getExplorationRates('week', 'all'),
      applyConquete,
      setIsRefetchingConquete,
      'conquête',
    );
  }, [globalOffset, swrFetch, applyConquete]);

  const fetchRepartition = useCallback(async () => {
    await swrFetch(
      `chart:repartition:${repartitionSport}:${repartitionWeeks}`,
      () => dashboardApi.getRepartition(repartitionSport, repartitionWeeks) as unknown as Promise<RepartitionResponse>,
      (rawData) => {
        if (!isMounted.current) return;
        setRepartitionData({ labels: rawData.labels || [], datasets: [{ label: 'Activités', data: rawData.values || [] }] });
      },
      setIsRefetchingRepartition,
      'repartition',
    );
  }, [repartitionSport, repartitionWeeks, swrFetch]);

  const applyWeeklyPace = useCallback((rawData: WeeklyPaceItem[]) => {
    if (!isMounted.current) return;
    const totalWeeks = rawData.length;
    const endIndex = totalWeeks - globalOffset;
    const startIndex = Math.max(0, endIndex - 10);
    const weekData = rawData.slice(startIndex, endIndex);
    const labels = weekData.map(d => formatDateLabel(d.period));
    const paces = weekData.map(d => d.pace_min_km || null);
    const speeds = paces.map(p => p !== null && p > 0 ? 60 / p : null);
    const validPaces = paces.filter((p): p is number => p !== null && p > 0);
    const averagePace = validPaces.length ? validPaces.reduce((s, p) => s + p, 0) / validPaces.length : 0;
    const minutes = Math.floor(averagePace);
    const seconds = Math.round((averagePace - minutes) * 60);
    setWeeklyPaceAverage(`${minutes}:${seconds.toString().padStart(2, '0')} min/km`);
    setWeeklyPaceData({ labels, datasets: [{ label: 'Allure', data: speeds, _rawPaces: paces } as never] });
  }, [globalOffset]);

  const fetchWeeklyPace = useCallback(async () => {
    await swrFetch(
      `chart:weeklyPace:${paceSport}:${globalOffset}`,
      () => dashboardApi.getWeeklyPace(paceSport, globalOffset) as unknown as Promise<WeeklyPaceItem[]>,
      applyWeeklyPace,
      setIsRefetchingWeeklyPace,
      'weekly pace',
    );
  }, [paceSport, globalOffset, swrFetch, applyWeeklyPace]);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => { fetchDailyHours(); }, [fetchDailyHours]);
  useEffect(() => { fetchWeeklyHours(); }, [fetchWeeklyHours]);
  useEffect(() => { fetchWeeklyDistance(); }, [fetchWeeklyDistance]);
  useEffect(() => { fetchRepartition(); }, [fetchRepartition]);
  useEffect(() => { fetchWeeklyPace(); }, [fetchWeeklyPace]);
  useEffect(() => { fetchConquete(); }, [fetchConquete]);

  // Background refresh on activities-updated — invalidate all chart caches then refetch
  useEffect(() => {
    const handleActivitiesUpdated = () => {
      cache.invalidateByPrefix('chart:');
      fetchDailyHours();
      fetchWeeklyHours();
      fetchWeeklyDistance();
      fetchRepartition();
      fetchWeeklyPace();
      fetchConquete();
    };
    window.addEventListener('activities-updated', handleActivitiesUpdated);
    return () => window.removeEventListener('activities-updated', handleActivitiesUpdated);
  }, [fetchDailyHours, fetchWeeklyHours, fetchWeeklyDistance, fetchRepartition, fetchWeeklyPace, fetchConquete]);

  // Resolve global isLoading once any chart has data
  useEffect(() => {
    if (dailyHoursData || weeklyHoursData || weeklyDistanceData || repartitionData || weeklyPaceData) {
      setIsLoading(false);
    }
  }, [dailyHoursData, weeklyHoursData, weeklyDistanceData, repartitionData, weeklyPaceData]);

  return {
    dailyHoursData,
    weekOffset,
    setWeekOffset,
    weekLabel,
    weekStats,
    weeklyHoursData,
    weeklyHoursAverage,
    weeklyDistanceData,
    distanceSport,
    setDistanceSport,
    weeklyDistanceAverage,
    repartitionData,
    repartitionSport,
    setRepartitionSport,
    repartitionWeeks,
    setRepartitionWeeks,
    weeklyPaceData,
    paceSport,
    setPaceSport,
    weeklyPaceAverage,
    conqueteData,
    conqueteAverage,
    weeklyElevationAverage,
    globalOffset,
    setGlobalOffset,
    isLoading,
    isRefetchingDailyHours,
    isRefetchingWeeklyHours,
    isRefetchingWeeklyDistance,
    isRefetchingRepartition,
    isRefetchingWeeklyPace,
    isRefetchingConquete,
    error,
  };
}
