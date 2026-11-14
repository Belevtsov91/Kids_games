/** Иконки разделов кабинета: тонкие линии вместо эмодзи, одинаковые на всех устройствах. */
const PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9.5h13V10M10 19.5v-5h4v5',
  kids: 'M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5M17 11.5a2.5 2.5 0 1 0 0-5M17.5 14.6c2.1.4 3.5 2.2 3.5 4.9',
  inbox: 'M3.5 6.5h17v11h-17zM3.5 7l8.5 6.5L20.5 7',
  family: 'M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z',
  lock: 'M6.5 10.5h11v9h-11zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14v2.5',
  pad: 'M7.5 8h9a4.5 4.5 0 0 1 4.3 5.800l-.8 2.700a2 2 0 0 1-3.5.7L15 15.5H9l-1.5 1.700a2 2 0 0 1-3.5-.7l-.8-2.700A4.5 4.5 0 0 1 7.5 8ZM8 10.5v3M6.5 12h3M15.5 11h.01M17.5 13h.01',
} as const;

export type NavIconName = keyof typeof PATHS;

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg className="pa-ico" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
