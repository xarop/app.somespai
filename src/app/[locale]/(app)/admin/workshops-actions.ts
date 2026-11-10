'use server';

import { createClient } from '@/lib/supabase/server';
import {
  getAllWorkshopsAdmin,
  updateWorkshopAdmin,
  deleteWorkshopAdmin,
  type AdminWorkshop,
  type AdminWorkshopUpdate,
} from '@/lib/supabase/admin-workshops';

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (user.email !== process.env.ADMIN_EMAIL && !profile?.is_admin) throw new Error('Unauthorized');
}

export async function getAdminWorkshopsAction(): Promise<{ data: AdminWorkshop[]; error?: string }> {
  await requireAdmin();
  try {
    return { data: await getAllWorkshopsAdmin() };
  } catch (error) {
    return { data: [], error: error instanceof Error ? error.message : 'Error' };
  }
}

export async function updateAdminWorkshopAction(id: string, update: AdminWorkshopUpdate): Promise<void> {
  await requireAdmin();
  await updateWorkshopAdmin(id, update);
}

export async function deleteAdminWorkshopAction(id: string): Promise<void> {
  await requireAdmin();
  await deleteWorkshopAdmin(id);
}
