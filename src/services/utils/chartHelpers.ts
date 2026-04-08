// ── Utilitaires partagés pour les graphiques SVG ────────────────────────────

/**
 * Calcule des ticks "ronds" pour un axe Y.
 * Retourne `count` valeurs uniformément réparties entre min et max.
 */
export function computeYTicks(min: number, max: number, count = 4): number[] {
  const rawStep = (max - min) / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = Math.ceil(rawStep / magnitude) * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let i = 0; i < count + 2; i++) {
    const v = start + i * step;
    if (v >= min - step * 0.1 && v <= max + step * 0.1) ticks.push(v);
  }
  return ticks.slice(0, count);
}

/**
 * Projette des coordonnées GPS (lat/lon) vers un espace SVG [0–100]×[0–100]
 * avec un padding optionnel.
 */
export function projectCoordsToSVG(
  coords: { lat: number; lon: number }[],
  padding = 10
): {
  points: { x: number; y: number }[];
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number };
} {
  if (coords.length === 0) {
    return { points: [], bounds: { minLat: 0, maxLat: 0, minLon: 0, maxLon: 0 } };
  }
  const lats = coords.map(c => c.lat);
  const lons = coords.map(c => c.lon);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons);
  const latRange = maxLat - minLat || 0.001;
  const lonRange = maxLon - minLon || 0.001;
  const usable = 100 - 2 * padding;
  const points = coords.map(({ lat, lon }) => ({
    x: padding + ((lon - minLon) / lonRange) * usable,
    y: padding + ((maxLat - lat) / latRange) * usable,
  }));
  return { points, bounds: { minLat, maxLat, minLon, maxLon } };
}

/**
 * Construit un chemin SVG lissé (quadratic Bezier) à partir d'une liste de points.
 */
export function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
  }
  path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return path;
}

/**
 * Formate des coordonnées GPS en degrés/minutes (ex: "N 45°11'")
 */
export function formatCoord(value: number, isLat: boolean): string {
  const dir = isLat ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W');
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.floor((abs - deg) * 60);
  return `${dir} ${deg}°${min.toString().padStart(2, '0')}'`;
}
