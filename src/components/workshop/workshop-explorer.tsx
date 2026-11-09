'use client';

import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/icon';
import { NavMenu } from '@/components/ui/nav-menu';
import { WORKSHOP_CATEGORIES, getWorkshopCategoryLabel } from '@/lib/data/workshop-categories';
import type { WorkshopWithSpace } from '@/types/workshop';
import { WorkshopBrandMark } from './workshop-brand-mark';
import { WorkshopCategoryIcon } from './workshop-category-icon';
import { WorkshopMapLoader } from './workshop-map-loader';

const copy = {
  ca: {
    brand: 'Somtallers',
    beta: 'beta',
    publish: 'Publica un taller',
    location: 'Cerca tallers a prop teu…',
    locate: 'Centrar al meu lloc',
    category: 'Tipus de taller',
    allCategories: 'Tots els tipus',
    date: 'Data',
    results: 'Tallers a prop teu',
    empty: 'No hi ha tallers amb aquests filtres. Prova una altra data o categoria.',
    list: 'Llista',
    map: 'Mapa',
    price: 'Preu a consultar',
    current: 'Ubicació actual',
    locationError: 'No hem pogut obtenir la ubicació. Pots escriure una ciutat o zona.',
  },
  es: {
    brand: 'Somtallers',
    beta: 'beta',
    publish: 'Publica un taller',
    location: 'Busca talleres cerca de ti…',
    locate: 'Centrar en mi ubicación',
    category: 'Tipo de taller',
    allCategories: 'Todos los tipos',
    date: 'Fecha',
    results: 'Talleres cerca de ti',
    empty: 'No hay talleres con estos filtros. Prueba otra fecha o categoría.',
    list: 'Lista',
    map: 'Mapa',
    price: 'Consultar precio',
    current: 'Ubicación actual',
    locationError: 'No pudimos obtener la ubicación. Puedes escribir una ciudad o zona.',
  },
  en: {
    brand: 'Somtallers',
    beta: 'beta',
    publish: 'List a workshop',
    location: 'Find workshops near you…',
    locate: 'Center on my location',
    category: 'Workshop type',
    allCategories: 'All types',
    date: 'Date',
    results: 'Workshops near you',
    empty: 'No workshops match these filters. Try another date or category.',
    list: 'List',
    map: 'Map',
    price: 'Contact for price',
    current: 'Current location',
    locationError: 'Could not get your location. Enter a city or area instead.',
  },
} as const;

