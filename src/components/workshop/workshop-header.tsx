import { getBrand, getSomespaiUrl } from '@/lib/brand';
import { NavMenu } from '@/components/ui/nav-menu';
import { WorkshopBrandMark } from './workshop-brand-mark';

const copy = {
  ca: {
    publish: 'Publica un taller',
    promo: 'Necessites un local o sala per hores per impartir la teva activitat?',
    cta: 'Troba espais a Somespai',
  },
  es: {
    publish: 'Publica un taller',
    promo: '¿Necesitas un local o sala por horas para impartir tu actividad?',
    cta: 'Encuentra espacios en Somespai',
  },
  en: {
    publish: 'List a workshop',
    promo: 'Need a venue or room by the hour for your activity?',
    cta: 'Find spaces on Somespai',
  },
} as const;

export function WorkshopHeader({ locale }: { locale: string }) {
  const brand = getBrand();
  const somespaiUrl = getSomespaiUrl();
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const localePrefix = locale === 'ca' ? '' : `/${locale}`;

  return (
    <>
      <header className="topnav topnav--page glass">
        <a className="topnav__brand" href={`${localePrefix}/`} aria-label={brand.name}>
          <WorkshopBrandMark />
          <span>{brand.name}</span>
          <em>beta</em>
        </a>
        <div className="topnav__actions">
          <a className="btn-publish" href={`${localePrefix}/publicar-taller`}>
            {text.publish}
          </a>
          <NavMenu workshops />
        </div>
      </header>
      <aside className="workshop-promo">
        <span>{text.promo}</span>{' '}
        <a href={somespaiUrl} target="_blank" rel="noreferrer">
          {text.cta} <span aria-hidden="true">↗</span>
        </a>
      </aside>
    </>
  );
}
