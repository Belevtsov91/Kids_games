# Interact Games

Игры для детей 3–15 лет. pnpm-воркспейс: каждая игра — отдельный пакет со своими зависимостями, кодом, сервером и тестами. Общий только экран выбора игр (`shell`) и маленькая платформа.

## Стек

- **shell:** TypeScript, Vite, React, react-router, PWA (vite-plugin-pwa).
- **игры:** что угодно на выбор игры: чистый DOM и Canvas, React, PixiJS + Howler (рисовалка), matter-js (космический садовник), Three.js + React Three Fiber + drei + Rapier (3D-игры).
- **сервер:** Node 24, TypeScript, Fastify (запуск через tsx). Вход родителя, профили детей и сохранения игр — в Supabase (Postgres); у каждой игры свои таблицы.
- **тесты:** Vitest (юнит и API), Playwright (e2e).

## Запуск

Нужен Node 24+. pnpm идёт через corepack, версия закреплена в `package.json`.

```bash
corepack pnpm install     # один раз и после добавления игры
corepack pnpm dev         # shell (http://localhost:5173) + сервер (http://localhost:3000)
corepack pnpm dev:shell   # только клиент
corepack pnpm dev:server  # только API
corepack pnpm lint        # границы (игры не импортируют друг друга) и размер файлов (≤ 200 строк)
corepack pnpm typecheck   # типы во всех пакетах
corepack pnpm test        # юнит- и API-тесты всех пакетов
corepack pnpm test:e2e    # меню → игра → выход, десктоп и телефон (Playwright)
corepack pnpm build       # lint + типы + сборка shell
```

Перед первым `test:e2e` один раз: `corepack pnpm --filter @ig/shell exec playwright install chromium`.

В dev Vite проксирует `/api/*` на `http://localhost:3000`. Настройки сервера: скопируйте `platform/server/.env.example` в `platform/server/.env`.

Для входа нужна БД: создайте проект Supabase, выполните миграции и заполните в `.env` `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` и `SESSION_ENCRYPTION_KEY`. Без них сервер работает, но вход отвечает 503, а API игр — 401 (нет сессии).

Восстановление пароля («Забыли пароль?» на странице входа → письмо со ссылкой → `/reset#<токен>` → новый пароль) отправляет письма через **Brevo**. В `platform/server/.env` задайте `MAIL_FROM_EMAIL` (отправитель, подтверждённый в Brevo → Senders) и один из способов отправки: SMTP (`SMTP_USER` вида `xxxx@smtp-brevo.com` и `SMTP_PASSWORD` — SMTP-ключ `xsmtpsib-…`) или HTTP API (`BREVO_API_KEY` — ключ `xkeysib-…`). `APP_URL` — адрес сайта для ссылки в письме (в проде, например, `https://<ваш-домен>`). Ключи держим только в `.env` и в переменных окружения хостинга, в git не кладём. Без почты в dev сервер пишет ссылку для сброса в лог, а в проде (`NODE_ENV=production`) отвечает 503. Ссылка одноразовая и живёт 30 минут; после смены пароля все сессии родителя закрываются. Шаблон письма: `platform/server/src/modules/auth/reset/email/`.

