"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Space } from "@/lib/schemas/space";
import { Icon, type IconName } from "@/components/ui/icon";
import { getReviews, addReview, type Review } from "@/lib/supabase/reviews";
import { getSlugFromType } from "@/lib/seo/type-slugs";
import { formatLocation } from "@/lib/geo";

const TYPE_ICON: Record<Space["type"], IconName> = {
  storage: "storage",
  workspace: "workspace",
  garden: "garden",
  room: "room",
  parking: "parking",
};

interface SpaceDetailModalProps {
  space: Space | null;
  onClose: () => void;
  isAdmin?: boolean;
  currentUserId?: string;
  onReviewAdded?: (
    spaceId: string,
    rating: number,
    reviewsCount: number,
  ) => void;
  standalone?: boolean;
  liked?: boolean;
  onToggleLike?: (id: string) => void;
}

function withUtm(url: string, campaign?: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "somespai");
    u.searchParams.set("utm_medium", "referral");
    if (campaign) u.searchParams.set("utm_campaign", campaign);
    return u.toString();
  } catch {
    return url;
  }
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange?: (v: number) => void;
}) {
  return (
    <div className="star-rating" role="group" aria-label="Puntuació">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-btn"
          aria-pressed={value >= n}
          onClick={() => onChange?.(n)}
          style={{ color: value >= n ? "var(--gold)" : "var(--ink-mute)" }}
        >
          <Icon name="star" size={20} />
        </button>
      ))}
    </div>
  );
}

