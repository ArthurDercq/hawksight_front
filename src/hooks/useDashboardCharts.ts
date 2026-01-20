import { useState, useEffect, useCallback } from 'react';
import { dashboardApi, type ChartData } from '@/services/api';

// Raw API response types
interface WeeklyBarItem {
  period: string;
  moving_time?: number;
  distance?: number;
}

interface WeeklyPaceItem {
  period: string;
  pace_min_km: number;
}

interface RepartitionResponse {
  labels: string[];
  values: number[];
}

// Helper to format date as DD/MM
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
}

interface UseDashboardChartsReturn {
  // Daily hours chart
  dailyHoursData: ChartData | null;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  weekLabel: string;
  weekStats: { distance: number; elevation: number; time: string } | null;

  // Weekly hours chart
  weeklyHoursData: ChartData | null;
  weeklyHoursAverage: string;

  // Weekly distance chart
  weeklyDistanceData: ChartData | null;
  distanceSport: string;
  setDistanceSport: (sport: string) => void;
  weeklyDistanceAverage: string;

  // Repartition chart
  repartitionData: ChartData | null;
  repartitionSport: string;
  setRepartitionSport: (sport: string) => void;
  repartitionWeeks: number;
  setRepartitionWeeks: (weeks: number) => void;

  // Weekly pace chart
  weeklyPaceData: ChartData | null;
  paceSport: string;
  setPaceSport: (sport: string) => void;
  weeklyPaceAverage: string;

  // Global offset for weekly charts
  globalOffset: number;
  setGlobalOffset: (offset: number) => void;

  isLoading: boolean;
  error: string | null;
}

