import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ENV } from '@/config/env';
import type { ExplorationGeoJSON } from '@/types';

interface ExplorationMapProps {
  data: ExplorationGeoJSON;
  className?: string;
}

const SOURCE_ID = 'exploration-cells';
const LAYER_ID = 'exploration-fill';
const HEATMAP_SOURCE = 'exploration-heatmap-points';
const HEATMAP_LAYER = 'exploration-heatmap';

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
        properties: { activity_count: f.properties.activity_count }
      };
    })
  };
}

export function ExplorationMap({ data, className = '' }: ExplorationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; count: number } | null>(null);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || !ENV.MAPBOX_ACCESS_TOKEN) return;

    // Set access token
    mapboxgl.accessToken = ENV.MAPBOX_ACCESS_TOKEN;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [3.5, 50.5], // Belgium + Nord de la France (Lille)
      zoom: 7,
      attributionControl: false,
    });

    mapRef.current = map;

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add scale control
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }),
      'bottom-left'
    );

    map.on('load', () => {
      // Add GeoJSON source (initial data — will be updated via filteredData effect)
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection,
      });

      // Glow layer (subtle background, visible at high zoom)
      map.addLayer({
        id: 'exploration-glow',
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['ln', ['+', ['get', 'activity_count'], 1]],
            0, '#0B1E33',
            1, '#123A6B',
            2, '#1D6FA5',
            3, '#3DB2E0'
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.05,
            8, 0.1,
            12, 0.15
          ]
        }
      });

      // Main fill layer (reduced opacity, detail visible at high zoom)
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['ln', ['+', ['get', 'activity_count'], 1]],
            0, '#1B2A41',
            1, '#1F4E79',
            2, '#2EA6D6',
            3, '#60D5FF',
            4, '#B3ECFF'
          ],
          'fill-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 0.1,
            8, 0.25,
            12, 0.5
          ],
          'fill-color-transition': { duration: 700 },
          'fill-opacity-transition': { duration: 700 }
        }
      });

      // Heatmap layer (smooth overlay that hides hexagonal edges)
      map.addSource(HEATMAP_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection,
      });

      map.addLayer({
        id: HEATMAP_LAYER,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        paint: {
          'heatmap-weight': [
            'interpolate', ['linear'],
            ['get', 'activity_count'],
            1, 0.3,
            10, 0.7,
            50, 1
          ],
          'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.5,
            8, 1.2,
            12, 1.5
          ],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,    'rgba(11,30,51,0)',
            0.2,  '#0B1E33',
            0.4,  '#1F4E79',
            0.6,  '#2EA6D6',
            0.8,  '#60D5FF',
            1,    '#B3ECFF'
          ],
          'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            3, 15,
            8, 30,
            12, 45
          ],
          'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            3, 0.8,
            10, 0.6,
            14, 0.3
          ]
        }
      });

      setMapLoaded(true);

      // Hover interaction — React tooltip (no Mapbox Popup to avoid DOM/WebGL conflicts)
      map.on('mousemove', LAYER_ID, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const count = e.features?.[0]?.properties?.activity_count ?? 0;
        setTooltip({ x: e.point.x, y: e.point.y, count });
      });

      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
        setTooltip(null);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []); // Only run once on mount

  // Update data when it changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(data as unknown as GeoJSON.FeatureCollection);
    }

    const heatmapSource = map.getSource(HEATMAP_SOURCE) as mapboxgl.GeoJSONSource;
    if (heatmapSource) {
      heatmapSource.setData(polygonsToCentroidPoints(data) as GeoJSON.FeatureCollection);
    }
  }, [data, mapLoaded]);

  if (!ENV.MAPBOX_ACCESS_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center bg-charcoal-light rounded-lg ${className}`}
      >
        <div className="text-center p-8">
          <p className="text-steel mb-2">Token Mapbox non configure</p>
          <p className="text-sm text-mist/40">
            Ajoutez VITE_MAPBOX_ACCESS_TOKEN dans votre fichier .env
          </p>
        </div>
      </div>
    );
  }

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [3.5, 50.5],
        zoom: 7,
        duration: 1000,
      });
    }
  };

  return (
    <div className="relative">
      <div ref={mapContainer} className={`rounded-lg ${className}`} />
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: tooltip.y - 36,
            pointerEvents: 'none',
            background: '#1C2A3A',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontFamily: 'monospace',
            fontSize: '12px',
            color: '#E2E8F0',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {tooltip.count} passage{tooltip.count > 1 ? 's' : ''}
        </div>
      )}
      <button
        onClick={handleResetView}
        className="absolute top-3 left-3 bg-charcoal/80 backdrop-blur-sm border border-steel/30 rounded-lg px-3 py-2 text-xs text-mist/70 hover:text-mist hover:border-amber/50 transition-all flex items-center gap-2"
        title="Recentrer sur mon territoire principal"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Mon territoire
      </button>
    </div>
  );
}