export function SpaceDetailModal({
  space,
  onClose,
  isAdmin,
  currentUserId,
  onReviewAdded,
  standalone,
  liked,
  onToggleLike,
}: SpaceDetailModalProps) {
  const t = useTranslations();
  const locale = useLocale();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reportMenuOpen, setReportMenuOpen] = useState(false);
  const reportMenuRef = useRef<HTMLDivElement>(null);

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
    const handleClick = (e: MouseEvent) => {
      if (e.target === dialog) onClose();
    };
    const handleClose = () => onClose();
    dialog.addEventListener("click", handleClick);
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("click", handleClick);
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  // Load reviews + auth state when space opens
  useEffect(() => {
    if (!space) {
      setReviews([]);
      setUserRating(null);
      setReviewsLoaded(false);
      return;
    }
    getReviews(space.id).then((r) => {
      setReviews(r);
      setReviewsLoaded(true);
      if (currentUserId) {
        const mine = r.find((rev) => rev.authorId === currentUserId);
        setUserRating(mine?.rating ?? null);
      }
    });
  }, [space]);

  useEffect(() => {
    if (!reportMenuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
        setReportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [reportMenuOpen]);

  function reportHref(reason: string) {
    if (!space) return '#';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const spaceUrl = `${origin}/${locale}/espai/${space.slug}`;
    const p = new URLSearchParams({
      title: space.title,
      address: space.address ?? space.city ?? '',
      url: spaceUrl,
      reason,
    });
    return `/${locale}/contacte?${p.toString()}`;
  }

  async function handleShare() {
    if (!space) return;
    const url = `${window.location.origin}/${locale}/espai/${space.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: space.title,
          text: space.description ?? "",
          url,
        });
      } catch {
        /* cancelled */
      }
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
      setNewBody("");
      const newAvg = updated.reduce((s, r) => s + r.rating, 0) / updated.length;
      onReviewAdded?.(space.id, newAvg, updated.length);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : "Error desconegut");
    }
    setSubmitting(false);
  }

  if (!space) return null;

  const localeMap: Record<string, string> = {
    ca: "ca-ES",
    es: "es-ES",
    en: "en-GB",
  };
  const formattedPrice =
    space.priceCents > 0
      ? new Intl.NumberFormat(localeMap[locale] ?? "ca-ES", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(space.priceCents / 100)
      : "?";

  const isVerified = (space as Space & { ownerVerified?: boolean })
    .ownerVerified;

  const whatsappHref = space.whatsapp
    ? `https://wa.me/${space.whatsapp.replace(/[^\d]/g, "")}`
    : null;

  const contactOptions = {
    web: space.web
      ? { href: withUtm(space.web, space.type), label: t("detail.web"), external: true }
      : null,
    phone: space.phone
      ? {
          href: `tel:${space.phone}`,
          label: t("detail.phone"),
          external: false,
        }
      : null,
    email: space.emailContact
      ? {
          href: `mailto:${space.emailContact}`,
          label: t("detail.email"),
          external: false,
        }
      : null,
    whatsapp: whatsappHref
      ? { href: whatsappHref, label: t("detail.whatsapp"), external: true }
      : null,
  } as const;
  const primaryContact =
    contactOptions[space.contactDefault] ??
    Object.values(contactOptions).find(Boolean);

  const Wrapper = standalone ? "div" : "dialog";
  const wrapperProps = standalone
    ? { className: "space-standalone", "aria-labelledby": "space-title" }
    : {
        ref: dialogRef as any,
        "data-modal": true,
        "aria-labelledby": "space-title",
      };

  return (
    <Wrapper {...wrapperProps}>
      {!standalone && (
        <button
          type="button"
          className="modal__close"
          aria-label="Close"
          onClick={onClose}
        >
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

      {standalone && (
        <nav
          className="detail__breadcrumbs"
          aria-label="Breadcrumb"
          style={{ paddingBottom: "var(--s-3)" }}
        >
          <a href={locale === "ca" ? "/" : `/${locale}`}>{t("nav.home")}</a>
          <span className="separator"> / </span>
          {space.city && (
            <>
              <a
                href={`${locale === "ca" ? "" : `/${locale}`}/${space.city.toLowerCase()}`}
              >
                {space.city}
              </a>
              <span className="separator"> / </span>
              <a
                href={`${locale === "ca" ? "" : `/${locale}`}/${space.city.toLowerCase()}/${getSlugFromType(space.type, locale)}`}
              >
                {t(`filter.${space.type as any}`)}
              </a>
              <span className="separator"> / </span>
            </>
          )}
        </nav>
      )}

      <div className="detail__hero" data-type={space.type}>
        {space.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={space.photos[0]}
            alt={space.title}
            className="detail__hero-img"
          />
        ) : (
          <Icon name={TYPE_ICON[space.type]} size={88} className="glyph" />
        )}
        <span className="detail__type-badge">
          <Icon name={TYPE_ICON[space.type]} size={16} />
        </span>
        <button
          type="button"
          className="detail__hero-like"
          aria-pressed={liked}
          aria-label={t("card.like")}
          onClick={() => space && onToggleLike?.(space.id)}
        >
          <Icon name="heart" size={18} />
        </button>
        <div className="detail__report-wrap detail__report-wrap--hero" ref={reportMenuRef}>
          <button
            type="button"
            className="detail__report-btn"
            aria-label={t("detail.reportMenu")}
            aria-expanded={reportMenuOpen}
            onClick={() => setReportMenuOpen((v) => !v)}
          >
            <Icon name="more" size={18} />
          </button>
          {reportMenuOpen && (
            <div className="detail__report-menu" role="menu">
              <p className="detail__report-label">{t("detail.reportMenu")}</p>
              <a
                href={reportHref("unavailable")}
                className="detail__report-item"
                role="menuitem"
                onClick={() => setReportMenuOpen(false)}
              >
                {t("detail.reportUnavailable")}
              </a>
              <a
                href={reportHref("wrongdata")}
                className="detail__report-item"
                role="menuitem"
                onClick={() => setReportMenuOpen(false)}
              >
                {t("detail.reportWrongData")}
              </a>
              <a
                href={reportHref("claim")}
                className="detail__report-item"
                role="menuitem"
                onClick={() => setReportMenuOpen(false)}
              >
                {t("detail.reportClaim")}
              </a>
              <a
                href={reportHref("contact")}
                className="detail__report-item"
                role="menuitem"
                onClick={() => setReportMenuOpen(false)}
              >
                {t("detail.reportContact")}
              </a>
              <a
                href={reportHref("report")}
                className="detail__report-item detail__report-item--danger"
                role="menuitem"
                onClick={() => setReportMenuOpen(false)}
              >
                <Icon name="flag" size={13} />
                {t("detail.reportAbuse")}
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="detail__body">
        <header className="detail__head">
          <div>
            <h1 id="space-title" className="detail__title">
              {space.title}
              {isVerified && (
                <span className="badge-verified" title="Verificat">
                  ✓
                </span>
              )}
            </h1>
            <p className="detail__meta">
              <span>
                <Icon name="pin" size={14} />
                {formatLocation(space.address, space.city)}
              </span>
              {space.sizeM2 != null && (
                <span>
                  <Icon name="ruler" size={14} />
                  {t("detail.size", { n: space.sizeM2 })}
                </span>
              )}
              <span>
                <Icon name="star" size={14} />
                {reviewsLoaded
                  ? reviews.length > 0
                    ? (
                        reviews.reduce((s, r) => s + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : space.rating.toFixed(1)
                  : space.rating.toFixed(1)}{" "}
                ·{" "}
                {t("detail.reviews", {
                  n: reviewsLoaded ? reviews.length : space.reviewsCount,
                })}
              </span>
            </p>
          </div>
          <p className="detail__price">
            {formattedPrice}
            <small>{t(`card.${space.priceUnit}`)}</small>
          </p>
        </header>

        {space.description && (
          <p className="detail__desc">{space.description}</p>
        )}

        {space.amenities.length > 0 && (
          <div>
            <small
              style={{
                color: "var(--ink-mute)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "11px",
              }}
            >
              {t("detail.amenities")}
            </small>
            <div
              className="detail__amenities"
              style={{ marginTop: "var(--s-2)" }}
            >
              {space.amenities.map((a) => (
                <span key={a} className="amenity">
                  {t(`amenity.${a}` as Parameters<typeof t>[0])}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="detail__actions">
          {primaryContact ? (
            <a
              href={primaryContact.href}
              {...(primaryContact.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              data-variant="primary"
            >
              {space.contactDefault === "whatsapp" && <Icon name="whatsapp" size={16} />}
              {space.contactDefault === "phone" && <Icon name="phone" size={16} />}
              {space.contactDefault === "email" && <Icon name="mail" size={16} />}
              {space.contactDefault === "web" && <Icon name="globe" size={16} />}
              {t("detail.contact")}
            </a>
          ) : (
            <a
              href={`/${locale}/contacte?title=${encodeURIComponent(space.title)}&address=${encodeURIComponent(space.address ?? space.city ?? '')}`}
              data-variant="primary"
            >
              <Icon name="mail" size={16} />
              {t("detail.contact")}
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
              <span className="detail__action-label">
                {t("detail.location")}
              </span>
            </a>
          )}

          <button type="button" data-variant="ghost" onClick={handleShare}>
            <Icon name="share" size={16} />
            <span className="detail__action-label">{t("detail.share")}</span>
          </button>
        </div>

        {/* ── Reviews ── */}
        <section className="reviews">
          <h3 className="reviews__title">{t("review.title")}</h3>

          {reviewsLoaded && reviews.length === 0 && (
            <p className="reviews__empty">{t("review.noReviews")}</p>
          )}

          {reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-item__head">
                <span className="review-item__author">{r.authorEmail}</span>
                <StarRating value={r.rating} />
              </div>
              {r.body && <p className="review-item__body">{r.body}</p>}
            </div>
          ))}

          {/* Review form */}
          {!!currentUserId && userRating === null && (
            <form onSubmit={handleReviewSubmit} className="review-form">
              <p className="reviews__title" style={{ fontSize: "var(--t-sm)" }}>
                {t("review.add")}
              </p>
              <StarRating value={newRating} onChange={setNewRating} />
              <textarea
                className="field__input field__textarea"
                rows={3}
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder={t("review.bodyPlaceholder")}
              />
              {reviewError && <p className="reviews__error">{reviewError}</p>}
              <button
                type="submit"
                data-variant="primary"
                disabled={submitting}
                style={{ alignSelf: "flex-start" }}
              >
                {submitting ? t("review.submitting") : t("review.submit")}
              </button>
            </form>
          )}

          {!!currentUserId && userRating !== null && (
            <p
              className="reviews__empty"
              style={{ color: "var(--primary-ink)" }}
            >
              {t("review.alreadyReviewed")} <StarRating value={userRating} />
            </p>
          )}

          {!!!currentUserId && (
            <p className="reviews__empty">
              {t("review.loginRequired")}{" "}
              <button
                type="button"
                className="reviews__login-link"
                onClick={() => window.dispatchEvent(new CustomEvent("open-auth-modal"))}
              >
                {t("review.loginLink")}
              </button>
            </p>
          )}
        </section>
      </div>
    </Wrapper>
  );
}
