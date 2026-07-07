import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ENV } from '@/config/env';
import type { ExplorationGeoJSON } from '@/types';

interface ExplorationMapProps {
  data: ExplorationGeoJSON;
  className?: string;
  coreThreshold?: number;
  showCoreOnly?: boolean;
}

interface TooltipState {
  x: number;
  y: number;
  count: number;
  firstSeen: string | null;
  lastSeen: string | null;
  sports: string[];
}

const SOURCE_ID      = 'exploration-cells';
const LAYER_GLOW     = 'exploration-glow';
const LAYER_FILL     = 'exploration-fill';
const LAYER_CORE     = 'exploration-core';
const LAYER_OUTLINE  = 'exploration-outline';
const HEATMAP_SOURCE = 'exploration-heatmap-points';
const HEATMAP_LAYER  = 'exploration-heatmap';

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

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtSports(sports: string[]): string {
  if (!sports?.length) return '—';
  const map: Record<string, string> = { Run: 'Course', Trail: 'Trail', TrailRun: 'Trail', bike: 'Vélo', Walk: 'Marche', Hike: 'Rando' };
  return [...new Set(sports.map(s => map[s] ?? s))].join(' · ');
}

export function ExplorationMap({ data, className = '', coreThreshold = 10, showCoreOnly = false }: ExplorationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded]   = useState(false);
  const [tooltip, setTooltip]       = useState<TooltipState | null>(null);

  // Init map
  useEffect(() => {
    if (!mapContainer.current || !ENV.MAPBOX_ACCESS_TOKEN) return;
    mapboxgl.accessToken = ENV.MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [3.5, 50.5],
      zoom: 7,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      // ── Sources ──────────────────────────────────────────────────────────
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection,
      });
      map.addSource(HEATMAP_SOURCE, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection,
      });

      // ── Heatmap (smooth overlay) ──────────────────────────────────────
      map.addLayer({
        id: HEATMAP_LAYER,
        type: 'heatmap',
        source: HEATMAP_SOURCE,
        paint: {
          'heatmap-weight': ['interpolate', ['linear'], ['get', 'activity_count'], 1, 0.3, 10, 0.7, 50, 1],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.4, 8, 1.0, 12, 1.4],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(11,30,51,0)',
            0.2, '#0B1E33',
            0.4, '#1F4E79',
            0.6, '#2EA6D6',
            0.8, '#60D5FF',
            1,   '#B3ECFF',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 18, 8, 32, 12, 48],
          'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.75, 10, 0.55, 14, 0.25],
        }
      });

      // ── Glow layer — visible seulement en zoomant ────────────────────
      map.addLayer({
        id: LAYER_GLOW,
        type: 'fill',
        source: SOURCE_ID,
        minzoom: 7,
        paint: {
          'fill-color': [
            'interpolate', ['linear'],
            ['ln', ['+', ['get', 'activity_count'], 1]],
            0, 'rgba(46,166,214,0.03)',
            2, 'rgba(46,166,214,0.06)',
            4, 'rgba(46,166,214,0.1)',
          ],
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.7, 12, 1],
        }
      });

      // ── Main fill — glacier monochrome, apparaît au fur et à mesure du zoom ──
      map.addLayer({
        id: LAYER_FILL,
        type: 'fill',
        source: SOURCE_ID,
        minzoom: 7,
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
          'fill-opacity': [
            'interpolate', ['linear'], ['zoom'],
            7, 0,
            8, 0.35,
            10, 0.55,
            13, 0.7,
          ],
          'fill-color-transition':   { duration: 600 },
          'fill-opacity-transition': { duration: 600 },
        }
      });

      // ── Core zones highlight (glacier pulsant via opacity animée) ────
      map.addLayer({
        id: LAYER_CORE,
        type: 'fill',
        source: SOURCE_ID,
        minzoom: 7,
        filter: ['>=', ['get', 'activity_count'], coreThreshold],
        paint: {
          'fill-color': '#2EA6D6',
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.18],
        }
      });

      // ── Outline sur les zones core ────────────────────────────────────
      map.addLayer({
        id: LAYER_OUTLINE,
        type: 'line',
        source: SOURCE_ID,
        minzoom: 7,
        filter: ['>=', ['get', 'activity_count'], coreThreshold],
        paint: {
          'line-color': '#2EA6D6',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 10, 0.9, 13, 1.4],
          'line-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0, 8, 0.5],
        }
      });

      setMapLoaded(true);

      // ── Hover tooltip enrichi ────────────────────────────────────────
      map.on('mousemove', LAYER_FILL, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const props = e.features?.[0]?.properties;
        if (!props) return;
        let sports: string[] = [];
        try { sports = typeof props.sports === 'string' ? JSON.parse(props.sports) : (props.sports ?? []); } catch { sports = []; }
        setTooltip({
          x: e.point.x,
          y: e.point.y,
          count:     props.activity_count ?? 0,
          firstSeen: props.first_seen ?? null,
          lastSeen:  props.last_seen  ?? null,
          sports,
        });
      });

      map.on('mouseleave', LAYER_FILL, () => {
        map.getCanvas().style.cursor = '';
        setTooltip(null);
      });
    });

    return () => { map.remove(); mapRef.current = null; setMapLoaded(false); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const displayData: ExplorationGeoJSON = showCoreOnly
      ? { ...data, features: data.features.filter(f => f.properties.activity_count >= coreThreshold) }
      : data;

    (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource)?.setData(displayData as unknown as GeoJSON.FeatureCollection);
    (map.getSource(HEATMAP_SOURCE) as mapboxgl.GeoJSONSource)?.setData(polygonsToCentroidPoints(displayData) as GeoJSON.FeatureCollection);
  }, [data, mapLoaded, showCoreOnly, coreThreshold]);

  // Update core filter when threshold changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const filter: mapboxgl.FilterSpecification = ['>=', ['get', 'activity_count'], coreThreshold];
    if (map.getLayer(LAYER_CORE))    map.setFilter(LAYER_CORE, filter);
    if (map.getLayer(LAYER_OUTLINE)) map.setFilter(LAYER_OUTLINE, filter);
  }, [coreThreshold, mapLoaded]);

  if (!ENV.MAPBOX_ACCESS_TOKEN) {
    return (
      <div className={`flex items-center justify-center bg-charcoal rounded-lg ${className}`}>
        <p className="text-steel text-sm">Token Mapbox non configuré</p>
      </div>
    );
  }

  const handleResetView = () => {
    mapRef.current?.flyTo({ center: [3.5, 50.5], zoom: 7, duration: 1000 });
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className={`w-full h-full rounded-lg ${className}`} />

      {/* Tooltip enrichi */}
      {tooltip && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 14,
            top:  tooltip.y - 10,
            pointerEvents: 'none',
            zIndex: 20,
          }}
        >
          <div className="bg-charcoal/95 border border-steel/30 rounded-lg p-3 shadow-card min-w-[170px]">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-steel/20">
              <span className="hw-text-label text-steel/85">Zone</span>
              <span className="font-mono text-sm font-bold tabular-nums" style={{ color: '#2EA6D6' }}>
                {tooltip.count} passage{tooltip.count > 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-4">
                <span className="hw-text-label text-steel/75">1ère fois</span>
                <span className="hw-text-caption text-mist/70">{fmtDate(tooltip.firstSeen)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="hw-text-label text-steel/75">Dernière</span>
                <span className="hw-text-caption text-mist/70">{fmtDate(tooltip.lastSeen)}</span>
              </div>
              {tooltip.sports.length > 0 && (
                <div className="flex items-center justify-between gap-4 pt-1 border-t border-steel/15">
                  <span className="hw-text-label text-steel/75">Sports</span>
                  <span className="hw-text-caption text-amber/80">{fmtSports(tooltip.sports)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset view */}
      <button
        onClick={handleResetView}
        className="absolute top-3 left-3 bg-charcoal/80 backdrop-blur-sm border border-steel/30 rounded-lg px-3 py-2 hw-text-label text-mist/60 hover:text-mist hover:border-amber/40 transition-all flex items-center gap-2"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Mon territoire
      </button>
    </div>
  );
}
