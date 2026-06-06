import type { SportType } from '@/types';

// ── Palette de couleurs ───────────────────────────────────────────────────────
export const COLORS = {
  charcoal: '#0B0C10',
  charcoalLight: '#1F2833',
  steel: '#3A3F47',
  steelLight: '#4A5058',
  mist: '#F2F2F2',
  amber: '#E8832A',
  amberLight: '#ff9942',
  amberDark: '#C96A1A',
  glacier: '#3DB2E0',
  glacierLight: '#5bc4ed',
  moss: '#6DAA75',
  mossLight: '#8bc492',
} as const;

// ── Source de vérité unique pour les sports ───────────────────────────────────
// color    : couleur principale du sport (badge, valeurs, trace)
// barColor : couleur de la barre latérale dans les cards liste
// bg       : fond semi-transparent pour badges
// label    : libellé FR affiché à l'utilisateur
export const SPORT_META: Record<SportType, {
  color: string;
  barColor: string;
  bg: string;
  label: string;
}> = {
  Run:           { color: '#E8832A', barColor: '#3DB2E0', bg: 'rgba(232,131,42,0.12)',  label: 'Course' },
  Trail:         { color: '#E8832A', barColor: '#C96A1A', bg: 'rgba(232,131,42,0.12)',  label: 'Trail' },
  Bike:          { color: '#3DB2E0', barColor: '#7B6BC8', bg: 'rgba(61,178,224,0.12)',  label: 'Vélo' },
  VirtualRide:   { color: '#7B6BC8', barColor: '#3DB2E0', bg: 'rgba(123,107,200,0.12)', label: 'Vélo Virtuel' },
  Swim:          { color: '#6DAA75', barColor: '#8B92A0', bg: 'rgba(109,170,117,0.12)', label: 'Natation' },
  Hike:          { color: '#6DAA75', barColor: '#5A5F6C', bg: 'rgba(109,170,117,0.12)', label: 'Randonnée' },
  WeightTraining:{ color: '#9ca3af', barColor: '#9ca3af', bg: 'rgba(58,63,71,0.12)',    label: 'Muscu' },
};

// Accès rapide : sportColor(type) → couleur principale
export function sportColor(type: SportType | string): string {
  return (SPORT_META as Record<string, { color: string }>)[type]?.color ?? COLORS.amber;
}

// Accès rapide : sportBarColor(type) → couleur barre card liste
export function sportBarColor(type: SportType | string): string {
  return (SPORT_META as Record<string, { barColor: string }>)[type]?.barColor ?? COLORS.glacier;
}

// Accès rapide : sportLabel(type) → libellé FR
export function sportLabel(type: SportType | string): string {
  return (SPORT_META as Record<string, { label: string }>)[type]?.label ?? type;
}

// Vrai pour tout sport traité comme du vélo (vitesse km/h, pas d'allure /km)
export function isBikeType(type: SportType | string): boolean {
  return type === 'Bike' || type === 'VirtualRide';
}

// Compat : objets plats pour les composants qui les consomment directement
// (à migrer progressivement vers SPORT_META)
export const SPORT_COLORS: Record<SportType, { bg: string; color: string; label: string }> = Object.fromEntries(
  Object.entries(SPORT_META).map(([k, v]) => [k, { bg: v.bg, color: v.color, label: v.label }])
) as Record<SportType, { bg: string; color: string; label: string }>;

export const SPORT_LABELS: Record<SportType, string> = Object.fromEntries(
  Object.entries(SPORT_META).map(([k, v]) => [k, v.label])
) as Record<SportType, string>;

export const SPORT_BAR_COLORS: Record<SportType, string> = Object.fromEntries(
  Object.entries(SPORT_META).map(([k, v]) => [k, v.barColor])
) as Record<SportType, string>;

// ── Couleurs de graphiques (charts dashboard) ─────────────────────────────────
export const CHART_SPORT_COLORS: Record<string, string> = {
  Run: '#3DB2E0',
  Trail: '#1E6A8F',
  Bike: '#7B6BC8',
  VirtualRide: '#5A4FA0',
  Swim: '#8B92A0',
  WeightTraining: '#9477D9',
  Hike: '#5A5F6C',
};

// ── Palettes cartographiques ──────────────────────────────────────────────────
// Ces couleurs sont intentionnellement interpolées (Mapbox expressions) et ne
// peuvent pas être remplacées par des tokens simples. Documentées ici comme
// source de vérité pour les deux cartes.
export const MAP_PALETTE = {
  // ExplorationMap — gradient froid (peu de passages) → chaud (zone ancrée)
  exploration: {
    cold0:   '#0D2A38',  // 0 passage  — glacier très sombre
    cold1:   '#1A5C80',  // 2-3 passages
    glacier: '#3DB2E0',  // ~4 passages — glacier plein
    warm1:   '#C96A1A',  // ~7 passages — amber chaud
    hot:     '#E8832A',  // 20+ passages — amber vif
  },
  // DashboardMap — densité d'activité (monochrome glacier)
  dashboard: {
    cold0: '#0B1E33',
    cold1: '#1F4E79',
    mid:   '#2EA6D6',
    hot1:  '#60D5FF',
    hot2:  '#B3ECFF',
  },
} as const;

// ── Misc ──────────────────────────────────────────────────────────────────────
export const SPORT_TYPES = ['Run', 'Trail', 'Bike', 'VirtualRide', 'Swim', 'Hike', 'WeightTraining'] as const;

export const TAG_ICONS: Record<string, string> = {
  treadmill: '🏃',
  trophy: '🏆',
  mountain: '⛰️',
  clock: '⏱️',
  zap: '⚡',
  heart: '❤️',
  target: '🎯',
};
