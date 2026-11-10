'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkshopAction, type PublishWorkshopState } from './actions';
import { WORKSHOP_CATEGORIES } from '@/lib/data/workshop-categories';

interface SpaceOption {
  id: string;
  slug: string;
  title: string;
  city: string | null;
}

interface WorkshopSessionDraft {
  start: string;
  end: string;
  seats: string;
}

const copy = {
  ca: {
    steps: ['Dades del taller', 'Lloc i contacte', 'Dates de les sessions'],
    title: 'Nom del taller', description: 'Descripció', category: 'Categoria', price: 'Preu per persona (€)', duration: 'Durada (minuts)', capacity: 'Aforament màxim',
    address: 'Adreça', city: 'Ciutat', lat: 'Latitud', lng: 'Longitud', space: 'Espai de Somespai (opcional)', noSpace: 'Sense espai vinculat',
    createSpace: 'No trobes el local? Crea un espai a Somespai', findSpaceText: 'Encara no tens on fer el taller? Busca i contacta amb un espai de Somespai.', findSpaceCta: 'Buscar un espai a Somespai', refreshSpaces: 'Actualitza la llista d’espais',
    spaceHelp: 'Selecciona primer on es farà el taller. Si l’espai encara no existeix, crea’l a Somespai en una pestanya nova i després actualitza la llista.',
    contactName: 'Persona de contacte', phone: 'Telèfon', email: 'Email', whatsapp: 'WhatsApp', url: 'Web', default: 'Contacte preferit',
    start: 'Inici', end: 'Final', seats: 'Places disponibles', add: 'Afegeix una sessió', next: 'Continua', back: 'Enrere', submit: 'Publica el taller',
    success: 'Taller publicat.', view: 'Veure el taller', login: 'La sessió ha caducat. Inicia sessió i torna-ho a provar.',
  },
  es: {
    steps: ['Datos del taller', 'Lugar y contacto', 'Fechas de las sesiones'],
    title: 'Nombre del taller', description: 'Descripción', category: 'Categoría', price: 'Precio por persona (€)', duration: 'Duración (minutos)', capacity: 'Aforo máximo',
    address: 'Dirección', city: 'Ciudad', lat: 'Latitud', lng: 'Longitud', space: 'Espacio de Somespai (opcional)', noSpace: 'Sin espacio vinculado',
    createSpace: '¿No encuentras el local? Crea un espacio en Somespai', findSpaceText: '¿Aún no tienes dónde hacer el taller? Busca y contacta con un espacio de Somespai.', findSpaceCta: 'Buscar un espacio en Somespai', refreshSpaces: 'Actualizar lista de espacios',
    spaceHelp: 'Selecciona primero dónde se hará el taller. Si el espacio aún no existe, créalo en Somespai en una pestaña nueva y después actualiza la lista.',
    contactName: 'Persona de contacto', phone: 'Teléfono', email: 'Email', whatsapp: 'WhatsApp', url: 'Web', default: 'Contacto preferido',
    start: 'Inicio', end: 'Fin', seats: 'Plazas disponibles', add: 'Añadir una sesión', next: 'Continuar', back: 'Atrás', submit: 'Publicar el taller',
    success: 'Taller publicado.', view: 'Ver el taller', login: 'La sesión ha caducado. Inicia sesión e inténtalo de nuevo.',
  },
  en: {
    steps: ['Workshop details', 'Location and contact', 'Session dates'],
    title: 'Workshop title', description: 'Description', category: 'Category', price: 'Price per person (€)', duration: 'Duration (minutes)', capacity: 'Maximum capacity',
    address: 'Address', city: 'City', lat: 'Latitude', lng: 'Longitude', space: 'Somespai space (optional)', noSpace: 'No linked space',
    createSpace: "Can't find the venue? Create a space on Somespai", findSpaceText: 'No place for your workshop yet? Find and contact a Somespai space.', findSpaceCta: 'Find a space on Somespai', refreshSpaces: 'Refresh space list',
    spaceHelp: 'First choose where the workshop will take place. If the space does not exist yet, create it on Somespai in a new tab, then refresh this list.',
    contactName: 'Contact person', phone: 'Phone', email: 'Email', whatsapp: 'WhatsApp', url: 'Website', default: 'Preferred contact',
    start: 'Start', end: 'End', seats: 'Available seats', add: 'Add a session', next: 'Continue', back: 'Back', submit: 'Publish workshop',
    success: 'Workshop published.', view: 'View workshop', login: 'Your session expired. Sign in and try again.',
  },
} as const;

