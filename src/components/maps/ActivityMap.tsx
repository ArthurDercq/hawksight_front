import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ENV } from '@/config/env';
import type { ActivityStream } from '@/types';

interface ActivityMapProps {
  streams: ActivityStream[];
  className?: string;
}

const COLORS = {
  moss: '#6DAA75',
  glacier: '#3DB2E0',
  route: '#E8832A',
};

export function ActivityMap({ streams, className = '' }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);

  const coords = streams
    .filter((s) => s.lat && s.lon)
    .map((s) => [s.lon!, s.lat!] as [number, number]);

  useEffect(() => {
    if (!mapRef.current || coords.length === 0) return;

    mapboxgl.accessToken = ENV.MAPBOX_ACCESS_TOKEN;

    // Compute bounds
    const bounds = coords.reduce(
      (b, c) => b.extend(c as mapboxgl.LngLatLike),
      new mapboxgl.LngLatBounds(coords[0], coords[0])
    );

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      bounds,
      fitBoundsOptions: { padding: 40 },
      interactive: false,
    });
    mapInstanceRef.current = map;

    map.on('load', () => {
      // Route line
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: {},
        },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': COLORS.route, 'line-width': 3, 'line-opacity': 0.9 },
      });

      // Start marker
      new mapboxgl.Marker({ color: COLORS.moss })
        .setLngLat(coords[0] as mapboxgl.LngLatLike)
        .setPopup(new mapboxgl.Popup().setText('Départ'))
        .addTo(map);

      // End marker
      new mapboxgl.Marker({ color: COLORS.glacier })
        .setLngLat(coords[coords.length - 1] as mapboxgl.LngLatLike)
        .setPopup(new mapboxgl.Popup().setText('Arrivée'))
        .addTo(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [streams]);

  if (coords.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-charcoal-light rounded-lg ${className}`}>
        <p className="text-steel">Pas de données GPS disponibles</p>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-lg overflow-hidden ${className}`} />;
}
