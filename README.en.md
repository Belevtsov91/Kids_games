# Interact Games

[Русский](README.md) · [Українська](README.uk.md) · [Română](README.ro.md) · **English**

Games for children aged 3–15 and a space for grown-ups. The site speaks four languages: Russian, Ukrainian, Romanian and English. It is a pnpm workspace: every game is its own package with its own dependencies, code, server and tests. Only the shell (`shell`) and a small platform are shared.

## What the site does

- **Parent sign-in** and password reset by email. A new account goes through a one-minute setup: child, daily time, PIN.
- **Child profiles.** The child picks themselves, and the dashboard shows games for their age, “Continue”, today’s plan from a grown-up, Teddy the bear, seasonal decorations and a voice greeting from a grown-up.
- **Toddler mode** (under 5, or switched on by a grown-up): no extra buttons, and leaving a game takes a 2-second hold. Switching profiles or opening the parent area needs a grown-up.
- **Time:** daily limit, quiet hours and breaks. A child can ask for more time, and a grown-up answers in the parent area, from a button in an email, or through a family helper. Two minutes before the end the game is told and wraps up gently.
- **Progress:** skills (counting, colours, shapes, memory…), levels and stickers. The child sees a sticker album; the grown-up sees each child’s skills.
- **Parent area** `/parent` (a sum to solve + PIN): overview, child profile, time, game access, stats, skills, comfort (volume, reduced motion, big buttons), drawing gallery, day plan, requests, family helpers (grandma answers through her own link), emails and a weekly report, data export, account deletion.
- **Other pages:** a game catalogue with cards (what each game builds, how to play together), “What’s new”, an offline screen, a 404 page.

There are no paid features yet.

## Games

| Game | id | Age | Type | Server |
|---|---|---|---|---|
| Teddy’s Bedtime | `sleepy-bear` | 3–5 | 2D | — |
| Who Lives Where | `who-lives-where` | 3–6 | 2D | ✓ |
| Animal Orchestra | `animal-orchestra` | 3–6 | 2D | ✓ |
| Pack Your Bag | `pack-backpack` | 3–6 | 2D | — |
| Shape Workshop | `shape-workshop` | 3–6 | 2D | — |
| House of Feelings | `emotion-house` | 3–7 | 2D | — |
| Count & play | `counting` | 3–8 | 2D | — |
| Breathe with Dragon | `dragon-breath` | 3–8 | 2D | — |
| Puzzles | `puzzles` | 3–12 | 2D | — |
| Drawing | `drawing` | 3–15 | 2D | ✓ |
| Seasons Garden | `seasons-garden` | 4–7 | 2D | — |
| Robot Chef | `robot-chef` | 4–8 | 2D | — |
| Memory Train | `memory-train` | 4–8 | 2D | — |
| Story Workshop | `story-workshop` | 4–8 | 2D | — |
| Little Shop | `little-shop` | 5–8 | 2D | — |
| 3D Sandbox | `playground3d` | 5–15 | 3D | — |
| Letter Eater | `letter-eater` | 6–10 | 2D | ✓ |
| Space Gardener | `space-gardener` | 6–10 | 2D | ✓ |
| Keepers of Moon Valley | `moon-valley` | 7–15 | 3D | ✓ |
| Island Builder | `island-builder` | 10–15 | 3D | ✓ |

Games without their own server keep progress in the platform cloud (`sdk.cloud`). The shell keeps `sdk.storage` per child and copies it to the cloud, so every game’s saves move between devices.

## Stack

- **shell:** TypeScript, Vite, React, react-router, PWA (vite-plugin-pwa).
- **games:** whatever suits the game: plain DOM and Canvas, SVG, React, PixiJS + Howler (Drawing), matter-js (Space Gardener), Three.js + React Three Fiber + drei + Rapier (3D games). Voice via Web Speech, sounds via Web Audio.
- **server:** Node 24, TypeScript, Fastify (run with tsx). Data lives in Supabase (Postgres); each game has its own tables. Email via Brevo.
- **tests:** Vitest (unit and API), Playwright (e2e, desktop and phone).

## Running

You need Node 24+. pnpm comes through corepack; the version is pinned in `package.json`.

