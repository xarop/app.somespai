import type { SVGProps } from 'react';

const CATEGORY_PATHS: Record<string, string> = {
  ceramica: '<path d="M6 4h12l-1 5a5 5 0 0 1-10 0L6 4Z"/><path d="M7 14v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4"/><path d="M5 4h14"/>',
  plantas: '<path d="M12 21v-9"/><path d="M12 13C5 13 4 8 4 5c4 0 8 1 8 8Z"/><path d="M12 16c0-6 4-9 8-9 0 4-1 9-8 9Z"/>',
  cuina: '<path d="M4 10h16l-1 9H5l-1-9Z"/><path d="M3 10h18"/><path d="M8 7V4M12 7V3M16 7V4"/>',
  pintura: '<path d="m14 4 6 6-9 9-6 1 1-6 8-10Z"/><path d="m12 6 6 6"/><path d="M5 20h15"/>',
  joieria: '<path d="m12 3 8 7-8 11-8-11 8-7Z"/><path d="M4 10h16M9 4l3 6 3-6"/>',
  teatre: '<path d="M4 5c5-2 11-2 16 0v7c0 5-4 8-8 9-4-1-8-4-8-9V5Z"/><path d="M8 10h.01M16 10h.01M8 14c2 2 6 2 8 0"/>',
  costura: '<path d="m20 4-8 8"/><path d="M14 3a3 3 0 0 1 4 4l-2 2"/><path d="M12 12c-5 0-8 3-8 6 0 2 2 3 4 2l6-3"/><path d="m9 15 3 3"/>',
};

export function getWorkshopCategoryIconMarkup(category: string): string {
  const paths = CATEGORY_PATHS[category] ?? CATEGORY_PATHS.ceramica;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export function WorkshopCategoryIcon({
  category,
  ...props
}: SVGProps<SVGSVGElement> & { category: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
      dangerouslySetInnerHTML={{ __html: CATEGORY_PATHS[category] ?? CATEGORY_PATHS.ceramica }}
    />
  );
}
