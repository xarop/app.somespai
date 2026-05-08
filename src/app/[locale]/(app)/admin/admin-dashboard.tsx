'use client';

import { useState, useTransition, useOptimistic, useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Space } from '@/lib/schemas/space';
import { Icon } from '@/components/ui/icon';
import {
  setStatusAction,
  setFeaturedAction,
  deleteSpaceAction,
  updateSpaceFullAction,
  getAdminReviewsAction,
  updateReviewAction,
  deleteReviewAction,
  getUsersAction,
  deleteUserAction,
  setUserAdminRoleAction,
  getContactMessagesAction,
  setContactMessageReadAction,
  deleteContactMessageAction,
  bulkSetStatusAction,
  bulkDeleteAction,
} from './actions';
import type { Review } from '@/lib/supabase/reviews';
import type { AdminUser, ContactMessage } from '@/lib/supabase/admin';

type StatusFilter = 'all' | 'active' | 'paused' | 'removed';
type TypeFilter = 'all' | 'storage' | 'workspace' | 'garden' | 'room' | 'parking';
type OwnerFilter = 'all' | 'none' | string;

const SPACE_TYPES = ['storage', 'workspace', 'garden', 'room', 'parking'] as const;

const AMENITY_GROUPS: Record<string, string[]> = {
  'Connectivitat': ['wifi', 'fiber', 'hot_desk', 'fixed_desk', 'monitor', 'locker'],
  'Reunions': ['meeting_room', 'event_space', 'whiteboard', 'podcast_studio'],
  'Confort': ['ac', 'heating', 'dimmable_light', 'hardwood_floor'],
  'Serveis': ['coffee', 'kitchen', 'printer', 'printer_3d'],
  'Pàrquing': ['covered', 'ev_charger', 'auto_gate', 'motorbike_ok', 'van_access'],
  'Accés': ['access_24h', 'cameras', 'parking', 'bike_parking'],
  'Exterior': ['terrace', 'bbq', 'pool', 'shade', 'sea_view', 'mountain_view'],
  'Equipament': ['projector', 'audio', 'tools', 'tables', 'chairs', 'electricity', 'water'],
  'Altres': ['community', 'reception', 'sustainable', 'campus', 'cellar', 'soundproofed'],
};

