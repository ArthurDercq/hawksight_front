import { useState, useEffect, useCallback } from 'react';
import {
  dashboardApi,
  formatDateForAPI,
  getWeekBoundaries,
  getMonthBoundaries,
  activitiesApi,
  apiClient,
  explorationApi,
} from '@/services/api';
import type { Activity, LastActivity, StreakData, KPIData, ExplorationStats, ActivityExplorationRate } from '@/types';

interface WeeklySummaryData {
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  sessionCount: number;
  prevWeekComparison: number;
}

interface MonthlySummaryData {
  totalDistance: number;
  totalElevation: number;
  sessionCount: number;
  monthProgress: number;
  trend: number;
  daysPassed: number;
  daysInMonth: number;
}

interface UseDashboardReturn {
  kpis: KPIData | null;
  streak: StreakData | null;
  lastActivity: LastActivity | null;
  lastActivityExploration: ActivityExplorationRate | null;
  recentActivities: LastActivity[];
  weeklySummary: WeeklySummaryData | null;
  monthlySummary: MonthlySummaryData | null;
  explorationStats: ExplorationStats | null;
  isLoading: boolean;
  error: string | null;
  isSyncing: boolean;
  syncData: () => Promise<void>;
}

// Normalize API response - can be array or { activities: [...] }
function normalizeActivities(data: Activity[] | { activities: Activity[] } | null): Activity[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.activities && Array.isArray(data.activities)) return data.activities;
  return [];
}

