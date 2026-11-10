'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { WORKSHOP_CATEGORIES, getWorkshopCategoryLabel } from '@/lib/data/workshop-categories';
import type { AdminWorkshop } from '@/lib/supabase/admin-workshops';
import {
  getAdminWorkshopsAction,
  updateAdminWorkshopAction,
  deleteAdminWorkshopAction,
} from './workshops-actions';

const copy = {
  ca: { loading: 'Carregant tallers…', empty: 'No hi ha tallers.', search: 'Cerca per títol o organitzador', all: 'Tots', active: 'Actiu', paused: 'Pausat', removed: 'Eliminat', title: 'Títol', category: 'Tipus', price: 'Preu', organizer: 'Organitzador', space: 'Espai', sessions: 'Sessions', status: 'Estat', edit: 'Editar', save: 'Desar', cancel: 'Cancel·lar', del: 'Esborrar', confirm: 'Confirmar', view: 'Veure', refresh: 'Actualitzar' },
  es: { loading: 'Cargando talleres…', empty: 'No hay talleres.', search: 'Busca por título u organizador', all: 'Todos', active: 'Activo', paused: 'Pausado', removed: 'Eliminado', title: 'Título', category: 'Tipo', price: 'Precio', organizer: 'Organizador', space: 'Espacio', sessions: 'Sesiones', status: 'Estado', edit: 'Editar', save: 'Guardar', cancel: 'Cancelar', del: 'Borrar', confirm: 'Confirmar', view: 'Ver', refresh: 'Actualizar' },
  en: { loading: 'Loading workshops…', empty: 'No workshops.', search: 'Search by title or organizer', all: 'All', active: 'Active', paused: 'Paused', removed: 'Removed', title: 'Title', category: 'Type', price: 'Price', organizer: 'Organizer', space: 'Space', sessions: 'Sessions', status: 'Status', edit: 'Edit', save: 'Save', cancel: 'Cancel', del: 'Delete', confirm: 'Confirm', view: 'View', refresh: 'Refresh' },
} as const;

type Status = 'active' | 'paused' | 'removed';

export function WorkshopsAdminTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const locale = useLocale();
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const [workshops, setWorkshops] = useState<AdminWorkshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState({ title: '', category: '', price: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error: err } = await getAdminWorkshopsAction();
    setError(err ?? null);
    setWorkshops(data);
    onCountChange?.(data.length);
    setLoading(false);
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return workshops.filter((workshop) =>
      (statusFilter === 'all' || workshop.status === statusFilter) &&
      (!needle || `${workshop.title} ${workshop.organizerName ?? ''}`.toLocaleLowerCase().includes(needle)),
    );
  }, [workshops, query, statusFilter]);

  async function setStatus(id: string, status: Status) {
    await updateAdminWorkshopAction(id, { status });
    setWorkshops((prev) => prev.map((workshop) => (workshop.id === id ? { ...workshop, status } : workshop)));
  }

  async function saveEdit(id: string) {
    const price = draft.price.trim() === '' ? null : Number(draft.price);
    if (price !== null && !Number.isFinite(price)) return;
    const update = { title: draft.title.trim(), category: draft.category, price };
    if (!update.title) return;
    await updateAdminWorkshopAction(id, update);
    setWorkshops((prev) => prev.map((workshop) => (workshop.id === id ? { ...workshop, ...update } : workshop)));
    setEditId(null);
  }

  async function remove(id: string) {
    setConfirmDeleteId(null);
    await deleteAdminWorkshopAction(id);
    const next = workshops.filter((workshop) => workshop.id !== id);
    setWorkshops(next);
    onCountChange?.(next.length);
  }

  if (loading && workshops.length === 0) return <p className="admin-empty">{text.loading}</p>;
  if (error) {
    return (
      <div className="admin-empty">
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button type="button" className="admin-action-btn" onClick={load}>{text.refresh}</button>
      </div>
    );
  }

  const prefix = locale === 'ca' ? '' : `/${locale}`;

  return (
    <div className="admin-workshops">
      <div className="admin-actions" style={{ marginBottom: 'var(--s-3)' }}>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.search}
          aria-label={text.search}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | Status)} aria-label={text.status}>
          <option value="all">{text.all}</option>
          <option value="active">{text.active}</option>
          <option value="paused">{text.paused}</option>
          <option value="removed">{text.removed}</option>
        </select>
        <button type="button" className="admin-action-btn" onClick={load}>{text.refresh}</button>
      </div>
      {visible.length === 0 ? (
        <p className="admin-empty">{text.empty}</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{text.title}</th><th>{text.category}</th><th>{text.price}</th><th>{text.organizer}</th>
                <th>{text.space}</th><th>{text.sessions}</th><th>{text.status}</th><th />
              </tr>
            </thead>
            <tbody>
              {visible.map((workshop) => {
                const editing = editId === workshop.id;
                return (
                  <tr key={workshop.id}>
                    <td>
                      {editing ? (
                        <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} aria-label={text.title} />
                      ) : workshop.title}
                    </td>
                    <td>
                      {editing ? (
                        <select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} aria-label={text.category}>
                          {WORKSHOP_CATEGORIES.map((category) => (
                            <option key={category.value} value={category.value}>{getWorkshopCategoryLabel(category.value, locale)}</option>
                          ))}
                        </select>
                      ) : getWorkshopCategoryLabel(workshop.category, locale)}
                    </td>
                    <td>
                      {editing ? (
                        <input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} aria-label={text.price} style={{ width: 80 }} />
                      ) : workshop.price === null ? '—' : `${workshop.price} €`}
                    </td>
                    <td>{workshop.organizerName ?? '—'}</td>
                    <td>{workshop.spaceTitle ?? '—'}</td>
                    <td className="admin-cell--center">{workshop.sessionsCount}</td>
                    <td>
                      <select style={{ minWidth: 110 }} value={workshop.status} onChange={(event) => setStatus(workshop.id, event.target.value as Status)} aria-label={text.status}>
                        <option value="active">{text.active}</option>
                        <option value="paused">{text.paused}</option>
                        <option value="removed">{text.removed}</option>
                      </select>
                    </td>
                    <td>
                      <div className="admin-actions">
                        {editing ? (
                          <>
                            <button type="button" className="admin-action-btn" onClick={() => saveEdit(workshop.id)}>{text.save}</button>
                            <button type="button" className="admin-action-btn" onClick={() => setEditId(null)}>{text.cancel}</button>
                          </>
                        ) : (
                          <>
                            <a className="admin-action-btn" href={`${prefix}/taller/${workshop.slug}`} target="_blank" rel="noreferrer">{text.view}</a>
                            <button
                              type="button"
                              className="admin-action-btn"
                              onClick={() => {
                                setEditId(workshop.id);
                                setDraft({ title: workshop.title, category: workshop.category, price: workshop.price === null ? '' : String(workshop.price) });
                              }}
                            >
                              {text.edit}
                            </button>
                            {confirmDeleteId === workshop.id ? (
                              <>
                                <button type="button" className="admin-action-btn admin-action-btn--delete" onClick={() => remove(workshop.id)}>{text.confirm}</button>
                                <button type="button" className="admin-action-btn" onClick={() => setConfirmDeleteId(null)}>{text.cancel}</button>
                              </>
                            ) : (
                              <button type="button" className="admin-action-btn admin-action-btn--delete" onClick={() => setConfirmDeleteId(workshop.id)}>{text.del}</button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
