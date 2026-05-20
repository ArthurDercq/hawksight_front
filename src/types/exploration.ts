/**
 * Types for World Exploration feature
 */

export interface ExplorationCellProperties {
  h3_id: string;
  sports: ('run' | 'trail' | 'bike' | string)[];
  activity_count: number;
  first_seen: string | null;
  last_seen: string | null;
  color: string;
  opacity: number;
}

export interface ExplorationStats {
  // Base
  total_cells: number;
  surface_km2: number;
  new_this_year: number;
  novelty_percent: number;
  exploration_score: number;
  new_cells_per_month: number;
  // Nouveauté
  new_cells?: number;
  exploration_rate?: number;
  median_visits?: number;
  avg_visits?: number;
  max_visits?: number;
  novelty_gap?: number;
  // Ancrage
  core_ratio?: number;
  core_level?: string;
  core_threshold?: number;
  freshness_ratio?: number;
  // Récence
  recent_4w?: number;
  recent_12w?: number;
  recent_52w?: number;
  recent_usage?: number;
  rotation_activity?: number;
}

export interface ExplorationFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: ExplorationCellProperties;
}

export interface ExplorationGeoJSON {
  type: 'FeatureCollection';
  features: ExplorationFeature[];
  stats: ExplorationStats;
}

export interface ActivityExplorationRate {
  exploration_rate: number | null;
  new_cells: number;
  total_cells: number;
  label: string;
}

export type SportFilter = 'run' | 'trail' | 'bike' | 'other' | 'all';

export interface TerritoryLargest {
  rank: number;
  cells_count: number;
  surface_km2: number;
  center_lat: number;
  center_lon: number;
  city: string | null;
  region: string | null;
  country: string | null;
}

export interface TerritoryUnexplored {
  rank: number;
  cells_count: number;
  surface_km2: number;
  center_lat: number;
  center_lon: number;
  distance_from_home_km: number;
  nearest_explored_cell: string;
  city: string | null;
  region: string | null;
  country: string | null;
}
