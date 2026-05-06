'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/routing';
import { Icon } from '@/components/ui/icon';
import { PageNav } from '@/components/ui/page-nav';
import { SpaceCard } from '@/components/space/space-card';
import { MOCK_SPACES } from '@/lib/data/mock-spaces';

const COLOR_TOKENS: Array<{ name: string; varName: string; ink: string }> = [
  { name: 'bg', varName: '--bg', ink: 'var(--ink)' },
  { name: 'bg-soft', varName: '--bg-soft', ink: 'var(--ink)' },
  { name: 'bg-deep', varName: '--bg-deep', ink: 'var(--ink)' },
  { name: 'ink', varName: '--ink', ink: 'var(--bg)' },
  { name: 'ink-soft', varName: '--ink-soft', ink: 'var(--bg)' },
  { name: 'ink-mute', varName: '--ink-mute', ink: 'var(--bg)' },
  { name: 'primary', varName: '--primary', ink: 'var(--bg)' },
  { name: 'primary-soft', varName: '--primary-soft', ink: 'var(--bg)' },
  { name: 'primary-tint', varName: '--primary-tint', ink: 'var(--ink)' },
  { name: 'accent', varName: '--accent', ink: 'var(--bg)' },
  { name: 'accent-soft', varName: '--accent-soft', ink: 'var(--ink)' },
  { name: 'gold', varName: '--gold', ink: 'var(--bg)' },
];

const TYPE_SCALE = [
  { token: '3xl', size: '2.5rem', sample: 'Vila de Gràcia espera' },
  { token: '2xl', size: '2rem', sample: 'Trasters i jardins' },
  { token: 'xl', size: '1.5rem', sample: 'Sala del Diamant' },
  { token: 'lg', size: '1.1875rem', sample: 'Lloga el teu espai en minuts' },
  { token: 'base', size: '1rem', sample: 'El paràgraf cau aquí amb naturalitat.' },
  { token: 'sm', size: '0.875rem', sample: 'Metadades, etiquetes secundàries.' },
];

export default function DesignSystemPage() {
  const t = useTranslations();
  const [likedDemo, setLikedDemo] = useState(false);
  const sampleSpace = MOCK_SPACES[2]; // jardí glicines

  return (
    <>
    <PageNav />
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="ds">
        <Link href="/" className="ds__back">
          <Icon name="arrowLeft" size={16} />
          {t('view.back')}
        </Link>

        <h1 className="ds__title">{t('ds.title')}</h1>
        <p className="ds__lead">{t('ds.lead')}</p>

        {/* COLORS */}
        <section className="ds__section">
          <h2>{t('ds.section.colors')}</h2>
          <div className="ds__grid">
            {COLOR_TOKENS.map((c) => (
              <div
                key={c.name}
                className="ds__swatch"
                style={{ background: `var(${c.varName})`, color: c.ink }}
              >
                <span className="ds__swatch-name">{c.name}</span>
                <span className="ds__swatch-val">{c.varName}</span>
              </div>
            ))}
          </div>
        </section>

        {/* TYPOGRAPHY */}
        <section className="ds__section">
          <h2>{t('ds.section.typography')}</h2>
          <div className="ds__type-block">
            {TYPE_SCALE.map((t) => (
              <div className="ds__type-row" key={t.token}>
                <span className="ds__type-meta">--t-{t.token}</span>
                <span
                  style={{
                    fontFamily: 'var(--font)',
                    fontVariationSettings: ['3xl', '2xl', 'xl'].includes(t.token)
                      ? 'var(--rx-casual)'
                      : 'var(--rx-sans)',
                    fontSize: t.size,
                    fontWeight: ['3xl', '2xl', 'xl'].includes(t.token) ? 700 : 400,
                    color: 'var(--ink)',
                  }}
                >
                  {t.sample}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* BUTTONS */}
        <section className="ds__section">
          <h2>{t('ds.section.buttons')}</h2>
          <div className="ds__row">
            <button type="button" data-variant="primary">
              {t('detail.contact')}
            </button>
            <button type="button" data-variant="ghost">
              <Icon name="share" size={16} />
              {t('detail.share')}
            </button>
            <button type="button" data-variant="subtle">
              {t('nav.publish')}
            </button>
            <button type="button" data-variant="primary" disabled>
              Disabled
            </button>
          </div>
        </section>

        {/* CHIPS */}
        <section className="ds__section">
          <h2>{t('ds.section.chips')}</h2>
          <div className="ds__row">
            <button type="button" className="chip" aria-pressed={false}>
              {t('filter.all')}
            </button>
            <button type="button" className="chip" aria-pressed>
              <Icon name="storage" size={16} />
              {t('filter.storage')}
            </button>
            <button type="button" className="chip" aria-pressed={false}>
              <Icon name="garden" size={16} />
              {t('filter.garden')}
            </button>
            <button type="button" className="chip" aria-pressed={false}>
              <Icon name="star" size={16} />
              {t('filter.featured')}
            </button>
          </div>
        </section>

        {/* CARDS */}
        <section className="ds__section">
          <h2>{t('ds.section.cards')}</h2>
          <div style={{ maxWidth: 320 }}>
            <SpaceCard
              space={sampleSpace}
              liked={likedDemo}
              onSelect={() => {}}
              onToggleLike={() => setLikedDemo((v) => !v)}
            />
          </div>
        </section>

        {/* MARKERS */}
        <section className="ds__section">
          <h2>{t('ds.section.markers')}</h2>
          <div
            className="ds__row"
            style={{
              background: 'linear-gradient(135deg, #c8d8b3 0%, #8aa66f 100%)',
              padding: 'var(--s-7)',
              minHeight: 200,
              gap: 'var(--s-5)',
              alignItems: 'flex-end',
            }}
          >
            <MarkerDemo type="storage" price={75} />
            <MarkerDemo type="garden" price={120} featured />
            <MarkerDemo type="workspace" price={180} active />
            <MarkerDemo type="room" price={220} />
          </div>
        </section>
      </div>
    </div>
    </>
  );
}

function MarkerDemo({
  type,
  price,
  active,
  featured,
}: {
  type: 'storage' | 'workspace' | 'garden' | 'room';
  price: number;
  active?: boolean;
  featured?: boolean;
}) {
  return (
    <div className="marker" data-active={!!active} data-featured={!!featured} style={{ position: 'static', transform: 'none' }}>
      <div className="marker__pin">
        <span className="marker__icon">
          <Icon name={type} size={14} />
        </span>
        <span>{price}€</span>
      </div>
    </div>
  );
}
