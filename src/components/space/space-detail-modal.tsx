'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { Icon, type IconName } from '@/components/ui/icon';
import { getReviews, addReview, getUserReview, type Review } from '@/lib/supabase/reviews';
import { createClient } from '@/lib/supabase/client';

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

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="star-rating" role="group" aria-label="Puntuació">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className="star-btn"
          aria-pressed={value >= n}
          onClick={() => onChange?.(n)}
          style={{ color: value >= n ? 'var(--gold)' : 'var(--ink-mute)' }}
        >
          <Icon name="star" size={20} />
        </button>
      ))}
    </div>
  );
}

export function SpaceDetailModal({ space, onClose }: SpaceDetailModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (space && !dialog.open) {
      dialog.showModal();
    } else if (!space && dialog.open) {
      dialog.close();
    }
  }, [space]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClick = (e: MouseEvent) => { if (e.target === dialog) onClose(); };
    const handleClose = () => onClose();
    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('click', handleClick);
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  // Load reviews + auth state when space opens
  useEffect(() => {
    if (!space) { setReviews([]); setUserRating(null); setReviewsLoaded(false); return; }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
    getReviews(space.id).then(r => { setReviews(r); setReviewsLoaded(true); });
    getUserReview(space.id).then(r => setUserRating(r));
  }, [space]);

  async function handleShare() {
    if (!space) return;
    const url = `${window.location.origin}/${locale}/espai/${space.slug}`;
    if (navigator.share) {
      try { await navigator.share({ title: space.title, text: space.description ?? '', url }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!space || submitting) return;
    setSubmitting(true);
    try {
      await addReview(space.id, newRating, newBody);
      const updated = await getReviews(space.id);
      setReviews(updated);
      setUserRating(newRating);
      setNewBody('');
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  if (!space) return null;

  const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
  const formattedPrice = new Intl.NumberFormat(localeMap[locale] ?? 'ca-ES', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(space.priceCents / 100);

  const isVerified = (space as Space & { ownerVerified?: boolean }).ownerVerified;

  const whatsappHref = space.whatsapp
    ? `https://wa.me/${space.whatsapp.replace(/[^\d]/g, '')}`
    : null;

  return (
    <dialog ref={dialogRef} data-modal aria-labelledby="space-title">
      <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
        <Icon name="close" size={18} />
      </button>

      <div className="detail__hero" data-type={space.type} style={space.photos[0] ? undefined : {
        background: {
          storage: 'linear-gradient(135deg, #e8d9b8 0%, #c9b288 100%)',
          workspace: 'linear-gradient(135deg, #b6c4a3 0%, #6b8053 100%)',
          garden: 'linear-gradient(135deg, #c8d8b3 0%, #8aa66f 100%)',
          room: 'linear-gradient(135deg, #e8a583 0%, #c45a2c 100%)',
        }[space.type],
      }}>
        {space.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={space.photos[0]} alt={space.title} className="detail__hero-img" />
        ) : (
          <Icon name={TYPE_ICON[space.type]} size={88} className="glyph" />
        )}
        <span className="detail__type-badge">
          <Icon name={TYPE_ICON[space.type]} size={16} />
        </span>
      </div>

      <div className="detail__body">
        <header className="detail__head">
          <div>
            <h2 id="space-title" className="detail__title">
              {space.title}
              {isVerified && <span className="badge-verified" title="Verificat">✓</span>}
            </h2>
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
            <small>{t(`card.${space.priceUnit}`)}</small>
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
                <span key={a} className="amenity">{t(`amenity.${a}` as Parameters<typeof t>[0])}</span>
              ))}
            </div>
          </div>
        )}

        <div className="detail__actions">
          {(space.address || space.city) && (
            <a
              href={`https://www.google.com/maps?q=${space.lat},${space.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              data-variant="ghost"
              className="detail__action-link"
            >
              <Icon name="pin" size={16} />
              {[space.address, space.city].filter(Boolean).join(', ')}
            </a>
          )}

          {space.web && (
            <a
              href={space.web}
              target="_blank"
              rel="noopener noreferrer"
              data-variant={space.contactDefault === 'web' ? 'primary' : 'ghost'}
              className="detail__action-link"
              style={space.contactDefault === 'web' ? { fontWeight: 'bold' } : undefined}
            >
              <Icon name="globe" size={16} />
              {t('detail.web')}
            </a>
          )}

          {space.phone && (
            <a
              href={`tel:${space.phone}`}
              data-variant={space.contactDefault === 'phone' ? 'primary' : 'ghost'}
              className="detail__action-link"
              style={space.contactDefault === 'phone' ? { fontWeight: 'bold' } : undefined}
            >
              <Icon name="phone" size={16} />
              {t('detail.phone')}
            </a>
          )}

          {space.emailContact && (
            <a
              href={`mailto:${space.emailContact}`}
              data-variant={space.contactDefault === 'email' ? 'primary' : 'ghost'}
              className="detail__action-link"
              style={space.contactDefault === 'email' ? { fontWeight: 'bold' } : undefined}
            >
              <Icon name="mail" size={16} />
              {t('detail.email')}
            </a>
          )}

          {space.whatsapp && whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              data-variant={space.contactDefault === 'whatsapp' ? 'primary' : 'ghost'}
              className="detail__action-link"
              style={space.contactDefault === 'whatsapp' ? { fontWeight: 'bold' } : undefined}
            >
              <Icon name="share" size={16} />
              {t('detail.whatsapp')}
            </a>
          )}

          <button type="button" data-variant="ghost" onClick={handleShare}>
            <Icon name="share" size={16} />{t('detail.share')}
          </button>
        </div>

        {/* ── Reviews ── */}
        <section className="reviews">
          <h3 className="reviews__title">{t('review.title')}</h3>

          {reviewsLoaded && reviews.length === 0 && (
            <p className="reviews__empty">{t('review.noReviews')}</p>
          )}

          {reviews.map(r => (
            <div key={r.id} className="review-item">
              <div className="review-item__head">
                <span className="review-item__author">{r.authorEmail}</span>
                <StarRating value={r.rating} />
              </div>
              {r.body && <p className="review-item__body">{r.body}</p>}
            </div>
          ))}

          {/* Review form */}
          {isLoggedIn && userRating === null && (
            <form onSubmit={handleReviewSubmit} className="review-form">
              <p className="reviews__title" style={{ fontSize: 'var(--t-sm)' }}>{t('review.add')}</p>
              <StarRating value={newRating} onChange={setNewRating} />
              <textarea
                className="field__input field__textarea"
                rows={3}
                value={newBody}
                onChange={e => setNewBody(e.target.value)}
                placeholder={t('review.bodyPlaceholder')}
              />
              <button type="submit" data-variant="primary" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
                {submitting ? t('review.submitting') : t('review.submit')}
              </button>
            </form>
          )}

          {isLoggedIn && userRating !== null && (
            <p className="reviews__empty" style={{ color: 'var(--primary-ink)' }}>
              {t('review.alreadyReviewed')} <StarRating value={userRating} />
            </p>
          )}

          {!isLoggedIn && (
            <p className="reviews__empty">{t('review.loginRequired')}</p>
          )}
        </section>
      </div>
    </dialog>
  );
}
