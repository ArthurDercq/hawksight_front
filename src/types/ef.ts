// Modèle EF (Efficiency Factor / point de bascule) — miroir de
// models/ef_analysis.py (backend). Voir docs/METHODOLOGIE_ANALYSE_EF.md.

export interface EfSeriesPoint {
  m: number;
  ef: number;
  ef_roll: number;
}

export interface PacingRuleCitation {
  cruise_bin: string; // "<-12%" | "-12%/-5%" | ">=-5%"
  pct_collapse: number | null;
  n: number;
  wording: string;
}

// §14.1 méthodo — zoom événement critique
export interface CriticalWindowPoint {
  t_min: number;
  gap: number;
  hr: number;
  rolling_corr: number | null;
}

export interface CriticalWindow {
  anchor_min: number;
  anchor_type: 'collapse' | 'microstop_burst' | 'hr_peak';
  series: CriticalWindowPoint[];
}

// §14.2 méthodo — montées nommées (noms par défaut uniquement, v1 — pas
// d'édition, voir docs/PLAN_IMPLEMENTATION_ANALYSE_EF.md Phase 5)
export interface EfClimb {
  index: number;
  default_name: string;
  km_start: number;
  km_end: number;
  dplus_m: number;
  vam_m_per_h: number | null;
  avg_hr: number | null;
  duration_s: number;
}

export interface EfSignals {
  muscular: Record<string, number | null>;
  muscular_score: number;
  first_sign_min: number | null;
  stops: { start_s: number; end_s: number }[];
  expected_baseline: number | null;
  microstop_times_s: number[];
  critical_window: CriticalWindow | null;
  climbs: EfClimb[];
  gap_curve_fallback?: string;
}

export interface EfAnalysis {
  activity_id: number;
  model_version: string | null;

  ef_baseline: number | null;
  ef_expected: number | null;
  cruise_pct: number | null;
  breakpoint_min: number | null;
  breakpoint_type: 'cardio' | 'muscular' | 'mixed' | 'none' | null;
  ef_drift_pct: number | null;
  microstops_climb_per_h: number | null;
  avg_temp_c: number | null;
  altitude_flag: boolean | null;
  baseline_quality: 'ok' | 'suspect' | null;

  ef_series: EfSeriesPoint[];
  ef_signals: EfSignals;

  pacing_rule: PacingRuleCitation | null;
  flags: string[];
}

// --- /me/ef-baseline — socle personnel (PerformancePage) -------------------

export interface GapCurve {
  gmids: number[];
  rvals: number[];
  v_flat: number;
  n_outings: number;
}

export interface RegressionResult {
  coef: number[];
  uses_fitness: boolean;
  n: number;
  r2_in: number;
  r2_loo: number;
}

export interface RuleBucket {
  pct_collapse: number | null;
  n: number;
}

export interface RulesResult {
  pacing: Record<string, RuleBucket>; // clés : "<-12%" | "-12%/-5%" | ">=-5%"
  preparation: {
    above_threshold: RuleBucket;
    below_threshold: RuleBucket;
    threshold: number;
  };
  budget: {
    by_duration: Record<string, RuleBucket>; // clés : "<4h" | "4-6h" | ">6h"
    temp_vs_breakpoint_corr: number | null;
  };
}

export interface BaselineHistoryPoint {
  date: string;
  baseline: number;
}

// Sortie longue déjà analysée — service.py::build_outings_payload
export interface Outing {
  activity_id: number;
  sport_type: string;
  date: string;
  duration_h: number;
  avg_temp_c: number | null;
  cruise_pct: number | null;
  breakpoint_min: number | null;
  collapse: boolean;
  d42_ratio: number | null;
  baseline: number | null;
}

export interface UserBaseline {
  user_id: number;
  model_version: string | null;
  computed_at: string | null;

  gap_curve: GapCurve | null;
  v_flat: number | null;
  hr_band: [number, number] | null;
  regression: RegressionResult | null;
  rules: RulesResult | null;
  cruise_distribution: Record<string, number> | null;
  fitness_180d: number | null;
  n_outings: number | null;

  baseline_history: BaselineHistoryPoint[];
  outings: Outing[];
  flags: string[];
}