```bash
corepack pnpm install     # once, and after adding a game
corepack pnpm dev         # shell (http://localhost:5173) + server (http://localhost:3000)
corepack pnpm dev:shell   # client only
corepack pnpm dev:server  # API only
corepack pnpm lint        # boundaries (games don't import each other) and file size (≤ 200 lines)
corepack pnpm typecheck   # types in every package
corepack pnpm test        # unit and API tests in every package
corepack pnpm test:e2e    # sign-in, setup, menu → game → exit for every game (Playwright)
corepack pnpm build       # lint + types + shell build
```

Before the first `test:e2e`, run once: `corepack pnpm --filter @ig/shell exec playwright install chromium`.

In dev, Vite proxies `/api/*` to `http://localhost:3000`. Server settings: copy `platform/server/.env.example` to `platform/server/.env`.

### Database

Create a Supabase project and fill in `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SESSION_ENCRYPTION_KEY` in `.env`. Without them the server still runs, but sign-in returns 503 and game APIs return 401 (no session).

Platform migrations (`platform/server/migrations/001–006`) and all game migrations are combined into one script:

```bash
node tools/db-sql.mjs > all.sql
```

Run the contents of `all.sql` in Supabase → SQL Editor. The script is idempotent (`create … if not exists`), so after a new migration or game you can simply run it again. Without migrations 004 and 005, skills, stickers, cloud saves, comfort settings, helpers, emails and the day plan don’t work; without 006, the one-time profile switch with an adult’s PIN doesn’t.

### Email

Emails (password reset, a child’s time request with Yes/No buttons, the weekly report) are sent through **Brevo**. In `platform/server/.env` set `MAIL_FROM_EMAIL` (a sender verified in Brevo → Senders) and one way of sending: SMTP (`SMTP_USER` like `xxxx@smtp-brevo.com` and `SMTP_PASSWORD`, an `xsmtpsib-…` key) or the HTTP API (`BREVO_API_KEY`, an `xkeysib-…` key). `APP_URL` is the site address used in email links. Keys live only in `.env` and the host’s environment variables, never in git.

Without email, in dev the server logs the reset link, and in production (`NODE_ENV=production`) it returns 503. A reset link works once and lasts 30 minutes; the buttons in a request email last 24 hours. The weekly report is sent by a background job of the real server (`server.ts`); it doesn’t run in tests.

### Production

Client on Vercel (`shell/vercel.json` rewrites `/api` to the server), server on Render. Server variables in production:

- `NODE_ENV=production`, `COOKIE_SECURE=true`, `APP_URL=https://your-domain`.
- `CORS_ORIGIN`: one origin or a comma-separated list (for example, the domain and Vercel previews).
- `TRUST_PROXY`: how many proxies sit in front of the server (default 2: Vercel and Render). Rate-limit IPs depend on it.
- `CRON_SECRET`: enables `POST /api/jobs/hourly` (weekly reports) and `/api/jobs/daily` (cleanup) with an `x-cron-secret` header. Needed when free Render puts the server to sleep: internal timers stop firing, so an external cron wakes them.
- Leave `VITE_API_URL` unset on Vercel: requests go to the same domain through the rewrite, otherwise the session cookie becomes third-party.

On start the server logs which settings are missing.

## Structure

