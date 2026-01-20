export const COLORS = {
  charcoal: '#0B0C10',
  charcoalLight: '#1F2833',
  steel: '#3A3F47',
  steelLight: '#4A5058',
  mist: '#F2F2F2',
  amber: '#E8832A',
  amberLight: '#ff9942',
  amberDark: '#c56a1a',
  glacier: '#3DB2E0',
  glacierLight: '#5bc4ed',
  moss: '#6DAA75',
  mossLight: '#8bc492',
} as const;

export const SPORT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  Run: { bg: 'rgba(232, 131, 42, 0.125)', color: '#E8832A', label: 'Course' },
  Trail: { bg: 'rgba(232, 131, 42, 0.125)', color: '#E8832A', label: 'Trail' },
  Bike: { bg: 'rgba(61, 178, 224, 0.125)', color: '#3DB2E0', label: 'Velo' },
  Swim: { bg: 'rgba(109, 170, 117, 0.125)', color: '#6DAA75', label: 'Natation' },
  Hike: { bg: 'rgba(109, 170, 117, 0.125)', color: '#6DAA75', label: 'Rando' },
  WeightTraining: { bg: 'rgba(58, 63, 71, 0.125)', color: '#3A3F47', label: 'Muscu' },
};

export const CHART_SPORT_COLORS: Record<string, string> = {
  Run: '#3DB2E0',
  Trail: '#1E6A8F',
  Bike: '#7B6BC8',
  Swim: '#8B92A0',
  WeightTraining: '#9477D9',
  Hike: '#5A5F6C',
};

export const SPORT_TYPES = ['Run', 'Trail', 'Bike', 'Swim', 'Hike', 'WeightTraining'] as const;

export const TAG_ICONS: Record<string, string> = {
  treadmill: '🏃',
  trophy: '🏆',
  mountain: '⛰️',
  clock: '⏱️',
  zap: '⚡',
  heart: '❤️',
  target: '🎯',
};
