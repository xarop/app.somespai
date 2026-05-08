'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { Space } from '@/lib/schemas/space';
import { Icon, type IconName } from '@/components/ui/icon';
import { getReviews, addReview, type Review } from '@/lib/supabase/reviews';
import { createClient } from '@/lib/supabase/client';
import { getSlugFromType } from '@/lib/seo/type-slugs';

const TYPE_ICON: Record<Space['type'], IconName> = {
  storage: 'storage',
  workspace: 'workspace',
  garden: 'garden',
  room: 'room',
  parking: 'parking',
};

interface SpaceDetailModalProps {
  space: Space | null;
  onClose: () => void;
  isAdmin?: boolean;
  currentUserId?: string;
  onReviewAdded?: (spaceId: string, rating: number, reviewsCount: number) => void;
  standalone?: boolean;
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

export function SpaceDetailModal({ space, onClose, isAdmin, currentUserId, onReviewAdded, standalone }: SpaceDetailModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newBody, setNewBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
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
    supabase.auth.getUser().then(async ({ data }) => {
      const loggedIn = !!data.user;
      setIsLoggedIn(loggedIn);
      const r = await getReviews(space.id);
      setReviews(r);
      setReviewsLoaded(true);
      if (loggedIn && data.user) {
        const mine = r.find(rev => rev.authorId === data.user!.id);
        setUserRating(mine?.rating ?? null);
      }
    });
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
    setReviewError(null);
    try {
      await addReview(space.id, newRating, newBody);
      const updated = await getReviews(space.id);
      setReviews(updated);
      setUserRating(newRating);
      setNewBody('');
      const newAvg = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
      onReviewAdded?.(space.id, newAvg, updated.length);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Error desconegut');
    }
    setSubmitting(false);
  }

  if (!space) return null;

  const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
  const formattedPrice = space.priceCents > 0
    ? new Intl.NumberFormat(localeMap[locale] ?? 'ca-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
      }).format(space.priceCents / 100)
    : '?';

  const isVerified = (space as Space & { ownerVerified?: boolean }).ownerVerified;

  const whatsappHref = space.whatsapp
    ? `https://wa.me/${space.whatsapp.replace(/[^\d]/g, '')}`
    : null;

  const contactOptions = {
    web:      space.web          ? { href: space.web,                    label: t('detail.web'),      external: true  } : null,
    phone:    space.phone        ? { href: `tel:${space.phone}`,         label: t('detail.phone'),    external: false } : null,
    email:    space.emailContact ? { href: `mailto:${space.emailContact}`,label: t('detail.email'),   external: false } : null,
    whatsapp: whatsappHref       ? { href: whatsappHref,                  label: t('detail.whatsapp'),external: true  } : null,
  } as const;
  const primaryContact = contactOptions[space.contactDefault] ?? Object.values(contactOptions).find(Boolean);

  const Wrapper = standalone ? 'div' : 'dialog';
  const wrapperProps = standalone 
    ? { className: "space-standalone", 'aria-labelledby': "space-title" } 
    : { ref: dialogRef as any, 'data-modal': true, 'aria-labelledby': "space-title" };

  return (
    <Wrapper {...wrapperProps}>
      {!standalone && (
        <button type="button" className="modal__close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={18} />
        </button>
      )}
      {isAdmin ? (
        <a
          href={`/${locale}/admin?edit=${space.id}`}
          className="modal__admin-edit"
          title="Editar a l'admin"
        >
          <Icon name="pencil" size={15} />
        </a>
      ) : currentUserId && space.ownerId === currentUserId ? (
        <a
          href={`/${locale}/editar/${space.slug}`}
          className="modal__admin-edit"
          title="Editar"
        >
          <Icon name="pencil" size={15} />
        </a>
      ) : null}

      <div className="detail__hero" data-type={space.type}>
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
            {standalone && (
              <nav className="detail__breadcrumbs" aria-label="Breadcrumb">
                <a href={locale === 'ca' ? '/' : `/${locale}`}>{t('nav.home') || 'Somespai'}</a>
                <span className="separator"> / </span>
                {space.city && (
                  <>
                    <a href={`${locale === 'ca' ? '' : `/${locale}`}/${space.city.toLowerCase()}`}>
                      {space.city}
                    </a>
                    <span className="separator"> / </span>
                    <a href={`${locale === 'ca' ? '' : `/${locale}`}/${space.city.toLowerCase()}/${getSlugFromType(space.type, locale)}`}>
                      {t(`filter.${space.type as any}`)}
                    </a>
                    <span className="separator"> / </span>
                  </>
                )}
              </nav>
            )}
            <h1 id="space-title" className="detail__title">
              {space.title}
              {isVerified && <span className="badge-verified" title="Verificat">✓</span>}
            </h1>
            <p className="detail__meta">
              <span><Icon name="pin" size={14} />{[space.address, space.city].filter(Boolean).join(', ')}</span>
              {space.sizeM2 != null && (
                <span><Icon name="ruler" size={14} />{t('detail.size', { n: space.sizeM2 })}</span>
              )}
              <span>
                <Icon name="star" size={14} />
                {reviewsLoaded
                  ? (reviews.length > 0
                      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
                      : space.rating.toFixed(1))
                  : space.rating.toFixed(1)
                } · {t('detail.reviews', { n: reviewsLoaded ? reviews.length : space.reviewsCount })}
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
          {primaryContact && (
            <a
              href={primaryContact.href}
              {...(primaryContact.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              data-variant="primary"
            >
              {space.contactDefault === 'whatsapp' && <Icon name="share" size={16} />}
              {space.contactDefault === 'phone'    && <Icon name="phone" size={16} />}
              {space.contactDefault === 'email'    && <Icon name="mail"  size={16} />}
              {t('detail.contact')}
            </a>
          )}

          {(space.address || space.city) && (
            <a
              href={`https://www.google.com/maps?q=${space.lat},${space.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              data-variant="ghost"
              className="detail__action-link"
            >
              <Icon name="pin" size={16} />
              <span className="detail__action-label">{t('detail.location')}</span>
            </a>
          )}

          <button type="button" data-variant="ghost" onClick={handleShare}>
            <Icon name="share" size={16} />
            <span className="detail__action-label">{t('detail.share')}</span>
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
              {reviewError && (
                <p className="reviews__error">{reviewError}</p>
              )}
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
    </Wrapper>
  );
}
