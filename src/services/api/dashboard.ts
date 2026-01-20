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
    const response = await apiClient.get<KPIData>('/kpi/', { params });
    return response.data;
  },

  async getStreak(): Promise<StreakData> {
    const response = await apiClient.get<StreakData>('/kpi/streak');
    return response.data;
  },

  async getLastActivity(sportType?: string): Promise<LastActivity> {
    const params = sportType ? { sport_type: sportType } : {};
    const response = await apiClient.get<LastActivity>('/activities/last_activity', { params });
    return response.data;
  },

  async getActivitiesForPeriod(startDate: string, endDate: string): Promise<Activity[] | { activities: Activity[] }> {
    const response = await apiClient.get<Activity[] | { activities: Activity[] }>('/activities/filter_activities', {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  // Chart endpoints for analytics
  async getDailyHours(weekOffset: number = 0): Promise<ChartData> {
    const response = await apiClient.get<ChartData>('/plot/daily_hours_bar', {
      params: { week_offset: weekOffset },
    });
    return response.data;
  },

  async getWeeklyHours(offset: number = 0): Promise<ChartData> {
    // Use weeks parameter: 11 + offset to include current week
    const weeks = 11 + Math.abs(offset);
    const response = await apiClient.get<ChartData>('/plot/weekly_bar', {
      params: { value_col: 'moving_time', weeks },
    });
    return response.data;
  },

  async getWeeklyDistance(sport: string = 'Run,Trail', offset: number = 0): Promise<ChartData> {
    const weeks = 11 + Math.abs(offset);
    const sportTypes = sport.split(',');
    const params = new URLSearchParams();
    params.append('value_col', 'distance');
    params.append('weeks', weeks.toString());
    sportTypes.forEach(s => params.append('sport_types', s.trim()));

    const response = await apiClient.get<ChartData>(`/plot/weekly_bar?${params.toString()}`);
    return response.data;
  },

  async getRepartition(sport: string = 'Run,Trail', weeks: number = 4): Promise<ChartData> {
    const sportTypes = sport.split(',');
    const params = new URLSearchParams();
    params.append('weeks', weeks.toString());
    sportTypes.forEach(s => params.append('sport_type', s.trim()));

    const response = await apiClient.get<ChartData>(`/plot/repartition_run?${params.toString()}`);
    return response.data;
  },

  async getWeeklyPace(sport: string = 'Run,Trail', offset: number = 0): Promise<ChartData> {
    const weeks = 11 + Math.abs(offset);
    const sportTypes = sport.split(',');
    const params = new URLSearchParams();
    params.append('weeks', weeks.toString());
    sportTypes.forEach(s => params.append('sport_types', s.trim()));

    const response = await apiClient.get<ChartData>(`/plot/weekly_pace?${params.toString()}`);
    return response.data;
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
