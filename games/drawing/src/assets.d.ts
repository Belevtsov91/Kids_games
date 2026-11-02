// Ресурсы игры подключаются через import; сборку делает Vite в оболочке.
declare module '*.css';
declare module '*.png' {
  const url: string;
  export default url;
}
declare module '*.mp3' {
  const url: string;
  export default url;
}
