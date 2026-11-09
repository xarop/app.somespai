'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type Marker } from 'maplibre-gl';
import Supercluster from 'supercluster';
import type { Workshop } from '@/types/workshop';
import { getWorkshopCategoryIconMarkup } from './workshop-category-icon';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

export function WorkshopMap({
  workshops,
  locale,
  center,
}: {
  workshops: Workshop[];
  locale: string;
  center?: [number, number];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const [clusterInfo, setClusterInfo] = useState<{
    zoom: number;
    bounds: [number, number, number, number] | null;
  }>({ zoom: 11, bounds: null });

  const clusterIndex = useMemo(() => {
    const cluster = new Supercluster<{ workshop: Workshop }, { workshop: Workshop }>({
      radius: 40,
      maxZoom: 18,
    });
    cluster.load(
      workshops.flatMap((workshop) =>
        workshop.lat === null || workshop.lng === null
          ? []
          : [{
              type: 'Feature' as const,
              properties: { workshop },
              geometry: { type: 'Point' as const, coordinates: [workshop.lng, workshop.lat] },
            }],
      ),
    );
    return cluster;
  }, [workshops]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: process.env.NEXT_PUBLIC_MAP_TILES_URL || MAP_STYLE,
      center: center ?? [2.16, 41.39],
      zoom: center ? 12 : 11,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
    const updateViewport = () => {
      const bounds = map.getBounds();
      setClusterInfo({
        zoom: Math.floor(map.getZoom()),
        bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
      });
    };
    map.on('moveend', updateViewport);
    map.on('zoomend', updateViewport);
    map.once('load', updateViewport);
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    const fly = () => map.flyTo({ center, zoom: 13, duration: 700 });
    if (map.isStyleLoaded()) fly();
    else map.once('load', fly);
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !clusterInfo.bounds) return;

    const syncMarkers = () => {
      const clusters = clusterIndex.getClusters(clusterInfo.bounds!, clusterInfo.zoom);
      const nextIds = new Set(clusters.map((item) => {
        const properties = item.properties as typeof item.properties & { cluster_id?: number };
        return properties.cluster_id !== undefined
          ? `cluster-${properties.cluster_id}`
          : properties.workshop.id;
      }));
      for (const [id, marker] of markersRef.current) {
        if (!nextIds.has(id)) {
          marker.remove();
          markersRef.current.delete(id);
        }
      }

      for (const feature of clusters) {
        const properties = feature.properties as typeof feature.properties & {
          cluster_id?: number;
          point_count?: number;
        };
        const isCluster = properties.cluster_id !== undefined;
        const workshop = isCluster ? null : properties.workshop;
        const id = isCluster ? `cluster-${properties.cluster_id}` : workshop!.id;
        if (markersRef.current.has(id)) continue;

        const element = document.createElement(isCluster ? 'div' : 'a');
        element.className = isCluster ? 'marker marker--cluster workshop-marker' : 'marker workshop-marker';
        if (isCluster) {
          const clusterId = properties.cluster_id!;
          const pointCount = properties.point_count!;
          const clusterLabel = locale === 'en'
            ? `${pointCount} workshops`
            : locale === 'es'
              ? `${pointCount} talleres`
              : `${pointCount} tallers`;
          element.setAttribute('role', 'button');
          element.setAttribute('tabindex', '0');
          element.setAttribute('aria-label', clusterLabel);
          element.innerHTML = `<span class="marker__pin"><span>${pointCount}</span></span>`;
          const expandCluster = (event: Event) => {
            event.stopPropagation();
            map.flyTo({
              center: feature.geometry.coordinates as [number, number],
              zoom: clusterIndex.getClusterExpansionZoom(clusterId),
              duration: 500,
            });
          };
          element.addEventListener('click', expandCluster);
          element.addEventListener('keydown', (event) => {
            if (event instanceof KeyboardEvent && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
              expandCluster(event);
            }
          });
        } else {
          const item = workshop!;
          if (element instanceof HTMLAnchorElement) {
            element.href = `${locale === 'ca' ? '' : `/${locale}`}/taller/${encodeURIComponent(item.slug)}`;
          }
          element.title = item.title;
          element.setAttribute('aria-label', item.title);
          element.setAttribute('data-category', item.category);
          const price = item.price === null
            ? '?'
            : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(item.price)}€`;
          element.innerHTML = `<span class="marker__pin"><span class="marker__icon">${getWorkshopCategoryIconMarkup(item.category)}</span><span>${price}</span></span>`;
        }

        const marker = new maplibregl.Marker({ element, anchor: 'bottom' })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .addTo(map);
        markersRef.current.set(id, marker);
      }
    };

    if (map.isStyleLoaded()) syncMarkers();
    else map.once('load', syncMarkers);
    return () => {
      map.off('load', syncMarkers);
    };
  }, [clusterIndex, clusterInfo, locale]);

  useEffect(() => {
    const map = mapRef.current;
    const points = workshops.filter(
      (workshop) => workshop.lat !== null && workshop.lng !== null,
    );
    if (!map || !points.length || center) return;

    const fit = () => {
      if (points.length === 1) {
        map.flyTo({ center: [points[0].lng!, points[0].lat!], zoom: 13, duration: 500 });
        return;
      }
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((point) => bounds.extend([point.lng!, point.lat!]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 500 });
    };
    if (map.isStyleLoaded()) fit();
    else map.once('load', fit);
  }, [workshops, center]);

  return <div className="workshop-map" ref={containerRef} aria-label="Map of workshops" />;
}
