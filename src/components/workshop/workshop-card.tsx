import type { Workshop } from '@/types/workshop';
import { getWorkshopCategoryLabel } from '@/lib/data/workshop-categories';

export function WorkshopCard({
  workshop,
  locale,
}: {
  workshop: Workshop;
  locale: string;
}) {
  const label = getWorkshopCategoryLabel(workshop.category, locale);
  const session = workshop.sessions.find((item) => item.status === 'scheduled');
  const date = session
    ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(
        new Date(session.startTime),
      )
    : null;

  return (
    <article className="workshop-card">
      <div className="workshop-card__category">{label}</div>
      <h2>
        <a href={`${locale === 'ca' ? '' : `/${locale}`}/taller/${encodeURIComponent(workshop.slug)}`}>
          {workshop.title}
        </a>
      </h2>
      <p className="workshop-card__location">
        {[workshop.address, workshop.city].filter(Boolean).join(', ') || 'Barcelona'}
      </p>
      {workshop.description && <p className="workshop-card__description">{workshop.description}</p>}
      <div className="workshop-card__meta">
        {date && <span>{date}</span>}
        <strong>
          {workshop.price === null
            ? locale === 'en'
              ? 'Contact for price'
              : locale === 'es'
                ? 'Consultar precio'
                : 'Preu a consultar'
            : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(workshop.price)}
        </strong>
      </div>
    </article>
  );
}
