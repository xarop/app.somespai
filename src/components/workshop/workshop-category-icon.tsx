import type { SVGProps } from 'react';

const CATEGORY_PATHS: Record<string, string> = {
  ceramica: '<path d="M6 4h12l-1 5a5 5 0 0 1-10 0L6 4Z"/><path d="M7 14v4a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4"/><path d="M5 4h14"/>',
  plantas: '<path d="M12 21v-9"/><path d="M12 13C5 13 4 8 4 5c4 0 8 1 8 8Z"/><path d="M12 16c0-6 4-9 8-9 0 4-1 9-8 9Z"/>',
  cuina: '<path d="M4 10h16l-1 9H5l-1-9Z"/><path d="M3 10h18"/><path d="M8 7V4M12 7V3M16 7V4"/>',
  pintura: '<path d="m14 4 6 6-9 9-6 1 1-6 8-10Z"/><path d="m12 6 6 6"/><path d="M5 20h15"/>',
  joieria: '<path d="m12 3 8 7-8 11-8-11 8-7Z"/><path d="M4 10h16M9 4l3 6 3-6"/>',
  teatre: '<path d="M4 5c5-2 11-2 16 0v7c0 5-4 8-8 9-4-1-8-4-8-9V5Z"/><path d="M8 10h.01M16 10h.01M8 14c2 2 6 2 8 0"/>',
  costura: '<path d="m20 4-8 8"/><path d="M14 3a3 3 0 0 1 4 4l-2 2"/><path d="M12 12c-5 0-8 3-8 6 0 2 2 3 4 2l6-3"/><path d="m9 15 3 3"/>',
  fusteria: '<path d="M3 20l9-9"/><path d="M14 4l6 6-3 3-6-6 3-3Z"/><path d="M5 18l2 2"/>',
  floristeria: '<circle cx="12" cy="10" r="3"/><path d="M12 7c0-3 3-4 4-3 1 1 0 4-4 3Zm0 6c0 3-3 4-4 3-1-1 0-4 4-3Z"/><path d="M12 13v8"/>',
  reposteria: '<path d="M5 14a7 7 0 0 1 14 0v5H5v-5Z"/><path d="M9 11v3M13 10v4M16 12v2"/>',
  begudes: '<path d="M8 3h8l-1 7a3 3 0 0 1-6 0L8 3Z"/><path d="M12 13v7M8 21h8"/>',
  musica: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
  dansa: '<circle cx="12" cy="5" r="2"/><path d="M12 8v6l-4 6M12 14l4 6M6 11l6-1 6 3"/>',
  benestar: '<circle cx="12" cy="6" r="2"/><path d="M5 20c2-5 5-6 7-6s5 1 7 6M12 8v6M6 12c3 1 9 1 12 0"/>',
  fotografia: '<path d="M4 8h3l2-3h6l2 3h3v11H4V8Z"/><circle cx="12" cy="13" r="3.5"/>',
  escriptura: '<path d="M5 19l1-4 10-10 3 3-10 10-4 1Z"/><path d="M14 7l3 3"/>',
  illustracio: '<path d="M4 20l1-5 11-11 4 4-11 11-5 1Z"/><path d="M13 7l4 4"/>',
  textil: '<path d="M12 3v6"/><circle cx="12" cy="13" r="4"/><path d="M8 17l-3 4M16 17l3 4M12 17v4"/>',
  vidre: '<path d="M6 3h12l-2 9a4 4 0 0 1-8 0L6 3Z"/><path d="M12 16v5M9 21h6"/>',
  cuir: '<path d="M4 14c3-1 4-5 8-5s5 3 8 4v4H4v-3Z"/><path d="M8 16v-2M12 16v-3M16 16v-2"/>',
  escultura: '<path d="M12 3l7 4v7l-7 7-7-7V7l7-4Z"/><path d="M5 7l7 4 7-4M12 11v10"/>',
  maker: '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
  altres: '<circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>',
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
