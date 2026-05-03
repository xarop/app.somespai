'use client';

import { useEffect, useRef } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import { useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { GRACIA_CENTER } from '@/lib/data/mock-spaces';
import { Icon, type IconName } from '@/components/ui/icon';
import { renderToStaticMarkup } from 'react-dom/server';

const TILE_FALLBACK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      paint: { 'raster-saturation': -0.4, 'raster-brightness-min': 0.05 },
    },
  ],
};

interface MapViewProps {
  spaces: Space[];
  activeSpaceId?: string | null;
  onSelect?: (space: Space) => void;
}

const TYPE_ICON: Record<Space['type'], IconName> = {
  storage: 'storage',
  workspace: 'workspace',
  garden: 'garden',
  room: 'room',
};

function formatPriceShort(cents: number) {
  const eur = Math.round(cents / 100);
  return `${eur}€`;
}

export function MapView({ spaces, activeSpaceId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());

  // Initialize map (once)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const tilesUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL;
    const style: string | maplibregl.StyleSpecification = tilesUrl ?? TILE_FALLBACK_STYLE;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style,
      center: [GRACIA_CENTER.lng, GRACIA_CENTER.lat],
      zoom: 15.2,
      pitch: 0,
      attributionControl: { compact: true },
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Sync markers with spaces
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const existing = markersRef.current;
    const nextIds = new Set(spaces.map((s) => s.id));

    // Remove gone markers
    for (const [id, marker] of existing) {
      if (!nextIds.has(id)) {
        marker.remove();
        existing.delete(id);
      }
    }

    // Add or update markers
    for (const space of spaces) {
      const existingMarker = existing.get(space.id);
      if (existingMarker) {
        const el = existingMarker.getElement();
        el.setAttribute('data-active', String(space.id === activeSpaceId));
        continue;
      }

      const el = document.createElement('div');
      el.className = 'marker';
      el.setAttribute('data-active', String(space.id === activeSpaceId));
      el.setAttribute('data-featured', String(space.isFeatured));
      el.innerHTML = `
        <div class="marker__pin">
          <span class="marker__icon">${renderToStaticMarkup(<Icon name={TYPE_ICON[space.type]} size={14} />)}</span>
          <span>${formatPriceShort(space.priceCents)}</span>
        </div>
      `;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelect?.(space);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([space.lng, space.lat])
        .addTo(map);

      existing.set(space.id, marker);
    }
  }, [spaces, activeSpaceId, onSelect]);

  return <div ref={containerRef} className="mapwrap__canvas" />;
}
