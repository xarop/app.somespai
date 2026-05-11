'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

let cache: string[] | null = null;

export function useNavCities(): string[] {
  const [cities, setCities] = useState<string[]>(cache ?? []);

  useEffect(() => {
    if (cache) { setCities(cache); return; }
    
    async function fetchCities() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('spaces')
          .select('city')
          .eq('status', 'active')
          .not('city', 'is', null);

        if (error) {
          console.error("Cities fetch error:", error.message, error.code, error.details);
          return;
        }

        const counts = new Map<string, number>();
        for (const row of data ?? []) {
          if (row.city) counts.set(row.city as string, (counts.get(row.city as string) ?? 0) + 1);
        }
        cache = [...counts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([city]) => city);
        setCities(cache);
      } catch (err) {
        console.error("Cities fetch outer error:", err);
      }
    }
    
    fetchCities();
  }, []);

  return cities;
}
