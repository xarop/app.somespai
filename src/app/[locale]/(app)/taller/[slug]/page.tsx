import { notFound } from 'next/navigation';
import { getBrand, getSomespaiUrl } from '@/lib/brand';
import { getWorkshopCategoryLabel } from '@/lib/data/workshop-categories';
import { getWorkshopBySlug } from '@/lib/supabase/workshops';
import { WorkshopHeader } from '@/components/workshop/workshop-header';

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

const copy = {
  ca: { sessions: 'Properes sessions', location: 'On es fa', duration: 'Durada', capacity: 'Places', contact: 'Contacta amb el tallerista', web: 'Més informació', seats: 'places disponibles', space: 'Impartit a', viewSpace: 'Veure espai a Somespai' },
  es: { sessions: 'Próximas sesiones', location: 'Dónde se hace', duration: 'Duración', capacity: 'Plazas', contact: 'Contacta con el tallerista', web: 'Más información', seats: 'plazas disponibles', space: 'Impartido en', viewSpace: 'Ver espacio en Somespai' },
  en: { sessions: 'Upcoming sessions', location: 'Location', duration: 'Duration', capacity: 'Places', contact: 'Contact the organizer', web: 'More information', seats: 'seats available', space: 'Hosted at', viewSpace: 'View space on Somespai' },
} as const;

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

function webHref(url: string) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug } = await params;
  const [workshop, brand] = await Promise.all([getWorkshopBySlug(slug), getBrand()]);
  if (!workshop) return {};
  const title = `${workshop.title} · ${brand.name}`;
  const description = workshop.description?.slice(0, 160) ?? brand.tagline;
  return {
    title,
    description,
    alternates: {
      canonical: `${brand.domain}${locale === 'ca' ? '' : `/${locale}`}/taller/${encodeURIComponent(slug)}`,
    },
    openGraph: { title, description, type: 'article' },
  };
}

export default async function WorkshopDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const [workshop, brand] = await Promise.all([getWorkshopBySlug(slug), getBrand()]);
  if (!workshop) notFound();

  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const localePrefix = locale === 'ca' ? '' : `/${locale}`;
  const somespaiUrl = getSomespaiUrl();
  const sessions = workshop.sessions
    .filter((session) => session.status === 'scheduled' && new Date(session.startTime) >= new Date())
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
  const whatsapp = workshop.contactWhatsapp ? whatsappHref(workshop.contactWhatsapp) : null;

  return (
    <main className="workshop-detail-page">
      <WorkshopHeader locale={locale} />
      <article className="workshop-detail">
        <a className="workshop-back" href={`${localePrefix}/`}>← {brand.name}</a>
        <p className="workshop-card__category">{getWorkshopCategoryLabel(workshop.category, locale)}</p>
        <h1>{workshop.title}</h1>
        <p className="workshop-detail__location">
          {[workshop.address, workshop.city].filter(Boolean).join(', ') || 'Barcelona'}
        </p>
        {workshop.description && <p className="workshop-detail__description">{workshop.description}</p>}
        <div className="workshop-detail__facts">
          {workshop.durationMinutes && <span>{text.duration}: {workshop.durationMinutes} min</span>}
          {workshop.maxCapacity && <span>{text.capacity}: {workshop.maxCapacity}</span>}
          <strong>
            {workshop.price === null
              ? locale === 'en' ? 'Contact for price' : locale === 'es' ? 'Consultar precio' : 'Preu a consultar'
              : new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(workshop.price)}
          </strong>
        </div>

        <section className="workshop-detail__section">
          <h2>{text.sessions}</h2>
          {sessions.length ? (
            <ul className="workshop-sessions">
              {sessions.map((session) => (
                <li key={session.id}>
                  <time dateTime={session.startTime}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(session.startTime))}
                  </time>
                  <span>{new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'Europe/Madrid' }).format(new Date(session.endTime))}</span>
                  {session.availableSeats !== null && <small>{session.availableSeats} {text.seats}</small>}
                </li>
              ))}
            </ul>
          ) : (
            <p>{locale === 'en' ? 'No dates scheduled yet.' : locale === 'es' ? 'Todavía no hay fechas programadas.' : 'Encara no hi ha dates programades.'}</p>
          )}
        </section>

        {(workshop.contactName || workshop.contactPhone || workshop.contactEmail || whatsapp || workshop.contactUrl) && (
          <section className="workshop-detail__section">
            <h2>{text.contact}</h2>
            {workshop.contactName && <p>{workshop.contactName}</p>}
            <div className="workshop-contact-links">
              {whatsapp && <a className="workshop-button workshop-button--primary" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
              {workshop.contactEmail && <a className="workshop-button" href={`mailto:${workshop.contactEmail}`}>Email</a>}
              {workshop.contactPhone && <a className="workshop-button" href={phoneHref(workshop.contactPhone)}>{workshop.contactPhone}</a>}
              {workshop.contactUrl && <a className="workshop-button" href={webHref(workshop.contactUrl)} target="_blank" rel="noreferrer">{text.web}</a>}
            </div>
          </section>
        )}

        {workshop.space && (
          <aside className="workshop-space-link">
            <span>{text.space} <strong>{workshop.space.title}</strong></span>
            <a href={`${somespaiUrl}/espai/${encodeURIComponent(workshop.space.slug)}`} target="_blank" rel="noreferrer">
              {text.viewSpace} ↗
            </a>
          </aside>
        )}
      </article>
    </main>
  );
}
