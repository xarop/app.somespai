'use client';

import { useState, useActionState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { quickImportAction } from '../actions';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    title?: string;
    address?: string;
    web?: string;
    photoUrl?: string;
  };
}

export function QuickImportModal({ onClose, onSuccess, initialData }: Props) {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState(quickImportAction, null);

  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [geoState, setGeoState] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const addressRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state === 'ok') {
      onSuccess();
      onClose();
    }
  }, [state, onClose, onSuccess]);

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
      if (data[0]) {
        setLat(data[0].lat);
        setLng(data[0].lon);
        setGeoState('success');
      } else {
        setGeoState('error');
      }
    } catch {
      setGeoState('error');
    }
  }

  return (
    <div className="admin-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal admin-modal--full">
        <header className="admin-modal__header">
          <h2>⚡ Importació Ràpida (Des de Google Maps / Web)</h2>
          <button type="button" className="admin-modal__close" onClick={onClose}>✕</button>
        </header>

        <form action={formAction} className="admin-modal__form">
          {state && state !== 'ok' && <div className="admin-error">{state}</div>}

          <div className="admin-form-row">
            <label>
              <span>{t('publish.title')} (*)</span>
              <input name="title" required defaultValue={initialData?.title} />
            </label>
            <label>
              <span>{t('publish.type')} (*)</span>
              <select name="type" required defaultValue="storage">
                <option value="storage">{t('types.storage')}</option>
                <option value="workspace">{t('types.workspace')}</option>
                <option value="garden">{t('types.garden')}</option>
                <option value="room">{t('types.room')}</option>
              </select>
            </label>
          </div>

          <label>
            <span>Web Original URL (Contacte)</span>
            <input type="url" name="web" defaultValue={initialData?.web} />
          </label>

          <div className="admin-form-row">
            <label style={{ flex: 2 }}>
              <span>{t('publish.address')}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  name="address"
                  ref={addressRef}
                  defaultValue={initialData?.address}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={geocode} className="admin-btn admin-btn--secondary" disabled={geoState === 'loading'}>
                  {geoState === 'loading' ? '⏳' : geoState === 'success' ? '✅' : 'Geocode'}
                </button>
              </div>
            </label>
            <input type="hidden" name="lat" value={lat} />
            <input type="hidden" name="lng" value={lng} />
          </div>

          <label>
            <span>{t('publish.description')}</span>
            <textarea name="description" rows={4} />
          </label>

          <div className="admin-form-row">
            <label>
              <span>{t('publish.price')} (€/mes)</span>
              <input type="number" name="price" min="0" step="0.01" />
            </label>
            <label>
              <span>{t('publish.size')} (m²)</span>
              <input type="number" name="size_m2" min="1" step="0.1" />
            </label>
          </div>

          <label>
            <span>URL de la Foto Principal (s'importarà i comprimirà)</span>
            <input type="url" name="photoUrl" defaultValue={initialData?.photoUrl} />
          </label>
          <label>
            <span>O pujar arxiu manualment (substitueix l'URL)</span>
            <input type="file" name="photo" accept="image/*" />
          </label>

          <footer className="admin-modal__footer">
            <button type="button" onClick={onClose} className="admin-btn admin-btn--secondary">
              Cancel·lar
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isPending || (!lat && geoState !== 'success')}>
              {isPending ? 'Guardant...' : geoState !== 'success' ? 'Busca Coordenades abans' : 'Importar (Pausat)'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
