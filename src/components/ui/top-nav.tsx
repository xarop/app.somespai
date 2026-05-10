"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { NavMenu } from "@/components/ui/nav-menu";

interface TopNavProps {
  query: string;
  onQueryChange: (value: string) => void;
  onLocationFound?: (lat: number, lng: number) => void;
  onGeolocateClick?: () => void;
  forcedPlaceholder?: string;
  hideSearch?: boolean;
  children?: React.ReactNode;
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      { headers: { "Accept-Language": "ca,es,en" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (
      data.address?.quarter ??
      data.address?.suburb ??
      data.address?.neighbourhood ??
      data.address?.city_district ??
      data.address?.city ??
      null
    );
  } catch {
    return null;
  }
}

export function TopNav({
  query,
  onQueryChange,
  onLocationFound,
  onGeolocateClick,
  forcedPlaceholder,
  hideSearch,
  children,
}: TopNavProps) {
  const t = useTranslations();
  const [placeholder, setPlaceholder] = useState<string>(forcedPlaceholder ?? "");

  useEffect(() => {
    if (forcedPlaceholder) {
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => onLocationFound?.(coords.latitude, coords.longitude),
        () => {},
        { timeout: 6000, maximumAge: 60_000 },
      );
      return;
    }
    setPlaceholder(t("nav.searchLocating"));
    if (!navigator.geolocation) {
      setPlaceholder(t("nav.searchPlaceholder"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }: GeolocationPosition) => {
        const { latitude: lat, longitude: lng } = coords;
        onLocationFound?.(lat, lng);
        const name = await reverseGeocode(lat, lng);
        setPlaceholder(name ? t("nav.searchNear", { location: name }) : t("nav.searchPlaceholder"));
      },
      () => setPlaceholder(t("nav.searchPlaceholder")),
      { timeout: 6000, maximumAge: 60_000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <header className="topnav glass">
        <a className="topnav__brand" href="/" aria-label={t("brand.name")}>
          <svg className="topnav__brand-mark" width="34" height="34" viewBox="0 0 103 103" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect width="102.813" height="102.813" rx="51.4065" fill="var(--primary)" />
            <path d="M23.4217 70.6662C22.0036 70.6662 20.9078 70.2795 20.1344 69.506C19.3867 68.7583 19.0128 67.6754 19.0128 66.2574V36.5557C19.0128 35.1376 19.3867 34.0548 20.1344 33.3071C20.9078 32.5336 22.0036 32.1469 23.4217 32.1469H29.5322V35.7435H24.1178C23.2927 35.7435 22.8802 36.1561 22.8802 36.9811V65.7546C22.8802 66.5796 23.2927 66.9922 24.1178 66.9922H29.5322V70.6662H23.4217Z" fill="var(--primary-ink)" />
            <path d="M73.281 70.6662V66.9922H78.6953C79.5204 66.9922 79.9329 66.5796 79.9329 65.7546V36.9811C79.9329 36.1561 79.5204 35.7435 78.6953 35.7435H73.281V32.1469H79.3915C80.8095 32.1469 81.8924 32.5336 82.6401 33.3071C83.4136 34.0548 83.8003 35.1376 83.8003 36.5557V66.2574C83.8003 67.6754 83.4136 68.7583 82.6401 69.506C81.8924 70.2795 80.8095 70.6662 79.3915 70.6662H73.281Z" fill="var(--primary-ink)" />
          </svg>
          <span>{t("brand.name")}</span>
          <em>beta</em>
        </a>

        {!hideSearch && (
          <label className="topnav__search">
            <Icon name="search" size={18} />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={placeholder}
              aria-label={placeholder}
            />
            {onGeolocateClick && (
              <button
                type="button"
                className="topnav__geolocate"
                onClick={(e) => { e.preventDefault(); onGeolocateClick(); }}
                aria-label="Centrar al meu lloc"
              >
                <Icon name="locate" size={16} />
              </button>
            )}
          </label>
        )}

        <div className="topnav__actions">
          <a href="/publica" className="btn-publish">{t("nav.publish")}</a>
          <NavMenu />
        </div>

        {children && <div className="topnav__filters">{children}</div>}
      </header>
    </>
  );
}
