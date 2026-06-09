'use client';

import { useActionState, useState, useRef, useEffect, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Icon } from '@/components/ui/icon';
import { createClient } from '@/lib/supabase/client';
import { createSpaceAction } from './actions';
import { resizeImageFile } from '@/lib/images/resize-image';
import type { ReverseGeocodeResponse } from '@/lib/schemas/geo';

const SPACE_TYPES = ['storage', 'workspace', 'garden', 'room', 'parking'] as const;

const STREET_PREFIX_RE = /^(carrer|avinguda|passeig|plaça|ronda|via|rambla|travessera|gran via|calle|avenida|paseo|plaza|cami|camí|pg\.|av\.|c\.)\s+(de\s+les?|dels?|d'|de\s+l'|de\s+)?/i;
type SpaceType = (typeof SPACE_TYPES)[number];

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

const AMENITIES_BY_TYPE: Record<SpaceType, Set<string>> = {
  storage: new Set([
    'access_24h', 'cameras',
    'electricity', 'water',
    'cellar', 'sustainable',
  ]),
  workspace: new Set([
    'wifi', 'fiber', 'hot_desk', 'fixed_desk', 'monitor', 'locker',
    'meeting_room', 'event_space', 'whiteboard', 'podcast_studio',
    'ac', 'heating', 'dimmable_light', 'hardwood_floor',
    'coffee', 'kitchen', 'printer', 'printer_3d',
    'access_24h', 'cameras', 'parking', 'bike_parking',
    'terrace',
    'projector', 'audio', 'tables', 'chairs', 'electricity',
    'community', 'reception', 'sustainable', 'campus', 'soundproofed',
  ]),
  garden: new Set([
    'terrace', 'bbq', 'pool', 'shade', 'sea_view', 'mountain_view',
    'tables', 'chairs', 'electricity', 'water',
    'access_24h', 'cameras',
    'sustainable',
  ]),
  room: new Set([
    'wifi', 'locker',
    'ac', 'heating', 'dimmable_light', 'hardwood_floor',
    'coffee', 'kitchen',
    'access_24h', 'cameras', 'parking', 'bike_parking',
    'projector', 'audio', 'tables', 'chairs', 'electricity',
    'community', 'reception', 'sustainable', 'soundproofed',
  ]),
  parking: new Set([
    'covered', 'ev_charger', 'auto_gate', 'motorbike_ok', 'van_access',
    'access_24h', 'cameras',
    'sustainable',
  ]),
};

interface PublishFormProps {
  isLoggedIn?: boolean;
  isPremium?: boolean;
}

