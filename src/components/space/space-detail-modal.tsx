'use client';

import { useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { Icon, type IconName } from '@/components/ui/icon';

const TYPE_ICON: Record<Space['type'], IconName> = {
  storage: 'storage',
  workspace: 'workspace',
  garden: 'garden',
  room: 'room',
};

interface SpaceDetailModalProps {
  space: Space | null;
  onClose: () => void;
}

export function SpaceDetailModal({ space, onClose }: SpaceDetailModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (space && !dialog.open) {
      dialog.showModal();
    } else if (!space && dialog.open) {
      dialog.close();
    }
  }, [space]);

  // Close on backdrop click or escape
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) onClose();
    };
    const handleClose = () => onClose();

    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('click', handleClick);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  async function handleShare() {
    if (!space) return;
    const url = `${window.location.origin}/${locale}/espai/${space.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: space.title, text: space.description ?? '', url });
      } catch {
        // User cancelled, no-op.
      }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  if (!space) return null;

  const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
  const formattedPrice = new Intl.NumberFormat(localeMap[locale] ?? 'ca-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(space.priceCents / 100);

  return (
    <dialog ref={dialogRef} data-modal aria-labelledby="space-title">
      <button
        type="button"
        className="modal__close"
        aria-label="Close"
        onClick={onClose}
      >
        <Icon name="close" size={18} />
      </button>

      <div className="detail__hero" data-type={space.type} style={{
        background: {
          storage: 'linear-gradient(135deg, #e8d9b8 0%, #c9b288 100%)',
          workspace: 'linear-gradient(135deg, #b6c4a3 0%, #6b8053 100%)',
          garden: 'linear-gradient(135deg, #c8d8b3 0%, #8aa66f 100%)',
          room: 'linear-gradient(135deg, #e8a583 0%, #c45a2c 100%)',
        }[space.type],
      }}>
        <Icon name={TYPE_ICON[space.type]} size={88} className="glyph" />
      </div>

      <div className="detail__body">
        <header className="detail__head">
          <div>
            <h2 id="space-title" className="detail__title">{space.title}</h2>
            <p className="detail__meta">
              <span><Icon name="pin" size={14} />{space.address}</span>
              {space.sizeM2 != null && (
                <span><Icon name="ruler" size={14} />{t('detail.size', { n: space.sizeM2 })}</span>
              )}
              <span>
                <Icon name="star" size={14} />
                {space.rating.toFixed(1)} · {t('detail.reviews', { n: space.reviewsCount })}
              </span>
            </p>
          </div>
          <p className="detail__price">
            {formattedPrice}
            <small>{t('card.month')}</small>
          </p>
        </header>

        {space.description && <p className="detail__desc">{space.description}</p>}

        {space.amenities.length > 0 && (
          <div>
            <small style={{ color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
              {t('detail.amenities')}
            </small>
            <div className="detail__amenities" style={{ marginTop: 'var(--s-2)' }}>
              {space.amenities.map((a) => (
                <span key={a} className="amenity">{a}</span>
              ))}
            </div>
          </div>
        )}

        <div className="detail__actions">
          <button type="button" data-variant="primary">
            {t('detail.contact')}
          </button>
          <button type="button" data-variant="ghost" onClick={handleShare}>
            <Icon name="share" size={16} />
            {t('detail.share')}
          </button>
        </div>
      </div>
    </dialog>
  );
}
