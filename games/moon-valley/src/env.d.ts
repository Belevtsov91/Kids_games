/// <reference types="@ig/sdk/assets" />

// 3D-модели и звуки игры. Vite превращает импорт в URL.
declare module '*.glb' {
  const url: string;
  export default url;
}

// import.meta.glob от Vite: игра собирает список моделей из своей папки assets/models.
interface ImportMeta {
  readonly env?: { readonly DEV?: boolean };
  glob<T = unknown>(pattern: string, options: { eager: true; query?: string; import?: string }): Record<string, T>;
}