```
shell/                       @ig/shell — the shell: sign-in, profiles, dashboard, parent area, game launcher
  src/app/App.tsx            site routes
  src/catalog/               catalogue from games/*/manifest.ts (import.meta.glob), covers
  src/host/                  GameHost (mount/unmount, pause/resume, game crash), createSdk, progress queue, cloud
  src/auth/                  sign-in, sign-up, password reset (3D island)
  src/dashboard/             dashboard /dashboard: sky, game portals, “Continue”
  src/family/                day plan, Teddy the bear, at-home task, seasonal decor, grown-up’s voice
  src/kid/                   child profile /me, timer, “ask for more”, toddler mode, stickers
  src/parent/                parent area /parent: overview, children, requests, family, account
  src/more/                  setup, sticker album, answer from email, helper, catalogue, “What’s new”, 404
  src/i18n/                  shell texts in 4 languages
  e2e/                       Playwright

games/<id>/                  @ig/game-<id> — one fully self-contained game
  manifest.ts                id, titles, emoji, 2d/3d, ages, skills, stickers, description
  src/index.ts(x)            export default defineGame({ mount(container, sdk) { … } })
  server/index.ts            (optional) the game’s Fastify plugin; receives opts.db, limited to its own tables
  server/migrations/*.sql    the game’s tables ig_game_<id>_*
  assets/cover.webp          960×640 cover
  tests/

platform/
  sdk/                       @ig/sdk — the game contract: GameManifest, GameSdk, defineGame, skills, manifest checks
                             @ig/sdk/server — player session for game servers (childIdOf, requireChild, parentCanView)
  server/                    @ig/server — Fastify
    src/modules/auth/        sign-in, sign-up, password reset
    src/modules/children/    child profiles, profile-switch guard
    src/modules/kid/         time, game heartbeat, requests, stats
    src/modules/progress/    progress, stickers, cloud saves, crash reports
    src/modules/parent/      parent area: children, skills, requests, helpers, emails, setup, export
    src/modules/notify/      request emails, answers by link, weekly report
    migrations/              platform SQL (ig_* tables)

tools/
  game-template/, create-game.mjs   new game: corepack pnpm new-game <id> "Title"
  check-boundaries.mjs              boundary linter: imports and DB tables
  check-file-size.mjs               at most 200 lines per code file
  db-sql.mjs                        all migrations as one script

visual-lab/                  art workshop: covers, icons, studio.html gallery
```

### Inside a game

| Folder | What’s there |
|---|---|
| `app/` | controller: screens, state, wires everything together |
| `game/` | rules and data without DOM or sound — what unit tests cover |
| `ui/` | DOM or React interface components |
| `scene/`, `scenes/`, `render/` | 3D scene, 2D game scenes, or Canvas drawing |
| `audio/` | sounds and speech |
| `api/`, `storage/` | saving: game server, platform cloud, or browser |
| `i18n/` | texts and voice lines in 4 languages |
| `styles/` | CSS in parts; `index.css` imports them in order |

One file, one job, at most 200 lines (checked by `corepack pnpm lint`; README and other `.md` files aren’t checked). A large module becomes a folder with an `index.ts`.

## Game SDK

A game gets only the SDK from the shell:

| Field | What it is |
|---|---|
| `manifest`, `profile`, `locale` | manifest, the child (or `null`), site language |
| `api` | requests only to its own prefix `/api/games/<id>` |
| `storage` | localStorage keyed by game and child, copied to the platform cloud |
| `cloud` | per-child saves on the platform server (for games without a server), up to 64 KB per key |
| `audio` | the shared mute switch |
| `progress` | `level()`, `skill(skill, ok)`, `sticker(id)` — progress for the album and the parent area |
| `time` | time left and `onEnding()` two minutes before the end |
| `comfort` | music and effects volume, reduced motion, big buttons, toddler mode |
| `exit()` | back to the menu |

## Rules

1. A game doesn’t import another game, `shell` or `@ig/server`. It talks to the platform only through `@ig/sdk`. `corepack pnpm lint` checks this.
2. The shell and server don’t know games by name: the catalogue is built from manifests. Add a folder and the game appears in the menu and API. Delete it and it’s gone; everything else keeps working.
3. The manifest `id` matches the folder name. A broken manifest doesn’t break the catalogue: the game is skipped and the error is logged. Skills and stickers in the manifest are validated.
4. Code needed by one game lives in that game’s folder. Only what everyone needs goes into `platform/`.
5. A game server learns whose data it is only from the session: `childIdOf(req)` / `requireChild` from `@ig/sdk/server`. A `profileId` from the request is never accepted.
6. Each game has its own `ig_game_<id>_*` tables (dashes in the id → `_`). The `opts.db` client throws on another game’s table, and lint checks table names. The only outside link is `child_id → ig_children(id) on delete cascade`.
7. New platform tables only come with a new migration (`007_…`), then `all.sql` is rebuilt.

## New game

```bash
corepack pnpm new-game puzzle-animals "Animal puzzles"
corepack pnpm install
corepack pnpm dev
```

The template is a dependency-free canvas. An engine goes into the game’s own `package.json`. You can delete the `server/` folder if you don’t need it. Remember titles in 4 languages, skills, stickers and the `assets/cover.webp` cover.

## API

Platform (all paths under `/api`):

