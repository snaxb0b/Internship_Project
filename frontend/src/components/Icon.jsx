const iconPaths = {
  menu: (
    <>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  minus: (
    <>
      <path d="M5 12h14" />
    </>
  ),
  logo: (
    <>
      <path d="M8.5 3.5h-3a2 2 0 0 0-2 2v3M15.5 3.5h3a2 2 0 0 1 2 2v3M20.5 15.5v3a2 2 0 0 1-2 2h-3M8.5 20.5h-3a2 2 0 0 1-2-2v-3" />
      <path d="M8.5 8.5h7v7h-7z" />
      <path d="m10.5 12 1 1 2-2" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3-1.1 2.9a4.8 4.8 0 0 1-2.8 2.8L5 10l3.1 1.2a4.8 4.8 0 0 1 2.8 2.8L12 17l1.1-3a4.8 4.8 0 0 1 2.8-2.8L19 10l-3.1-1.3a4.8 4.8 0 0 1-2.8-2.8L12 3Z" />
      <path d="m5 3-.4 1.1a1.9 1.9 0 0 1-1.1 1.1L2.5 5.5l1 .4A1.9 1.9 0 0 1 4.6 7L5 8l.4-1A1.9 1.9 0 0 1 6.5 6l1-.4-1-.4a1.9 1.9 0 0 1-1.1-1.1L5 3Z" />
      <path d="m19 16-.3.8a1.5 1.5 0 0 1-.9.9L17 18l.8.3a1.5 1.5 0 0 1 .9.9l.3.8.3-.8a1.5 1.5 0 0 1 .9-.9l.8-.3-.8-.3a1.5 1.5 0 0 1-.9-.9L19 16Z" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4" />
    </>
  ),
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m21 15-4.5-4.5L7 20" />
    </>
  ),
  history: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5M12 7v5l3 2" />
    </>
  ),
  check: (
    <path d="m5 12 4 4L19 6" />
  ),
  model: (
    <>
      <path d="m12 2 8 4.5v9L12 20l-8-4.5v-9L12 2Z" />
      <path d="m4.3 6.7 7.7 4.4 7.7-4.4M12 11.1V20" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h6M14 18h6" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="12" cy="18" r="2" />
    </>
  ),
  device: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </>
  ),
  maximize: (
    <>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
    </>
  ),
  external: (
    <>
      <path d="M15 3h6v6M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M5 21h14" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18M6 10h12M10 15h4" />
    </>
  ),
  star: (
    <>
      <path d="M12 5v14M6 8l12 8M18 8l-12 8" />
    </>
  ),
  home: (
    <>
      <path d="M3 10.5 12 4l9 6.5" />
      <path d="M5 9.6V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.6" />
      <path d="M9.5 21v-6.5h5V21" />
    </>
  ),
  chevronDown: (
    <path d="m6 9 6 6 6-6" />
  ),
  chevronUp: (
    <path d="m6 15 6-6 6 6" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.8 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.8a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: (
    <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
  ),
};


function Icon({
  name,
  size = 20,
  className = "",
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {iconPaths[name] ?? iconPaths.info}
    </svg>
  );
}


export default Icon;
