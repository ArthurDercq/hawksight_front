import { apiClient } from './client';
import type { Activity, LastActivity, StreakData, KPIData } from '@/types';

// Chart data types for analytics
export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
  week_range?: string;
  stats?: {
    distance?: number;
    elevation?: number;
    time?: string;
  };
  average?: number | string;
}

export interface WeeklySummary {
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  sessionCount: number;
  activities: Activity[];
}

export interface MonthlySummary {
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  sessionCount: number;
  monthProgress: number;
  trend: number;
}

export const dashboardApi = {
  async getKPIs(year?: number): Promise<KPIData> {
    const params = year ? { year } : {};
    return apiClient.fetchWithCache<KPIData>('/kpi/', { params });
  },

  async getStreak(): Promise<StreakData> {
    return apiClient.fetchWithCache<StreakData>('/kpi/streak');
  },

  async getLastActivity(sportType?: string): Promise<LastActivity> {
    const params = sportType ? { sport_type: sportType } : {};
    return apiClient.fetchWithCache<LastActivity>('/activities/last_activity', { params });
  },

  async getRecentActivities(n: number = 3): Promise<LastActivity[]> {
    return apiClient.fetchWithCache<LastActivity[]>('/activities/recent', { params: { n } });
  },

  async getActivitiesForPeriod(startDate: string, endDate: string): Promise<Activity[]> {
    const res = await apiClient.fetchWithCache<{ activities: Activity[] } | Activity[]>('/activities/filter_activities', {
      params: { start_date: startDate, end_date: endDate },
    });
    return Array.isArray(res) ? res : res.activities;
  },

  // Chart endpoints for analytics
  async getDailyHours(weekOffset: number = 0): Promise<ChartData> {
    return apiClient.fetchWithCache<ChartData>('/plot/daily_hours_bar', {
      params: { week_offset: weekOffset },
    });
  },

  async getWeeklyHours(offset: number = 0): Promise<ChartData> {
    const weeks = 12 + Math.abs(offset);
    return apiClient.fetchWithCache<ChartData>('/plot/weekly_bar', {
      params: { value_col: 'moving_time', weeks },
    });
  },

  async getWeeklyDistance(sport: string = 'Run,Trail', offset: number = 0): Promise<ChartData> {
    const weeks = 12 + Math.abs(offset);
    const sportTypes = sport.split(',');
    const params = new URLSearchParams();
    params.append('value_col', 'distance');
    params.append('weeks', weeks.toString());
    sportTypes.forEach(s => params.append('sport_types', s.trim()));

    return apiClient.fetchWithCache<ChartData>(`/plot/weekly_bar?${params.toString()}`);
  },

  async getRepartition(sport: string = 'Run,Trail', weeks: number = 4): Promise<ChartData> {
    const sportTypes = sport.split(',');
    const params = new URLSearchParams();
    params.append('weeks', weeks.toString());
    sportTypes.forEach(s => params.append('sport_type', s.trim()));

    return apiClient.fetchWithCache<ChartData>(`/plot/repartition_run?${params.toString()}`);
  },

  async getWeeklyPace(sport: string = 'Run,Trail', offset: number = 0): Promise<ChartData> {
    const weeks = 12 + Math.abs(offset);
    const sportTypes = sport.split(',');
    const params = new URLSearchParams();
    params.append('weeks', weeks.toString());
    sportTypes.forEach(s => params.append('sport_types', s.trim()));

    return apiClient.fetchWithCache<ChartData>(`/plot/weekly_pace?${params.toString()}`);
  },
};

// Helper to format date for API (YYYY-MM-DD)
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get week boundaries (Monday to Sunday)
export function getWeekBoundaries(weekOffset: number = 0): { start: Date; end: Date } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday + weekOffset * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

// Helper to get month boundaries
export function getMonthBoundaries(): { start: Date; end: Date; daysInMonth: number; daysPassed: number } {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return {
    start: firstDay,
    end: lastDay,
    daysInMonth: lastDay.getDate(),
    daysPassed: today.getDate(),
  };
}
