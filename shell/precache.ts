import type { Plugin } from 'vite';

// Что кэшировать заранее (precache сервис-воркера). С 30 играми «всё подряд» весило ~22 МБ: каждый
// первый визит качал все игры, картинки и 3D-движок, даже если ребёнок откроет одну. Теперь заранее
// кэшируется только оболочка — то, что index.html грузит сразу (вход, меню, обложки, стили), — а код
// и картинки игр кэшируются при первом запуске игры (runtimeCaching на /assets/, CacheFirst).
// Запущенная однажды игра дальше работает без сети, как и раньше.

type Entry = { url: string; size: number; revision: string | null };

export interface ShellPrecache {
  /** Плагин Vite: после сборки запоминает файлы оболочки. */
  plugin: Plugin;
  /** Для workbox.manifestTransforms: выкидывает из precache всё, что не оболочка. */
  transform: (entries: Entry[]) => { manifest: Entry[]; warnings: string[] };
}

/** Файлы не из assets/ (index.html, манифест, иконки из public) кэшируются всегда. */
const isAsset = (url: string) => url.startsWith('assets/');

export function shellPrecache(): ShellPrecache {
  const shell = new Set<string>();

  const plugin: Plugin = {
    name: 'ig-shell-precache',
    apply: 'build',
    generateBundle(_options, bundle) {
      shell.clear();
      const visit = (name: string) => {
        if (shell.has(name)) return;
        const item = bundle[name];
        if (!item) return;
        shell.add(name);
        if (item.type !== 'chunk') return;
        // Только статические импорты: import() — это игры и тяжёлые куски, они грузятся по требованию.
        item.imports.forEach(visit);
        item.viteMetadata?.importedCss.forEach((css) => shell.add(css));
        item.viteMetadata?.importedAssets.forEach((asset) => shell.add(asset));
      };
      for (const [name, item] of Object.entries(bundle)) if (item.type === 'chunk' && item.isEntry) visit(name);
    },
  };

  const transform = (entries: Entry[]) => {
    // Плагин не отработал (например, сборка без него) — ничего не выкидываем, чтобы не сломать офлайн.
    if (!shell.size) return { manifest: entries, warnings: ['ig-shell-precache: список оболочки пуст, precache не урезан'] };
    return { manifest: entries.filter((e) => !isAsset(e.url) || shell.has(e.url)), warnings: [] };
  };

  return { plugin, transform };
}
