import { getWorkshops } from '@/lib/supabase/workshops';
import { WorkshopExplorer } from './workshop-explorer';

export async function WorkshopsHome({
  locale,
  category,
  date,
  location,
  latitude,
  longitude,
}: {
  locale: string;
  category?: string;
  date?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}) {
  const workshops = await getWorkshops({ category, date, location, latitude, longitude });

  return (
    <WorkshopExplorer
      workshops={workshops}
      locale={locale}
      category={category}
      date={date}
      location={location}
      latitude={latitude}
      longitude={longitude}
    />
  );
}
