"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import type { MapViewProps } from "@/components/map/map-view";
import { TopNav } from "@/components/ui/top-nav";
import { FilterBar, type FilterId } from "@/components/space/filter-bar";
import { SpaceSheet, type SortId } from "@/components/space/space-sheet";
import { SpaceDetailModal } from "@/components/space/space-detail-modal";
import { Icon } from "@/components/ui/icon";
import { GRACIA_CENTER } from "@/lib/data/mock-spaces";
import { getFavoriteIds, toggleFavorite } from "@/lib/supabase/favorites-actions";
import { createClient } from "@/lib/supabase/client";
import type { Space } from "@/lib/schemas/space";
import { filterSpacesByQuery } from "@/lib/search/space-search";
import { useRouter } from "@/lib/i18n/routing";
import { getSlugFromType } from "@/lib/seo/type-slugs";
import { slugify } from "@/lib/geo/index";

const MapView = dynamic<MapViewProps>(
  () => import("@/components/map/map-view").then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div
        className="mapwrap__canvas"
        style={{ background: "var(--bg-soft)" }}
      />
    ),
  },
);

function distanceSq(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dlat = a.lat - b.lat;
  const dlng = a.lng - b.lng;
  return dlat * dlat + dlng * dlng;
}

interface HomeClientProps {
  initialSpaces: Space[];
  isAdmin: boolean;
  currentUserId?: string;
  initialFilter?: FilterId;
  cityContext?: string;
  typeContext?: string;
}