| Method | Path | What it does |
|---|---|---|
| GET | `/health` | liveness check |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | parent sign-in; the session is an httpOnly cookie |
| POST | `/auth/forgot`, `/auth/reset/check`, `/auth/reset` | password reset by email |
| GET | `/auth/me` | the parent, their children and the selected child |
| POST, PUT | `/children`, `/children/active` | new profile, choose who plays (over the limit, only with a grown-up) |
| GET | `/games`, `/games/:id` | game catalogue from manifests |
| GET, POST | `/kid/status`, `/kid/beat`, `/kid/requests`, `/kid/stats` | time, game heartbeat, requests, stats |
| POST, GET | `/kid/progress`, `/kid/stickers`, `/kid/stickers/seen` | progress and the sticker album |
| GET, PUT | `/kid/cloud/:gameId/:key` | a game’s cloud saves (`null` deletes the key) |
| DELETE | `/auth/account` | delete the account: open parent area and password |
| POST | `/jobs/hourly`, `/jobs/daily` | weekly reports and cleanup for an external cron, `x-cron-secret` header |
| POST | `/errors` | game crash report |
| POST | `/answer`, `/helper`, `/helper/answer` | answer a request from an email link or as a helper |
| * | `/parent/*` | parent area: sign-in, overview, children, skills, requests, helpers, emails, day plan, PIN, account, `/setup`, `/export` |

Games each live under their own prefix `/api/games/<id>`; the selected child’s data comes from the session (no child, 401):

| Game | Paths |
|---|---|
| drawing | GET/POST `/drawings`, GET/DELETE `/drawings/:id`; for the parent area `/parent/:childId[/:id]` |
| animal-orchestra | GET/POST `/melodies`, DELETE `/melodies/:id` |
| island-builder | GET/POST/DELETE `/island` |
| letter-eater | GET/POST `/progress` |
| space-gardener | GET/POST `/progress` |
| who-lives-where | GET/POST `/progress` |
| moon-valley | GET/POST/DELETE `/save` |

## Data in the database

Platform: parents and sessions, children and their settings (time, comfort, day plan), play time, requests, progress events (`ig_play_events`), stickers (`ig_stickers`), cloud saves (`ig_cloud_saves`), family helpers (`ig_helpers`).

| Game | Table | What a row holds |
|---|---|---|
| drawing | `ig_game_drawing_drawings` | a drawing: title, PNG (data URL) |
| animal-orchestra | `ig_game_animal_orchestra_melodies` | a tune: title, notes (jsonb); at most 30 per child |
| island-builder | `ig_game_island_builder_islands` | the child’s island (jsonb), one per child |
| letter-eater | `ig_game_letter_eater_progress` | stars per level (smallint[]) |
| space-gardener | `ig_game_space_gardener_levels` | best stars for one level |
| who-lives-where | `ig_game_who_lives_where_progress` | level and animals found |
| moon-valley | `ig_game_moon_valley_saves` | valley state (jsonb), one per child |

All tables are locked down: RLS on, no policies, `anon`/`authenticated` privileges revoked. Only the server with the secret key reads and writes. A game repository uses the database when the platform passes `opts.db`, and process memory without it (tests, running without Supabase).

## What branch 3.11.26/2 adds

- Profile-switch guard and toddler mode.
- SDK for progress, time, cloud and comfort; skills, stickers, migration 004.
- Parent area: skills, comfort, drawing gallery, requests, family and helpers, request emails and a weekly report, data export.
- Pages: one-minute setup, sticker album, answer from email, helper, game catalogue, “What’s new”, offline, 404.
- The game Teddy’s Bedtime; skills and stickers in the games for ages 3–6.
- Nine new games: Robot Chef, House of Feelings, Breathe with Dragon, Shape Workshop, Little Shop, Pack Your Bag, Memory Train, Story Workshop, Seasons Garden.
- Dashboard: Teddy the bear, day plan (migration 005), at-home task, seasonal decor, grown-up’s voice greeting; “How to play together” tips.
- README in four languages.
- Audit fixes: proxy hops and per-session rate limit, one-time profile switch (migration 006), account deletion with password, PIN from age 7, offline time, cloud copy of `sdk.storage`, sticker toast once, progress in every game, “2 minutes left” banner, cleanup of old data, cron endpoints.
