import { Icon, type IconName } from '@/components/ui/icon';
import { getSomespaiUrl } from '@/lib/brand';
import { WORKSHOP_CATEGORIES } from '@/lib/data/workshop-categories';
import { WorkshopCategoryIcon } from './workshop-category-icon';
import { WorkshopHeader } from './workshop-header';

const copy = {
  ca: {
    back: 'Tornar',
    title: 'Com funciona Somtallers',
    intro:
      'Somtallers és el directori de tallers, cursos i activitats creatives de la teva ciutat. Cerca, contacta directament amb qui els imparteix o publica el teu.',
    steps: [
      ['map', 'Cerca al mapa', 'Entra a l’inici i veuràs els tallers a prop teu. Pots canviar la ubicació escrivint una ciutat o una adreça, o prement el botó de localització.'],
      ['search', 'Filtra per tipus i data', 'Tria un tipus de taller al desplegable i, si vols, una data. El mapa i la llista s’actualitzen a l’instant.'],
      ['info', 'Mira la fitxa', 'Cada taller mostra la descripció, el preu, la durada, el calendari de sessions i on es fa.'],
      ['mail', 'Contacta directament', 'Escriu o truca a qui imparteix el taller per WhatsApp, correu, telèfon o web. Sense intermediaris.'],
    ],
    categories: 'Tipus de tallers',
    organizersTitle: 'Vols publicar un taller?',
    organizers: [
      ['user', 'Un sol compte', 'Fas servir el mateix usuari que a Somespai. No cal registrar-te dues vegades.'],
      ['pencil', 'Publica en tres passos', 'Dades del taller, lloc i contacte, i dates de les sessions.'],
      ['room', 'Utilitza un espai de Somespai', 'Si no tens local, tria una sala de la xarxa Somespai que accepti tallers o crea’n una de nova.'],
    ],
    ctaExplore: 'Explorar tallers',
    ctaPublish: 'Publicar un taller',
    contactPrompt: 'Tens dubtes?',
    contactLink: 'Contacta amb nosaltres',
    venues: 'Busques un espai on fer el taller?',
    venuesLink: 'Troba espais a Somespai',
  },
  es: {
    back: 'Volver',
    title: 'Cómo funciona Somtallers',
    intro:
      'Somtallers es el directorio de talleres, cursos y actividades creativas de tu ciudad. Busca, contacta directamente con quien los imparte o publica el tuyo.',
    steps: [
      ['map', 'Busca en el mapa', 'Entra en el inicio y verás los talleres cerca de ti. Puedes cambiar la ubicación escribiendo una ciudad o dirección, o pulsando el botón de localización.'],
      ['search', 'Filtra por tipo y fecha', 'Elige un tipo de taller en el desplegable y, si quieres, una fecha. El mapa y la lista se actualizan al instante.'],
      ['info', 'Mira la ficha', 'Cada taller muestra la descripción, el precio, la duración, el calendario de sesiones y dónde se hace.'],
      ['mail', 'Contacta directamente', 'Escribe o llama a quien imparte el taller por WhatsApp, correo, teléfono o web. Sin intermediarios.'],
    ],
    categories: 'Tipos de talleres',
    organizersTitle: '¿Quieres publicar un taller?',
    organizers: [
      ['user', 'Una sola cuenta', 'Usas el mismo usuario que en Somespai. No hace falta registrarte dos veces.'],
      ['pencil', 'Publica en tres pasos', 'Datos del taller, lugar y contacto, y fechas de las sesiones.'],
      ['room', 'Usa un espacio de Somespai', 'Si no tienes local, elige una sala de la red Somespai que acepte talleres o crea una nueva.'],
    ],
    ctaExplore: 'Explorar talleres',
    ctaPublish: 'Publicar un taller',
    contactPrompt: '¿Tienes dudas?',
    contactLink: 'Contacta con nosotros',
    venues: '¿Buscas un espacio donde hacer el taller?',
    venuesLink: 'Encuentra espacios en Somespai',
  },
  en: {
    back: 'Back',
    title: 'How Somtallers works',
    intro:
      'Somtallers is the directory of workshops, courses and creative activities in your city. Search, contact the teacher directly, or list your own.',
    steps: [
      ['map', 'Search the map', 'Open the home page to see workshops near you. Change the location by typing a city or address, or press the locate button.'],
      ['search', 'Filter by type and date', 'Pick a workshop type from the dropdown and, optionally, a date. The map and list update instantly.'],
      ['info', 'Open the details', 'Each workshop shows its description, price, duration, session calendar and where it takes place.'],
      ['mail', 'Contact directly', 'Message or call the teacher via WhatsApp, email, phone or website. No middlemen.'],
    ],
    categories: 'Workshop types',
    organizersTitle: 'Want to list a workshop?',
    organizers: [
      ['user', 'One account', 'You use the same login as Somespai. No need to sign up twice.'],
      ['pencil', 'Publish in three steps', 'Workshop details, place and contact, and session dates.'],
      ['room', 'Use a Somespai space', 'No venue? Pick a room from the Somespai network that hosts workshops, or create a new one.'],
    ],
    ctaExplore: 'Explore workshops',
    ctaPublish: 'List a workshop',
    contactPrompt: 'Any questions?',
    contactLink: 'Contact us',
    venues: 'Looking for a place to run your workshop?',
    venuesLink: 'Find spaces on Somespai',
  },
} as const;

