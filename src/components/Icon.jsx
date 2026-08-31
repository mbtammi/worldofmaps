// Inline SVG icon set.
//
// Replaces the emoji that used to stand in for UI icons. Emoji render differently on every
// platform, can't inherit weight or colour, and read as filler rather than interface.
// These are stroke-based, sized in `em` so they scale with surrounding text, and painted in
// `currentColor` so they pick up the theme automatically.
//
// Deliberately not a dependency: ~20 glyphs is not worth an icon package.

const PATHS = {
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  flame: (
    <path d="M12 3c.6 2.6 2 3.7 3.3 5.1A6.9 6.9 0 0 1 17.5 13a5.5 5.5 0 0 1-11 0c0-1.6.7-2.9 1.6-4 .3 .8 .9 1.4 1.7 1.7.3-3 1.4-4.9 2.2-7.7Z" />
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 20v-6M12 20V6M17 20v-9" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5 10-11" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  map: (
    <>
      <path d="M9 4.5 3.5 7v12.5L9 17l6 2.5 5.5-2.5V4.5L15 7Z" />
      <path d="M9 4.5V17M15 7v12.5" />
    </>
  ),
  document: (
    <>
      <path d="M6 3.5h7.5L18.5 8.5v12H6Z" />
      <path d="M13.5 3.5v5h5M9 13h6M9 16.5h6" />
    </>
  ),
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.6 2.6 0 0 1 5 1c0 1.7-2.5 2-2.5 3.7" />
      <path d="M12 17.5h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8h.01" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
      <path d="M5.5 13v5.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V13" />
    </>
  ),
  send: (
    <>
      <path d="M20.5 3.5 3.5 10l7 3 3 7Z" />
      <path d="M20.5 3.5 10.5 13" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3a9 9 0 0 0 0 18c1.2 0 1.8-.8 1.8-1.7 0-1.4-1-1.7-1-2.8 0-.8.7-1.5 1.6-1.5H16a5 5 0 0 0 5-5c0-3.9-4-7-9-7Z" />
      <path d="M7.5 11.5h.01M10.5 8h.01M14.5 8h.01" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.8 20h18.4Z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 17h6M10 20.5h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6h5.4c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </>
  ),
  home: <path d="M3.5 10.5 12 3.5l8.5 7M6 9.5v11h12v-11" />,
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />
    </>
  ),
  bell: (
    <>
      <path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10Z" />
      <path d="M10.2 19a2 2 0 0 0 3.6 0" />
    </>
  ),
  bolt: <path d="M13.5 3 5 13.5h5.5L10 21l8.5-10.5H13Z" />,
  arrowUp: <path d="M12 19.5v-15M5.5 11 12 4.5l6.5 6.5" />,
  trophy: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0Z" />
      <path d="M7.5 5.5H5A2.5 2.5 0 0 0 7.5 10M16.5 5.5H19A2.5 2.5 0 0 1 16.5 10" />
      <path d="M12 13.5V17M9 20.5h6" />
    </>
  ),
}

export const ICON_NAMES = Object.keys(PATHS)

/**
 * @param {string} name  key from PATHS
 * @param {string|number} size  any CSS length; defaults to 1em so it tracks font-size
 * @param {string} title  when set, the icon is exposed to screen readers with this label;
 *                        otherwise it is hidden as decoration
 */
export default function Icon({ name, size = '1em', title, className, strokeWidth = 1.7, ...rest }) {
  const d = PATHS[name]
  if (!d) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
      {...rest}
    >
      {title && <title>{title}</title>}
      {d}
    </svg>
  )
}