export function useDashboardCharts(): UseDashboardChartsReturn {
  // Daily hours state
  const [dailyHoursData, setDailyHoursData] = useState<ChartData | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekLabel, setWeekLabel] = useState('Semaine en cours');
  const [weekStats, setWeekStats] = useState<{ distance: number; elevation: number; time: string } | null>(null);

  // Weekly hours state
  const [weeklyHoursData, setWeeklyHoursData] = useState<ChartData | null>(null);
  const [weeklyHoursAverage, setWeeklyHoursAverage] = useState('-');

  // Weekly distance state
  const [weeklyDistanceData, setWeeklyDistanceData] = useState<ChartData | null>(null);
  const [distanceSport, setDistanceSport] = useState('Run,Trail');
  const [weeklyDistanceAverage, setWeeklyDistanceAverage] = useState('-');

  // Repartition state
  const [repartitionData, setRepartitionData] = useState<ChartData | null>(null);
  const [repartitionSport, setRepartitionSport] = useState('Run,Trail');
  const [repartitionWeeks, setRepartitionWeeks] = useState(4);

  // Weekly pace state
  const [weeklyPaceData, setWeeklyPaceData] = useState<ChartData | null>(null);
  const [paceSport, setPaceSport] = useState('Run,Trail');
  const [weeklyPaceAverage, setWeeklyPaceAverage] = useState('-');

  // Global offset for weekly charts
  const [globalOffset, setGlobalOffset] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch daily hours
  const fetchDailyHours = useCallback(async () => {
    try {
      const data = await dashboardApi.getDailyHours(weekOffset);

      // Ensure datasets array exists even if empty
      const chartData: ChartData = {
        labels: data.labels || ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: data.datasets || [],
        week_range: data.week_range,
        stats: data.stats,
      };
      setDailyHoursData(chartData);

      if (data.week_range) {
        setWeekLabel(weekOffset === 0 ? 'Semaine en cours' : data.week_range);
      }

      if (data.stats) {
        setWeekStats({
          distance: data.stats.distance || 0,
          elevation: data.stats.elevation || 0,
          time: data.stats.time || '-',
        });
      }
    } catch (err) {
      console.error('Error fetching daily hours:', err);
    }
  }, [weekOffset]);

  // Fetch weekly hours
  const fetchWeeklyHours = useCallback(async () => {
    try {
      const rawData = await dashboardApi.getWeeklyHours(globalOffset) as unknown as WeeklyBarItem[];

      // Take last 10 weeks
      const totalWeeks = rawData.length;
      const endIndex = totalWeeks - globalOffset;
      const startIndex = Math.max(0, endIndex - 10);
      const weekData = rawData.slice(startIndex, endIndex);

      // Transform to Chart.js format
      const labels = weekData.map(d => formatDateLabel(d.period));
      const hours = weekData.map(d => (d.moving_time || 0) / 60); // Convert minutes to hours

      // Calculate average
      const totalHours = hours.reduce((sum, h) => sum + h, 0);
      const averageHours = hours.length > 0 ? totalHours / hours.length : 0;
      const avgH = Math.floor(averageHours);
      const avgM = Math.round((averageHours - avgH) * 60);
      setWeeklyHoursAverage(`${avgH}h${avgM.toString().padStart(2, '0')}/sem`);

      setWeeklyHoursData({
        labels,
        datasets: [{ label: 'Heures', data: hours }],
      });
    } catch (err) {
      console.error('Error fetching weekly hours:', err);
    }
  }, [globalOffset]);

  // Fetch weekly distance
  const fetchWeeklyDistance = useCallback(async () => {
    try {
      const rawData = await dashboardApi.getWeeklyDistance(distanceSport, globalOffset) as unknown as WeeklyBarItem[];

      // Take last 10 weeks
      const totalWeeks = rawData.length;
      const endIndex = totalWeeks - globalOffset;
      const startIndex = Math.max(0, endIndex - 10);
      const weekData = rawData.slice(startIndex, endIndex);

      // Transform to Chart.js format
      const labels = weekData.map(d => formatDateLabel(d.period));
      const distances = weekData.map(d => d.distance || 0);

      // Calculate average
      const totalDistance = distances.reduce((sum, d) => sum + d, 0);
      const averageDistance = distances.length > 0 ? totalDistance / distances.length : 0;
      setWeeklyDistanceAverage(`${averageDistance.toFixed(1)} km/sem`);

      setWeeklyDistanceData({
        labels,
        datasets: [{ label: 'Distance', data: distances }],
      });
    } catch (err) {
      console.error('Error fetching weekly distance:', err);
    }
  }, [distanceSport, globalOffset]);

  // Fetch repartition
  const fetchRepartition = useCallback(async () => {
    try {
      const rawData = await dashboardApi.getRepartition(repartitionSport, repartitionWeeks) as unknown as RepartitionResponse;

      // API returns { labels: [...], values: [...] }
      setRepartitionData({
        labels: rawData.labels || [],
        datasets: [{ label: 'Activités', data: rawData.values || [] }],
      });
    } catch (err) {
      console.error('Error fetching repartition:', err);
    }
  }, [repartitionSport, repartitionWeeks]);

  // Fetch weekly pace
  const fetchWeeklyPace = useCallback(async () => {
    try {
      const rawData = await dashboardApi.getWeeklyPace(paceSport, globalOffset) as unknown as WeeklyPaceItem[];

      // Take last 10 weeks
      const totalWeeks = rawData.length;
      const endIndex = totalWeeks - globalOffset;
      const startIndex = Math.max(0, endIndex - 10);
      const weekData = rawData.slice(startIndex, endIndex);

      // Transform to Chart.js format
      const labels = weekData.map(d => formatDateLabel(d.period));
      const paces = weekData.map(d => d.pace_min_km || 0);

      // Calculate average
      const totalPace = paces.reduce((sum, p) => sum + p, 0);
      const averagePace = paces.length > 0 ? totalPace / paces.length : 0;
      const minutes = Math.floor(averagePace);
      const seconds = Math.round((averagePace - minutes) * 60);
      setWeeklyPaceAverage(`${minutes}:${seconds.toString().padStart(2, '0')} min/km`);

      setWeeklyPaceData({
        labels,
        datasets: [{ label: 'Allure', data: paces }],
      });
    } catch (err) {
      console.error('Error fetching weekly pace:', err);
    }
  }, [paceSport, globalOffset]);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchDailyHours(),
          fetchWeeklyHours(),
          fetchWeeklyDistance(),
          fetchRepartition(),
          fetchWeeklyPace(),
        ]);
      } catch (err) {
        setError('Erreur lors du chargement des graphiques');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [fetchDailyHours, fetchWeeklyHours, fetchWeeklyDistance, fetchRepartition, fetchWeeklyPace]);

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
    globalOffset,
    setGlobalOffset,
    isLoading,
    error,
  };
}
