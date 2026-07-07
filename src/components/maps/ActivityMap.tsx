import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ENV } from '@/config/env';
import type { ActivityStream } from '@/types';

interface ActivityMapProps {
  streams: ActivityStream[];
  className?: string;
  color?: string;
  interactive?: boolean;
}

export interface ActivityMapHandle {
  /** Capture l'état actuel du canvas WebGL — pour l'export PNG (html2canvas ne lit pas le WebGL). */
  getCanvasDataURL: () => string | null;
}

export const ActivityMap = forwardRef<ActivityMapHandle, ActivityMapProps>(
  function ActivityMap({ streams, className = '', color = '#E8832A', interactive = true }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);

    const coords = streams
      .filter((s) => s.lat != null && s.lon != null)
      .map((s) => [s.lon!, s.lat!] as [number, number]);

    useImperativeHandle(ref, () => ({
      getCanvasDataURL: () => mapRef.current?.getCanvas().toDataURL('image/png') ?? null,
    }), []);

    useEffect(() => {
      if (!containerRef.current || coords.length < 2 || !ENV.MAPBOX_ACCESS_TOKEN) return;

      mapboxgl.accessToken = ENV.MAPBOX_ACCESS_TOKEN;

      const bounds = coords.reduce(
        (b, c) => b.extend(c as mapboxgl.LngLatLike),
        new mapboxgl.LngLatBounds(coords[0], coords[0])
      );

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        bounds,
        fitBoundsOptions: { padding: 40 },
        interactive,
        attributionControl: false,
        preserveDrawingBuffer: true, // requis pour toDataURL() (export PNG)
      });
      mapRef.current = map;

      if (interactive) {
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      }

      map.on('load', () => {
        map.addSource('activity-route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} },
        });

        // Glow sous la trace pour la lisibilité, cohérent avec le reste de l'app
        map.addLayer({
          id: 'activity-route-glow',
          type: 'line',
          source: 'activity-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': color, 'line-width': 7, 'line-opacity': 0.25, 'line-blur': 2 },
        });
        map.addLayer({
          id: 'activity-route-line',
          type: 'line',
          source: 'activity-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': color, 'line-width': 3, 'line-opacity': 0.95 },
        });

        map.addSource('activity-endpoints', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', geometry: { type: 'Point', coordinates: coords[0] }, properties: { kind: 'start' } },
              { type: 'Feature', geometry: { type: 'Point', coordinates: coords[coords.length - 1] }, properties: { kind: 'end' } },
            ],
          },
        });
        map.addLayer({
          id: 'activity-endpoints-halo',
          type: 'circle',
          source: 'activity-endpoints',
          paint: {
            'circle-radius': 7,
            'circle-color': ['match', ['get', 'kind'], 'start', '#6DAA75', '#3DB2E0'],
            'circle-opacity': 0.25,
          },
        });
        map.addLayer({
          id: 'activity-endpoints-dot',
          type: 'circle',
          source: 'activity-endpoints',
          paint: {
            'circle-radius': 4,
            'circle-color': ['match', ['get', 'kind'], 'start', '#6DAA75', '#3DB2E0'],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#0B0C10',
          },
        });
      });

      return () => {
        map.remove();
        mapRef.current = null;
      };
    }, [streams, color, interactive]);

    if (coords.length < 2) {
      return (
        <div className={`flex items-center justify-center bg-charcoal-light ${className}`}>
          <p className="font-mono text-xs text-steel">Pas de données GPS disponibles</p>
        </div>
      );
    }

    return <div ref={containerRef} className={className} />;
  }
);
