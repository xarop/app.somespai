import type { Space } from '@/lib/schemas/space';
import { getWorkshopCategoryLabel } from '@/lib/data/workshop-categories';

interface WorkshopItem {
  slug: string;
  title: string;
  category: string;
  price: number | null;
  next: string | null;
}

const copy = {
  ca: {
    title: 'Tallers en aquest espai',
    empty: 'Encara no hi ha tallers publicats en aquest espai.',
    venue: 'Aquest espai està habilitat per fer-hi tallers.',
    create: 'Crea un taller a Somtallers ↗',
    ask: 'Pregunta al propietari',
    free: 'Gratuït',
    next: 'Proper',
  },
  es: {
    title: 'Talleres en este espacio',
    empty: 'Todavía no hay talleres publicados en este espacio.',
    venue: 'Este espacio está habilitado para hacer talleres.',
    create: 'Crea un taller en Somtallers ↗',
    ask: 'Pregunta al propietario',
    free: 'Gratis',
    next: 'Próximo',
  },
  en: {
    title: 'Workshops in this space',
    empty: 'No workshops have been published in this space yet.',
    venue: 'This space is open to hosting workshops.',
    create: 'Create a workshop on Somtallers ↗',
    ask: 'Ask the owner',
    free: 'Free',
    next: 'Next',
  },
} as const;

export function SpaceWorkshops({
  space,
  locale,
  isVenue,
  workshops,
  tallersUrl,
}: {
  space: Space;
  locale: string;
  isVenue: boolean;
  workshops: WorkshopItem[];
  tallersUrl: string;
}) {
  if (!isVenue) return null;
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const prefix = locale === 'ca' ? '' : `/${locale}`;
  const whatsapp = space.whatsapp ? `https://wa.me/${space.whatsapp.replace(/[^\d]/g, '')}` : null;
  const askHref =
    (space.contactDefault === 'whatsapp' && whatsapp) ||
    (space.contactDefault === 'email' && space.emailContact && `mailto:${space.emailContact}`) ||
    (space.contactDefault === 'phone' && space.phone && `tel:${space.phone}`) ||
    whatsapp ||
    (space.emailContact && `mailto:${space.emailContact}`) ||
    (space.phone && `tel:${space.phone}`) ||
    `${prefix}/contacte?title=${encodeURIComponent(space.title)}`;
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Madrid' });

  return (
    <section className="space-workshops" aria-labelledby="space-workshops-title">
      <h2 id="space-workshops-title">{text.title}</h2>
      {workshops.length > 0 ? (
        <ul className="space-workshops__list">
          {workshops.map((workshop) => (
            <li key={workshop.slug}>
              <a href={`${tallersUrl}${prefix}/taller/${workshop.slug}`}>
                <strong>{workshop.title}</strong>
                <span>
                  {getWorkshopCategoryLabel(workshop.category, locale)}
                  {' · '}
                  {workshop.price ? `${workshop.price} €` : text.free}
                  {workshop.next ? ` · ${text.next}: ${dateFormat.format(new Date(workshop.next))}` : ''}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p>{text.empty}</p>
      )}
      <p className="space-workshops__venue">{text.venue}</p>
      <div className="space-workshops__actions">
        <a
          data-variant="primary"
          href={`${tallersUrl}${prefix}/publicar-taller?space=${encodeURIComponent(space.slug)}`}
        >
          {text.create}
        </a>
        <a href={askHref} {...(askHref.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
          {text.ask}
        </a>
      </div>
    </section>
  );
}
