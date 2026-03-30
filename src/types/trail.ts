export interface TrailAxisScores {
  engine: number | null;
  climbing: number | null;
  endurance: number | null;
  technical: number | null;
  volume: number | null;
  legacy?: number | null;
}

export interface TrailProfile {
  user_id: number;
  trail_score_raw: number;
  trail_score_final: number;
  imbalance_penalty: number;
  score_std_dev: number;
  dominant_profile: string;
  axis_scores: TrailAxisScores;
  raw_values: {
    engine_kmh: number | null;
    climbing_wkg: number | null;
    endurance_ratio: number | null;
    descent_ratio: number | null;
    steep_ratio: number | null;
    monthly_vertical_m: number;
    monthly_distance_km: number;
    monthly_active_days: number;
    monthly_hours: number;
    legacy_dplus_m: number;
    legacy_distance_km: number;
  };
  data_freshness_factor: number;
  last_activity_date: string | null;
  computed_at: string;
  model_version: string;
}

export interface TrailProfileHistory {
  snapshot_date: string;
  week_label: string;
  trail_score_raw: number;
  trail_score_final: number;
  dominant_profile: string;
  axis_scores: TrailAxisScores;
}

export interface TrailReferenceProfile {
  slug: string;
  name: string;
  description: string;
  trail_score_final: number;
  trail_score_raw: number;
  dominant_profile: string;
  axis_scores: TrailAxisScores;
  is_reference: boolean;
}
