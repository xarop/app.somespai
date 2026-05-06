'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import Supercluster from 'supercluster';
import type { Space } from '@/lib/schemas/space';
import { GRACIA_CENTER } from '@/lib/data/mock-spaces';

// Carto Voyager — clean vector map with good contrast, no API key required
const CARTO_POSITRON = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

const TYPE_SVG: Record<Space['type'], string> = {
  storage: `<path d="M3 7l9-4 9 4v10l-9 4-9-4V7z"/><path d="M3 7l9 4 9-4"/><path d="M12 11v10"/>`,
  workspace: `<rect x="3" y="5" width="18" height="11" rx="2"/><path d="M7 20h10M12 16v4"/>`,
  garden: `<path d="M12 22V13"/><path d="M5 9c0-3 3-5 7-5s7 2 7 5c0 4-3 6-7 6S5 13 5 9z"/><path d="M9 9c0-1.5 1.4-2.5 3-2.5s3 1 3 2.5"/>`,
  room: `<path d="M3 21V5l9-2v18"/><path d="M2 21h20M14 21V8l7-2v15"/><circle cx="9" cy="13" r="0.6" fill="currentColor"/>`,
  parking: `<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M10 17v-8h4a3 3 0 010 6h-4"/>`,
};

function iconSvg(type: Space['type']): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TYPE_SVG[type]}</svg>`;
}

function priceLabel(cents: number) {
  return `${Math.round(cents / 100)}€`;
}

export interface MapViewProps {
  spaces: Space[];
  activeSpaceId?: string | null;
  hoveredSpaceId?: string | null;
  onSelect?: (space: Space) => void;
  userCenter?: { lat: number; lng: number } | null;
}

export function MapView({ spaces, activeSpaceId, hoveredSpaceId, onSelect, userCenter }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [clusterInfo, setClusterInfo] = useState<{ zoom: number; bounds: [number, number, number, number] | null }>({ zoom: 15.2, bounds: null });

  // Initialize supercluster
  const supercluster = useMemo(() => {
    const sc = new Supercluster<{ id: string; space: Space }, any>({
      radius: 35,
      maxZoom: 18,
    });
    sc.load(
      spaces.map((s) => ({
        type: 'Feature',
        properties: { cluster: false, id: s.id, space: s },
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      }))
    );
    return sc;
  }, [spaces]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const style: string = process.env.NEXT_PUBLIC_MAP_TILES_URL || CARTO_POSITRON;

    const center = userCenter ?? GRACIA_CENTER;

    const map = new maplibregl.Map({
      container,
      style,
      center: [center.lng, center.lat],
      zoom: 15.2,
      pitch: 0,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    const updateClusters = () => {
      const bounds = map.getBounds();
      setClusterInfo({
        zoom: Math.floor(map.getZoom()),
        bounds: [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth(),
        ],
      });
    };

    map.on('move', updateClusters);
    map.on('zoom', updateClusters);
    
    // Initial call after map configures itself
    map.once('load', updateClusters);

    return () => {
      map.off('move', updateClusters);
      map.off('zoom', updateClusters);
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const syncMarkers = () => {
      const existing = markersRef.current;
      
      const clusters = clusterInfo.bounds 
        ? supercluster.getClusters(clusterInfo.bounds, clusterInfo.zoom)
        : [];

      // Create a set of next IDs. For clusters, ID is the cluster_id. For points, ID is the space.id.
      const nextIds = new Set(clusters.map((c) => c.properties.cluster ? `cluster-${c.id}` : c.properties.id));

      for (const [id, marker] of existing) {
        if (!nextIds.has(id)) { marker.remove(); existing.delete(id); }
      }

      for (const cluster of clusters) {
        const isCluster = cluster.properties.cluster;
        const id = isCluster ? `cluster-${cluster.id}` : cluster.properties.id;
        
        const m = existing.get(id);
        if (m) {
          if (!isCluster) {
            m.getElement().setAttribute('data-active', String(id === activeSpaceId));
          }
          continue;
        }

        const el = document.createElement('div');
        
        if (isCluster) {
          el.className = 'marker marker--cluster';
          const count = cluster.properties.point_count;
          el.innerHTML = `<div class="marker__pin" style="padding: 5px 8px; border-radius: 20px;"><span style="font-weight: 700;">${count}</span></div>`;
          
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const expansionZoom = supercluster.getClusterExpansionZoom(cluster.id as number);
            map.flyTo({
              center: [cluster.geometry.coordinates[0], cluster.geometry.coordinates[1]],
              zoom: expansionZoom,
              duration: 500
            });
          });
        } else {
          const space = cluster.properties.space;
          el.className = 'marker';
          el.setAttribute('data-active', String(space.id === activeSpaceId));
          el.setAttribute('data-featured', String(!!space.isFeatured));
          el.setAttribute('data-type', space.type);
          el.innerHTML = `<div class="marker__pin"><span class="marker__icon">${iconSvg(space.type)}</span><span>${space.priceCents > 0 ? priceLabel(space.priceCents) : '?'}</span></div>`;
          el.addEventListener('click', (e) => { e.stopPropagation(); onSelect?.(space); });
        }

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([cluster.geometry.coordinates[0], cluster.geometry.coordinates[1]])
          .addTo(map);
        existing.set(id, marker);
      }
    };

    if (map.loaded()) {
      syncMarkers();
    } else {
      map.once('load', syncMarkers);
    }
  }, [spaces, activeSpaceId, onSelect, supercluster, clusterInfo]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || spaces.length === 0) return;

    const fly = () => {
      if (spaces.length === 1) {
        map.flyTo({ center: [spaces[0].lng, spaces[0].lat], zoom: 15, duration: 800 });
        return;
      }
      const bounds = spaces.reduce(
        (b, s) => b.extend([s.lng, s.lat] as [number, number]),
        new maplibregl.LngLatBounds(
          [spaces[0].lng, spaces[0].lat],
          [spaces[0].lng, spaces[0].lat],
        ),
      );
      map.fitBounds(bounds, { padding: 80, maxZoom: 16, duration: 800 });
    };

    if (map.loaded()) fly();
    else map.once('load', fly);
  }, [spaces]);

  // Fly to user location when geolocation resolves
  useEffect(() => {
    if (!userCenter) return;
    const map = mapRef.current;
    const fly = () => map?.flyTo({ center: [userCenter.lng, userCenter.lat], zoom: 15, duration: 1000 });
    if (map?.loaded()) fly();
    else map?.once('load', fly);
  }, [userCenter]);

  // Update data-hover attribute without re-creating markers
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      marker.getElement().setAttribute('data-hover', String(id === hoveredSpaceId && hoveredSpaceId !== null));
    }
  }, [hoveredSpaceId]);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />;
}
