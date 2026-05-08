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

        {/* LOGO */}
        <section className="ds__section mt-8">
          <h2>Logo / Branding</h2>
          <div className="ds__logo-box p-4" style={{ background: 'var(--bg)', display: 'inline-flex', padding: 'var(--s-4)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <a className="topnav__brand" href="/" aria-label="somespai" style={{ pointerEvents: 'none' }}>
              <svg className="topnav__brand-mark" width="34" height="34" viewBox="0 0 103 103" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect width="102.813" height="102.813" rx="51.4065" fill="var(--primary)"></rect>
                <path d="M23.4217 70.6662C22.0036 70.6662 20.9078 70.2795 20.1344 69.506C19.3867 68.7583 19.0128 67.6754 19.0128 66.2574V36.5557C19.0128 35.1376 19.3867 34.0548 20.1344 33.3071C20.9078 32.5336 22.0036 32.1469 23.4217 32.1469H29.5322V35.7435H24.1178C23.2927 35.7435 22.8802 36.1561 22.8802 36.9811V65.7546C22.8802 66.5796 23.2927 66.9922 24.1178 66.9922H29.5322V70.6662H23.4217Z" fill="var(--primary-ink)"></path>
                <path d="M73.281 70.6662V66.9922H78.6953C79.5204 66.9922 79.9329 66.5796 79.9329 65.7546V36.9811C79.9329 36.1561 79.5204 35.7435 78.6953 35.7435H73.281V32.1469H79.3915C80.8095 32.1469 81.8924 32.5336 82.6401 33.3071C83.4136 34.0548 83.8003 35.1376 83.8003 36.5557V66.2574C83.8003 67.6754 83.4136 68.7583 82.6401 69.506C81.8924 70.2795 80.8095 70.6662 79.3915 70.6662H73.281Z" fill="var(--primary-ink)"></path>
              </svg>
              <span>somespai</span>
              <em>beta</em>
            </a>
          </div>
        </section>

        {/* COLORS */}
        <section className="ds__section mt-8">
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
        <section className="ds__section mt-8">
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

        {/* TYPES & CHIPS */}
        <section className="ds__section mt-8">
          <h2>Types & Filter Chips</h2>
          <div style={{ display: 'flex', gap: 'var(--s-3)', flexWrap: 'wrap', marginBottom: 'var(--s-4)' }}>
            <span className="chip" aria-pressed={false}>Tots</span>
            <span className="chip" aria-pressed={true}>Tots (active)</span>

            <span className="chip" data-type="workspace">
              <span className="chip__icon" style={{ color: 'var(--type-workspace)' }}><Icon name="workspace" size={16} /></span>
              <span>Estudis</span>
            </span>

            <span className="chip" data-type="garden">
              <span className="chip__icon" style={{ color: 'var(--type-garden)' }}><Icon name="garden" size={16} /></span>
              <span>Jardins</span>
            </span>

             <span className="chip" data-type="room">
              <span className="chip__icon" style={{ color: 'var(--type-room)' }}><Icon name="room" size={16} /></span>
              <span>Sales</span>
            </span>

             <span className="chip" data-type="storage">
              <span className="chip__icon" style={{ color: 'var(--type-storage)' }}><Icon name="storage" size={16} /></span>
              <span>Trasters</span>
            </span>

            <span className="chip" data-type="parking">
              <span className="chip__icon" style={{ color: 'var(--type-parking)' }}><Icon name="parking" size={16} /></span>
              <span>Pàrquings</span>
            </span>

             <span className="chip" data-type="featured">
              <span className="chip__icon" style={{ color: 'var(--type-featured)' }}><Icon name="star" size={16} /></span>
              <span>Destacats</span>
            </span>
          </div>

          <div className="ds__grid">
              {['workspace', 'garden', 'storage', 'room', 'parking', 'featured'].map((type) => (
                <div key={type} style={{
                    background: `var(--type-${type})`,
                    color: '#fff',
                    padding: 'var(--s-4)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    <strong style={{ textTransform: 'capitalize' }}>{type}</strong>
                    <div style={{ display: 'flex', gap: 8 }}>
                       <span style={{background: `var(--type-${type}-soft)`, padding: 4, borderRadius: 2, fontSize: '0.8rem'}}>soft</span>
                       <span style={{background: `var(--type-${type}-tint)`, color: '#000', padding: 4, borderRadius: 2, fontSize: '0.8rem'}}>tint</span>
                    </div>
                </div>
              ))}
          </div>
        </section>

        {/* BUTTONS */}
        <section className="ds__section mt-8">
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

        {/* CARDS */}
        <section className="ds__section mt-8">
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
        <section className="ds__section mt-8">
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
            <MarkerDemo type="storage" price="75" />
            <MarkerDemo type="garden" price="120" featured />
            <MarkerDemo type="workspace" price="180" active />
            <MarkerDemo type="room" price="220" />
            <MarkerDemo type="parking" price="100" />
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
  type: 'storage' | 'workspace' | 'garden' | 'room' | 'parking';
  price: string;
  active?: boolean;
  featured?: boolean;
}) {
  return (
    <div className="marker" data-type={type} data-active={!!active} data-featured={!!featured} style={{ position: 'static', transform: 'none' }}>
      <div className="marker__pin">
        <span className="marker__icon">
          <Icon name={type} size={14} />
        </span>
        <span>{price}€/mes</span>
      </div>
    </div>
  );
}
