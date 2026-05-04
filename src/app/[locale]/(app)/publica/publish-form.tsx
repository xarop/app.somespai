'use client';

import { useActionState, useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/icon';
import { createSpaceAction } from './actions';

const SPACE_TYPES = ['storage', 'workspace', 'garden', 'room'] as const;

const AMENITY_GROUPS: Record<string, string[]> = {
  'Connectivitat': ['wifi', 'fiber', 'hot_desk', 'fixed_desk', 'monitor', 'locker'],
  'Reunions': ['meeting_room', 'event_space', 'whiteboard', 'projector', 'podcast_studio'],
  'Confort': ['ac', 'heating', 'dimmable_light', 'hardwood_floor'],
  'Serveis': ['coffee', 'kitchen', 'printer', 'printer_3d'],
  'Accés': ['access_24h', 'cameras', 'van_access', 'parking', 'bike_parking'],
  'Exterior': ['terrace', 'bbq', 'pool', 'shade', 'sea_view', 'mountain_view'],
  'Equipament': ['pa_system', 'audio', 'tools', 'scale', 'electricity', 'water', 'furniture'],
  'Altres': ['community', 'reception', 'sustainable', 'campus', 'cellar', 'soundproofed'],
};

export function PublishForm() {
  const t = useTranslations('publish');
  const tAmenity = useTranslations('amenity');
  const tFilter = useTranslations('filter');

  const [state, formAction, isPending] = useActionState(
    async (_prev: null | string, formData: FormData) => {
      try {
        await createSpaceAction(formData);
        return null;
      } catch (e) {
        return (e as Error).message;
      }
    },
    null
  );

  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [lat, setLat] = useState('41.4047');
  const [lng, setLng] = useState('2.1567');
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const addressRef = useRef<HTMLInputElement>(null);

  async function geocodeAddress() {
    const addr = addressRef.current?.value;
    if (!addr) return;
    setGeoState('loading');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addr)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'ca,es,en' } }
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

  function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6);
    setPhotoPreviews(files.map(f => URL.createObjectURL(f)));
  }

  return (
    <form action={formAction} className="publish-form">
      {state && (
        <div className="form-error">{state}</div>
      )}

      {/* ── Basic info ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionBasic')}</legend>

        <label className="field">
          <span className="field__label">{t('fieldTitle')} *</span>
          <input name="title" type="text" className="field__input" required maxLength={120}
            placeholder={t('fieldTitlePlaceholder')} />
        </label>

        <div className="field">
          <span className="field__label">{t('fieldType')} *</span>
          <div className="type-picker">
            {SPACE_TYPES.map(type => (
              <label key={type} className="type-option">
                <input type="radio" name="type" value={type} required />
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
            rows={4} maxLength={2000} placeholder={t('fieldDescriptionPlaceholder')} />
        </label>
      </fieldset>

      {/* ── Pricing ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionPricing')}</legend>

        <div className="field-row">
          <label className="field field--grow">
            <span className="field__label">{t('fieldPrice')} *</span>
            <input name="price" type="number" className="field__input" required min="0" step="0.01"
              placeholder="150" />
          </label>
          <label className="field">
            <span className="field__label">{t('fieldPriceUnit')}</span>
            <select name="price_unit" className="field__input field__select">
              <option value="month">{t('unitMonth')}</option>
              <option value="day">{t('unitDay')}</option>
              <option value="hour">{t('unitHour')}</option>
            </select>
          </label>
          <label className="field">
            <span className="field__label">{t('fieldSize')}</span>
            <input name="size_m2" type="number" className="field__input" min="0" step="0.1"
              placeholder="25" />
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
              placeholder={t('fieldAddressPlaceholder')} onBlur={geocodeAddress} />
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
              defaultValue="Vila de Gràcia" />
          </label>
          <label className="field field--grow">
            <span className="field__label">{t('fieldCity')}</span>
            <input name="city" type="text" className="field__input" defaultValue="Barcelona" />
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
              {items.map(id => (
                <label key={id} className="checkbox-item">
                  <input type="checkbox" name="amenities" value={id} />
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
        <label className="field">
          <span className="field__label field__hint">{t('photosHelp')}</span>
          <input name="photos" type="file" className="field__input" multiple accept="image/*"
            onChange={handlePhotos} />
        </label>
        {photoPreviews.length > 0 && (
          <div className="photo-previews">
            {photoPreviews.map((src, i) => (
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
          <span className="field__label">{t('fieldContactUrl')}</span>
          <input name="contact_url" type="text" className="field__input"
            placeholder={t('fieldContactUrlPlaceholder')} />
        </label>
      </fieldset>

      <div className="form-actions">
        <button type="submit" data-variant="primary" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  );
}
