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

        <section className="ds__section mt-8">
          <h2>Logo / Branding</h2>
          <div className="ds__logo-box p-4" style={{ background: 'var(--bg-soft)', display: 'inline-flex', padding: 'var(--s-4)', borderRadius: 'var(--r-md)' }}>
             <svg width="180" height="auto" viewBox="0 0 168 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.84 27.24C22.84 28.52 22.12 29.56 20.88 30.12C19.56 30.72 17.6 31.04 15.08 31.04C12.44 31.04 10.36 30.68 9.08 29.84C7.8 29 7.16 27.84 7.16 26.36C7.16 23.36 10.48 21.08 17.08 19.48L17.2 19.44C19.92 18.8 21.28 17.92 21.28 16.76C21.28 15.76 20.76 14.96 19.64 14.4C18.6 13.88 17.2 13.6 15.36 13.6C13.56 13.6 12 13.84 10.76 14.28C9.56 14.68 8.92 15.32 8.92 16.12C8.92 16.72 9.24 17.2 9.88 17.6C10.56 18.04 11.52 18.28 12.84 18.36L12.56 20.36C10.52 20.24 8.76 19.76 7.4 18.96C6.04 18.16 5.36 17.08 5.36 15.68C5.36 14.04 6.2 12.8 7.76 11.96C9.36 11.16 11.8 10.72 15 10.72C18.36 10.72 20.96 11.12 22.8 11.88C24.4 12.64 25.16 13.8 25.16 15.28C25.16 18 21.84 20.12 15.4 21.72L15.16 21.8C12.52 22.44 11.16 23.32 11.16 24.36C11.16 25.36 11.76 26.2 12.92 26.8C14.12 27.4 15.76 27.68 17.84 27.68C20 27.68 21.52 27.44 22.28 26.96C22.68 26.68 22.84 26.32 22.84 25.88C22.84 25.56 22.72 25.24 22.48 24.96C22.28 24.72 21.84 24.44 21.2 24.16L22.24 22.68C23.36 23.12 24.28 23.64 24.96 24.36C25.68 25.08 26.04 25.84 26.04 26.64H22.84V27.24ZM35.4187 31.04C32.7387 31.04 30.6587 30.56 29.0587 29.6C27.4587 28.64 26.6587 27.24 26.6587 25.32C26.6587 23.4 27.4587 22.04 29.0587 21.12C30.6587 20.2 32.7387 19.72 35.4187 19.72C38.0587 19.72 40.0987 20.2 41.7387 21.12C43.3787 22.04 44.1787 23.4 44.1787 25.32C44.1787 27.24 43.3787 28.64 41.7787 29.6C40.1787 30.56 38.0587 31.04 35.4187 31.04ZM35.4187 28.64C36.9387 28.64 38.0587 28.4 38.8187 27.88C39.5787 27.36 39.9387 26.56 39.9387 25.44C39.9387 24.28 39.5787 23.48 38.8187 22.96C38.0587 22.4 36.9387 22.12 35.4187 22.12C33.8987 22.12 32.7387 22.4 31.9387 22.96C31.1787 23.48 30.7787 24.28 30.7787 25.44C30.7787 26.56 31.1787 27.36 31.9387 27.88C32.7387 28.4 33.8987 28.64 35.4187 28.64ZM63.7915 23.2V30.84H60.0315V22.92C60.0315 21.72 59.8315 20.84 59.3915 20.28C58.9915 19.76 58.2715 19.48 57.1915 19.48C56.2715 19.48 55.5115 19.72 54.9115 20.16C54.3115 20.6 53.8315 21.4 53.4715 22.6V30.84H49.7515V22.92C49.7515 21.72 49.5515 20.84 49.1115 20.28C48.7115 19.76 47.9515 19.48 46.8715 19.48C45.9115 19.48 45.1115 19.76 44.5115 20.28C43.9115 20.8 43.5115 21.56 43.3115 22.6V30.84H39.5515V20H43.3115V20.32C43.9115 19.8 44.5915 19.44 45.3915 19.16C46.1915 18.88 47.0315 18.76 47.8715 18.76C48.9115 18.76 49.7915 18.96 50.4715 19.4C51.1515 19.8 51.6315 20.36 51.9115 21.08C52.4315 20.4 53.0715 19.88 53.8715 19.48C54.6715 19.04 55.6315 18.84 56.7115 18.84C58.4715 18.84 59.8315 19.32 60.7915 20.28C61.7515 21.2 62.2315 22.44 62.2315 24V23.2H63.7915ZM68.2104 26.6C68.2104 27.52 68.6104 28.16 69.3704 28.52C70.1304 28.84 71.3704 29 73.0904 29H77.1304V30.84H65.8104V26.2H68.2104V26.6ZM78.0104 24.36H67.0904C67.1704 23.16 67.5704 22.28 68.2904 21.72C69.0104 21.16 70.0504 20.88 71.4104 20.88H73.0104C74.4504 20.88 75.5304 21.16 76.2904 21.76C77.0504 22.36 77.4904 23.24 77.6504 24.36H78.0104ZM74.5704 23.08C74.5704 22.44 74.0504 22.12 73.0104 22.12H71.4104C70.4104 22.12 69.8904 22.44 69.8904 23.08H74.5704ZM92.1795 27.24C92.1795 28.52 91.4595 29.56 90.2195 30.12C88.8995 30.72 86.9395 31.04 84.4195 31.04C81.7795 31.04 79.6995 30.68 78.4195 29.84C77.1395 29 76.4995 27.84 76.4995 26.36C76.4995 23.36 79.8195 21.08 86.4195 19.48L86.5395 19.44C89.2595 18.8 90.6195 17.92 90.6195 16.76C90.6195 15.76 90.0995 14.96 88.9795 14.4C87.9395 13.88 86.5395 13.6 84.6995 13.6C82.8995 13.6 81.3395 13.84 80.0995 14.28C78.8995 14.68 78.2595 15.32 78.2595 16.12C78.2595 16.72 78.5795 17.2 79.2195 17.6C79.8995 18.04 80.8595 18.28 82.1795 18.36L81.8995 20.36C79.8595 20.24 78.0995 19.76 76.7395 18.96C75.3795 18.16 74.6995 17.08 74.6995 15.68C74.6995 14.04 75.5395 12.8 77.0995 11.96C78.6995 11.16 81.1395 10.72 84.3395 10.72C87.6995 10.72 90.2995 11.12 92.1395 11.88C93.7395 12.64 94.4995 13.8 94.4995 15.28C94.4995 18 91.1795 20.12 84.7395 21.72L84.4995 21.8C81.8595 22.44 80.4995 23.32 80.4995 24.36C80.4995 25.36 81.0995 26.2 82.2595 26.8C83.4595 27.4 85.0995 27.68 87.1795 27.68C89.3395 27.68 90.8595 27.44 91.6195 26.96C92.0195 26.68 92.1795 26.32 92.1795 25.88C92.1795 25.56 92.0595 25.24 91.8195 24.96C91.6195 24.72 91.1795 24.44 90.5395 24.16L91.5795 22.68C92.6995 23.12 93.6195 23.64 94.2995 24.36C95.0195 25.08 95.3795 25.84 95.3795 26.64H92.1795V27.24ZM109.117 21C109.117 22.48 108.677 23.64 107.837 24.52C106.997 25.36 105.757 25.84 104.157 26.04V32.96H100.357V20H104.357C105.957 20 107.157 20.16 107.957 20.48C108.717 20.8 109.117 21.2 109.117 21.72V21ZM105.117 23.96C105.117 23.56 104.837 23.24 104.317 23.08C103.797 22.92 102.917 22.84 101.597 22.84V24.56C102.437 24.52 103.197 24.44 103.877 24.28C104.677 24.12 105.117 23.8 105.117 23.36V23.96ZM123.655 31.04C121.735 31.04 120.255 30.6 119.255 29.72C118.295 28.84 117.815 27.68 117.815 26.32C117.815 25.24 118.175 24.36 118.895 23.68C119.615 22.96 120.735 22.28 122.255 21.68V21.6C121.055 21 120.215 20.48 119.695 19.92C119.175 19.4 118.935 18.72 118.935 17.88C118.935 16.76 119.455 15.84 120.495 15.12C121.575 14.36 122.935 14 124.575 14C126.175 14 127.455 14.4 128.455 15.2C129.455 16 129.935 16.88 129.935 17.92C129.935 18.76 129.695 19.48 129.215 20.08C128.775 20.64 127.895 21.2 126.615 21.72V21.84C128.055 22.4 129.175 22.96 129.735 23.6C130.335 24.2 130.655 24.96 130.655 25.88C130.655 27.32 130.015 28.56 128.735 29.56C127.495 30.56 125.775 31.04 123.655 31.04ZM122.295 18.92V20.28C123.335 20.08 124.135 19.8 124.775 19.36C125.415 18.88 125.735 18.4 125.735 17.88C125.735 17.36 125.295 16.92 124.495 16.52C123.695 16.12 122.575 15.92 121.135 15.92V17.32C121.855 17.36 122.255 17.64 122.255 18.16V18.92ZM126.535 26.12V24.52C125.135 24.64 124.135 24.92 123.495 25.44C122.855 25.96 122.535 26.56 122.535 27.24C122.535 27.64 123.015 28.08 123.975 28.6C124.975 29.12 126.335 29.36 128.055 29.36V27.48C127.175 27.44 126.655 26.96 126.535 26.12ZM138.837 13.92V17H135.037V13.92H138.837ZM138.837 20V30.84H135.037V20H138.837Z" fill="var(--ink)"/>
              <path d="M141.777 30L150.267 15.3402C150.597 14.7725 150.941 14.1794 151.301 13.5608H151.461C151.461 14.28 151.421 14.9392 151.341 15.5381V30H154.541V8.6H151.781L143.141 23.468C142.821 24.0272 142.481 24.6203 142.121 25.2469H141.961C141.961 24.5276 142.001 23.8684 142.081 23.2694V8.6H138.881V30H141.777Z" fill="var(--accent)"/>
              <path d="M161.421 25.1091V28.271H158.461V22.2575L160.053 23.8559C161.644 25.4418 163.535 26.2348 165.726 26.2348C167.382 26.2348 168.026 26.1549 167.658 25.9951H163.155L161.421 25.1091Z" fill="var(--primary)"/>
              <path d="M167.893 25.9985C167.525 26.1583 166.726 26.2448 164.887 26.2448C161.241 26.2448 158.461 24.7677 158.461 21.057V12.7212L161.421 9.48914V17.0723H162.772V14.1566H166.177C166.177 14.1566 168.614 14.6197 167.893 16.9942C167.172 19.3688 165.578 20.3015 163.858 20.2282H161.421V21.1302C161.421 22.8402 162.593 23.5858 164.939 23.5858C166.637 23.5858 168.156 22.8934 169.502 21.5087L167.893 25.9985Z" fill="var(--gold)"/>
            </svg>
          </div>
        </section>

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
