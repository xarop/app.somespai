'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { PlaceCandidate } from '@/lib/imports/sources/google-places';

type Candidate = PlaceCandidate & { already_imported: boolean };

export function ImportSearch() {
  const locale = useLocale();
  const tFilter = useTranslations('filter');
  const [query, setQuery] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [radius, setRadius] = useState('5000');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ job_id: string; imported: number } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectAll() {
    setSelected(new Set(candidates.filter((c) => !c.already_imported).map((c) => c.place_id)));
  }

  function handleSelectNone() {
    setSelected(new Set());
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setResult(null);
    setCandidates([]);
    setSelected(new Set());

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = { query: query.trim() };
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        const radNum = parseInt(radius, 10);
        if (isFinite(latNum) && isFinite(lngNum)) {
          body.lat = latNum;
          body.lng = lngNum;
          body.radius = isFinite(radNum) ? radNum : 5000;
        }

        const res = await fetch('/api/admin/imports/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Error desconegut');
          return;
        }
        setCandidates(data.candidates ?? []);
      } catch {
        setError('Error de xarxa');
      }
    });
  }

  function handleCommit() {
    if (selected.size === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          place_ids: Array.from(selected),
          query: query.trim(),
        };
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        if (isFinite(latNum) && isFinite(lngNum)) {
          body.lat = latNum;
          body.lng = lngNum;
          body.radius = parseInt(radius, 10) || 5000;
        }

        const res = await fetch('/api/admin/imports/commit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Error en importar');
          return;
        }
        setResult({ job_id: data.job_id, imported: data.imported });
        setCandidates([]);
        setSelected(new Set());
      } catch {
        setError('Error de xarxa');
      }
    });
  }

  const newCandidates = candidates.filter((c) => !c.already_imported);
  const existingCount = candidates.length - newCandidates.length;

  return (
    <div className="import-search">
      <form className="import-search__form" onSubmit={handleSearch}>
        <div className="import-search__query-row">
          <input
            type="text"
            className="field__input"
            placeholder="Ex: pàrquings Eixample Barcelona"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
          <button type="submit" disabled={isPending || !query.trim()}>
            {isPending ? 'Cercant…' : 'Cercar'}
          </button>
        </div>

        <details className="import-search__location">
          <summary>Filtrar per ubicació (opcional)</summary>
          <div className="import-search__location-fields">
            <label className="field">
              <span className="field__label">Latitud</span>
              <input
                type="number"
                step="any"
                className="field__input"
                placeholder="41.3879"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Longitud</span>
              <input
                type="number"
                step="any"
                className="field__input"
                placeholder="2.1699"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
              />
            </label>
            <label className="field">
              <span className="field__label">Radi (m)</span>
              <input
                type="number"
                className="field__input"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </label>
          </div>
        </details>
      </form>

      {error && <p className="import-result import-result--error">{error}</p>}

      {result && (
        <div className="import-result import-result--ok">
          <strong>{result.imported} espais importats</strong> com a pendents de revisió.{' '}
          <a href={`/${locale}/admin/imports/${result.job_id}`}>Veure tasca d&apos;importació →</a>
        </div>
      )}

      {candidates.length > 0 && (
        <div className="import-candidates">
          <div className="import-candidates__header">
            <span>
              {candidates.length} resultats
              {existingCount > 0 && ` · ${existingCount} ja importats`}
            </span>
            <div className="import-candidates__select-actions">
              <button type="button" className="admin-action-btn" onClick={handleSelectAll}>
                Seleccionar nous
              </button>
              <button type="button" className="admin-action-btn" onClick={handleSelectNone}>
                Cap
              </button>
            </div>
          </div>

          <ul className="import-candidates__list">
            {candidates.map((c) => (
              <li
                key={c.place_id}
                className={`import-candidate${c.already_imported ? ' import-candidate--existing' : ''}${selected.has(c.place_id) ? ' import-candidate--selected' : ''}`}
              >
                <label className="import-candidate__check-label">
                  <input
                    type="checkbox"
                    checked={selected.has(c.place_id)}
                    disabled={c.already_imported}
                    onChange={() => toggleSelect(c.place_id)}
                  />
                </label>
                <div className="import-candidate__body">
                  <div className="import-candidate__name">
                    {c.name}
                    {c.already_imported && (
                      <span className="import-candidate__badge import-candidate__badge--existing">
                        ja importat
                      </span>
                    )}
                    {c.type && (
                      <span className={`type-badge type-badge--${c.type}`}>
                        {tFilter(c.type)}
                      </span>
                    )}
                    {c.rating != null && (
                      <span className="import-candidate__rating">★ {c.rating.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="import-candidate__address">{c.address}</div>
                  <div className="import-candidate__meta">
                    <span className="import-candidate__coords">
                      {c.lat.toFixed(5)}, {c.lng.toFixed(5)}
                    </span>
                    <a
                      href={c.map_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="import-candidate__map-link"
                    >
                      Maps ↗
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {selected.size > 0 && (
            <div className="import-commit-bar">
              <span>{selected.size} seleccionats</span>
              <button
                type="button"
                data-variant="primary"
                onClick={handleCommit}
                disabled={isPending}
              >
                {isPending ? 'Important…' : `Importar ${selected.size} espais`}
              </button>
            </div>
          )}
        </div>
      )}

      {!isPending && candidates.length === 0 && !result && query && (
        <p className="import-search__empty">Cap resultat. Prova una cerca diferent.</p>
      )}
    </div>
  );
}
