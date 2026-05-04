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
