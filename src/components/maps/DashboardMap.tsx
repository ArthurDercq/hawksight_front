import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ENV } from '@/config/env';
import { explorationApi } from '@/services/api';
import type { ExplorationGeoJSON, ExplorationStats } from '@/types';

const SOURCE_ID = 'dash-cells';
const LAYER_FILL = 'dash-fill';
const LAYER_HEATMAP = 'dash-heatmap';
const HEATMAP_SOURCE = 'dash-heatmap-pts';

// Cache module-level pour éviter un re-fetch si le dashboard est remonté
let cachedGeoJSON: ExplorationGeoJSON | null = null;

function polygonsToCentroidPoints(data: ExplorationGeoJSON): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: data.features.map(f => {
      const ring = f.geometry.coordinates[0];
      let x = 0, y = 0;
      for (const [lng, lat] of ring) { x += lng; y += lat; }
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [x / ring.length, y / ring.length] },
        properties: { activity_count: f.properties.activity_count },
      };
    }),
  };
}

interface DashboardMapProps {
  className?: string;
  style?: CSSProperties;
  explorationStats?: ExplorationStats | null;
}

export function DashboardMap({ className = '', style, explorationStats }: DashboardMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [newThisMonth, setNewThisMonth] = useState<number | null>(null);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || !ENV.MAPBOX_ACCESS_TOKEN) return;

    mapboxgl.accessToken = ENV.MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [4.5, 50.5],
      zoom: 7.2,
      interactive: true,
      attributionControl: false,
      projection: 'mercator',
    });
    mapRef.current = map;

    map.on('load', () => {
      // Hexagone fill source (vide au départ)
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Heatmap source
      map.addSource(HEATMAP_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Heatmap layer (fond doux, visible à tous les zooms)
      map.addLayer({
        id: LAYER_HEATMAP,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'activity_count'], 1, 0.3, 10, 0.7, 50, 1],
          'heatmap-intensity': 1.2,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(11,30,51,0)',
            0.2, '#0B1E33',
            0.4, '#1F4E79',
            0.6, '#2EA6D6',
            0.8, '#60D5FF',
            1,   '#B3ECFF',
          ],
          'heatmap-radius': 22,
          'heatmap-opacity': 0.75,
        },
      });

      // Hexagone fill par-dessus — visible seulement à partir de zoom 9
      map.addLayer({
        id: LAYER_FILL,
        type: 'fill',
        source: SOURCE_ID,
        minzoom: 9,
        paint: {
          'fill-color': [
            'interpolate', ['linear'],
            ['ln', ['+', ['get', 'activity_count'], 1]],
            0, '#1B2A41',
            1, '#1F4E79',
            2, '#2EA6D6',
            3, '#60D5FF',
            4, '#B3ECFF',
          ],
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 9, 0, 10, 0.35],
        },
      });

      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // Charger les données GeoJSON après que la carte est prête
  // Utilise le cache module-level pour ne pas refetcher si déjà chargé
  useEffect(() => {
    if (!mapLoaded || dataLoaded) return;

    async function loadData() {
      if (!mapRef.current) return;

      try {
        // Utilise le cache module-level, sinon fetch (sans paramètres = toutes données)
        if (!cachedGeoJSON) {
          cachedGeoJSON = await explorationApi.getExploration();
        }

        const map = mapRef.current;
        if (!map) return;

        const fillSource = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
        const heatSource = map.getSource(HEATMAP_SOURCE) as mapboxgl.GeoJSONSource;

        if (fillSource) fillSource.setData(cachedGeoJSON as unknown as GeoJSON.FeatureCollection);
        if (heatSource) heatSource.setData(polygonsToCentroidPoints(cachedGeoJSON) as GeoJSON.FeatureCollection);

        const now = new Date();
        const count = cachedGeoJSON.features.filter(f => {
          const d = f.properties.first_seen ? new Date(f.properties.first_seen) : null;
          return d && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        }).length;
        setNewThisMonth(count);

        setDataLoaded(true);
      } catch {
        // Silencieux — la carte reste affichée sans données
      }
    }

    loadData();
  }, [mapLoaded, dataLoaded]);

  if (!ENV.MAPBOX_ACCESS_TOKEN) return null;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <div ref={containerRef} className="w-full h-full" />
      {/* Grid overlay style mockup */}
      <div className="absolute inset-0 pointer-events-none hw-map-grid-overlay" />
      {/* Gradient bas pour lisibilité des stats */}
      <div className="absolute inset-0 pointer-events-none hw-map-gradient-bottom" />
      {/* Gradient gauche léger */}
      <div className="absolute inset-0 pointer-events-none hw-map-gradient-left" />

      {/* Label haut gauche */}
      <span className="absolute pointer-events-none hw-text-label" style={{ top: '14px', left: '16px', letterSpacing: '2px' }}>
        Zones explorées
      </span>

      {/* Stats conquête — bas gauche */}
      <div className="absolute pointer-events-none flex gap-5" style={{ bottom: '14px', left: '16px' }}>
        {explorationStats ? (
          <>
            <div>
              <p className="hw-stat-value-lg">{explorationStats.total_cells}</p>
              <p className="hw-text-label mt-px">territoires</p>
            </div>
            <div>
              <p className="hw-stat-value-lg">{Math.round(explorationStats.surface_km2)} km²</p>
              <p className="hw-text-label mt-px">surface</p>
            </div>
            <div>
              {newThisMonth === 0 ? (
                <p className="hw-text-label" style={{ lineHeight: 1.4 }}>Aucune nouvelle<br />zone ce mois</p>
              ) : (
                <>
                  <p className="hw-stat-value-lg">+{newThisMonth ?? '—'}</p>
                  <p className="hw-text-label mt-px">ce mois</p>
                </>
              )}
            </div>
          </>
        ) : mapLoaded && !dataLoaded ? (
          <span className="hw-text-caption text-glacier/40 animate-pulse">chargement...</span>
        ) : null}
      </div>

      {/* Lien Exploration — bas droite */}
      <Link
        to="/exploration"
        className="hw-link absolute text-glacier/50 hover:text-glacier/90 transition-colors"
        style={{ bottom: '14px', right: '14px' }}
      >
        Voir exploration →
      </Link>

      {/* Corner brackets — glacier */}
      <span className="hw-br hw-br-tl hw-br-glacier-dim pointer-events-none" />
      <span className="hw-br hw-br-br hw-br-glacier-dim pointer-events-none" />
    </div>
  );
}
