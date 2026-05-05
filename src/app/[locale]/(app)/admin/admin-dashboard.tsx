'use client';

import { useState, useTransition, useOptimistic } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Space } from '@/lib/schemas/space';
import { Icon } from '@/components/ui/icon';
import {
  setStatusAction,
  setFeaturedAction,
  updateSpaceAction,
  deleteSpaceAction,
} from './actions';

type StatusFilter = 'all' | 'active' | 'paused' | 'removed';

const SPACE_TYPES = ['storage', 'workspace', 'garden', 'room'] as const;

function formatPrice(priceCents: number, unit: string): string {
  const price = (priceCents / 100).toFixed(0);
  return `${price}€/${unit === 'month' ? 'mes' : unit === 'day' ? 'dia' : 'h'}`;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`type-badge type-badge--${type}`}>
      <Icon name={type as 'storage' | 'workspace' | 'garden' | 'room'} size={12} />
      {type}
    </span>
  );
}

interface EditModalProps {
  space: Space;
  onClose: () => void;
  onSave: (data: Partial<Space>) => void;
  isPending: boolean;
}

function EditModal({ space, onClose, onSave, isPending }: EditModalProps) {
  const t = useTranslations('admin');
  const tFilter = useTranslations('filter');
  const [form, setForm] = useState({
    title: space.title,
    description: space.description ?? '',
    type: space.type,
    priceCents: space.priceCents,
    priceUnit: space.priceUnit,
    sizeM2: space.sizeM2 ?? '',
    neighborhood: space.neighborhood,
    city: space.city,
    status: space.status,
    isFeatured: space.isFeatured,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      title: form.title,
      description: form.description || null,
      type: form.type as Space['type'],
      priceCents: Number(form.priceCents),
      priceUnit: form.priceUnit as Space['priceUnit'],
      sizeM2: form.sizeM2 !== '' ? Number(form.sizeM2) : null,
      neighborhood: form.neighborhood,
      city: form.city,
      status: form.status as Space['status'],
      isFeatured: form.isFeatured,
    });
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <header className="admin-modal__header">
          <h2>{t('editTitle')}</h2>
          <button type="button" className="admin-modal__close" onClick={onClose} aria-label="Tancar">
            ✕
          </button>
        </header>
        <form onSubmit={handleSubmit} className="admin-modal__body">
          <label className="field">
            <span className="field__label">{t('fieldTitle')}</span>
            <input
              type="text"
              className="field__input"
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              required
              maxLength={120}
            />
          </label>

          <label className="field">
            <span className="field__label">{t('fieldDescription')}</span>
            <textarea
              className="field__input field__textarea"
              rows={3}
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </label>

          <div className="field-row">
            <div className="field">
              <span className="field__label">{t('fieldType')}</span>
              <select
                className="field__input field__select"
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value as Space['type'] }))}
              >
                {SPACE_TYPES.map(type => (
                  <option key={type} value={type}>{tFilter(type)}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <span className="field__label">{t('fieldStatus')}</span>
              <select
                className="field__input field__select"
                value={form.status}
                onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Space['status'] }))}
              >
                <option value="active">{t('statusActive')}</option>
                <option value="paused">{t('statusPaused')}</option>
                <option value="removed">{t('statusRemoved')}</option>
              </select>
            </div>
          </div>

          <div className="field-row">
            <label className="field field--grow">
              <span className="field__label">{t('fieldPrice')} (€)</span>
              <input
                type="number"
                className="field__input"
                min={0}
                step={1}
                value={form.priceCents}
                onChange={(e) => setForm(f => ({ ...f, priceCents: Number(e.target.value) }))}
              />
            </label>
            <div className="field">
              <span className="field__label">{t('fieldPriceUnit')}</span>
              <select
                className="field__input field__select"
                value={form.priceUnit}
                onChange={(e) => setForm(f => ({ ...f, priceUnit: e.target.value as Space['priceUnit'] }))}
              >
                <option value="month">{t('unitMonth')}</option>
                <option value="day">{t('unitDay')}</option>
                <option value="hour">{t('unitHour')}</option>
              </select>
            </div>
            <label className="field">
              <span className="field__label">{t('fieldSize')} (m²)</span>
              <input
                type="number"
                className="field__input"
                min={0}
                step={0.1}
                value={form.sizeM2}
                onChange={(e) => setForm(f => ({ ...f, sizeM2: e.target.value }))}
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field field--grow">
              <span className="field__label">{t('fieldNeighborhood')}</span>
              <input
                type="text"
                className="field__input"
                value={form.neighborhood}
                onChange={(e) => setForm(f => ({ ...f, neighborhood: e.target.value }))}
              />
            </label>
            <label className="field field--grow">
              <span className="field__label">{t('fieldCity')}</span>
              <input
                type="text"
                className="field__input"
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
              />
            </label>
          </div>

          <label className="checkbox-item admin-featured-check">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
            />
            <span>{t('fieldFeatured')}</span>
          </label>

          <div className="admin-modal__footer">
            <button type="button" onClick={onClose} disabled={isPending}>
              {t('cancel')}
            </button>
            <button type="submit" data-variant="primary" disabled={isPending}>
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({ message, onConfirm, onCancel }: ConfirmDialogProps) {
  const t = useTranslations('admin');
  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="admin-modal admin-modal--sm">
        <p className="admin-modal__confirm-msg">{message}</p>
        <div className="admin-modal__footer">
          <button type="button" onClick={onCancel}>{t('cancel')}</button>
          <button type="button" data-variant="danger" onClick={onConfirm}>{t('confirm')}</button>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard({ spaces: initialSpaces }: { spaces: Space[] }) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spaces, setSpacesOptimistic] = useOptimistic(
    initialSpaces,
    (_state: Space[], updater: (s: Space[]) => Space[]) => updater(_state),
  );

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const counts = {
    all: initialSpaces.length,
    active: initialSpaces.filter(s => s.status === 'active').length,
    paused: initialSpaces.filter(s => s.status === 'paused').length,
    removed: initialSpaces.filter(s => s.status === 'removed').length,
  };

  const featured = initialSpaces.filter(s => s.isFeatured).length;

  const filtered = statusFilter === 'all'
    ? spaces
    : spaces.filter(s => s.status === statusFilter);

  function handleToggleStatus(space: Space) {
    const next = space.status === 'active' ? 'paused' : 'active';
    startTransition(async () => {
      setSpacesOptimistic(prev =>
        prev.map(s => s.id === space.id ? { ...s, status: next } : s)
      );
      await setStatusAction(space.id, next);
      router.refresh();
    });
  }

  function handleToggleFeatured(space: Space) {
    const next = !space.isFeatured;
    startTransition(async () => {
      setSpacesOptimistic(prev =>
        prev.map(s => s.id === space.id ? { ...s, isFeatured: next } : s)
      );
      await setFeaturedAction(space.id, next);
      router.refresh();
    });
  }

  function handleSaveEdit(data: Partial<Space>) {
    if (!editingSpace) return;
    const id = editingSpace.id;
    setEditingSpace(null);
    startTransition(async () => {
      setSpacesOptimistic(prev =>
        prev.map(s => s.id === id ? { ...s, ...data } : s)
      );
      await updateSpaceAction(id, {
        title: data.title,
        description: data.description,
        type: data.type,
        priceCents: data.priceCents,
        priceUnit: data.priceUnit,
        sizeM2: data.sizeM2,
        neighborhood: data.neighborhood,
        city: data.city,
        status: data.status,
        isFeatured: data.isFeatured,
      });
      router.refresh();
    });
  }

  function handleDelete(id: string) {
    setDeletingId(null);
    startTransition(async () => {
      setSpacesOptimistic(prev => prev.filter(s => s.id !== id));
      await deleteSpaceAction(id);
      router.refresh();
    });
  }

  return (
    <div className="admin-dashboard">
      {/* Stats */}
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__value">{counts.all}</span>
          <span className="admin-stat__label">{t('statsTotal')}</span>
        </div>
        <div className="admin-stat admin-stat--active">
          <span className="admin-stat__value">{counts.active}</span>
          <span className="admin-stat__label">{t('statsActive')}</span>
        </div>
        <div className="admin-stat admin-stat--paused">
          <span className="admin-stat__value">{counts.paused}</span>
          <span className="admin-stat__label">{t('statsPaused')}</span>
        </div>
        <div className="admin-stat admin-stat--removed">
          <span className="admin-stat__value">{counts.removed}</span>
          <span className="admin-stat__label">{t('statsRemoved')}</span>
        </div>
        <div className="admin-stat admin-stat--featured">
          <span className="admin-stat__value">{featured}</span>
          <span className="admin-stat__label">{t('statsFeatured')}</span>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="admin-filter-bar">
        {(['all', 'active', 'paused', 'removed'] as StatusFilter[]).map(f => (
          <button
            key={f}
            type="button"
            className={`admin-filter-tab${statusFilter === f ? ' admin-filter-tab--active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >
            {t(`filter_${f}` as Parameters<typeof t>[0])}
            <span className="admin-filter-tab__count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('colTitle')}</th>
              <th>{t('colType')}</th>
              <th>{t('colStatus')}</th>
              <th>{t('colLocation')}</th>
              <th>{t('colPrice')}</th>
              <th>{t('colRating')}</th>
              <th>{t('colFeatured')}</th>
              <th>{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(space => (
              <tr key={space.id} className={`admin-row admin-row--${space.status}`}>
                <td className="admin-cell admin-cell--title">
                  <a
                    href={`/espai/${space.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-space-link"
                  >
                    {space.title}
                  </a>
                </td>
                <td><TypeBadge type={space.type} /></td>
                <td><StatusBadge status={space.status} /></td>
                <td className="admin-cell--location">
                  <span>{space.neighborhood}</span>
                  <span className="admin-cell--city">{space.city}</span>
                </td>
                <td>{formatPrice(space.priceCents, space.priceUnit)}</td>
                <td>
                  {space.rating > 0 ? (
                    <span className="admin-rating">★ {space.rating.toFixed(1)}</span>
                  ) : (
                    <span className="admin-rating admin-rating--none">—</span>
                  )}
                </td>
                <td>
                  <button
                    type="button"
                    className={`admin-featured-btn${space.isFeatured ? ' admin-featured-btn--on' : ''}`}
                    onClick={() => handleToggleFeatured(space)}
                    disabled={isPending}
                    aria-label={space.isFeatured ? t('unfeature') : t('feature')}
                    title={space.isFeatured ? t('unfeature') : t('feature')}
                  >
                    ★
                  </button>
                </td>
                <td>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => handleToggleStatus(space)}
                      disabled={isPending}
                      title={space.status === 'active' ? t('pauseSpace') : t('activateSpace')}
                    >
                      {space.status === 'active' ? t('pause') : t('activate')}
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--edit"
                      onClick={() => setEditingSpace(space)}
                      disabled={isPending}
                      title={t('editSpace')}
                    >
                      {t('edit')}
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--delete"
                      onClick={() => setDeletingId(space.id)}
                      disabled={isPending}
                      title={t('deleteSpace')}
                    >
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="admin-empty">{t('empty')}</p>
        )}
      </div>

      {editingSpace && (
        <EditModal
          space={editingSpace}
          onClose={() => setEditingSpace(null)}
          onSave={handleSaveEdit}
          isPending={isPending}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          message={t('deleteConfirm')}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}
    </div>
  );
}
