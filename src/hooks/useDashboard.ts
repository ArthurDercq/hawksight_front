import { useState, useEffect, useCallback, useRef } from 'react';
import {
  dashboardApi,
  formatDateForAPI,
  getWeekBoundaries,
  getMonthBoundaries,
  activitiesApi,
  apiClient,
  explorationApi,
} from '@/services/api';
import { cache } from '@/services/cache';
import type { Activity, LastActivity, StreakData, KPIData, ExplorationStats, ActivityExplorationRate } from '@/types';

const CACHE_KEY = 'dashboard:main';
const CACHE_TTL = 5 * 60 * 1000; // 5 min

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

interface DashboardSnapshot {
  kpis: KPIData | null;
  streak: StreakData | null;
  lastActivity: LastActivity | null;
  lastActivityExploration: ActivityExplorationRate | null;
  recentActivities: LastActivity[];
  weeklySummary: WeeklySummaryData | null;
  monthlySummary: MonthlySummaryData | null;
  explorationStats: ExplorationStats | null;
}

interface UseDashboardReturn extends DashboardSnapshot {
  isLoading: boolean;
  isRefetching: boolean;
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

async function fetchAllDashboardData(): Promise<DashboardSnapshot> {
  const { start: weekStart, end: weekEnd } = getWeekBoundaries(0);
  const { start: prevWeekStart, end: prevWeekEnd } = getWeekBoundaries(-1);
  const { start: monthStart, end: monthEnd, daysInMonth, daysPassed } = getMonthBoundaries();
  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonthEnd = new Date(prevMonthStart);
  prevMonthEnd.setDate(daysPassed);

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

  let lastActivityExploration: ActivityExplorationRate | null = null;
  if (lastActivityData?.id) {
    lastActivityExploration = await explorationApi
      .getActivityExplorationRate(lastActivityData.id)
      .catch(() => null);
  }

  const weekActivities = normalizeActivities(weekActivitiesRaw);
  const prevWeekActivities = normalizeActivities(prevWeekActivitiesRaw);
  const monthActivities = normalizeActivities(monthActivitiesRaw);
  const prevMonthActivities = normalizeActivities(prevMonthActivitiesRaw);

  return {
    kpis: kpiData,
    streak: streakData,
    lastActivity: lastActivityData,
    lastActivityExploration,
    recentActivities: recentData || [],
    explorationStats: explorationStatsData,
    weeklySummary: calculateWeekSummary(weekActivities, prevWeekActivities),
    monthlySummary: calculateMonthSummary(monthActivities, prevMonthActivities, daysInMonth, daysPassed),
  };
}

export function useDashboard(): UseDashboardReturn {
  // Seed state from cache immediately (stale-while-revalidate)
  const cached = cache.get<DashboardSnapshot>(CACHE_KEY);

  const [kpis, setKpis] = useState<KPIData | null>(cached?.kpis ?? null);
  const [streak, setStreak] = useState<StreakData | null>(cached?.streak ?? null);
  const [lastActivity, setLastActivity] = useState<LastActivity | null>(cached?.lastActivity ?? null);
  const [lastActivityExploration, setLastActivityExploration] = useState<ActivityExplorationRate | null>(cached?.lastActivityExploration ?? null);
  const [recentActivities, setRecentActivities] = useState<LastActivity[]>(cached?.recentActivities ?? []);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummaryData | null>(cached?.weeklySummary ?? null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryData | null>(cached?.monthlySummary ?? null);
  const [explorationStats, setExplorationStats] = useState<ExplorationStats | null>(cached?.explorationStats ?? null);

  // isLoading = true only when there is no data at all (first ever load)
  const [isLoading, setIsLoading] = useState(cached === null);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Prevent stale closures from overwriting fresh data after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  /**
   * Swap all states atomically — never sets anything to null.
   * Only updates a field if the new value is non-null.
   */
  const applySnapshot = useCallback((snap: DashboardSnapshot) => {
    if (!isMounted.current) return;
    if (snap.kpis !== null) setKpis(snap.kpis);
    if (snap.streak !== null) setStreak(snap.streak);
    if (snap.lastActivity !== null) setLastActivity(snap.lastActivity);
    if (snap.lastActivityExploration !== null) setLastActivityExploration(snap.lastActivityExploration);
    if (snap.recentActivities.length > 0) setRecentActivities(snap.recentActivities);
    if (snap.weeklySummary !== null) setWeeklySummary(snap.weeklySummary);
    if (snap.monthlySummary !== null) setMonthlySummary(snap.monthlySummary);
    if (snap.explorationStats !== null) setExplorationStats(snap.explorationStats);
  }, []);

  const fetchDashboardData = useCallback(async (invalidateFirst = false) => {
    setError(null);

    if (invalidateFirst) {
      cache.invalidate(CACHE_KEY);
      // We already have data in React states — never show full loading screen on invalidation
      setIsRefetching(true);
    } else {
      // Apply stale cache immediately (SWR step 1)
      const stale = cache.get<DashboardSnapshot>(CACHE_KEY);
      if (stale) {
        applySnapshot(stale);
        setIsLoading(false);
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
    }

    // Always fetch fresh in background (SWR step 2) — deduped
    try {
      const fresh = await cache.dedupe(CACHE_KEY, fetchAllDashboardData, CACHE_TTL);
      applySnapshot(fresh);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      if (isMounted.current) setError('Erreur lors du chargement du tableau de bord');
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [applySnapshot]);

  // Initial fetch on mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Silent background refresh when activities are mutated — never resets to null
  useEffect(() => {
    const handleActivitiesUpdated = () => {
      fetchDashboardData(true); // invalidate cache, then background fetch → atomic swap
    };
    window.addEventListener('activities-updated', handleActivitiesUpdated);
    return () => window.removeEventListener('activities-updated', handleActivitiesUpdated);
  }, [fetchDashboardData]);

  const syncData = useCallback(async () => {
    setIsSyncing(true);
    try {
      await activitiesApi.syncActivities();
      await activitiesApi.syncStreams();
      apiClient.clearCache();
      // Full cache invalidation after sync, then background refresh
      await fetchDashboardData(true);
    } catch (err) {
      console.error('Error syncing data:', err);
    } finally {
      if (isMounted.current) setIsSyncing(false);
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
    isRefetching,
    error,
    isSyncing,
    syncData,
  };
}

function calculateWeekSummary(
  activities: Activity[],
  prevActivities: Activity[]
): WeeklySummaryData {
  const getDistance = (a: Activity) => a.distance_km ?? a.distance ?? 0;
  const getTime = (a: Activity) => (a.moving_time || 0) * 60;
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
  const getDistance = (a: Activity) => a.distance_km ?? a.distance ?? 0;
  const getTime = (a: Activity) => (a.moving_time || 0) * 60;
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