function sessionDateInBarcelona(value: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function locationText(workshop: WorkshopWithSpace): string {
  return [
    workshop.address,
    workshop.city,
    workshop.space?.address,
    workshop.space?.neighborhood,
    workshop.space?.city,
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();
}

export function WorkshopExplorer({
  workshops,
  locale,
  category: initialCategory,
  date: initialDate,
  location: initialLocation,
  latitude,
  longitude,
}: {
  workshops: WorkshopWithSpace[];
  locale: string;
  category?: string;
  date?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}) {
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const localePrefix = locale === 'ca' ? '' : `/${locale}`;
  const [category, setCategory] = useState(initialCategory ?? '');
  const [date, setDate] = useState(initialDate ?? '');
  const [location, setLocation] = useState(initialLocation ?? 'Barcelona');
  const [center, setCenter] = useState<[number, number] | undefined>(
    Number.isFinite(latitude) && Number.isFinite(longitude) ? [longitude!, latitude!] : undefined,
  );
  const [locationError, setLocationError] = useState('');
  const [view, setView] = useState<'map' | 'list'>('map');

  const filteredWorkshops = useMemo(() => {
    const query = location.trim().toLocaleLowerCase();
    return workshops.filter((workshop) => {
      if (category && workshop.category !== category) return false;
      if (date && !workshop.sessions.some(
        (session) => session.status === 'scheduled' && sessionDateInBarcelona(session.startTime) === date,
      )) return false;
      if (query && !center && !locationText(workshop).includes(query)) return false;
      return true;
    });
  }, [workshops, category, date, location, center]);

  function updateUrl(next: { category?: string; date?: string; location?: string }) {
    const url = new URL(window.location.href);
    for (const key of ['category', 'date', 'location', 'latitude', 'longitude']) {
      url.searchParams.delete(key);
    }
    const nextCategory = next.category ?? category;
    const nextDate = next.date ?? date;
    const nextLocation = next.location ?? location;
    if (nextCategory) url.searchParams.set('category', nextCategory);
    if (nextDate) url.searchParams.set('date', nextDate);
    if (nextLocation) url.searchParams.set('location', nextLocation);
    window.history.replaceState(window.history.state, '', url);
  }

  function searchLocation() {
    const url = new URL(window.location.href);
    for (const key of ['latitude', 'longitude']) url.searchParams.delete(key);
    const nextCategory = category;
    const nextDate = date;
    if (nextCategory) url.searchParams.set('category', nextCategory);
    else url.searchParams.delete('category');
    if (nextDate) url.searchParams.set('date', nextDate);
    else url.searchParams.delete('date');
    if (location.trim()) url.searchParams.set('location', location.trim());
    else url.searchParams.delete('location');
    window.location.assign(url);
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationError(text.locationError);
      return;
    }
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextCenter: [number, number] = [coords.longitude, coords.latitude];
        setCenter(nextCenter);
        setLocation(text.current);
        const url = new URL(window.location.href);
        if (category) url.searchParams.set('category', category);
        else url.searchParams.delete('category');
        if (date) url.searchParams.set('date', date);
        else url.searchParams.delete('date');
        url.searchParams.set('location', text.current);
        url.searchParams.set('latitude', String(coords.latitude));
        url.searchParams.set('longitude', String(coords.longitude));
        window.location.assign(url);
      },
      () => setLocationError(text.locationError),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  useEffect(() => {
    if (initialLocation || center || !navigator.geolocation) return;
    locate();
    // Request geolocation once when the directory opens without explicit filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="app workshop-app">
      <header className="topnav glass">
        <a className="topnav__brand" href={`${localePrefix}/`} aria-label={text.brand}>
          <WorkshopBrandMark />
          <span>{text.brand}</span>
          <em>{text.beta}</em>
        </a>
        <form className="topnav__search workshop-topnav__search" onSubmit={(event) => {
          event.preventDefault();
          searchLocation();
        }}>
          <Icon name="search" size={18} />
          <input
            type="search"
            value={location}
            onChange={(event) => {
              setLocation(event.target.value);
              setCenter(undefined);
            }}
            placeholder={text.location}
            aria-label={text.location}
          />
          <button
            type="button"
            className="topnav__geolocate"
            onClick={locate}
            aria-label={text.locate}
            title={text.locate}
          >
            <Icon name="locate" size={16} />
          </button>
          {locationError && <span className="workshop-topnav__location-error" role="status">{locationError}</span>}
        </form>
        <div className="topnav__actions">
          <a href={`${localePrefix}/publicar-taller`} className="btn-publish">{text.publish}</a>
          <NavMenu workshops />
        </div>
        <div className="topnav__filters">
          <div className="workshop-filters">
            <label className="workshop-select">
              <span className="workshop-select__label">{text.category}</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  updateUrl({ category: event.target.value });
                }}
              >
                <option value="">{text.allCategories}</option>
                {WORKSHOP_CATEGORIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item[locale as keyof typeof item] ?? item.ca}
                  </option>
                ))}
              </select>
            </label>
            <label className="workshop-select">
              <span className="workshop-select__label">{text.date}</span>
              <input
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  updateUrl({ date: event.target.value });
                }}
              />
            </label>
          </div>
        </div>
      </header>

      <div className="mapwrap workshop-mapwrap" data-view={view}>
        <div className="mapwrap__canvas">
          <WorkshopMapLoader workshops={filteredWorkshops} locale={locale} center={center} />
        </div>
        <section className="sheet glass workshop-sheet" aria-label={text.results}>
          <span className="sheet__handle" aria-hidden="true" />
          <header className="sheet__header">
            <h2 className="sheet__count">{text.results} <span>({filteredWorkshops.length})</span></h2>
          </header>
          {filteredWorkshops.length > 0 ? (
            <div className="cards stagger workshop-map-cards">
              {filteredWorkshops.map((workshop) => {
                const session = workshop.sessions.find((item) => item.status === 'scheduled');
                const formattedDate = session
                  ? new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Europe/Madrid',
                    }).format(new Date(session.startTime))
                  : null;
                return (
                  <a
                    className="card workshop-map-card"
                    key={workshop.id}
                    href={`${localePrefix}/taller/${encodeURIComponent(workshop.slug)}`}
                  >
                    <div className="card__media workshop-map-card__media" data-category={workshop.category}>
                      <WorkshopCategoryIcon category={workshop.category} className="card__glyph" />
                      <span className="card__type-badge">
                        <WorkshopCategoryIcon category={workshop.category} />
                      </span>
                    </div>
                    <div className="card__body">
                      <span className="workshop-map-card__category">
                        {getWorkshopCategoryLabel(workshop.category, locale)}
                      </span>
                      <h3 className="card__title">{workshop.title}</h3>
                      <p className="card__meta">
                        <span>{[workshop.address, workshop.city || workshop.space?.city].filter(Boolean).join(', ') || 'Barcelona'}</span>
                      </p>
                      <div className="card__footer">
                        <span className="workshop-map-card__date">{formattedDate}</span>
                        <strong className="card__price">
                          {workshop.price === null
                            ? text.price
                            : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(workshop.price)}
                        </strong>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="workshops-empty workshop-map-empty">{text.empty}</p>
          )}
        </section>
      </div>

      <button
        type="button"
        className="view-toggle"
        onClick={() => setView((current) => current === 'map' ? 'list' : 'map')}
        aria-label={view === 'map' ? text.list : text.map}
      >
        <Icon name={view === 'map' ? 'list' : 'map'} size={16} />
        {view === 'map' ? text.list : text.map}
      </button>
    </div>
  );
}
