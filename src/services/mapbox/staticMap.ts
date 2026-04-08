import { ENV } from '@/config/env';

interface StaticMapOptions {
  coordinates: [number, number][]; // [lat, lon][]
  color?: string; // Couleur hex de la trace
  width?: number;
  height?: number;
  strokeWidth?: number;
}

/**
 * Encode un nombre signé pour l'algorithme polyline
 */
function encodeSignedNumber(num: number): string {
  let value = num < 0 ? ~(num << 1) : num << 1;
  let result = '';

  while (value >= 0x20) {
    result += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }

  result += String.fromCharCode(value + 63);
  return result;
}

/**
 * Encode les coordonnées en format Google Polyline Algorithm
 * Compatible avec Mapbox Static API
 */
function encodePolyline(coordinates: [number, number][]): string {
  let result = '';
  let prevLat = 0;
  let prevLon = 0;

  for (const [lat, lon] of coordinates) {
    const dLat = Math.round((lat - prevLat) * 1e5);
    const dLon = Math.round((lon - prevLon) * 1e5);

    result += encodeSignedNumber(dLat);
    result += encodeSignedNumber(dLon);

    prevLat = lat;
    prevLon = lon;
  }

  return result;
}

/**
 * Calcule la distance perpendiculaire d'un point à une ligne
 */
function perpendicularDistance(
  point: [number, number],
  lineStart: [number, number],
  lineEnd: [number, number]
): number {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Simplifie les coordonnées avec l'algorithme Douglas-Peucker
 * Réduit le nombre de points tout en préservant la forme
 */
function simplifyCoordinates(
  coords: [number, number][],
  tolerance: number = 0.00005
): [number, number][] {
  if (coords.length <= 2) return coords;

  let maxDist = 0;
  let maxIndex = 0;

  const lineStart = coords[0];
  const lineEnd = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const dist = perpendicularDistance(coords[i], lineStart, lineEnd);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyCoordinates(coords.slice(0, maxIndex + 1), tolerance);
    const right = simplifyCoordinates(coords.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [coords[0], coords[coords.length - 1]];
}

/**
 * Simplifie les coordonnées pour respecter la limite de points
 * Ajuste dynamiquement la tolérance si nécessaire
 */
function simplifyToMaxPoints(
  coords: [number, number][],
  maxPoints: number = 100
): [number, number][] {
  if (coords.length <= maxPoints) return coords;

  let tolerance = 0.00001;
  let simplified = simplifyCoordinates(coords, tolerance);

  // Augmente progressivement la tolérance jusqu'à atteindre le nombre de points souhaité
  while (simplified.length > maxPoints && tolerance < 0.01) {
    tolerance *= 2;
    simplified = simplifyCoordinates(coords, tolerance);
  }

  return simplified;
}

/**
 * Construit l'URL Mapbox Static Image avec la trace GPS en overlay
 *
 * @param options Configuration de la carte
 * @returns URL de l'image statique ou null si impossible
 */
export function buildStaticMapUrl(options: StaticMapOptions): string | null {
  const {
    coordinates,
    color = '#E8832A',
    width = 500,
    height = 500,
    strokeWidth = 4,
  } = options;

  if (!ENV.MAPBOX_ACCESS_TOKEN || coordinates.length < 2) {
    return null;
  }

  // Simplifier pour respecter la limite URL (~8KB)
  const simplified = simplifyToMaxPoints(coordinates, 100);
  const encoded = encodePolyline(simplified);

  // Format Mapbox: path-{strokeWidth}+{color}-{opacity}({encoded_polyline})
  const strokeColor = color.replace('#', '');
  const pathOverlay = `path-${strokeWidth}+${strokeColor}-0.9(${encodeURIComponent(encoded)})`;

  // auto = zoom automatique pour englober toute la trace
  // padding=60 = marge autour de la trace pour éviter le zoom excessif
  // @2x = résolution retina
  return `https://api.mapbox.com/styles/v1/mapbox/navigation-night-v1/static/${pathOverlay}/auto/${width}x${height}@2x?padding=120&attribution=false&logo=false&access_token=${ENV.MAPBOX_ACCESS_TOKEN}`;
}
