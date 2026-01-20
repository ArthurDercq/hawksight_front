import { useState, useEffect, useCallback } from 'react';
import { activitiesApi } from '@/services/api';
import type { Activity } from '@/types';

interface UseCalendarReturn {
  currentDate: Date;
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  previousMonth: () => void;
  nextMonth: () => void;
  goToToday: () => void;
}

export function useCalendar(): UseCalendarReturn {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all activities and filter client-side for simplicity
      const data = await activitiesApi.getActivities();
      setActivities(data);
    } catch (err) {
      console.error('Error fetching calendar activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const previousMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return {
    currentDate,
    activities,
    isLoading,
    error,
    previousMonth,
    nextMonth,
    goToToday,
  };
}

// Helper to get activities for a specific date
export function getActivitiesForDate(activities: Activity[], date: Date): Activity[] {
  const dateKey = formatDateKey(date);
  return activities.filter((activity) => {
    const activityDate = new Date(activity.start_date);
    return formatDateKey(activityDate) === dateKey;
  });
}

// Helper to format date as YYYY-MM-DD
export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Helper to get calendar grid data
export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: Activity[];
}

export interface CalendarWeek {
  days: CalendarDay[];
  stats: {
    totalDistance: number;
    totalTime: number;
    runTrailDistance: number;
    runTrailTime: number;
  };
}

export function generateCalendarWeeks(
  year: number,
  month: number,
  activities: Activity[]
): CalendarWeek[] {
  const weeks: CalendarWeek[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Adjust for Monday start (0 = Sunday -> 6, 1 = Monday -> 0, etc.)
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - startDayOfWeek);

  let currentDate = new Date(startDate);

  while (currentDate <= lastDay || currentDate.getDay() !== 1) {
    const week: CalendarWeek = {
      days: [],
      stats: {
        totalDistance: 0,
        totalTime: 0,
        runTrailDistance: 0,
        runTrailTime: 0,
      },
    };

    for (let i = 0; i < 7; i++) {
      const dayActivities = getActivitiesForDate(activities, currentDate);

      week.days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        activities: dayActivities,
      });

      // Calculate week stats
      dayActivities.forEach((activity) => {
        const distance = activity.distance_km || activity.distance / 1000 || 0;
        const time = activity.moving_time || 0;

        week.stats.totalDistance += distance;
        week.stats.totalTime += time;

        if (activity.sport_type === 'Run' || activity.sport_type === 'Trail') {
          week.stats.runTrailDistance += distance;
          week.stats.runTrailTime += time;
        }
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeks.push(week);

    if (currentDate > lastDay && currentDate.getDay() === 1) {
      break;
    }
  }

  return weeks;
}
