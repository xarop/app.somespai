import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Icon, type IconName } from '@/components/ui/icon';
import { PageNav } from '@/components/ui/page-nav';
import type { SpaceType } from '@/lib/schemas/space';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: `${t('help.title')} — coslot`,
    description: t('help.subtitle'),
  };
}

const TYPES: ReadonlyArray<{ id: SpaceType; iconName: IconName }> = [
  { id: 'workspace', iconName: 'workspace' },
  { id: 'garden',    iconName: 'garden'    },
  { id: 'room',      iconName: 'room'      },
  { id: 'storage',   iconName: 'storage'   },
  { id: 'parking',   iconName: 'parking'   },
];

const TYPE_COLORS: Record<SpaceType, { tint: string; main: string }> = {
  workspace: { tint: 'var(--type-workspace-tint)', main: 'var(--type-workspace)' },
  garden:    { tint: 'var(--type-garden-tint)',    main: 'var(--type-garden)'    },
  storage:   { tint: 'var(--type-storage-tint)',   main: 'var(--type-storage)'   },
  room:      { tint: 'var(--type-room-tint)',       main: 'var(--type-room)'      },
  parking:   { tint: 'var(--type-parking-tint)',   main: 'var(--type-parking)'   },
};

export default async function AjudaPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('help');
  const ti = await getTranslations('typeInfo');

  const features = [
    { icon: 'heart' as const, title: t('feature1Title'), body: t('feature1Body') },
    { icon: 'more'  as const, title: t('feature2Title'), body: t('feature2Body') },
    { icon: 'star'  as const, title: t('feature3Title'), body: t('feature3Body') },
    { icon: 'user'  as const, title: t('feature4Title'), body: t('feature4Body') },
  ];

  const steps = [
    {
      num: '01',
      icon: 'map' as const,
      title: t('step1Title'),
      body: t('step1Body'),
    },
    {
      num: '02',
      icon: 'search' as const,
      title: t('step2Title'),
      body: t('step2Body'),
    },
    {
      num: '03',
      icon: 'info' as const,
      title: t('step3Title'),
      body: t('step3Body'),
    },
    {
      num: '04',
      icon: 'pencil' as const,
      title: t('step4Title'),
      body: t('step4Body'),
    },
  ];

  return (
    <>
    <PageNav />
    <div className="page-form">
      <div className="page-form__inner page-form__inner--wide">

        <header className="page-form__header">
          <a href={`/${locale}`} className="page-form__back">← {t('back')}</a>
          <h1>{t('title')}</h1>
          <p className="page-form__subtitle">{t('intro')}</p>
        </header>

        {/* Steps */}
        <ol className="help-steps">
          {steps.map((step) => (
            <li key={step.num} className="help-step">
              <div className="help-step__num" aria-hidden="true">{step.num}</div>
              <div className="help-step__icon" aria-hidden="true">
                <Icon name={step.icon} size={22} />
              </div>
              <div className="help-step__content">
                <h2 className="help-step__title">{step.title}</h2>
                <p className="help-step__body">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        {/* Space types */}
        <section className="help-types">
          <h2 className="help-types__title" id="typeinfo-title">{ti('title')}</h2>
          <ul className="help-types__list">
            {TYPES.map(({ id, iconName }) => (
              <li key={id} className="help-type-item" style={{
                background: TYPE_COLORS[id].tint,
                border: `1px solid ${TYPE_COLORS[id].main}40`,
              }}>
                <span className="help-type-item__icon" style={{ background: TYPE_COLORS[id].main }}>
                  <Icon name={iconName} size={22} />
                </span>
                <div>
                  <p className="help-type-item__label">{ti(`${id}.label`)}</p>
                  <p className="help-type-item__desc">{ti(`${id}.desc`)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Device mockups */}
        <section className="help-devices">
          {/* Mobile */}
          <div className="help-device-block">
            <h3 className="help-device-block__label">{t('mobileTitle')}</h3>
            <div className="help-mock help-mock--mobile" aria-hidden="true">
              {/* Topnav */}
              <div className="help-mock__nav">
                <div className="help-mock__logo" />
                <div className="help-mock__search-bar" />
                <div className="help-mock__avatar" />
              </div>
              {/* Filters */}
              <div className="help-mock__filterbar">
                <span className="help-mock__chip help-mock__chip--active" />
                <span className="help-mock__chip" />
                <span className="help-mock__chip" />
                <span className="help-mock__chip" />
              </div>
              {/* Map */}
              <div className="help-mock__map">
                <div className="help-mock__map-bg" />
                <span className="help-mock__pin" style={{ top: '28%', left: '42%' }} />
                <span className="help-mock__pin help-mock__pin--active" style={{ top: '48%', left: '62%' }} />
                <span className="help-mock__pin" style={{ top: '66%', left: '33%' }} />
              </div>
              {/* Floating button */}
              <div className="help-mock__toggle">≡ Llista</div>
            </div>
            <p className="help-device-block__desc">{t('mobileDesc')}</p>
          </div>

          {/* Desktop */}
          <div className="help-device-block">
            <h3 className="help-device-block__label">{t('desktopTitle')}</h3>
            <div className="help-mock help-mock--desktop" aria-hidden="true">
              {/* Topnav */}
              <div className="help-mock__nav help-mock__nav--wide">
                <div className="help-mock__logo" />
                <div className="help-mock__search-bar" />
                <div className="help-mock__publish" />
                <div className="help-mock__avatar" />
              </div>
              {/* Filters wide */}
              <div className="help-mock__filterbar help-mock__filterbar--wide">
                <span className="help-mock__chip help-mock__chip--active" />
                <span className="help-mock__chip" />
                <span className="help-mock__chip" />
                <span className="help-mock__chip" />
              </div>
              {/* Body: map + sidebar */}
              <div className="help-mock__body">
                <div className="help-mock__map help-mock__map--wide">
                  <div className="help-mock__map-bg" />
                  <span className="help-mock__pin" style={{ top: '35%', left: '35%' }} />
                  <span className="help-mock__pin help-mock__pin--active" style={{ top: '55%', left: '55%' }} />
                  <span className="help-mock__pin" style={{ top: '70%', left: '25%' }} />
                </div>
                <div className="help-mock__sidebar">
                  <div className="help-mock__card" />
                  <div className="help-mock__card" />
                  <div className="help-mock__card" />
                </div>
              </div>
            </div>
            <p className="help-device-block__desc">{t('desktopDesc')}</p>
          </div>
        </section>

        {/* Features */}
        <section className="help-features">
          <h2 className="help-features__title">{t('featuresTitle')}</h2>
          <div className="help-features__grid">
            {features.map((f) => (
              <div key={f.title} className="help-feature-item">
                <div className="help-feature-item__icon" aria-hidden="true">
                  <Icon name={f.icon} size={18} />
                </div>
                <div>
                  <p className="help-feature-item__title">{f.title}</p>
                  <p className="help-feature-item__body">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="help-cta">
          <a href={`/${locale}`} className="btn-primary">{t('ctaExplore')}</a>
          <a href={`/${locale}/publica`} className="btn-secondary">{t('ctaPublish')}</a>
        </div>

        {/* Contact prompt */}
        <p className="help-contact-prompt">
          {t('contactPrompt')}{' '}
          <a href={`/${locale}/contacte`}>{t('contactLink')}</a>
        </p>

      </div>
    </div>
    </>
  );
}
