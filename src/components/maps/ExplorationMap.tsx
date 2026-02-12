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

export function ExplorationMap({ data, className = '' }: ExplorationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || !ENV.MAPBOX_ACCESS_TOKEN) return;

    // Set access token
    mapboxgl.accessToken = ENV.MAPBOX_ACCESS_TOKEN;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [2.3522, 46.8566], // Center on France
      zoom: 5,
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
      // Add GeoJSON source
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: data as unknown as GeoJSON.FeatureCollection,
      });

      // Add fill layer with data-driven styling
      map.addLayer({
        id: LAYER_ID,
        type: 'fill',
        source: SOURCE_ID,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['get', 'opacity'],
        },
      });

      // Fit bounds to all features
      fitBoundsToData(map, data);

      setMapLoaded(true);

      // Add hover interaction
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'exploration-popup',
      });

      map.on('mouseenter', LAYER_ID, (e) => {
        map.getCanvas().style.cursor = 'pointer';

        if (e.features && e.features[0]) {
          const props = e.features[0].properties;
          if (!props) return;

          // Parse sports array (comes as string from GeoJSON)
          let sports: string[] = [];
          try {
            sports = typeof props.sports === 'string' ? JSON.parse(props.sports) : props.sports || [];
          } catch {
            sports = [];
          }

          const sportsText = sports
            .map((s: string) => (s === 'run' ? 'Course' : 'Velo'))
            .join(', ');

          popup
            .setLngLat(e.lngLat)
            .setHTML(
              `<div class="text-sm p-1">
                <p class="font-semibold text-white">${sportsText || 'Activite'}</p>
                <p class="text-gray-300">${props.activity_count} activite${props.activity_count > 1 ? 's' : ''}</p>
              </div>`
            )
            .addTo(map);
        }
      });

      map.on('mouseleave', LAYER_ID, () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
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

      // Refit bounds with animation
      fitBoundsToData(map, data, true);
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

  return <div ref={mapContainer} className={`rounded-lg ${className}`} />;
}

/**
 * Fit map bounds to GeoJSON data
 */
function fitBoundsToData(
  map: mapboxgl.Map,
  data: ExplorationGeoJSON,
  animate: boolean = false
) {
  if (data.features.length === 0) return;

  const bounds = new mapboxgl.LngLatBounds();

  data.features.forEach((feature) => {
    const coords = feature.geometry.coordinates[0];
    coords.forEach(([lng, lat]) => {
      bounds.extend([lng, lat]);
    });
  });

  map.fitBounds(bounds, {
    padding: 50,
    duration: animate ? 1000 : 0,
  });
}
