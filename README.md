# Interact Games

Игры для детей 3–15 лет. pnpm-воркспейс: каждая игра — отдельный пакет со своими зависимостями, кодом, сервером и тестами. Общий только экран выбора игр (`shell`) и маленькая платформа.

## Стек

- **shell:** TypeScript, Vite, React, react-router, PWA (vite-plugin-pwa).
- **игры:** что угодно на выбор игры. Сейчас: рисовалка на PixiJS + React + Howler, 3D-песочница на Three.js + React Three Fiber + drei + Rapier.
- **сервер:** Node 24, TypeScript, Fastify (запуск через tsx). Пока без БД: данные в памяти.
- **тесты:** Vitest (юнит и API), Playwright (e2e).

## Запуск

Нужен Node 24+. pnpm идёт через corepack, версия закреплена в `package.json`.

```bash
corepack pnpm install     # один раз и после добавления игры
corepack pnpm dev         # shell (http://localhost:5173) + сервер (http://localhost:3000)
corepack pnpm dev:shell   # только клиент
corepack pnpm dev:server  # только API
corepack pnpm lint        # проверка границ: игры не импортируют друг друга
corepack pnpm typecheck   # типы во всех пакетах
corepack pnpm test        # юнит- и API-тесты всех пакетов
corepack pnpm test:e2e    # меню → игра → выход, десктоп и телефон (Playwright)
corepack pnpm build       # lint + типы + сборка shell
```

Перед первым `test:e2e` один раз: `corepack pnpm --filter @ig/shell exec playwright install chromium`.

В dev Vite проксирует `/api/*` на `http://localhost:3000`. Настройки сервера: скопируйте `platform/server/.env.example` в `platform/server/.env`.

## Структура

```
shell/                       @ig/shell — единственный общий экран: меню и запуск игр
  src/catalog/catalog.ts     каталог из games/*/manifest.ts (import.meta.glob), код игры — отдельный чанк
  src/host/GameHost.tsx      вызывает mount()/unmount() игры, pause/resume при скрытии вкладки
  src/host/createSdk.ts      SDK, который получает игра
  src/pages/                 MenuPage, GamePage
  e2e/                       Playwright: меню → игра → выход для каждой игры из games/

games/<id>/                  @ig/game-<id> — одна игра, полностью автономная
  package.json               свои зависимости
  manifest.ts                id, название, эмодзи, 2d/3d, возраст
  src/index.ts(x)            export default defineGame({ mount(container, sdk) { … } })
  server/index.ts            (необязательно) Fastify-плагин игры
  tests/

platform/
  sdk/                       @ig/sdk — контракт игры: GameManifest, GameSdk, defineGame, валидация манифеста
  server/                    @ig/server — Fastify: health, профили, каталог, подключение серверов игр

tools/
  game-template/             шаблон новой игры
  create-game.mjs            corepack pnpm new-game <id> "Название"
  check-boundaries.mjs       линтер границ (corepack pnpm lint)
```

## Правила

1. Игра не импортирует другую игру, `shell` или `@ig/server`. С платформой связь только через `@ig/sdk`. Это проверяет `corepack pnpm lint`.
2. Shell и сервер не знают игры по именам: каталог собирается из манифестов. Добавили папку — игра появилась в меню и в API. Удалили — пропала, остальное работает.
3. Игра получает от оболочки только SDK: `manifest`, `profile`, `api` (запросы только в свой префикс `/api/games/<id>`), `storage` (localStorage с ключами игры), `audio` (общий выключатель звука), `exit()`.
4. `id` в манифесте совпадает с именем папки. Битый манифест не роняет каталог: игра пропускается, ошибка пишется в лог.
5. Код, который нужен только одной игре, живёт в её папке. В `platform/` попадает только то, что нужно всем.

## Новая игра

```bash
corepack pnpm new-game puzzle-animals "Пазлы с животными"
corepack pnpm install
corepack pnpm dev
```

Шаблон — холст без зависимостей. Движок (Pixi, Three, React…) добавляется в `package.json` самой игры. Ненужную папку `server/` можно удалить.

## API

Платформа:

| Метод | Путь | Что делает |
|---|---|---|
| GET | `/api/health` | проверка живости |
| GET | `/api/games`, `/api/games/:id` | каталог игр из манифестов |
| GET/POST | `/api/profiles`, GET `/api/profiles/:id` | профили детей (`{ name, avatar? }`) |

Игры (каждая под своим префиксом `/api/games/<id>`):

| Метод | Путь | Что делает |
|---|---|---|
| GET/POST | `/api/games/drawing/drawings` (`?profileId=`) | сохранённые рисунки (`{ profileId, title?, image: "data:image/png;base64,..." }`) |
| GET/DELETE | `/api/games/drawing/drawings/:id` | один рисунок |

## Подключение БД

Меняются только `*.repository.ts`: платформенные в `platform/server/src/modules/`, игровые в `games/<id>/server/`. Сигнатуры уже асинхронные, маршруты трогать не нужно.
