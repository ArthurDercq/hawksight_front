import type { EfClimb } from '@/types/ef';
import type { ClimbVAM } from '@/types/analysis';

/**
 * Traduit ef_signals.climbs (§14.2 méthodo, format B.3 backend) vers
 * ClimbVAM[] pour réutiliser VAMComparisonChart tel quel — le composant ne
 * change pas, seul le point d'entrée de données change (ancien flux
 * TrailAnalysisDashboard legacy -> nouveau ef_signals.climbs).
 *
 * Climbs sans avg_hr (FC absente sur le segment) sont exclus — le composant
 * suppose avg_hr non-null pour dessiner la ligne FC superposée.
 */
export function climbsToVAMData(climbs: EfClimb[]): ClimbVAM[] {
  return climbs
    .filter((c): c is EfClimb & { avg_hr: number } => c.avg_hr != null && c.vam_m_per_h != null)
    .map((c) => ({
      climb_name: c.default_name,
      vam: c.vam_m_per_h as number,
      avg_hr: c.avg_hr,
      elev_gain: Math.round(c.dplus_m),
      start_km: c.km_start,
      end_km: c.km_end,
    }));
}
