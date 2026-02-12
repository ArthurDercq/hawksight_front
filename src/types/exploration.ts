/**
 * Types for World Exploration feature
 */

export interface ExplorationCellProperties {
  h3_id: string;
  sports: ('run' | 'bike')[];
  activity_count: number;
  first_seen: string | null;
  last_seen: string | null;
  color: string;
  opacity: number;
}

export interface ExplorationStats {
  total_cells: number;
  surface_km2: number;
  new_this_year: number;
  novelty_percent: number;
  exploration_score: number;
  new_cells_per_month: number;
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

export type SportFilter = 'run' | 'bike' | 'all';
