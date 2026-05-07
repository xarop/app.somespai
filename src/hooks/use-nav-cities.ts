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
        const counts = new Map<string, number>();
        for (const row of data ?? []) {
          if (row.city) counts.set(row.city as string, (counts.get(row.city as string) ?? 0) + 1);
        }
        cache = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([city]) => city);
        setCities(cache);
      });
  }, []);

  return cities;
}
