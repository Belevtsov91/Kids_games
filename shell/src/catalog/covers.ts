// Browser-only assets: manifests also run on the server and stay data-only.
const files = import.meta.glob<string>('@games/*/assets/cover.webp', { eager: true, query: '?url', import: 'default' });
export const covers = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').at(-3), url]));