export function WorkshopPublishForm({
  locale,
  spaces,
  somespaiUrl,
  defaultSpaceId = '',
}: {
  locale: string;
  spaces: SpaceOption[];
  somespaiUrl: string;
  defaultSpaceId?: string;
}) {
  const text = copy[locale as keyof typeof copy] ?? copy.ca;
  const [state, formAction, pending] = useActionState<PublishWorkshopState | null, FormData>(
    createWorkshopAction,
    null,
  );
  const [step, setStep] = useState(1);
  const [sessions, setSessions] = useState<WorkshopSessionDraft[]>([{ start: '', end: '', seats: '' }]);
  const localizedPrefix = locale === 'ca' ? '' : `/${locale}`;
  const router = useRouter();

  function changeSession(index: number, field: keyof WorkshopSessionDraft, value: string) {
    setSessions((current) => current.map((session, row) => row === index ? { ...session, [field]: value } : session));
  }

  function continueToNextStep() {
    const currentPanel = document.querySelector<HTMLElement>(`[data-workshop-step="${step}"]`);
    const invalid = currentPanel?.querySelector<HTMLInputElement | HTMLSelectElement>(':invalid');
    if (invalid) {
      invalid.reportValidity();
      return;
    }
    setStep((current) => Math.min(current + 1, 3));
  }

  return (
    <form className="workshop-form" action={formAction}>
      <ol className="workshop-form__steps" aria-label="Progress">
        {text.steps.map((label, index) => (
          <li key={label} aria-current={step === index + 1 ? 'step' : undefined} data-active={step >= index + 1}>
            <span>{index + 1}</span>{label}
          </li>
        ))}
      </ol>

      <section data-workshop-step="1" hidden={step !== 1}>
        <label>{text.title}<input name="title" required={step === 1} maxLength={140} /></label>
        <label>{text.description}<textarea name="description" rows={5} maxLength={5000} /></label>
        <label>
          {text.category}
          <select name="category" required={step === 1} defaultValue="">
            <option value="" disabled>—</option>
            {WORKSHOP_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category[locale as keyof typeof category] ?? category.ca}
              </option>
            ))}
          </select>
        </label>
        <div className="workshop-form__two-columns">
          <label>{text.price}<input name="price" type="number" min="0" step="0.01" /></label>
          <label>{text.duration}<input name="duration_minutes" type="number" min="1" step="1" /></label>
          <label>{text.capacity}<input name="max_capacity" type="number" min="1" step="1" /></label>
        </div>
      </section>

      <section data-workshop-step="2" hidden={step !== 2}>
        <aside className="workshop-form__find-space">
          <span>{text.findSpaceText}</span>
          <a className="workshop-button workshop-button--primary" href={somespaiUrl} target="_blank" rel="noreferrer">
            {text.findSpaceCta} <span aria-hidden="true">↗</span>
          </a>
        </aside>
        <label>
          {text.space}
          <select name="space_id" defaultValue={defaultSpaceId}>
            <option value="">{text.noSpace}</option>
            {spaces.map((space) => (
              <option key={space.id} value={space.id}>{space.title}{space.city ? ` · ${space.city}` : ''}</option>
            ))}
          </select>
        </label>
        <p className="workshop-form__space-help">
          {text.spaceHelp}{' '}
          <a href={`${somespaiUrl}${localizedPrefix}/publica`} target="_blank" rel="noreferrer">{text.createSpace}</a>
          {' · '}
          <button className="workshop-form__link-button" type="button" onClick={() => router.refresh()}>
            {text.refreshSpaces}
          </button>
        </p>
        <label>{text.address}<input name="address" maxLength={200} /></label>
        <label>{text.city}<input name="city" defaultValue="Barcelona" maxLength={100} /></label>
        <div className="workshop-form__two-columns">
          <label>{text.lat}<input name="lat" type="number" min="-90" max="90" step="any" /></label>
          <label>{text.lng}<input name="lng" type="number" min="-180" max="180" step="any" /></label>
        </div>
        <div className="workshop-form__two-columns">
          <label>{text.contactName}<input name="contact_name" maxLength={160} /></label>
          <label>{text.phone}<input name="contact_phone" type="tel" maxLength={40} /></label>
          <label>{text.email}<input name="contact_email" type="email" maxLength={254} /></label>
          <label>{text.whatsapp}<input name="contact_whatsapp" type="tel" maxLength={40} /></label>
          <label>{text.url}<input name="contact_url" type="url" maxLength={500} /></label>
          <label>
            {text.default}
            <select name="contact_default" defaultValue="whatsapp">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="phone">{text.phone}</option>
              <option value="web">{text.url}</option>
            </select>
          </label>
        </div>
      </section>

      <section data-workshop-step="3" hidden={step !== 3}>
        {sessions.map((session, index) => (
          <fieldset className="workshop-session-editor" key={index}>
            <legend>{text.steps[2]} {index + 1}</legend>
            <div className="workshop-form__two-columns">
              <label>{text.start}<input type="datetime-local" value={session.start} required onChange={(event) => changeSession(index, 'start', event.target.value)} /></label>
              <label>{text.end}<input type="datetime-local" value={session.end} required onChange={(event) => changeSession(index, 'end', event.target.value)} /></label>
              <label>{text.seats}<input type="number" min="0" step="1" value={session.seats} onChange={(event) => changeSession(index, 'seats', event.target.value)} /></label>
            </div>
          </fieldset>
        ))}
        {sessions.length < 30 && (
          <button className="workshop-button" type="button" onClick={() => setSessions((current) => [...current, { start: '', end: '', seats: '' }])}>
            + {text.add}
          </button>
        )}
      </section>

      <input
        type="hidden"
        name="sessions"
        value={JSON.stringify(sessions.map(({ start, end, seats }) => ({
          start: start ? new Date(start).toISOString() : '',
          end: end ? new Date(end).toISOString() : '',
          seats: seats || null,
        })))}
      />
      <input type="hidden" name="locale" value={locale} />
      {state?.error && <p className="workshop-form__message" role="alert">{state.error}</p>}
      {state?.success && state.slug && (
        <p className="workshop-form__success" role="status">
          {text.success} <a href={`${localizedPrefix}/taller/${encodeURIComponent(state.slug)}`}>{text.view}</a>
        </p>
      )}
      <div className="workshop-form__actions">
        {step > 1 && <button className="workshop-button" type="button" onClick={() => setStep((current) => current - 1)}>{text.back}</button>}
        {step < 3
          ? <button className="workshop-button workshop-button--primary" type="button" onClick={continueToNextStep}>{text.next}</button>
          : <button className="workshop-button workshop-button--primary" type="submit" disabled={pending}>{pending ? '…' : text.submit}</button>}
      </div>
    </form>
  );
}
