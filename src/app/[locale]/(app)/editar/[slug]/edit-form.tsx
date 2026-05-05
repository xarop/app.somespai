'use client';

import { useActionState, useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { Icon } from '@/components/ui/icon';
import { updateOwnSpaceAction, deleteOwnSpaceAction } from './actions';
import type { Space } from '@/lib/schemas/space';

const SPACE_TYPES = ['storage', 'workspace', 'garden', 'room'] as const;

const AMENITY_GROUPS: Record<string, string[]> = {
  'Connectivitat': ['wifi', 'fiber', 'hot_desk', 'fixed_desk', 'monitor', 'locker'],
  'Reunions': ['meeting_room', 'event_space', 'whiteboard', 'podcast_studio'],
  'Confort': ['ac', 'heating', 'dimmable_light', 'hardwood_floor'],
  'Serveis': ['coffee', 'kitchen', 'printer', 'printer_3d'],
  'Accés': ['access_24h', 'cameras', 'van_access', 'parking', 'bike_parking'],
  'Exterior': ['terrace', 'bbq', 'pool', 'shade', 'sea_view', 'mountain_view'],
  'Equipament': ['projector', 'audio', 'tools', 'tables', 'chairs', 'electricity', 'water'],
  'Altres': ['community', 'reception', 'sustainable', 'campus', 'cellar', 'soundproofed'],
};

interface Props {
  space: Space;
}

export function EditSpaceForm({ space }: Props) {
  const t = useTranslations('publish');
  const tEdit = useTranslations('edit');
  const tAmenity = useTranslations('amenity');
  const tFilter = useTranslations('filter');
  const locale = useLocale();
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    updateOwnSpaceAction.bind(null, space.id),
    null,
  );

  useEffect(() => {
    if (state === 'ok') router.push(`/espai/${space.slug}` as Parameters<typeof router.push>[0]);
  }, [state, router, space.slug]);

  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [lat, setLat] = useState(String(space.lat));
  const [lng, setLng] = useState(String(space.lng));
  const addressRef = useRef<HTMLInputElement>(null);

  const [keptPhotos, setKeptPhotos] = useState<string[]>(space.photos);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function geocodeAddress() {
    const addr = addressRef.current?.value;
    if (!addr) return;
    setGeoState('loading');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'ca,es,en' } },
      );
      const data = await res.json();
      if (data[0]) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        setGeoState('idle');
      } else {
        setGeoState('error');
      }
    } catch {
      setGeoState('error');
    }
  }

  function handleNewPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setNewPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleDelete() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    setDeleting(true);
    const result = await deleteOwnSpaceAction(space.id);
    if (result === 'ok') {
      router.push('/');
    } else {
      setDeleteError(result);
      setDeleting(false);
    }
  }

  return (
    <form action={formAction} className="publish-form">
      {state && state !== 'ok' && <div className="form-error">{state}</div>}
      {deleteError && <div className="form-error">{deleteError}</div>}

      {/* ── Status ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{tEdit('sectionStatus')}</legend>
        <div className="field">
          <span className="field__label">{tEdit('fieldStatus')}</span>
          <div className="type-picker">
            <label className="type-option">
              <input type="radio" name="status" value="active" defaultChecked={space.status === 'active'} />
              <span>{tEdit('statusActive')}</span>
            </label>
            <label className="type-option">
              <input type="radio" name="status" value="paused" defaultChecked={space.status === 'paused'} />
              <span>{tEdit('statusPaused')}</span>
            </label>
          </div>
        </div>
      </fieldset>

      {/* ── Basic info ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionBasic')}</legend>

        <label className="field">
          <span className="field__label">{t('fieldTitle')} *</span>
          <input name="title" type="text" className="field__input" required maxLength={120}
            defaultValue={space.title} />
        </label>

        <div className="field">
          <span className="field__label">{t('fieldType')} *</span>
          <div className="type-picker">
            {SPACE_TYPES.map((type) => (
              <label key={type} className="type-option">
                <input type="radio" name="type" value={type} required defaultChecked={space.type === type} />
                <span>
                  <Icon name={type} size={20} />
                  {tFilter(type)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <label className="field">
          <span className="field__label">{t('fieldDescription')}</span>
          <textarea name="description" className="field__input field__textarea"
            rows={4} maxLength={2000} defaultValue={space.description ?? ''} />
        </label>
      </fieldset>

      {/* ── Pricing ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionPricing')}</legend>

        <div className="field-row">
          <label className="field field--grow">
            <span className="field__label">{t('fieldPrice')} *</span>
            <input name="price" type="number" className="field__input" required min="0" step="0.01"
              defaultValue={space.priceCents / 100} />
          </label>
          <label className="field">
            <span className="field__label">{t('fieldPriceUnit')}</span>
            <select name="price_unit" className="field__input field__select" defaultValue={space.priceUnit}>
              <option value="month">{t('unitMonth')}</option>
              <option value="day">{t('unitDay')}</option>
              <option value="hour">{t('unitHour')}</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">{t('fieldSize')}</span>
            <input name="size_m2" type="number" className="field__input" min="0" step="0.1"
              defaultValue={space.sizeM2 ?? ''} />
          </label>
        </div>
      </fieldset>

      {/* ── Location ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionLocation')}</legend>

        <div className="field-row field-row--address">
          <label className="field field--grow">
            <span className="field__label">{t('fieldAddress')}</span>
            <input ref={addressRef} name="address" type="text" className="field__input"
              defaultValue={space.address ?? ''} onBlur={geocodeAddress} />
          </label>
          <button type="button" className="field__geo-btn" onClick={geocodeAddress} disabled={geoState === 'loading'}>
            <Icon name="pin" size={16} />
          </button>
        </div>
        {geoState === 'loading' && <p className="field__hint">{t('geolocating')}</p>}
        {geoState === 'error' && <p className="field__hint field__hint--error">{t('geoError')}</p>}
        {lat && lng && geoState !== 'error' && (
          <p className="field__hint">📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}</p>
        )}

        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lng" value={lng} />

        <div className="field-row">
          <label className="field field--grow">
            <span className="field__label">{t('fieldNeighborhood')}</span>
            <input name="neighborhood" type="text" className="field__input"
              defaultValue={space.neighborhood} />
          </label>
          <label className="field field--grow">
            <span className="field__label">{t('fieldCity')}</span>
            <input name="city" type="text" className="field__input" defaultValue={space.city} />
          </label>
        </div>
      </fieldset>

      {/* ── Amenities ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionAmenities')}</legend>
        {Object.entries(AMENITY_GROUPS).map(([group, items]) => (
          <div key={group} className="amenity-group">
            <p className="amenity-group__label">{group}</p>
            <div className="checkbox-grid">
              {items.map((id) => (
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

      {/* ── Photos ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionPhotos')}</legend>

        {keptPhotos.length > 0 && (
          <div>
            <p className="field__label" style={{ marginBottom: 'var(--s-2)' }}>{tEdit('photosKeep')}</p>
            <div className="admin-photo-grid">
              {keptPhotos.map((url, i) => (
                <div key={i} className="admin-photo-item">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="admin-photo-thumb" />
                  <button
                    type="button"
                    className="admin-photo-remove"
                    onClick={() => setKeptPhotos((prev) => prev.filter((_, j) => j !== i))}
                  >×</button>
                  <input type="hidden" name="kept_photo" value={url} />
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="field" style={{ marginTop: keptPhotos.length > 0 ? 'var(--s-3)' : undefined }}>
          <span className="field__label field__hint">{tEdit('photosAdd')}</span>
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

      {/* ── Contact ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionContact')}</legend>

        <label className="field">
          <span className="field__label">{t('fieldWeb')}</span>
          <input name="web" type="url" className="field__input" defaultValue={space.web ?? ''} />
        </label>
        <label className="field">
          <span className="field__label">{t('fieldPhone')}</span>
          <input name="phone" type="tel" className="field__input" defaultValue={space.phone ?? ''} />
        </label>
        <label className="field">
          <span className="field__label">{t('fieldEmail')}</span>
          <input name="email_contact" type="email" className="field__input" defaultValue={space.emailContact ?? ''} />
        </label>
        <label className="field">
          <span className="field__label">{t('fieldWhatsapp')}</span>
          <input name="whatsapp" type="tel" className="field__input" defaultValue={space.whatsapp ?? ''} />
        </label>

        <div className="field">
          <span className="field__label">{t('contactDefault')}</span>
          <div className="type-picker">
            {(['web', 'phone', 'email', 'whatsapp'] as const).map((opt) => (
              <label key={opt} className="type-option">
                <input type="radio" name="contact_default" value={opt}
                  defaultChecked={space.contactDefault === opt} />
                <span>{t(`contact_${opt}` as Parameters<typeof t>[0])}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" data-variant="primary" disabled={isPending}>
          {isPending ? tEdit('submitting') : tEdit('submit')}
        </button>
        <button
          type="button"
          data-variant="danger"
          disabled={deleting}
          onClick={handleDelete}
        >
          {deleting ? tEdit('deleting') : deleteConfirm ? tEdit('confirm') : tEdit('deleteSpace')}
        </button>
        {deleteConfirm && !deleting && (
          <button type="button" onClick={() => setDeleteConfirm(false)}>
            {tEdit('cancel')}
          </button>
        )}
      </div>

      {deleteConfirm && !deleting && (
        <p className="field__hint field__hint--error" style={{ marginTop: 'var(--s-2)' }}>
          {tEdit('deleteConfirm')}
        </p>
      )}
    </form>
  );
}
