// Типы ресурсов, которые игра подключает через import. Сборку делает Vite в оболочке:
// стили встраиваются, картинки и звуки превращаются в URL.
// Подключение в игре: src/env.d.ts → /// <reference types="@ig/sdk/assets" />

declare module '*.css';

declare module '*.png' {
  const url: string;
  export default url;
}
declare module '*.jpg' {
  const url: string;
  export default url;
}
declare module '*.svg' {
  const url: string;
  export default url;
}
declare module '*.webp' {
  const url: string;
  export default url;
}
declare module '*.mp3' {
  const url: string;
  export default url;
}
declare module '*.ogg' {
  const url: string;
  export default url;
}
declare module '*.wav' {
  const url: string;
  export default url;
}