export function WorkshopHelp({ locale }: { locale: string }) {
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const prefix = locale === 'ca' ? '' : `/${locale}`;

  return (
    <>
      <WorkshopHeader locale={locale} />
      <div className="page-form">
        <div className="page-form__inner page-form__inner--wide">
          <header className="page-form__header">
            <a href={`${prefix}/`} className="page-form__back">← {text.back}</a>
            <h1>{text.title}</h1>
            <p className="page-form__subtitle">{text.intro}</p>
          </header>

          <ol className="help-steps">
            {text.steps.map(([icon, title, body], index) => (
              <li key={title} className="help-step">
                <div className="help-step__num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</div>
                <div className="help-step__icon" aria-hidden="true">
                  <Icon name={icon as IconName} size={22} />
                </div>
                <div className="help-step__content">
                  <h2 className="help-step__title">{title}</h2>
                  <p className="help-step__body">{body}</p>
                </div>
              </li>
            ))}
          </ol>

          <section className="help-types">
            <h2 className="help-types__title">{text.categories}</h2>
            <ul className="help-types__list">
              {WORKSHOP_CATEGORIES.map((item) => (
                <li key={item.value} className="help-type-item">
                  <span className="help-type-item__icon" style={{ background: 'var(--primary)', color: 'var(--primary-ink)' }}>
                    <WorkshopCategoryIcon category={item.value} width={22} height={22} />
                  </span>
                  <p className="help-type-item__label">{item[locale as 'ca' | 'es' | 'en'] ?? item.ca}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="help-features">
            <h2 className="help-features__title">{text.organizersTitle}</h2>
            <div className="help-features__grid">
              {text.organizers.map(([icon, title, body]) => (
                <div key={title} className="help-feature-item">
                  <div className="help-feature-item__icon" aria-hidden="true">
                    <Icon name={icon as IconName} size={18} />
                  </div>
                  <div>
                    <p className="help-feature-item__title">{title}</p>
                    <p className="help-feature-item__body">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="help-cta">
            <a href={`${prefix}/`} className="btn-primary">{text.ctaExplore}</a>
            <a href={`${prefix}/publicar-taller`} className="btn-secondary">{text.ctaPublish}</a>
          </div>

          <p className="help-contact-prompt">
            {text.venues}{' '}
            <a href={getSomespaiUrl()} target="_blank" rel="noreferrer">{text.venuesLink} ↗</a>
          </p>
          <p className="help-contact-prompt">
            {text.contactPrompt}{' '}
            <a href={`${prefix}/contacte`}>{text.contactLink}</a>
          </p>
        </div>
      </div>
    </>
  );
}