function formatPrice(priceCents: number, unit: string): string {  if (priceCents === 0) return '?';  const price = (priceCents / 100).toFixed(0);
  return `${price}€/${unit === 'month' ? 'mes' : unit === 'day' ? 'dia' : 'h'}`;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-badge--${status}`}>{status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span className={`type-badge type-badge--${type}`}>
      <Icon name={type as 'storage' | 'workspace' | 'garden' | 'room' | 'parking'} size={12} />
      {type}
    </span>
  );
}

/* ── Admin reviews section ───────────────────────────────────────────────── */

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="admin-star-picker">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}
          className={`admin-star-btn${n <= value ? ' admin-star-btn--on' : ''}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ spaceId }: { spaceId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editBody, setEditBody] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminReviewsAction(spaceId).then((r) => { setReviews(r); setLoading(false); });
  }, [spaceId]);

  function startEdit(r: Review) {
    setEditingId(r.id);
    setEditRating(r.rating);
    setEditBody(r.body ?? '');
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    const r = reviews.find((x) => x.id === editingId)!;
    await updateReviewAction(editingId, r.spaceId, editRating, editBody || null);
    setReviews((prev) =>
      prev.map((x) => x.id === editingId ? { ...x, rating: editRating, body: editBody || null } : x),
    );
    setEditingId(null);
    setSaving(false);
  }

  async function confirmDelete(id: string) {
    const r = reviews.find((x) => x.id === id)!;
    await deleteReviewAction(id, r.spaceId);
    setReviews((prev) => prev.filter((x) => x.id !== id));
    setConfirmDeleteId(null);
  }

  if (loading) return <p className="field__hint">Carregant ressenyes…</p>;
  if (reviews.length === 0) return <p className="field__hint">Cap ressenya per a aquest slot.</p>;

  return (
    <div className="admin-reviews">
      {reviews.map((r) => (
        <div key={r.id} className="admin-review-item">
          {editingId === r.id ? (
            <div className="admin-review-edit">
              <StarPicker value={editRating} onChange={setEditRating} />
              <textarea
                className="field__input field__textarea"
                rows={3}
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
              />
              <div className="admin-review-edit-actions">
                <button type="button" data-variant="primary" onClick={saveEdit} disabled={saving}>
                  {saving ? 'Desant…' : 'Desa'}
                </button>
                <button type="button" onClick={() => setEditingId(null)} disabled={saving}>
                  Cancel·la
                </button>
              </div>
            </div>
          ) : confirmDeleteId === r.id ? (
            <div className="admin-review-confirm-delete">
              <span>Eliminar aquesta ressenya?</span>
              <button type="button" data-variant="danger" onClick={() => confirmDelete(r.id)}>Sí</button>
              <button type="button" onClick={() => setConfirmDeleteId(null)}>No</button>
            </div>
          ) : (
            <div className="admin-review-view">
              <div className="admin-review-meta">
                <span className="admin-review-author">{r.authorEmail}</span>
                <span className="admin-review-stars">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </span>
                <span className="admin-review-date">
                  {new Date(r.createdAt).toLocaleDateString('ca-ES')}
                </span>
              </div>
              {r.body && <p className="admin-review-body">{r.body}</p>}
              <div className="admin-review-actions">
                <button type="button" className="admin-action-btn" onClick={() => startEdit(r)}>
                  Editar
                </button>
                <button type="button" className="admin-action-btn admin-action-btn--delete"
                  onClick={() => setConfirmDeleteId(r.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Full edit modal ─────────────────────────────────────────────────────── */

interface EditModalProps {
  space: Space;
  onClose: () => void;
  onSuccess: () => void;
}

function EditModal({ space, onClose, onSuccess }: EditModalProps) {
  const t = useTranslations('admin');
  const tFilter = useTranslations('filter');
  const tAmenity = useTranslations('amenity');
  const tPublish = useTranslations('publish');

  const boundAction = updateSpaceFullAction.bind(null, space.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  useEffect(() => {
    if (state === 'ok') { onSuccess(); onClose(); }
  }, [state, onClose, onSuccess]);

  const [keptPhotos, setKeptPhotos] = useState<string[]>(space.photos);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [lat, setLat] = useState(String(space.lat));
  const [lng, setLng] = useState(String(space.lng));
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'error'>('idle');
  const addressRef = useRef<HTMLInputElement>(null);

  const [users, setUsers] = useState<AdminUser[]>([]);
  useEffect(() => {
    getUsersAction().then(({ data }) => setUsers(data));
  }, []);

  async function geocode() {
    const addr = addressRef.current?.value;
    if (!addr) return;
    setGeoState('loading');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'ca,es,en' } },
      );
      const data = await res.json();
      if (data[0]) { setLat(data[0].lat); setLng(data[0].lon); setGeoState('idle'); }
      else setGeoState('error');
    } catch { setGeoState('error'); }
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10);
    setNewPreviews(files.map(f => URL.createObjectURL(f)));
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal admin-modal--full">
        <header className="admin-modal__header">
          <h2>{t('editTitle')} — {space.slug}</h2>
          <button type="button" className="admin-modal__close" onClick={onClose}>✕</button>
        </header>

        <form action={formAction} className="admin-modal__body">
          {state && state !== 'ok' && <div className="form-error">{state}</div>}

          {/* ── Bàsic ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{tPublish('sectionBasic')}</legend>

            <div className="field">
              <span className="field__label">Propietari</span>
              <select name="owner_id" className="field__input" defaultValue={space.ownerId ?? ''}>
                <option value="">— Sense propietari —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.displayName ? `${u.displayName} · ${u.email}` : u.email}
                  </option>
                ))}
              </select>
            </div>

            <label className="field">
              <span className="field__label">{tPublish('fieldTitle')} *</span>
              <input name="title" type="text" className="field__input" required maxLength={120}
                defaultValue={space.title} />
            </label>

            <div className="field">
              <span className="field__label">{tPublish('fieldType')} *</span>
              <div className="type-picker">
                {SPACE_TYPES.map(type => (
                  <label key={type} className="type-option">
                    <input type="radio" name="type" value={type} required
                      defaultChecked={space.type === type} />
                    <span><Icon name={type} size={18} />{tFilter(type)}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="field">
              <span className="field__label">{tPublish('fieldDescription')}</span>
              <textarea name="description" className="field__input field__textarea"
                rows={4} maxLength={2000} defaultValue={space.description ?? ''} />
            </label>
          </fieldset>

          {/* ── Estat i destacat ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{t('sectionStatus')}</legend>
            <div className="field-row">
              <div className="field">
                <span className="field__label">{t('fieldStatus')}</span>
                <select name="status" className="field__input field__select" defaultValue={space.status}>
                  <option value="active">{t('statusActive')}</option>
                  <option value="paused">{t('statusPaused')}</option>
                  <option value="removed">{t('statusRemoved')}</option>
                </select>
              </div>
              <div className="field" style={{ justifyContent: 'flex-end' }}>
                <label className="checkbox-item admin-featured-check">
                  <input type="checkbox" name="is_featured" value="true"
                    defaultChecked={space.isFeatured} />
                  <span>{t('fieldFeatured')}</span>
                </label>
              </div>
            </div>
          </fieldset>

          {/* ── Preu ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{tPublish('sectionPricing')}</legend>
            <div className="field-row">
              <label className="field field--grow">
                <span className="field__label">{tPublish('fieldPrice')} *</span>
                <input name="price" type="number" className="field__input" required min="0" step="0.01"
                  defaultValue={(space.priceCents / 100).toFixed(2)} />
              </label>
              <div className="field">
                <span className="field__label">{tPublish('fieldPriceUnit')}</span>
                <select name="price_unit" className="field__input field__select" defaultValue={space.priceUnit}>
                  <option value="month">{tPublish('unitMonth')}</option>
                  <option value="day">{tPublish('unitDay')}</option>
                  <option value="hour">{tPublish('unitHour')}</option>
                </select>
              </div>
              <label className="field">
                <span className="field__label">{tPublish('fieldSize')}</span>
                <input name="size_m2" type="number" className="field__input" min="0" step="0.1"
                  defaultValue={space.sizeM2 ?? ''} />
              </label>
            </div>
          </fieldset>

          {/* ── Ubicació ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{tPublish('sectionLocation')}</legend>
            <div className="field-row field-row--address">
              <label className="field field--grow">
                <span className="field__label">{tPublish('fieldAddress')}</span>
                <input ref={addressRef} name="address" type="text" className="field__input"
                  defaultValue={space.address ?? ''} onBlur={geocode} />
              </label>
              <button type="button" className="field__geo-btn" onClick={geocode}
                disabled={geoState === 'loading'}>
                <Icon name="pin" size={16} />
              </button>
            </div>
            {geoState === 'loading' && <p className="field__hint">{tPublish('geolocating')}</p>}
            {geoState === 'error' && <p className="field__hint field__hint--error">{tPublish('geoError')}</p>}
            {lat && lng && geoState !== 'error' && (
              <p className="field__hint">📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}</p>
            )}
            <input type="hidden" name="lat" value={lat} />
            <input type="hidden" name="lng" value={lng} />

            <div className="field-row">
              <label className="field field--grow">
                <span className="field__label">{tPublish('fieldNeighborhood')}</span>
                <input name="neighborhood" type="text" className="field__input"
                  defaultValue={space.neighborhood ?? ''} />
              </label>
              <label className="field field--grow">
                <span className="field__label">{tPublish('fieldCity')}</span>
                <input name="city" type="text" className="field__input"
                  defaultValue={space.city ?? ''} />
              </label>
              <label className="field field--grow">
                <span className="field__label">{t('fieldRegion')}</span>
                <input name="region" type="text" className="field__input"
                  defaultValue={space.region ?? ''} />
              </label>
            </div>
          </fieldset>

          {/* ── Equipaments ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{tPublish('sectionAmenities')}</legend>
            {Object.entries(AMENITY_GROUPS).map(([group, items]) => (
              <div key={group} className="amenity-group">
                <p className="amenity-group__label">{group}</p>
                <div className="checkbox-grid">
                  {items.map(id => (
                    <label key={id} className="checkbox-item">
                      <input type="checkbox" name="amenities" value={id}
                        defaultChecked={space.amenities.includes(id)} />
                      <span>{tAmenity(id as Parameters<typeof tAmenity>[0])}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </fieldset>

          {/* ── Fotos ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{tPublish('sectionPhotos')}</legend>

            {keptPhotos.length > 0 && (
              <div className="admin-photo-grid">
                {keptPhotos.map((url, i) => (
                  <div key={i} className="admin-photo-item">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="admin-photo-thumb" />
                    <button
                      type="button"
                      className="admin-photo-remove"
                      onClick={() => setKeptPhotos(p => p.filter((_, j) => j !== i))}
                      aria-label="Eliminar foto"
                    >✕</button>
                    <input type="hidden" name="kept_photo" value={url} />
                  </div>
                ))}
              </div>
            )}

            <label className="field">
              <span className="field__label field__hint">{tPublish('photosHelp')}</span>
              <input name="new_photos" type="file" className="field__input" multiple accept="image/*"
                onChange={handleNewPhotos} />
            </label>

            {newPreviews.length > 0 && (
              <div className="photo-previews">
                {newPreviews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="photo-preview" />
                ))}
              </div>
            )}
          </fieldset>

          {/* ── Contacte ── */}
          <fieldset className="fieldset">
            <legend className="fieldset__legend">{tPublish('sectionContact')}</legend>
            <label className="field">
              <span className="field__label">{tPublish('fieldWeb')}</span>
              <input name="web" type="url" className="field__input" placeholder="https://"
                defaultValue={space.web ?? ''} />
            </label>
            <label className="field">
              <span className="field__label">{tPublish('fieldPhone')}</span>
              <input name="phone" type="tel" className="field__input"
                defaultValue={space.phone ?? ''} />
            </label>
            <label className="field">
              <span className="field__label">{tPublish('fieldEmail')}</span>
              <input name="email_contact" type="email" className="field__input"
                defaultValue={space.emailContact ?? ''} />
            </label>
            <label className="field">
              <span className="field__label">{tPublish('fieldWhatsapp')}</span>
              <input name="whatsapp" type="tel" className="field__input"
                defaultValue={space.whatsapp ?? ''} />
            </label>
            <div className="field">
              <span className="field__label">{tPublish('contactDefault')}</span>
              <div className="type-picker">
                {(['web', 'phone', 'email', 'whatsapp'] as const).map(opt => (
                  <label key={opt} className="type-option">
                    <input type="radio" name="contact_default" value={opt}
                      defaultChecked={space.contactDefault === opt} />
                    <span>{tPublish(`contact_${opt}` as Parameters<typeof tPublish>[0])}</span>
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          <div className="admin-modal__footer">
            <button type="button" onClick={onClose} disabled={isPending}>{t('cancel')}</button>
            <button type="submit" data-variant="primary" disabled={isPending}>
              {isPending ? t('saving') : t('save')}
            </button>
          </div>
        </form>

        {/* Reviews — outside <form> so buttons don't submit */}
        <div className="admin-modal__reviews">
          <h3 className="admin-reviews-title">Ressenyes</h3>
          <ReviewsSection spaceId={space.id} />
        </div>
      </div>
    </div>
  );
}

/* ── Confirm dialog ──────────────────────────────────────────────────────── */

function ConfirmDialog({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
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

/* ── Users tab ───────────────────────────────────────────────────────────── */

function UsersTab({ onCountChange, mainAdminEmail, onViewUserSpaces }: { onCountChange?: (n: number) => void; mainAdminEmail?: string; onViewUserSpaces?: (userId: string) => void }) {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => { handleRefresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getUsersAction();
    if (err) setError(err);
    else { setUsers(data); onCountChange?.(data.length); }
    setLoading(false);
  }

  async function handleToggleAdmin(id: string, currentlyAdmin: boolean) {
    await setUserAdminRoleAction(id, !currentlyAdmin);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isAdmin: !currentlyAdmin } : u));
    router.refresh();
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(null);
    await deleteUserAction(id);
    setUsers(prev => prev.filter(u => u.id !== id));
    router.refresh();
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  const filtered = users.filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.email.toLowerCase().includes(q) || (u.displayName ?? '').toLowerCase().includes(q);
  });

  if (loading && users.length === 0) return <p className="admin-empty">Carregant usuaris…</p>;
  if (error) return (
    <div className="admin-empty">
      <p style={{ color: 'var(--danger)', marginBottom: 'var(--s-3)' }}>{error}</p>
      <button type="button" className="admin-action-btn" onClick={handleRefresh}>{t('refresh')}</button>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__value">{users.length}</span>
          <span className="admin-stat__label">{t('statsUsers')}</span>
        </div>
        <div className="admin-stat admin-stat--active">
          <span className="admin-stat__value">{users.filter(u => u.spacesCount > 0).length}</span>
          <span className="admin-stat__label">{t('statsUsersWithSpaces')}</span>
        </div>
      </div>

      <div className="admin-search-wrap">
        <Icon name="search" size={16} />
        <input
          type="search"
          className="admin-search-input"
          placeholder={t('searchUsersPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <button type="button" className="admin-action-btn" onClick={handleRefresh} disabled={loading}
          style={{ marginLeft: 'auto' }}>
          {loading ? '…' : t('refresh')}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('colEmail')}</th>
              <th>{t('colDisplayName')}</th>
              <th>{t('colJoined')}</th>
              <th>{t('colLastLogin')}</th>
              <th className="admin-cell--center">{t('colSpacesCount')}</th>
              <th>{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="admin-row admin-row--active" style={{ backgroundColor: (user.isAdmin || user.email === mainAdminEmail) ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : undefined }}>
                <td className="admin-cell admin-cell--title">
                  {user.email}
                  {(user.isAdmin || user.email === mainAdminEmail) && (
                    <span style={{ marginLeft: '8px', fontSize: '0.8rem', padding: '2px 6px', background: 'var(--primary)', color: 'var(--brand-ink)', borderRadius: '4px', fontWeight: 'bold' }}>
                      Admin
                    </span>
                  )}
                </td>
                <td>{user.displayName ?? <span style={{ color: 'var(--ink-mute)' }}>—</span>}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDate(user.lastSignIn)}</td>
                <td className="admin-cell--center">
                  {user.spacesCount > 0
                    ? (
                      onViewUserSpaces ? (
                        <button
                          type="button"
                          className="inline-link"
                          style={{ fontWeight: 'bold' }}
                          onClick={() => onViewUserSpaces(user.id)}
                          title={`Veure els ${user.spacesCount} espais d'aquest usuari`}
                        >
                          {user.spacesCount}
                        </button>
                      ) : (
                        <strong>{user.spacesCount}</strong>
                      )
                    )
                    : <span style={{ color: 'var(--ink-mute)' }}>0</span>}
                </td>
                <td>
                  <div className="admin-actions">
                    {user.email !== mainAdminEmail && (
                      <button
                        type="button"
                        className="admin-action-btn"
                        onClick={() => handleToggleAdmin(user.id, user.isAdmin)}
                      >
                        {user.isAdmin ? 'Desfer Admin' : 'Fer Admin'}
                      </button>
                    )}
                    {user.email !== mainAdminEmail && (
                      <button
                        type="button"
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => setConfirmDeleteId(user.id)}
                      >
                        {t('deleteUser')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="admin-empty">{t('emptyUsers')}</p>}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          message={t('deleteUserConfirm')}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ── Messages tab ────────────────────────────────────────────────────────── */

function MessagesTab({ onCountChange }: { onCountChange?: (counts: { unread: number; total: number }) => void }) {
  const t = useTranslations('admin');
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { handleRefresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateCounts(msgs: ContactMessage[]) {
    onCountChange?.({ unread: msgs.filter(m => !m.read).length, total: msgs.length });
  }

  async function handleRefresh() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await getContactMessagesAction();
    if (err) setError(err);
    else { setMessages(data); updateCounts(data); }
    setLoading(false);
  }

  async function handleToggleRead(msg: ContactMessage) {
    await setContactMessageReadAction(msg.id, !msg.read);
    setMessages(prev => {
      const next = prev.map(m => m.id === msg.id ? { ...m, read: !m.read } : m);
      updateCounts(next);
      return next;
    });
  }

  async function handleDelete(id: string) {
    setConfirmDeleteId(null);
    await deleteContactMessageAction(id);
    setMessages(prev => {
      const next = prev.filter(m => m.id !== id);
      updateCounts(next);
      return next;
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('ca-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  const TYPE_LABELS: Record<string, string> = {
    bug: t('typeBug'),
    suggestion: t('typeSuggestion'),
    question: t('typeQuestion'),
    other: t('typeOther'),
  };

  if (loading && messages.length === 0) return <p className="admin-empty">Carregant missatges…</p>;
  if (error) return (
    <div className="admin-empty">
      <p style={{ color: 'var(--danger)', marginBottom: 'var(--s-3)' }}>{error}</p>
      <button type="button" className="admin-action-btn" onClick={handleRefresh}>{t('refresh')}</button>
    </div>
  );

  const unread = messages.filter(m => !m.read).length;

  return (
    <div className="admin-messages">
      <div className="admin-stats">
        <div className="admin-stat">
          <span className="admin-stat__value">{messages.length}</span>
          <span className="admin-stat__label">{t('tabMessages')}</span>
        </div>
        {unread > 0 && (
          <div className="admin-stat admin-stat--active">
            <span className="admin-stat__value">{unread}</span>
            <span className="admin-stat__label">No llegits</span>
          </div>
        )}
        <button type="button" className="admin-action-btn" onClick={handleRefresh} disabled={loading}
          style={{ marginLeft: 'auto', alignSelf: 'center' }}>
          {loading ? '…' : t('refresh')}
        </button>
      </div>

      {messages.length === 0 ? (
        <p className="admin-empty">{t('noMessages')}</p>
      ) : (
        <div className="admin-message-list">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`admin-message${msg.read ? '' : ' admin-message--unread'}`}
            >
              <div className="admin-message__header">
                <div className="admin-message__meta">
                  <span className="admin-message__from">
                    {msg.name} — <a href={`mailto:${msg.email}`}>{msg.email}</a>
                  </span>
                  <span className="admin-message__date">{formatDate(msg.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
                  <span className="admin-message__type">{TYPE_LABELS[msg.type] ?? msg.type}</span>
                  <div className="admin-message__actions">
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                    >
                      {expandedId === msg.id ? 'Plegar' : t('msgMessage')}
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn"
                      onClick={() => handleToggleRead(msg)}
                      title={msg.read ? t('markUnread') : t('markRead')}
                    >
                      {msg.read ? '○' : '●'}
                    </button>
                    <button
                      type="button"
                      className="admin-action-btn admin-action-btn--delete"
                      onClick={() => setConfirmDeleteId(msg.id)}
                    >
                      {t('deleteMessage')}
                    </button>
                  </div>
                </div>
              </div>
              {expandedId === msg.id && (
                <p className="admin-message__body">{msg.message}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          message={t('deleteMessageConfirm')}
          onConfirm={() => handleDelete(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}

/* ── Main dashboard ──────────────────────────────────────────────────────── */

export function AdminDashboard({ spaces: initialSpaces, initialEditId, mainAdminEmail }: { spaces: Space[]; initialEditId?: string; mainAdminEmail?: string }) {
  const t = useTranslations('admin');
  const tFilter = useTranslations('filter');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spaces, setSpacesOptimistic] = useOptimistic(
    initialSpaces,
    (_state: Space[], updater: (s: Space[]) => Space[]) => updater(_state),
  );

  const [activeTab, setActiveTab] = useState<'spaces' | 'users' | 'messages' | 'analytics'>('spaces');
  const [usersCount, setUsersCount] = useState<number | null>(null);
  const [msgCounts, setMsgCounts] = useState<{ unread: number; total: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [filterUsers, setFilterUsers] = useState<AdminUser[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getUsersAction().then(({ data }) => setFilterUsers(data));
  }, []);

  useEffect(() => {
    if (!initialEditId) return;
    const space = initialSpaces.find(s => s.id === initialEditId);
    if (space) setEditingSpace(space);
  }, [initialEditId, initialSpaces]);

  const counts = {
    all: initialSpaces.length,
    active: initialSpaces.filter(s => s.status === 'active').length,
    paused: initialSpaces.filter(s => s.status === 'paused').length,
    removed: initialSpaces.filter(s => s.status === 'removed').length,
  };

  const featured = initialSpaces.filter(s => s.isFeatured).length;
  const filtered = spaces.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilter !== 'all' && s.type !== typeFilter) return false;
    if (featuredOnly && !s.isFeatured) return false;
    if (ownerFilter === 'none' && s.ownerId) return false;
    if (ownerFilter !== 'all' && ownerFilter !== 'none' && s.ownerId !== ownerFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return [s.title, s.address, s.neighborhood, s.city, s.description]
        .some(f => f?.toLowerCase().includes(q));
    }
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allFilteredSelected;
    }
  }, [someSelected, allFilteredSelected]);

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map(s => s.id)));
  }

  function handleBulkStatus(status: 'active' | 'paused') {
    const ids = [...selectedIds];
    startTransition(async () => {
      setSpacesOptimistic(prev => prev.map(s => ids.includes(s.id) ? { ...s, status } : s));
      await bulkSetStatusAction(ids, status);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function handleBulkDelete() {
    const ids = [...selectedIds];
    setBulkDeleteConfirm(false);
    startTransition(async () => {
      setSpacesOptimistic(prev => prev.filter(s => !ids.includes(s.id)));
      await bulkDeleteAction(ids);
      setSelectedIds(new Set());
      router.refresh();
    });
  }

  function handleToggleStatus(space: Space) {
    const next = space.status === 'active' ? 'paused' : 'active';
    startTransition(async () => {
      setSpacesOptimistic(prev => prev.map(s => s.id === space.id ? { ...s, status: next } : s));
      await setStatusAction(space.id, next);
      router.refresh();
    });
  }

  function handleToggleFeatured(space: Space) {
    const next = !space.isFeatured;
    startTransition(async () => {
      setSpacesOptimistic(prev => prev.map(s => s.id === space.id ? { ...s, isFeatured: next } : s));
      await setFeaturedAction(space.id, next);
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
      {/* Tabs */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`admin-tab${activeTab === 'spaces' ? ' admin-tab--active' : ''}`}
          onClick={() => setActiveTab('spaces')}
        >
          <Icon name="list" size={15} />
          {t('tabSpaces')}
          <span className="admin-tab__count">{initialSpaces.length}</span>
        </button>
        <button
          type="button"
          className={`admin-tab${activeTab === 'users' ? ' admin-tab--active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Icon name="user" size={15} />
          {t('tabUsers')}
          <span className="admin-tab__count">{usersCount ?? '…'}</span>
        </button>
        <button
          type="button"
          className={`admin-tab${activeTab === 'messages' ? ' admin-tab--active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <Icon name="mail" size={15} />
          {t('tabMessages')}
          {msgCounts && (
            <span className="admin-tab__count">
              {msgCounts.unread > 0 ? `${msgCounts.unread}/${msgCounts.total}` : msgCounts.total}
            </span>
          )}
        </button>
        <button
          type="button"
          className={`admin-tab${activeTab === 'analytics' ? ' admin-tab--active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <Icon name="globe" size={15} />
          {t('tabAnalytics')}
        </button>
      </div>

      {activeTab === 'analytics' && (
        <div style={{ padding: '2rem 0', maxWidth: 600 }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            {t('analyticsDescription')}
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a 
              href="https://vercel.com/xarops-projects/app-coslot/analytics" 
              target="_blank" 
              rel="noopener noreferrer"
              className="button button--secondary"
            >
              {t('analyticsVercel')}
            </a>
            <a 
              href="https://analytics.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="button button--secondary"
            >
              {t('analyticsGoogle')}
            </a>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <UsersTab 
          onCountChange={setUsersCount} 
          mainAdminEmail={mainAdminEmail} 
          onViewUserSpaces={(userId) => {
            setOwnerFilter(userId);
            setActiveTab('spaces');
          }}
        />
      )}
      {activeTab === 'messages' && <MessagesTab onCountChange={setMsgCounts} />}

      {activeTab === 'spaces' && <>
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

      {/* Search + owner filter */}
      <div className="admin-search-wrap">
        <Icon name="search" size={16} />
        <input
          type="search"
          className="admin-search-input"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <select
          className="admin-owner-select"
          value={ownerFilter}
          onChange={e => { setOwnerFilter(e.target.value); setSelectedIds(new Set()); }}
        >
          <option value="all">Tots els propietaris</option>
          <option value="none">Sense propietari</option>
          {filterUsers.map(u => (
            <option key={u.id} value={u.id}>
              {u.displayName ? `${u.displayName} · ${u.email}` : u.email}
            </option>
          ))}
        </select>
      </div>

      {/* Filter tabs — status */}
      <div className="admin-filter-bar">
        {(['all', 'active', 'paused', 'removed'] as StatusFilter[]).map(f => (
          <button key={f} type="button"
            className={`admin-filter-tab${statusFilter === f ? ' admin-filter-tab--active' : ''}`}
            onClick={() => setStatusFilter(f)}>
            {t(`filter_${f}` as Parameters<typeof t>[0])}
            <span className="admin-filter-tab__count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Filter row — type + featured */}
      <div className="admin-filter-bar admin-filter-bar--types">
        {(['all', 'storage', 'workspace', 'garden', 'room', 'parking'] as TypeFilter[]).map(type => (
          <button key={type} type="button"
            className={`admin-filter-tab${typeFilter === type ? ' admin-filter-tab--active' : ''}`}
            onClick={() => setTypeFilter(type)}>
            {type === 'all' ? t('filter_all') : (
              <><Icon name={type} size={13} />{tFilter(type)}</>
            )}
          </button>
        ))}
        <button type="button"
          className={`admin-filter-tab admin-filter-tab--featured${featuredOnly ? ' admin-filter-tab--active' : ''}`}
          onClick={() => setFeaturedOnly(v => !v)}>
          ★ {t('statsFeatured')}
        </button>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="admin-bulk-bar">
          <span className="admin-bulk-bar__count">{selectedIds.size} espais seleccionats</span>
          <button type="button" className="admin-action-btn" onClick={() => handleBulkStatus('active')} disabled={isPending}>
            Activar
          </button>
          <button type="button" className="admin-action-btn" onClick={() => handleBulkStatus('paused')} disabled={isPending}>
            Pausar
          </button>
          <button type="button" className="admin-action-btn admin-action-btn--delete" onClick={() => setBulkDeleteConfirm(true)} disabled={isPending}>
            Eliminar
          </button>
          <button type="button" className="admin-action-btn" onClick={() => setSelectedIds(new Set())} style={{ marginLeft: 'auto' }}>
            Cancel·lar
          </button>
        </div>
      )}

      {/* Table */}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-cell--cb">
                <input type="checkbox" ref={selectAllRef} checked={allFilteredSelected} onChange={toggleSelectAll} />
              </th>
              <th>{t('colTitle')}</th>
              <th className="admin-cell--center">Prop.</th>
              <th>{t('colType')}</th>
              <th>{t('colStatus')}</th>
              <th>{t('colLocation')}</th>
              <th>{t('colPrice')}</th>
              <th className="admin-cell--center">{t('colRating')}</th>
              <th className="admin-cell--center">{t('colFeatured')}</th>
              <th>{t('colActions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(space => (
              <tr key={space.id} className={`admin-row admin-row--${space.status}${selectedIds.has(space.id) ? ' admin-row--selected' : ''}`}>
                <td className="admin-cell--cb">
                  <input type="checkbox" checked={selectedIds.has(space.id)} onChange={() => toggleSelect(space.id)} />
                </td>
                <td className="admin-cell admin-cell--title">
                  <a href={`/slot/${space.slug}`} target="_blank" rel="noopener noreferrer"
                    className="admin-space-link">
                    {space.title}
                  </a>
                </td>
                <td className="admin-cell--center" title={space.ownerId ?? 'Sense amo'}>
                  {space.ownerId ? <span style={{ color: 'green' }}>✓</span> : <span style={{ color: 'red' }}>✕</span>}
                </td>
                <td><TypeBadge type={space.type} /></td>
                <td><StatusBadge status={space.status} /></td>
                <td className="admin-cell--location">
                  <span>{space.neighborhood}</span>
                  <span className="admin-cell--city">{space.city}</span>
                </td>
                <td>{formatPrice(space.priceCents, space.priceUnit)}</td>
                <td className="admin-cell--center">
                  {space.rating > 0
                    ? <span className="admin-rating">★ {space.rating.toFixed(1)}</span>
                    : <span className="admin-rating admin-rating--none">—</span>}
                </td>
                <td className="admin-cell--center">
                  <button type="button"
                    className={`admin-featured-btn${space.isFeatured ? ' admin-featured-btn--on' : ''}`}
                    onClick={() => handleToggleFeatured(space)} disabled={isPending}
                    title={space.isFeatured ? t('unfeature') : t('feature')}>★
                  </button>
                </td>
                <td>
                  <div className="admin-actions">
                    <button type="button" className="admin-action-btn"
                      onClick={() => handleToggleStatus(space)} disabled={isPending}
                      title={space.status === 'active' ? t('pauseSpace') : t('activateSpace')}>
                      {space.status === 'active' ? t('pause') : t('activate')}
                    </button>
                    <button type="button" className="admin-action-btn admin-action-btn--edit"
                      onClick={() => setEditingSpace(space)} disabled={isPending}>
                      {t('edit')}
                    </button>
                    <button type="button" className="admin-action-btn admin-action-btn--delete"
                      onClick={() => setDeletingId(space.id)} disabled={isPending}>
                      {t('delete')}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="admin-empty">{t('empty')}</p>}
      </div>

      {editingSpace && (
        <EditModal
          space={editingSpace}
          onClose={() => setEditingSpace(null)}
          onSuccess={() => router.refresh()}
        />
      )}

      {deletingId && (
        <ConfirmDialog
          message={t('deleteConfirm')}
          onConfirm={() => handleDelete(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {bulkDeleteConfirm && (
        <ConfirmDialog
          message={`Eliminar ${selectedIds.size} espais? Aquesta acció no es pot desfer.`}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkDeleteConfirm(false)}
        />
      )}
      </>}
    </div>
  );
}
