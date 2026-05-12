import type { SVGProps } from 'react';

const ICON_PATHS: Record<string, React.ReactNode> = {
  storage: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M3 7l9 4 9-4" />
      <path d="M12 11v10" />
    </>
  ),
  workspace: (
    <>
      <rect x="3" y="5" width="18" height="11" rx="2" />
      <path d="M7 20h10M12 16v4" />
    </>
  ),
  garden: (
    <>
      <path d="M12 22V13" />
      <path d="M5 9c0-3 3-5 7-5s7 2 7 5c0 4-3 6-7 6S5 13 5 9z" />
      <path d="M9 9c0-1.5 1.4-2.5 3-2.5s3 1 3 2.5" />
    </>
  ),
  room: (
    <>
      <path d="M3 21V5l9-2v18" />
      <path d="M2 21h20M14 21V8l7-2v15" />
      <circle cx="9" cy="13" r="0.6" fill="currentColor" />
    </>
  ),
  parking: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M10 17v-8h4a3 3 0 010 6h-4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
    </>
  ),
  heart: <path d="M12 21s-7-4.5-9-9.5C1.5 7 5 4 8 5c1.5.5 3 2 4 4 1-2 2.5-3.5 4-4 3-1 6.5 2 5 6.5-2 5-9 9.5-9 9.5z" />,
  share: (
    <>
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.5 10.5l7-3M8.5 13.5l7 3" />
    </>
  ),
  star: <path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12l5 5L20 6" />,
  pin: (
    <>
      <path d="M12 22s-7-7.5-7-13a7 7 0 1114 0c0 5.5-7 13-7 13z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </>
  ),
  arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="7" r="1.2" fill="currentColor" stroke="none" />
      <line x1="12" y1="11" x2="12" y2="18" strokeWidth={2.2} strokeLinecap="round" />
    </>
  ),
  ruler: (
    <>
      <path d="M21 4L4 21l-1-1L20 3z" />
      <path d="M7 14l2 2M10 11l2 2M13 8l2 2M16 5l2 2" />
    </>
  ),
  phone: <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.06 1.18 2 2 0 012.03 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />,
  mail: (
    <>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </>
  ),
  pencil: (
    <>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  map: (
    <>
      <path d="M3 6l6-3 6 3 6-3v13l-6 3-6-3-6 3V6z" />
      <path d="M9 3v13M15 6v13" />
    </>
  ),
  list: (
    <>
      <line x1="9" y1="6" x2="20" y2="6" strokeLinecap="round" />
      <line x1="9" y1="12" x2="20" y2="12" strokeLinecap="round" />
      <line x1="9" y1="18" x2="20" y2="18" strokeLinecap="round" />
      <circle cx="4.5" cy="6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.5" cy="18" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 22l1.6-5.7A9 9 0 1 1 9.7 20.4z" />
      <path d="M9 11c0-.5.4-1 1-1 .4 0 .7.3 1 .8l.4 1c.1.3 0 .5-.2.7l-.3.4c.4.7 1 1.4 1.8 1.8l.4-.3c.2-.2.5-.3.7-.2l1 .4c.5.3.8.6.8 1 0 1.1-1.2 2-2.2 2-2.8 0-6.4-3.6-6.4-6.6z" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="19" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  flag: (
    <>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </>
  ),
  instagram: (
    <>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </>
  ),
  camera: (
    <>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </>
  ),
  pause: (
    <>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </>
  ),
  play: <polygon points="5 3 19 12 5 21 5 3" />,
  trash: (
    <>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    </>
  ),
};

export type IconName = keyof typeof ICON_PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const path = ICON_PATHS[name];
  if (!path) return null;

  const filled = name === 'star';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}
