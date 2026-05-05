import { getSpaces } from '@/lib/supabase/spaces';
import { createClient } from '@/lib/supabase/server';
import { HomeClient } from './home-client';

export default async function HomePage() {
  const [spaces, supabase] = await Promise.all([getSpaces(), createClient()]);
  const { data: { user } } = await supabase.auth.getUser();
  const isAdmin = user?.email === process.env.ADMIN_EMAIL;
  return <HomeClient initialSpaces={spaces} isAdmin={isAdmin} />;
}
