const organizerId = '00000000-0000-0000-0000-000000000001';

function sessionInDays(days: number, seats: number) {
  const start = new Date();
  start.setDate(start.getDate() + days);
  start.setHours(18, 0, 0, 0);
  const end = new Date(start);
  end.setHours(20, 0, 0, 0);
  return {
    start_time: start.toISOString(),
    end_time: end.toISOString(),
    available_seats: seats,
    status: 'scheduled',
  };
}

export const MOCK_WORKSHOPS = [
  {
    organizer_id: organizerId,
    space_id: '4',
    title: "Taller de terraris a Jungle Mow's",
    slug: 'demo-terrari-jungle-mows',
    description:
      'Crea un petit jardí dins d’un recipient de vidre i descobreix com combinar plantes, substrat i elements naturals. Consulta el proveïdor per veure les properes sessions.',
    category: 'plantas',
    price: null,
    duration_minutes: 120,
    max_capacity: 12,
    address: 'Carrer de Verdi, 75',
    city: 'Barcelona',
    lat: 41.4049892,
    lng: 2.1555603,
    contact_url: 'https://junglemows.com/cat/workshops/',
    contact_default: 'web',
    status: 'active',
    sessions: [sessionInDays(14, 8)],
  },
  {
    organizer_id: organizerId,
    space_id: '9',
    title: 'Crea el teu terrari a Casapampa',
    slug: 'demo-terrari-casapampa',
    description:
      'Un taller pràctic per crear un mini jardí amb plantes, pedres i molsa, sense necessitat d’experiència prèvia. Consulta Casapampa per confirmar lloc, disponibilitat i properes dates.',
    category: 'plantas',
    price: null,
    duration_minutes: 120,
    max_capacity: 10,
    address: null,
    city: 'Barcelona',
    lat: null,
    lng: null,
    contact_url: 'https://www.casapampa.net/talleres',
    contact_default: 'web',
    status: 'active',
    sessions: [sessionInDays(16, 6)],
  },
  {
    organizer_id: organizerId,
    space_id: '4',
    title: 'Primera experiència amb ceràmica a Consell81',
    slug: 'demo-ceramica-consell81',
    description:
      'Una primera presa de contacte amb el fang i les tècniques de ceràmica en un taller de Barcelona. Revisa el web del taller per consultar el programa i el preu actuals.',
    category: 'ceramica',
    price: null,
    duration_minutes: 120,
    max_capacity: 10,
    address: 'Carrer del Consell de Cent, 81',
    city: 'Barcelona',
    lat: 41.3793899,
    lng: 2.149945,
    contact_url: 'https://www.consell81.com/primera-experiencia-ceramica/',
    contact_default: 'web',
    status: 'active',
    sessions: [sessionInDays(18, 8)],
  },
  {
    organizer_id: organizerId,
    space_id: '9',
    title: 'Iniciació al modelatge o al torn a Atuell',
    slug: 'demo-iniciacio-ceramica-atuell',
    description:
      'Aprèn tècniques bàsiques de modelatge o de torn i crea les teves pròpies peces. Els formats i les dates poden variar; consulta Atuell abans de reservar.',
    category: 'ceramica',
    price: null,
    duration_minutes: 120,
    max_capacity: 8,
    address: 'Carrer del Montseny, 45',
    city: 'Barcelona',
    lat: 41.4026182,
    lng: 2.1558204,
    contact_url: 'https://atuell.com/',
    contact_default: 'web',
    status: 'active',
    sessions: [sessionInDays(20, 6)],
  },
  {
    organizer_id: organizerId,
    space_id: '16',
    title: 'Taller creatiu de ceràmica a Aforest',
    slug: 'demo-ceramica-aforest',
    description:
      'Un espai de classes i monogràfics de ceràmica i altres disciplines creatives. Consulta l’agenda d’Aforest per trobar l’activitat i l’horari disponibles.',
    category: 'ceramica',
    price: null,
    duration_minutes: 120,
    max_capacity: 10,
    address: 'Carrer de Cartagena, 313',
    city: 'Barcelona',
    lat: 41.4105556,
    lng: 2.1749759,
    contact_url: 'https://aforest.es/',
    contact_default: 'web',
    status: 'active',
    sessions: [sessionInDays(22, 8)],
  },
].map((workshop, index) => {
  const { sessions, ...row } = workshop;
  const createdAt = new Date().toISOString();
  return {
    ...row,
    id: `demo-workshop-${index + 1}`,
    created_at: createdAt,
    updated_at: createdAt,
    sessions: sessions.map((session, sessionIndex) => ({
      ...session,
      id: `${row.slug}-session-${sessionIndex + 1}`,
      workshop_id: `demo-workshop-${index + 1}`,
    })),
  };
});

export type MockWorkshop = (typeof MOCK_WORKSHOPS)[number];