export function PublishForm({ isLoggedIn = true, isPremium = false }: PublishFormProps) {
  const t = useTranslations('publish');
  const tAmenity = useTranslations('amenity');
  const tSpaceType = useTranslations('spaceType');
  const locale = useLocale();

  const [state, formAction, isPending] = useActionState(createSpaceAction, null);

  const [selectedType, setSelectedType] = useState<SpaceType | null>(null);
  const [titleAutofilled, setTitleAutofilled] = useState(false);
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [autofillState, setAutofillState] = useState<'idle' | 'locating' | 'geocoding' | 'done' | 'error'>('idle');
  const [lat, setLat] = useState('41.4047');
  const [lng, setLng] = useState('2.1567');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const titleLocationRef = useRef('');
  const addressRef = useRef<HTMLInputElement>(null);
  const neighborhoodRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const emailContactRef = useRef<HTMLInputElement>(null);
  const contactNameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadUserAndProfile() {
      const supabase = createClient();
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        if (!user) return;
        if (emailContactRef.current && !emailContactRef.current.value) {
          emailContactRef.current.value = user.email ?? '';
        }
        // Load profile for name + phone autofill
        const { data: profile } = await supabase.from('profiles').select('display_name, phone').eq('id', user.id).maybeSingle();
        const p = profile as { display_name?: string | null; phone?: string | null } | null;
        if (p?.display_name && contactNameRef.current && !contactNameRef.current.value) {
          contactNameRef.current.value = p.display_name;
        }
        if (p?.phone && phoneRef.current && !phoneRef.current.value) {
          phoneRef.current.value = p.phone;
        }
      } catch (error) {
        console.error('Failed to load user or profile:', error);
      }
    }
    loadUserAndProfile();
  }, []);

  async function geocodeAddress() {
    const addr = addressRef.current?.value;
    if (!addr) return;
    setGeoState('loading');
    try {
      const res = await fetch('/api/geo/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: addr, language: locale }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.lat && data.lng) {
        setLat(String(data.lat));
        setLng(String(data.lng));
        setGeoState('idle');
      } else {
        setGeoState('error');
      }
    } catch {
      setGeoState('error');
    }
  }

  async function autofillFromLocation() {
    if (!navigator.geolocation) {
      setAutofillState('error');
      return;
    }
    setAutofillState('locating');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setAutofillState('geocoding');
        try {
          const res = await fetch('/api/geo/reverse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              language: locale,
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = (await res.json()) as ReverseGeocodeResponse;

          if (addressRef.current) {
            addressRef.current.value = data.street;
          }
          if (neighborhoodRef.current) {
            neighborhoodRef.current.value = data.neighborhood;
          }
          if (cityRef.current) {
            cityRef.current.value = data.city;
          }
          if (titleRef.current && !titleRef.current.value) {
            const shortRoad = data.road.replace(STREET_PREFIX_RE, '').trim();
            const streetPart = [shortRoad, data.houseNumber].filter(Boolean).join(' ');
            const location = [streetPart, data.neighborhood || data.city].filter(Boolean).join(', ');
            titleLocationRef.current = location;
            const typeLabel = selectedType ? tSpaceType(selectedType) : null;
            titleRef.current.value = typeLabel ? `${typeLabel} ${location}` : location;
            setTitleAutofilled(true);
          }
          setLat(String(data.lat));
          setLng(String(data.lng));
          setAutofillState('done');
        } catch {
          setAutofillState('error');
        }
      },
      () => setAutofillState('error'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  function handleTypeChange(type: SpaceType) {
    setSelectedType(type);
    if (titleAutofilled && titleRef.current) {
      const location = titleLocationRef.current;
      titleRef.current.value = location ? `${tSpaceType(type)} ${location}` : tSpaceType(type);
    }
  }

  const photoPreviews = useMemo(
    () => photoFiles.map(f => URL.createObjectURL(f)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photoFiles],
  );

  useEffect(() => {
    if (!photoInputRef.current) return;
    try {
      const dt = new DataTransfer();
      photoFiles.forEach(f => dt.items.add(f));
      photoInputRef.current.files = dt.files;
    } catch { /* DataTransfer not supported (rare) */ }
  }, [photoFiles]);

  const photoLimit = isPremium ? 6 : 1;

  async function addPhotos(incoming: File[]) {
    // Downscale to a mobile-friendly size before the photo enters the form,
    // so we never upload a multi-megabyte original from a phone camera.
    const resized = await Promise.all(incoming.map(f => resizeImageFile(f)));
    setPhotoFiles(prev => [...prev, ...resized].slice(0, photoLimit));
  }

  function removePhoto(index: number) {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
  }

  function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    void addPhotos(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  function handleCamera(e: React.ChangeEvent<HTMLInputElement>) {
    void addPhotos(Array.from(e.target.files ?? []));
    e.target.value = '';
  }

  if (state === 'SUCCESS_GUEST') {
    return (
      <div className="publish-success">
        <Icon name="check" size={48} className="publish-success__icon" />
        <h2>Gràcies! Hem rebut el teu espai.</h2>
        <p>
          Com que no havies iniciat sessió, l'espai està <strong>pendent de validació</strong>.
          <br /><br />
          Contactarem amb tu a l'adreça de correu que has indicat per verificar la teva identitat i publicar l'espai definitivament.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="publish-form">
      {state && state !== 'SUCCESS_GUEST' && (
        <div className="form-error">{state}</div>
      )}
      
      {!isLoggedIn && (
        <div className="form-notice" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
          <div>
            <strong>{t('guestNotice')}</strong><br />
            {t('guestDesc')}
          </div>
          <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
            <button type="button" data-variant="primary" onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signUp' } }))}>
              {t('guestSignUp')}
            </button>
            <button type="button" data-variant="ghost" onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { mode: 'signIn' } }))}>
              {t('guestSignIn')}
            </button>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <fieldset className="fieldset">
          <legend className="fieldset__legend">{t('guestDataTitle')}</legend>
          <label className="field">
            <span className="field__label">{t('fieldEmail')} <span style={{ color: 'var(--danger)', marginLeft: 4 }}>*</span></span>
            <input name="guest_email" type="email" className="field__input" placeholder={t('guestEmailPlaceholder')} required />
            <p className="field__help">{t('guestEmailHelp')}</p>
          </label>
        </fieldset>
      )}

      {/* ── Type ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('fieldType')}</legend>
        <div className="espais-filter-chips">
          {SPACE_TYPES.map(type => (
            <label key={type} className="chip" data-type={type}>
              <input
                type="radio"
                name="type"
                value={type}
                required
                className="visually-hidden"
                onChange={() => handleTypeChange(type)}
              />
              <span className="chip__icon">
                <Icon name={type} size={16} />
              </span>
              <span>{tSpaceType(type)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ── Location ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionLocation')}</legend>

        <div className="geo-autofill" data-status={autofillState}>
          <button
            type="button"
            onClick={autofillFromLocation}
            disabled={autofillState === 'locating' || autofillState === 'geocoding'}
            className="geo-autofill__button"
          >
            <span className="geo-autofill__icon" aria-hidden="true">📍</span>
            {autofillState === 'locating' && t('autofillLocating')}
            {autofillState === 'geocoding' && t('autofillGeocoding')}
            {(autofillState === 'idle' || autofillState === 'done' || autofillState === 'error') && t('autofillButton')}
          </button>
          {autofillState === 'done' && (
            <p className="geo-autofill__hint" role="status">{t('autofillSuccess')}</p>
          )}
          {autofillState === 'error' && (
            <p className="geo-autofill__hint" role="alert">{t('autofillError')}</p>
          )}
        </div>

        <label className="field">
          <span className="field__label">{t('fieldAddress')}</span>
          <input ref={addressRef} name="address" type="text" className="field__input"
            placeholder={t('fieldAddressPlaceholder')} onBlur={geocodeAddress} />
        </label>
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
            <input ref={neighborhoodRef} name="neighborhood" type="text" className="field__input" />
          </label>
          <label className="field field--grow">
            <span className="field__label">{t('fieldCity')}</span>
            <input ref={cityRef} name="city" type="text" className="field__input" />
          </label>
        </div>
      </fieldset>

      {/* ── Basic info ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionBasic')}</legend>

        <label className="field">
          <span className="field__label">{t('fieldTitle')} *</span>
          <input ref={titleRef} name="title" type="text" className="field__input" required maxLength={120}
            placeholder={t('fieldTitlePlaceholder')}
            onInput={() => setTitleAutofilled(false)} />
        </label>

        <label className="field">
          <span className="field__label">{t('fieldDescription')}</span>
          <textarea name="description" className="field__input field__textarea"
            rows={4} maxLength={2000} placeholder={t('fieldDescriptionPlaceholder')} />
        </label>

        <label className="field">
          <span className="field__label">{t('fieldSize')}</span>
          <input name="size_m2" type="number" className="field__input" min="0" step="0.1"
            placeholder="25" />
        </label>
      </fieldset>

      {/* ── Pricing ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionPricing')}</legend>

        <div className="field-row">
          <label className="field field--grow">
            <span className="field__label">{t('fieldPrice')}</span>
            <input name="price" type="number" className="field__input" min="0" step="0.01" />
          </label>
          <label className="field">
            <span className="field__label">{t('fieldPriceUnit')}</span>
            <select name="price_unit" className="field__input field__select">
              <option value="month">{t('unitMonth')}</option>
              <option value="day">{t('unitDay')}</option>
              <option value="hour">{t('unitHour')}</option>
            </select>
          </label>
        </div>
      </fieldset>

      {/* ── Amenities ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionAmenities')}</legend>
        {!selectedType && (
          <p className="field__hint">{t('amenitiesSelectType')}</p>
        )}
        {selectedType && Object.entries(AMENITY_GROUPS).map(([group, items]) => {
          const allowed = AMENITIES_BY_TYPE[selectedType];
          const visible = items.filter(id => allowed.has(id));
          if (visible.length === 0) return null;
          return (
            <div key={group} className="amenity-group">
              <p className="amenity-group__label">{group}</p>
              <div className="checkbox-grid">
                {visible.map(id => (
                  <label key={id} className="checkbox-item">
                    <input type="checkbox" name="amenities" value={id} />
                    <span>{tAmenity(id as Parameters<typeof tAmenity>[0])}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </fieldset>

      {/* ── Photos ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionPhotos')}</legend>
        <input ref={photoInputRef} name="photos" type="file" multiple style={{ display: 'none' }} />
        <p className="field__hint">
          {isPremium ? t('photosHelp') : t('photosHelpFree')}
        </p>
        <div className="photo-upload-row">
          <label className="photo-upload-btn">
            <input ref={galleryInputRef} type="file" accept="image/*" multiple onChange={handleGallery} style={{ display: 'none' }} />
            <Icon name="image" size={16} />
            {t('photosGallery')}
          </label>
          <label className="photo-upload-btn photo-upload-btn--camera">
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleCamera} style={{ display: 'none' }} />
            <Icon name="camera" size={16} />
            {t('photosCamera')}
          </label>
        </div>
        {photoPreviews.length > 0 && (
          <div className="photo-previews">
            {photoPreviews.map((src, i) => (
              <div key={i} className="photo-preview-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="photo-preview" />
                <button type="button" className="photo-preview-remove" onClick={() => removePhoto(i)} aria-label="Eliminar foto">×</button>
              </div>
            ))}
          </div>
        )}
      </fieldset>

      {/* ── Contact ── */}
      <fieldset className="fieldset">
        <legend className="fieldset__legend">{t('sectionContact')}</legend>

        <label className="field">
          <span className="field__label">{t('fieldContactName')}</span>
          <input ref={contactNameRef} name="contact_name" type="text" className="field__input" maxLength={100} autoComplete="name" />
        </label>

        <label className="field">
          <span className="field__label">{t('fieldWeb')}</span>
          <input name="web" type="url" className="field__input" placeholder="https://" />
        </label>

        <label className="field">
          <span className="field__label">{t('fieldPhone')}</span>
          <input ref={phoneRef} name="phone" type="tel" className="field__input" placeholder="+34 600 000 000" autoComplete="tel" />
          <span className="field__help">{t('fieldPhoneHelp')}</span>
        </label>

        <label className="field">
          <span className="field__label">{t('fieldEmail')}</span>
          <input ref={emailContactRef} name="email_contact" type="email" className="field__input" placeholder={t('guestEmailPlaceholder')} />
        </label>

        <div className="field">
          <span className="field__label">{t('contactDefault')}</span>
          <div className="type-picker">
            {(['web', 'phone', 'email', 'whatsapp'] as const).map(opt => (
              <label key={opt} className="type-option">
                <input type="radio" name="contact_default" value={opt} defaultChecked={opt === 'email'} />
                <span>{t(`contact_${opt}` as Parameters<typeof t>[0])}</span>
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" data-variant="primary" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  );
}
