import { useState, useEffect, useCallback } from 'react';
import {
  dashboardApi,
  formatDateForAPI,
  getWeekBoundaries,
  getMonthBoundaries,
  activitiesApi,
} from '@/services/api';
import type { Activity, LastActivity, StreakData, KPIData } from '@/types';

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
  weeklySummary: WeeklySummaryData | null;
  monthlySummary: MonthlySummaryData | null;
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
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [kpiData, streakData, lastActivityData] = await Promise.all([
        dashboardApi.getKPIs().catch(() => null),
        dashboardApi.getStreak().catch(() => null),
        dashboardApi.getLastActivity().catch(() => null),
      ]);

      setKpis(kpiData);
      setStreak(streakData);
      setLastActivity(lastActivityData);

      // Fetch weekly summary
      const { start: weekStart, end: weekEnd } = getWeekBoundaries(0);
      const { start: prevWeekStart, end: prevWeekEnd } = getWeekBoundaries(-1);

      const [weekActivitiesRaw, prevWeekActivitiesRaw] = await Promise.all([
        dashboardApi
          .getActivitiesForPeriod(formatDateForAPI(weekStart), formatDateForAPI(weekEnd))
          .catch(() => null),
        dashboardApi
          .getActivitiesForPeriod(formatDateForAPI(prevWeekStart), formatDateForAPI(prevWeekEnd))
          .catch(() => null),
      ]);

      const weekActivities = normalizeActivities(weekActivitiesRaw);
      const prevWeekActivities = normalizeActivities(prevWeekActivitiesRaw);
      const weekData = calculateWeekSummary(weekActivities, prevWeekActivities);
      setWeeklySummary(weekData);

      // Fetch monthly summary
      const { start: monthStart, end: monthEnd, daysInMonth, daysPassed } = getMonthBoundaries();

      // Previous month comparison (same number of days)
      const prevMonthStart = new Date(monthStart);
      prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
      const prevMonthEnd = new Date(prevMonthStart);
      prevMonthEnd.setDate(daysPassed);

      const [monthActivitiesRaw, prevMonthActivitiesRaw] = await Promise.all([
        dashboardApi
          .getActivitiesForPeriod(formatDateForAPI(monthStart), formatDateForAPI(monthEnd))
          .catch(() => null),
        dashboardApi
          .getActivitiesForPeriod(formatDateForAPI(prevMonthStart), formatDateForAPI(prevMonthEnd))
          .catch(() => null),
      ]);

      const monthActivities = normalizeActivities(monthActivitiesRaw);
      const prevMonthActivities = normalizeActivities(prevMonthActivitiesRaw);
      const monthData = calculateMonthSummary(
        monthActivities,
        prevMonthActivities,
        daysInMonth,
        daysPassed
      );
      setMonthlySummary(monthData);
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

  // Fonction de synchronisation avec Strava
  const syncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      // Synchroniser les activités puis les streams
      await activitiesApi.syncActivities();
      await activitiesApi.syncStreams();
      // Recharger les données du dashboard
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
    weeklySummary,
    monthlySummary,
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
  const getDistance = (a: Activity) => a.distance_km || a.distance / 1000 || 0;
  const getTime = (a: Activity) => a.moving_time || 0;
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
  const getDistance = (a: Activity) => a.distance_km || a.distance / 1000 || 0;
  const getTime = (a: Activity) => a.moving_time || 0;
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
