/**
 * Format a date to relative time (e.g., "Il y a 5 min", "Il y a 2j")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `Il y a ${diffMins} min`;
  } else if (diffHours < 24) {
    return `Il y a ${diffHours}h`;
  } else {
    return `Il y a ${diffDays}j`;
  }
}

/**
 * Format membership duration (e.g., "2 ans", "3 mois", "Nouveau")
 */
export function formatMembershipDuration(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const years = now.getFullYear() - date.getFullYear();
  const months = now.getMonth() - date.getMonth() + (years * 12);

  if (years > 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} mois`;
  } else {
    return 'Nouveau';
  }
}

/**
 * Format sex to French
 */
export function formatSex(sex?: string): string {
  if (sex === 'M') return 'Homme';
  if (sex === 'F') return 'Femme';
  return 'Non renseigné';
}

/**
 * Format distance in km
 */
export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration from seconds to HH:MM:SS or MM:SS
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
  }
  return `${minutes}min ${secs.toString().padStart(2, '0')}s`;
}

/**
 * Format pace (min/km)
 */
export function formatPace(secondsPerKm: number): string {
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.floor(secondsPerKm % 60);
  return `${minutes}'${seconds.toString().padStart(2, '0')}"`;
}
