'use client';

import dynamic from 'next/dynamic';
import type { Workshop } from '@/types/workshop';

const WorkshopMap = dynamic(
  () => import('./workshop-map').then((module) => module.WorkshopMap),
  { ssr: false, loading: () => <div className="workshop-map workshop-map--loading" /> },
);

export function WorkshopMapLoader({
  workshops,
  locale,
  center,
}: {
  workshops: Workshop[];
  locale: string;
  center?: [number, number];
}) {
  return <WorkshopMap workshops={workshops} locale={locale} center={center} />;
}
