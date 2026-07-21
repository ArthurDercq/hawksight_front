/**
 * Types réutilisés par VAMComparisonChart (branché sur ef_signals.climbs via
 * climbsToVAMData) — le reste des types legacy (analyse GPX/FIT à la
 * demande) a été supprimé avec le flux analyzer (PerformancePage refonte
 * Phase 5).
 */

export interface ClimbVAM {
  climb_name: string;
  vam: number;         // m/h
  avg_hr: number;      // bpm
  elev_gain: number;   // meters
  start_km: number;
  end_km: number;
}
