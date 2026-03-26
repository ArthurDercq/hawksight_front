export type EventType = 'Run' | 'Trail' | 'Bike' | 'Swim' | 'Hike' | 'Ultra' | 'Other';
export type GoalType = 'finish' | 'podium' | 'time_goal' | 'discovery';

export interface TrainingEvent {
  id: string;
  user_id: number;
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  type: EventType;
  distance_km: number | null;
  elevation_m: number | null;
  location: string | null;
  goal_type: GoalType | null;
  is_completed: boolean;
  activity_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  name: string;
  date: string;
  type: EventType;
  distance_km?: number;
  elevation_m?: number;
  location?: string;
  goal_type?: GoalType;
  activity_id?: number | null;
}
