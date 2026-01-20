import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ActivityStream } from '@/types';

interface ActivityMapProps {
  streams: ActivityStream[];
  className?: string;
}

const COLORS = {
  moss: '#6DAA75',
  glacier: '#3DB2E0',
  route: '#2563EB',
};

export function ActivityMap({ streams, className = '' }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Cleanup existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Filter streams with valid coordinates
    const coords = streams
      .filter((s) => s.lat && s.lon)
      .map((s) => [s.lat!, s.lon!] as [number, number]);

    if (coords.length === 0) {
      return;
    }

    // Initialize map
    const map = L.map(mapRef.current);
    mapInstanceRef.current = map;

    // Fit to bounds
    map.fitBounds(coords);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    // Add route polyline
    L.polyline(coords, {
      color: COLORS.route,
      weight: 3,
      opacity: 0.8,
    }).addTo(map);

    // Add start marker
    L.circleMarker(coords[0], {
      radius: 8,
      fillColor: COLORS.moss,
      color: '#fff',
      weight: 2,
      fillOpacity: 0.9,
    })
      .addTo(map)
      .bindPopup('Départ');

    // Add end marker
    L.circleMarker(coords[coords.length - 1], {
      radius: 8,
      fillColor: COLORS.glacier,
      color: '#fff',
      weight: 2,
      fillOpacity: 0.9,
    })
      .addTo(map)
      .bindPopup('Arrivée');

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [streams]);

  const hasCoords = streams.some((s) => s.lat && s.lon);

  if (!hasCoords) {
    return (
      <div className={`flex items-center justify-center bg-charcoal-light rounded-lg ${className}`}>
        <p className="text-steel">Pas de données GPS disponibles</p>
      </div>
    );
  }

  return <div ref={mapRef} className={`rounded-lg ${className}`} />;
}
