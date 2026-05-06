'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

let cache: string[] | null = null;

export function useNavCities(): string[] {
  const [cities, setCities] = useState<string[]>(cache ?? []);

  useEffect(() => {
    if (cache) { setCities(cache); return; }
    const supabase = createClient();
    supabase
      .from('spaces')
      .select('city')
      .eq('status', 'active')
      .not('city', 'is', null)
      .then(({ data }) => {
        const seen = new Set<string>();
        for (const row of data ?? []) if (row.city) seen.add(row.city as string);
        cache = [...seen].sort();
        setCities(cache);
      });
  }, []);

  return cities;
}
