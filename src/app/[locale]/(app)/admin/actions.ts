'use server';

import { createClient } from '@/lib/supabase/server';
import {
  setSpaceStatusAdmin,
  setSpaceFeaturedAdmin,
  updateSpaceAdmin,
  deleteSpaceAdmin,
  type AdminSpaceUpdate,
} from '@/lib/supabase/admin';

async function requireAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error('Unauthorized');
  }
}

export async function setStatusAction(id: string, status: 'active' | 'paused' | 'removed') {
  await requireAdmin();
  await setSpaceStatusAdmin(id, status);
}

export async function setFeaturedAction(id: string, isFeatured: boolean) {
  await requireAdmin();
  await setSpaceFeaturedAdmin(id, isFeatured);
}

export async function updateSpaceAction(id: string, data: AdminSpaceUpdate) {
  await requireAdmin();
  await updateSpaceAdmin(id, data);
}

export async function deleteSpaceAction(id: string) {
  await requireAdmin();
  await deleteSpaceAdmin(id);
}