export function HomeClient({
  initialSpaces,
  isAdmin,
  currentUserId,
  initialFilter,
  cityContext,
  typeContext,
}: HomeClientProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterId>(initialFilter ?? "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("distance");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [hoveredSpaceId, setHoveredSpaceId] = useState<string | null>(null);
  const [userCenter, setUserCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [flyTarget, setFlyTarget] = useState<{
    lat: number;
    lng: number;
    key: number;
  } | null>(null);
  const [view, setView] = useState<"map" | "list">("map");
  const [ratingPatch, setRatingPatch] = useState<
    Record<string, { rating: number; reviewsCount: number }>
  >({});

  const handleFilterChange = useCallback(
    (id: FilterId) => {
      if (cityContext && id !== "featured") {
        const citySlug = slugify(cityContext);
        if (id === "all") {
          router.push(`/${citySlug}`);
        } else {
          const typeSlug = getSlugFromType(
            id as import("@/lib/schemas/space").SpaceType,
            locale,
          );
          router.push(`/${citySlug}/${typeSlug}`);
        }
      } else {
        setFilter(id);
      }
    },
    [cityContext, locale, router],
  );

  const handleSelectSpace = useCallback(
    (space: Space | null) => {
      if (space) {
        const urlPrefix = locale === "ca" ? "" : `/${locale}`;
        if (selectedSpace) {
          window.history.replaceState(
            { modalSpaceId: space.id },
            "",
            `${urlPrefix}/espai/${space.slug}`,
          );
        } else {
          window.history.pushState(
            { modalSpaceId: space.id },
            "",
            `${urlPrefix}/espai/${space.slug}`,
          );
        }
        setSelectedSpace(space);
      } else {
        if (window.history.state?.modalSpaceId === selectedSpace?.id) {
          window.history.back();
        }
        setSelectedSpace(null);
      }
    },
    [locale, selectedSpace],
  );

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (!e.state?.modalSpaceId) {
        setSelectedSpace(null);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load favorites when user logs in
  useEffect(() => {
    const supabase = createClient();
    const load = async () => {
      const ids = await getFavoriteIds();
      setLikedIds(new Set(ids));
    };
    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => load());
    return () => subscription.unsubscribe();
  }, []);

  const filteredSpaces = useMemo(() => {
    let list = initialSpaces.map((s) => {
      const patch = ratingPatch[s.id];
      return patch ? { ...s, ...patch } : s;
    });
    if (filter === "featured") list = list.filter((s) => s.isFeatured);
    else if (filter !== "all") list = list.filter((s) => s.type === filter);
    if (query) list = filterSpacesByQuery(list, query, locale);
    const center = userCenter ?? GRACIA_CENTER;
    if (sort === "distance") {
      list.sort((a, b) => distanceSq(a, center) - distanceSq(b, center));
    } else if (sort === "price") {
      list.sort((a, b) => a.priceCents - b.priceCents);
    } else {
      list.sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [initialSpaces, filter, locale, query, sort, userCenter, ratingPatch]);

  const handleReviewAdded = useCallback(
    (spaceId: string, rating: number, reviewsCount: number) => {
      setRatingPatch((p) => ({ ...p, [spaceId]: { rating, reviewsCount } }));
    },
    [],
  );

  const contextTypeLabel = typeContext ? t(`filter.${typeContext}`) : undefined;

  const forcedPlaceholder = cityContext
    ? typeContext
      ? t("nav.searchContext", {
          typeLabel: contextTypeLabel,
          location: cityContext,
        })
      : t("nav.searchNear", { location: cityContext })
    : undefined;

  const locationLabel = useMemo<string | null>(() => {
    if (query.trim()) {
      const q = query.trim();
      return q.charAt(0).toUpperCase() + q.slice(1);
    }
    return cityContext ?? null;
  }, [query, cityContext]);

  const handleLocationFound = useCallback(
    (lat: number, lng: number) => {
      setUserCenter({ lat, lng });
      if (!cityContext) setFlyTarget({ lat, lng, key: Date.now() });
    },
    [cityContext],
  );

  const handleGeolocateClick = useCallback(() => {
    if (cityContext) {
      window.location.href = `/${locale}`;
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setUserCenter({ lat: coords.latitude, lng: coords.longitude });
        setFlyTarget({
          lat: coords.latitude,
          lng: coords.longitude,
          key: Date.now(),
        });
      },
      undefined,
      { timeout: 6000 },
    );
  }, [cityContext, locale]);

  const toggleLike = useCallback(async (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await toggleFavorite(id);
    } catch (err) {
      // Revert optimistic update on failure
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      if ((err as Error)?.message !== 'not-authenticated') {
        console.error('[like] toggleFavorite failed:', err);
      }
    }
  }, []);

  return (
    <div className="app">
      <TopNav
        query={query}
        onQueryChange={setQuery}
        onLocationFound={handleLocationFound}
        onGeolocateClick={handleGeolocateClick}
        forcedPlaceholder={forcedPlaceholder}
      >
        <FilterBar active={filter} onChange={handleFilterChange} />
      </TopNav>
      <div className="mapwrap" data-view={view}>
        <div className="mapwrap__canvas">
          <MapView
            spaces={filteredSpaces}
            activeSpaceId={selectedSpace?.id ?? null}
            hoveredSpaceId={hoveredSpaceId}
            onSelect={handleSelectSpace}
            flyTarget={flyTarget}
          />
        </div>
        <SpaceSheet
          spaces={filteredSpaces}
          likedIds={likedIds}
          sort={sort}
          onSortChange={setSort}
          onSelect={handleSelectSpace}
          onToggleLike={toggleLike}
          onHover={setHoveredSpaceId}
          locationLabel={locationLabel}
          typeLabel={contextTypeLabel}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
        />
        <SpaceDetailModal
          space={selectedSpace}
          onClose={() => handleSelectSpace(null)}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onReviewAdded={handleReviewAdded}
          liked={selectedSpace ? likedIds.has(selectedSpace.id) : false}
          onToggleLike={toggleLike}
        />
      </div>

      <button
        type="button"
        className="view-toggle"
        onClick={() => setView((v) => (v === "map" ? "list" : "map"))}
        aria-label={view === "map" ? t("view.showList") : t("view.showMap")}
      >
        <Icon name={view === "map" ? "list" : "map"} size={16} />
        {view === "map" ? t("view.showList") : t("view.showMap")}
      </button>
    </div>
  );
}