Миграции — платформы и всех игр — собираются в один скрипт: `corepack pnpm db:sql > all.sql`, затем содержимое `all.sql` выполняется в Supabase → SQL Editor. Скрипт идемпотентный (`create … if not exists`): после добавления игры его можно просто выполнить ещё раз.

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
  server/index.ts            (необязательно) Fastify-плагин игры; получает opts.db — БД только к своим таблицам
  server/migrations/*.sql    таблицы игры ig_game_<id>_*
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
  check-boundaries.mjs       линтер границ (corepack pnpm lint): импорты и таблицы БД
  check-file-size.mjs        не больше 200 строк в файле кода (corepack pnpm lint)
  db-sql.mjs                 все миграции одним скриптом (corepack pnpm db:sql)

visual-lab/                  мастерская графики: обложки, иконки, векторные версии и галерея studio.html

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

Файл — одна ответственность и не больше 200 строк (это проверяет `corepack pnpm lint`; исключение — README и другие `.md`). Крупный модуль становится папкой с `index.ts`, который реэкспортирует публичное API и в комментарии перечисляет, что в каком файле (например, `space-gardener/src/game/simulation/`, `moon-valley/src/game/world/`). Большой CSS делится по частям экрана, а главный файл подключает их через `@import` в прежнем порядке.

В 3D-играх `scene/` тоже делится по смыслу. Пример — `moon-valley/src/scene/`: `environment/` (небо, свет, земля, трава), `village/` (пейзаж и места), `characters/` (герой, питомцы, жители, враги), `physics/`, `targeting/`, `models/`. Подробная карта игры — в её `README.md` (`games/moon-valley/README.md`, `games/counting/README.md`).

## Правила

1. Игра не импортирует другую игру, `shell` или `@ig/server`. С платформой связь только через `@ig/sdk`. Это проверяет `corepack pnpm lint`.
2. Shell и сервер не знают игры по именам: каталог собирается из манифестов. Добавили папку — игра появилась в меню и в API. Удалили — пропала, остальное работает.
3. Игра получает от оболочки только SDK: `manifest`, `profile`, `api` (запросы только в свой префикс `/api/games/<id>`), `storage` (localStorage с ключами игры), `audio` (общий выключатель звука), `exit()`.
4. `id` в манифесте совпадает с именем папки. Битый манифест не роняет каталог: игра пропускается, ошибка пишется в лог.
5. Код, который нужен только одной игре, живёт в её папке. В `platform/` попадает только то, что нужно всем.
6. Сервер игры узнаёт, чьи данные, только из сессии: `childIdOf(req)` / `requireChild` из `@ig/sdk/server`. `profileId` из запроса не принимается.
7. У каждой игры свои таблицы `ig_game_<id>_*` (дефисы в id → `_`), игры не делят таблицы между собой и не трогают таблицы платформы. Клиент `opts.db`, который платформа даёт серверу игры, бросает ошибку при обращении к чужой таблице, а `corepack pnpm lint` проверяет имена таблиц в коде сервера игры и в её миграциях. Единственная ссылка наружу — внешний ключ `child_id → ig_children(id) on delete cascade`: удалили профиль ребёнка — удалились и его сохранения во всех играх.

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
| letter-eater | GET/POST `/progress` |
| space-gardener | GET/POST `/progress` |
| who-lives-where | GET/POST `/progress` |
| moon-valley | GET/POST/DELETE `/save` |

## Сохранения игр в БД

| Игра | Таблица | Что в строке |
|---|---|---|
| drawing | `ig_game_drawing_drawings` | рисунок: название, PNG (data URL) |
| animal-orchestra | `ig_game_animal_orchestra_melodies` | мелодия: название, ноты (jsonb); не больше 30 на ребёнка |
| island-builder | `ig_game_island_builder_islands` | остров ребёнка (jsonb), один на ребёнка |
| letter-eater | `ig_game_letter_eater_progress` | звёзды по уровням (smallint[]) |
| space-gardener | `ig_game_space_gardener_levels` | лучшие звёзды за один уровень |
| who-lives-where | `ig_game_who_lives_where_progress` | уровень и найденные звери |
| moon-valley | `ig_game_moon_valley_saves` | состояние долины (jsonb), одно на ребёнка |

Таблицы закрыты так же, как таблицы платформы: RLS включён, политик нет, права у `anon`/`authenticated` отозваны. Читает и пишет только сервер с секретным ключом.

Репозиторий игры (`server/repository.ts`) работает с БД, когда платформа передала `opts.db`, и с памятью процесса, когда БД нет (юнит-тесты, запуск без Supabase). Маршруты от этого не зависят.

Новая игра с сохранениями: таблицы — в `games/<id>/server/migrations/*.sql` с префиксом `ig_game_<id>_`, доступ — через `opts.db.from('ig_game_<id>_…')`, потом `corepack pnpm db:sql` и выполнить в SQL Editor.
