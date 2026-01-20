export type SportType = 'Run' | 'Trail' | 'Bike' | 'Swim' | 'Hike' | 'WeightTraining';

export interface Activity {
  id: number;
  name: string;
  sport_type: SportType;
  start_date: string;
  distance: number;
  distance_km?: number;
  moving_time: number;
  moving_time_hms?: string;
  total_elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  speed_minutes_per_km_hms?: string;
  has_heartrate?: boolean;
}

export interface ActivityStream {
  time_s: number;
  distance_m: number;
  lat?: number;
  lon?: number;
  altitude?: number;
  heartrate?: number;
  velocity_smooth?: number;
  cadence?: number;
  grade_smooth?: number;
  power?: number;
  temp?: number;
}

export interface ActivityDetail {
  activity: Activity;
  streams: ActivityStream[];
}

export interface LastActivity {
  id: number;
  name: string;
  date: string;
  distance_km: number;
  duree_hms: string;
  denivele_m: number;
  allure_min_per_km: string;
  bpm_moyen?: number;
  polyline_coords?: [number, number][];
}

export interface ActivityFormData {
  name: string;
  sport_type: SportType;
  start_date: string;
  distance: number;
  moving_time: number;
  total_elevation_gain?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
}