export function useDashboard(): UseDashboardReturn {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [lastActivity, setLastActivity] = useState<LastActivity | null>(null);
  const [recentActivities, setRecentActivities] = useState<LastActivity[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData | null>(null);
  const [explorationStats, setExplorationStats] = useState<ExplorationStats | null>(null);
  const [lastActivityExploration, setLastActivityExploration] = useState<ActivityExplorationRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDashboardData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);

    try {
      // Prepare all date boundaries (synchronous)
      const { start: weekStart, end: weekEnd } = getWeekBoundaries(0);
      const { start: prevWeekStart, end: prevWeekEnd } = getWeekBoundaries(-1);
      const { start: monthStart, end: monthEnd, daysInMonth, daysPassed } = getMonthBoundaries();
      const prevMonthStart = new Date(monthStart);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      const prevMonthEnd = new Date(prevMonthStart);
      prevMonthEnd.setDate(daysPassed);

      // Fetch ALL data in a single parallel batch
      const [
        kpiData, streakData, lastActivityData, recentData,
        weekActivitiesRaw, prevWeekActivitiesRaw,
        monthActivitiesRaw, prevMonthActivitiesRaw,
        explorationStatsData,
      ] = await Promise.all([
        dashboardApi.getKPIs().catch(() => null),
        dashboardApi.getStreak().catch(() => null),
        dashboardApi.getLastActivity().catch(() => null),
        dashboardApi.getRecentActivities(10).catch(() => [] as LastActivity[]),
        dashboardApi.getActivitiesForPeriod(formatDateForAPI(weekStart), formatDateForAPI(weekEnd)).catch(() => null),
        dashboardApi.getActivitiesForPeriod(formatDateForAPI(prevWeekStart), formatDateForAPI(prevWeekEnd)).catch(() => null),
        dashboardApi.getActivitiesForPeriod(formatDateForAPI(monthStart), formatDateForAPI(monthEnd)).catch(() => null),
        dashboardApi.getActivitiesForPeriod(formatDateForAPI(prevMonthStart), formatDateForAPI(prevMonthEnd)).catch(() => null),
        explorationApi.getStats().catch(() => null),
      ]);

      setKpis(kpiData);
      setStreak(streakData);
      setLastActivity(lastActivityData);
      setRecentActivities(recentData || []);
      setExplorationStats(explorationStatsData);

      if (lastActivityData?.id) {
        explorationApi.getActivityExplorationRate(lastActivityData.id)
          .then(setLastActivityExploration)
          .catch(() => null);
      }

      const weekActivities = normalizeActivities(weekActivitiesRaw);
      const prevWeekActivities = normalizeActivities(prevWeekActivitiesRaw);
      setWeeklySummary(calculateWeekSummary(weekActivities, prevWeekActivities));

      const monthActivities = normalizeActivities(monthActivitiesRaw);
      const prevMonthActivities = normalizeActivities(prevMonthActivitiesRaw);
      setMonthlySummary(calculateMonthSummary(monthActivities, prevMonthActivities, daysInMonth, daysPassed));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Erreur lors du chargement du tableau de bord');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Re-fetch silently when activities are mutated (create/update/delete)
  useEffect(() => {
    const handleActivitiesUpdated = () => { fetchDashboardData(true); };
    window.addEventListener('activities-updated', handleActivitiesUpdated);
    return () => window.removeEventListener('activities-updated', handleActivitiesUpdated);
  }, [fetchDashboardData]);

  // Fonction de synchronisation avec Strava
  const syncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Synchroniser les activités puis les streams
      await activitiesApi.syncActivities();
      await activitiesApi.syncStreams();
      // Vider le cache pour forcer le re-fetch des données fraîches
      apiClient.clearCache();
      await fetchDashboardData();
    } catch (err) {
      console.error('Error syncing data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchDashboardData]);

  return {
    kpis,
    streak,
    lastActivity,
    lastActivityExploration,
    recentActivities,
    weeklySummary,
    monthlySummary,
    explorationStats,
    isLoading,
    error,
    isSyncing,
    syncData,
  };
}

function calculateWeekSummary(
  activities: Activity[],
  prevActivities: Activity[]
): WeeklySummaryData {
  // Backend renvoie: distance en km, moving_time en minutes
  const getDistance = (a: Activity) => a.distance_km ?? a.distance ?? 0;
  const getTime = (a: Activity) => (a.moving_time || 0) * 60;  // Convertir minutes → secondes
  const getElevation = (a: Activity) => a.total_elevation_gain || 0;

  const totalDistance = activities.reduce((sum, a) => sum + getDistance(a), 0);
  const totalTime = activities.reduce((sum, a) => sum + getTime(a), 0);
  const totalElevation = activities.reduce((sum, a) => sum + getElevation(a), 0);

  const prevTotalTime = prevActivities.reduce((sum, a) => sum + getTime(a), 0);
  const comparison =
    prevTotalTime > 0 ? ((totalTime - prevTotalTime) / prevTotalTime) * 100 : totalTime > 0 ? 100 : 0;

  return {
    totalDistance,
    totalTime,
    totalElevation,
    sessionCount: activities.length,
    prevWeekComparison: comparison,
  };
}

function calculateMonthSummary(
  activities: Activity[],
  prevActivities: Activity[],
  daysInMonth: number,
  daysPassed: number
): MonthlySummaryData {
  // Backend renvoie: distance en km, moving_time en minutes
  const getDistance = (a: Activity) => a.distance_km ?? a.distance ?? 0;
  const getTime = (a: Activity) => (a.moving_time || 0) * 60;  // Convertir minutes → secondes
  const getElevation = (a: Activity) => a.total_elevation_gain || 0;

  const totalDistance = activities.reduce((sum, a) => sum + getDistance(a), 0);
  const totalTime = activities.reduce((sum, a) => sum + getTime(a), 0);
  const totalElevation = activities.reduce((sum, a) => sum + getElevation(a), 0);

  const prevTotalTime = prevActivities.reduce((sum, a) => sum + getTime(a), 0);
  const trend =
    prevTotalTime > 0 ? ((totalTime - prevTotalTime) / prevTotalTime) * 100 : totalTime > 0 ? 100 : 0;

  return {
    totalDistance,
    totalElevation,
    sessionCount: activities.length,
    monthProgress: (daysPassed / daysInMonth) * 100,
    trend,
    daysPassed,
    daysInMonth,
  };
}
