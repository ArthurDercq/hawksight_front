export type SportType = 'Run' | 'Trail' | 'Bike' | 'VirtualRide' | 'Swim' | 'Hike' | 'WeightTraining';

export interface TrailClimb {
  duration_s: number;
  duration_formatted: string;
  dplus_m: number;
  dminus_m: number;
  vap_m_per_hour: number | null;
}

export interface TrailSegment {
  start_idx: number;
  end_idx: number;
  duration_s: number;
  duration_formatted: string;
  distance_m: number;
  dplus_m: number;
  dminus_m: number;
  avg_grade: number;
  avg_speed_kmh: number;
  avg_gap_kmh: number;
  avg_hr?: number | null;
  vap_m_per_hour: number | null;
  score: number;
}

export interface AidStation {
  name: string;
  duration_min: number;
  duration_s?: number;
  duration_formatted?: string;
  km_point: number;
  start_time?: string;
  end_time?: string;
}

export interface TrailStats {
  avg_gap_kmh: number;
  avg_gap_pace_formatted: string;
  longest_climb: TrailClimb;
  longest_descent: TrailClimb;
  biggest_climb: TrailClimb;
  biggest_descent: TrailClimb;
  hardest_up: TrailSegment;
  hardest_down: TrailSegment;
  aid_stations: AidStation[];
  climbs_summary: { total: number; cotes: number; ondulations: number };
  run_walk: {
    run_time_s: number;
    walk_time_s: number;
    run_formatted: string;
    walk_formatted: string;
    run_percent: number;
    walk_percent: number;
  };
}

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
  average_speed?: number;
  average_watts?: number;
  has_heartrate?: boolean;
  race?: { id: string; name: string; type: string } | null;
  trail_stats?: TrailStats | null;
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

export interface ActivityRecord {
  id: number;
  distance_key: string;
  record_type: string;
  metric_type: string;
  value: number;
  unit: string;
  activity_distance_km: number | null;
  date: string | null;
  activity_id: number;
  activity_name: string;
  activity_url: string;
  start_km: number | null;
  end_km: number | null;
  is_excluded: boolean;
  time_formatted?: string;
  pace_formatted?: string | null;
  value_formatted?: string;
}

export interface ActivityDetail {
  activity: Activity;
  streams: ActivityStream[];
  trail_stats?: TrailStats | null;
  race?: { id: string; name: string; type: string } | null;
  records: ActivityRecord[];
}

export interface LastActivity {
  id: number;
  name: string;
  date: string;
  type?: string;
  distance_km: number;
  duree_hms: string;
  denivele_m: number;
  allure_min_per_km: string;
  vitesse_kmh?: number;
  bpm_moyen?: number;
  polyline_coords?: [number, number][];
  race?: { id: string; name: string; type: string } | null;
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
