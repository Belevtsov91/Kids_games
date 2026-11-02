# Interact Games

Игры для детей 3–15 лет. pnpm-воркспейс: каждая игра — отдельный пакет со своими зависимостями, кодом, сервером и тестами. Общий только экран выбора игр (`shell`) и маленькая платформа.

## Стек

- **shell:** TypeScript, Vite, React, react-router, PWA (vite-plugin-pwa).
- **игры:** что угодно на выбор игры: чистый DOM и Canvas, React, PixiJS + Howler (рисовалка), matter-js (космический садовник), Three.js + React Three Fiber + drei + Rapier (3D-игры).
- **сервер:** Node 24, TypeScript, Fastify (запуск через tsx). Вход родителя и профили детей — в Supabase (Postgres); данные игр пока в памяти сервера.
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

Для входа нужна БД: создайте проект Supabase, выполните `platform/server/migrations/*.sql` и заполните в `.env` `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и `SESSION_ENCRYPTION_KEY`. Без них сервер работает, но вход отвечает 503, а API игр — 401 (нет сессии).

## Структура

```
shell/                       @ig/shell — единственный общий экран: вход, профили детей, меню и запуск игр
  src/catalog/catalog.ts     каталог из games/*/manifest.ts (import.meta.glob), код игры — отдельный чанк
  src/host/GameHost.tsx      вызывает mount()/unmount() игры, pause/resume при скрытии вкладки
  src/host/createSdk.ts      SDK, который получает игра
  src/pages/                 Welcome, Login/Register, Children, Menu, Game
  src/styles/                стили по экранам (index.css собирает их по порядку)
  e2e/                       Playwright: вход и меню → игра → выход для каждой игры из games/

games/<id>/                  @ig/game-<id> — одна игра, полностью автономная
  package.json               свои зависимости
  manifest.ts                id, название, эмодзи, 2d/3d, возраст
  src/index.ts(x)            export default defineGame({ mount(container, sdk) { … } })
  server/index.ts            (необязательно) Fastify-плагин игры
  tests/

platform/
  sdk/                       @ig/sdk — контракт игры: GameManifest, GameSdk, defineGame, валидация манифеста
                             @ig/sdk/server — сессия игрока для серверов игр (childIdOf, requireChild…)
                             @ig/sdk/assets — типы импортов *.css, *.png, *.mp3…
  server/                    @ig/server — Fastify: health, вход, профили детей, каталог, подключение серверов игр
    migrations/              SQL для Supabase (таблицы ig_*)

tools/
  game-template/             шаблон новой игры
  create-game.mjs            corepack pnpm new-game <id> "Название"
  check-boundaries.mjs       линтер границ (corepack pnpm lint)

tsconfig.base.json           общие настройки TypeScript для игр
```

### Внутри игры

Папки в `src/` у всех игр называются одинаково — заглянув в любую, сразу ясно, где что:

| Папка | Что там |
|---|---|
| `app/` | контроллер: экраны, состояние, связывает всё остальное |
| `game/` | правила и данные без DOM и звука — то, что покрывают юнит-тесты |
| `ui/` | DOM или React-компоненты интерфейса |
| `scene/`, `render/` | 3D-сцена (React Three Fiber) или отрисовка на Canvas |
| `input/` | ввод: перетаскивание, клавиатура |
| `audio/` | звуки и речь |
| `api/`, `storage/` | сохранение: сервер игры или хранилище браузера |
| `styles/` | CSS по частям; `index.css` подключает их в нужном порядке |

Файл — одна ответственность и не больше 200 строк. Крупный модуль становится папкой с `index.ts`, который реэкспортирует публичное API (например, `space-gardener/src/game/simulation/`).

## Правила

1. Игра не импортирует другую игру, `shell` или `@ig/server`. С платформой связь только через `@ig/sdk`. Это проверяет `corepack pnpm lint`.
2. Shell и сервер не знают игры по именам: каталог собирается из манифестов. Добавили папку — игра появилась в меню и в API. Удалили — пропала, остальное работает.
3. Игра получает от оболочки только SDK: `manifest`, `profile`, `api` (запросы только в свой префикс `/api/games/<id>`), `storage` (localStorage с ключами игры), `audio` (общий выключатель звука), `exit()`.
4. `id` в манифесте совпадает с именем папки. Битый манифест не роняет каталог: игра пропускается, ошибка пишется в лог.
5. Код, который нужен только одной игре, живёт в её папке. В `platform/` попадает только то, что нужно всем.
6. Сервер игры узнаёт, чьи данные, только из сессии: `childIdOf(req)` / `requireChild` из `@ig/sdk/server`. `profileId` из запроса не принимается.

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
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | вход родителя; сессия — httpOnly-cookie |
| GET | `/api/auth/me` | родитель, его дети и выбранный ребёнок |
| POST | `/api/children` | новый профиль ребёнка (`{ name, age, avatar }`) |
| PUT | `/api/children/active` | выбрать, кто играет (`{ childId }`) |
| GET | `/api/games`, `/api/games/:id` | каталог игр из манифестов |

Игры — каждая под своим префиксом `/api/games/<id>`, данные выбранного ребёнка из сессии (без него — 401):

| Игра | Пути |
|---|---|
| drawing | GET/POST `/drawings`, GET/DELETE `/drawings/:id` |
| animal-orchestra | GET/POST `/melodies`, DELETE `/melodies/:id` |
| island-builder | GET/POST/DELETE `/island` |
| letter-eater | GET/POST `/progress` (без ребёнка — прогресс родителя) |
| space-gardener | GET/POST `/progress` |
| who-lives-where | GET/POST `/progress` |

## Подключение БД для игр

Данные игр пока в памяти сервера. Чтобы перенести их в БД, меняются только `games/<id>/server/repository.ts`: сигнатуры уже асинхронные, маршруты трогать не нужно.
