# Interact Games

Игры для детей. pnpm-воркспейс из двух пакетов: `front` (клиент) и `back` (API).

## Стек

- **front:** TypeScript, Vite, React (меню и оболочка), PixiJS (2D), Three.js + React Three Fiber + drei + Rapier (3D), Howler.js (звук), PWA (vite-plugin-pwa).
- **back:** Node 24, TypeScript, Fastify. Пока без БД: данные в памяти.

## Запуск

Нужен Node 24+. pnpm идёт через corepack (поставляется с Node), версия закреплена в `package.json`.

```bash
corepack pnpm install     # один раз
corepack pnpm dev         # front (http://localhost:5173) + back (http://localhost:3000) вместе
corepack pnpm dev:front   # только клиент
corepack pnpm dev:back    # только API
corepack pnpm build       # проверка типов + сборка обоих
```

Чтобы писать просто `pnpm`, выполните один раз `corepack enable` (в Windows может понадобиться терминал от администратора) или `npm i -g pnpm`.

В dev Vite проксирует `/api/*` на `http://localhost:3000`, поэтому фронт ходит в API без CORS-настроек.
Настройки бэка: скопируйте `back/.env.example` в `back/.env`.

## Структура

```
front/
  public/                  статика как есть (иконки PWA)
  src/
    app/App.tsx            роутинг: / — меню, /play/:gameId — игра
    pages/                 экраны оболочки (MenuPage, GamePage)
    games/
      registry.ts          список игр; каждая грузится отдельным чанком
      drawing/             рисовалка на PixiJS
        engine/            DrawingEngine — всё, что касается Pixi
        tools/             инструменты: карандаш, фломастер, мелок, ластик
      playground3d/        заготовка 3D-сцены (R3F + Rapier)
    shared/
      api/client.ts        fetch-обёртка для /api
      audio/sound.ts       реестр звуков на Howler
      hooks/, ui/          общие хуки и UI-компоненты
    assets/sounds, images  ресурсы, импортируемые из кода
    styles/global.css

back/
  src/
    server.ts              точка входа (listen)
    app.ts                 сборка Fastify, все маршруты под /api
    config/env.ts          переменные окружения
    db/                    место для подключения БД
    modules/<name>/
      <name>.routes.ts     HTTP-маршруты
      <name>.repository.ts доступ к данным (сейчас в памяти)
```

### Новая игра

1. Папка `front/src/games/<id>/` с компонентом по умолчанию (`export default`).
2. Запись в `front/src/games/registry.ts` — игра появится в меню.

### Подключение БД

Меняются только `*.repository.ts` (и `back/src/db/`): сигнатуры методов уже асинхронные, маршруты трогать не нужно.

## API (заглушки)

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/health` | проверка живости |
| GET | `/api/games`, `/api/games/:id` | каталог игр |
| GET/POST | `/api/profiles`, GET `/api/profiles/:id` | профили детей (`{ name, avatar? }`) |
| GET/POST | `/api/drawings` (`?profileId=`), GET/DELETE `/api/drawings/:id` | сохранённые рисунки (`{ profileId, title?, image: "data:image/png;base64,..." }`) |
