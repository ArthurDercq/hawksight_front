/**
 * Types for Trail Analysis API responses
 * =======================================
 * These types match the backend TrailAnalysisResult structure.
 */

// 1. Aid Station (Ravitaillement)
export interface AidStation {
  name: string;
  duration_min: number;
  km_point: number;
  start_time: string;
  end_time: string;
}

// 2. Run/Walk scatter point
export interface RunWalkPoint {
  slope: number;       // % gradient
  speed_kmh: number;
  cadence: number;     // SPM (steps per minute)
}

// 3. Climb VAM comparison
export interface ClimbVAM {
  climb_name: string;
  vam: number;         // m/h
  avg_hr: number;      // bpm
  elev_gain: number;   // meters
  start_km: number;
  end_km: number;
}

// 4. Efficiency timeseries point
export interface EfficiencyPoint {
  time_min: number;
  efficiency: number;  // effort meters per heartbeat
  altitude: number;
}

// 4. Efficiency result
export interface EfficiencyResult {
  start_avg: number;
  end_avg: number;
  loss_pct: number;
  timeseries: EfficiencyPoint[];
}

// 5. Decoupling timeseries point
export interface DecouplingPoint {
  time: string;        // ISO timestamp
  hr: number;          // bpm
  gap_speed: number;   // km/h
  rolling_corr: number; // -1 to 1
}

// 5. Decoupling result
export interface DecouplingResult {
  peak_hr: number;
  peak_hr_time: string;
  timeseries: DecouplingPoint[];
}

// 6. Force profile point (heatmap data)
export interface ForceProfilePoint {
  slope_bin: number;       // -40 to +40
  gap_pace_min_km: number; // min/km
}

// Full analysis result
export interface TrailAnalysisResult {
  // Metadata
  activity_name: string;
  distance_km: number;
  duration_seconds: number;
  elevation_gain: number;

  // Analysis sections
  aid_stations: AidStation[];
  run_walk_data: RunWalkPoint[];
  vam_comparison: ClimbVAM[];
  efficiency: EfficiencyResult;
  decoupling: DecouplingResult | null;
  force_profile: ForceProfilePoint[];
}

// API request types
export interface AnalyzeActivityRequest {
  activity_id: number;
}

export interface AnalyzeFileRequest {
  file: File;
}

// Analysis state for the UI
export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AnalysisState {
  status: AnalysisStatus;
  result: TrailAnalysisResult | null;
  error: string | null;
}
