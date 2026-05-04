import { getSpaces } from '@/lib/supabase/spaces';
import { HomeClient } from './home-client';

export default async function HomePage() {
  const spaces = await getSpaces();
  return <HomeClient initialSpaces={spaces} />;
}
