export interface WorkshopSession {
  id: string;
  workshopId: string;
  startTime: string;
  endTime: string;
  availableSeats: number | null;
  status: string;
}

export interface Workshop {
  id: string;
  organizerId: string;
  spaceId: string | null;
  title: string;
  slug: string;
  description: string | null;
  category: string;
  price: number | null;
  durationMinutes: number | null;
  maxCapacity: number | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
  contactUrl: string | null;
  contactDefault: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  sessions: WorkshopSession[];
}

export interface WorkshopWithSpace extends Workshop {
  space: {
    id: string;
    slug: string;
    title: string;
    city: string | null;
    address: string | null;
    neighborhood: string | null;
  } | null;
}
