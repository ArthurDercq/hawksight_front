export interface KPIData {
  total_km_run: number;
  total_km_trail: number;
  total_km_bike: number;
  total_km_swim: number;
  total_hours: number;
  total_dplus_run_trail: number;
  total_dplus_bike: number;
  "nombre d'activités par sport": Record<string, number>;
}

export interface StreakData {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export interface PersonalRecord {
  distance: string;
  time: string;
  date: string;
  activity_id: number;
  activity_name: string;
}

export interface RecordsData {
  records: Record<string, PersonalRecord | null>;
}
