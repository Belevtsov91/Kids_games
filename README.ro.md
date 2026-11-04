# Interact Games

[Русский](README.md) · [Українська](README.uk.md) · **Română** · [English](README.en.md)

Jocuri pentru copii de 3–15 ani și un cabinet pentru adulți. Site-ul are patru limbi: rusă, ucraineană, română, engleză. Workspace pnpm: fiecare joc este un pachet separat, cu dependențele, codul, serverul și testele lui. Comune sunt doar învelișul (`shell`) și o platformă mică.

## Ce face site-ul

- **Autentificarea părintelui** și resetarea parolei prin e-mail. Un cont nou trece prin „configurarea într-un minut”: copilul, timpul pe zi, PIN-ul.
- **Profilurile copiilor.** Copilul se alege pe sine, iar panoul arată jocurile potrivite vârstei, „Continuă”, planul zilei de la adult, ursulețul Teo, decorul de sezon și salutul vocal al adultului.
- **Modul pentru cei mici** (până la 5 ani sau pornit de adult): fără butoane în plus, iar ieșirea din joc se face ținând butonul apăsat 2 secunde. Fără adult nu se poate schimba profilul sau deschide cabinetul.
- **Timpul:** limită zilnică, ore de liniște și pauze. Copilul poate cere mai mult timp, iar adultul răspunde în cabinet, din butonul din e-mail sau printr-un ajutor al familiei. Cu 2 minute înainte de final, jocul află și se încheie blând.
- **Progresul:** abilități (numărat, culori, forme, memorie…), niveluri și abțibilduri. Copilul vede albumul de abțibilduri, adultul vede abilitățile fiecărui copil.
- **Cabinetul părintelui** `/parent` (intrare cu o problemă + PIN): privire de ansamblu, profilul copilului, timp, acces la jocuri, statistici, abilități, confort (volum, mai puțină mișcare, butoane mari), galeria de desene, planul zilei, cereri, ajutoarele familiei (bunica răspunde prin linkul ei), e-mailuri și raport săptămânal, exportul datelor, ștergerea contului.
- **Alte pagini:** catalogul jocurilor cu fișe (ce dezvoltă, cum să jucați împreună), „Ce e nou”, ecranul „fără internet”, pagina 404.

Funcții plătite încă nu există.

## Jocuri

| Joc | id | Vârstă | Tip | Server |
|---|---|---|---|---|
| Teo merge la culcare | `sleepy-bear` | 3–5 | 2D | — |
| Cine unde locuiește | `who-lives-where` | 3–6 | 2D | ✓ |
| Orchestra animalelor | `animal-orchestra` | 3–6 | 2D | ✓ |
| Fă-ți rucsacul | `pack-backpack` | 3–6 | 2D | — |
| Atelierul formelor | `shape-workshop` | 3–6 | 2D | — |
| Căsuța emoțiilor | `emotion-house` | 3–7 | 2D | — |
| Numără și joacă | `counting` | 3–8 | 2D | — |
| Respiră cu dragonul | `dragon-breath` | 3–8 | 2D | — |
| Puzzle-uri | `puzzles` | 3–12 | 2D | — |
| Desenăm | `drawing` | 3–15 | 2D | ✓ |
| Grădina anotimpurilor | `seasons-garden` | 4–7 | 2D | — |
| Robotul bucătar | `robot-chef` | 4–8 | 2D | — |
| Trenulețul memoriei | `memory-train` | 4–8 | 2D | — |
| Atelierul de povești | `story-workshop` | 4–8 | 2D | — |
| Magazinul mic | `little-shop` | 5–8 | 2D | — |
| Cutia cu nisip 3D | `playground3d` | 5–15 | 3D | — |
| Mâncătorul de litere | `letter-eater` | 6–10 | 2D | ✓ |
| Grădinarul spațial | `space-gardener` | 6–10 | 2D | ✓ |
| Paznicii Văii Lunii | `moon-valley` | 7–15 | 3D | ✓ |
| Insula-constructor | `island-builder` | 10–15 | 3D | ✓ |

Jocurile fără server propriu își salvează progresul în cloudul platformei (`sdk.cloud`). `sdk.storage` e păstrat separat pentru fiecare copil și copiat automat în cloud, așa că salvările oricărui joc trec de pe un dispozitiv pe altul.

## Tehnologii

- **shell:** TypeScript, Vite, React, react-router, PWA (vite-plugin-pwa).
- **jocuri:** orice alege jocul: DOM și Canvas simple, SVG, React, PixiJS + Howler (desenat), matter-js (grădinarul spațial), Three.js + React Three Fiber + drei + Rapier (jocuri 3D). Vocea — Web Speech, sunetele — Web Audio.
- **server:** Node 24, TypeScript, Fastify (pornit prin tsx). Datele — în Supabase (Postgres); fiecare joc are tabelele lui. E-mail — Brevo.
- **teste:** Vitest (unitare și API), Playwright (e2e, desktop și telefon).

## Pornire

E nevoie de Node 24+. pnpm vine prin corepack, versiunea e fixată în `package.json`.

```bash
corepack pnpm install     # o dată și după adăugarea unui joc
corepack pnpm dev         # shell (http://localhost:5173) + server (http://localhost:3000)
corepack pnpm dev:shell   # doar clientul
corepack pnpm dev:server  # doar API
corepack pnpm lint        # granițe (jocurile nu se importă între ele) și mărimea fișierelor (≤ 200 de rânduri)
corepack pnpm typecheck   # tipurile în toate pachetele
corepack pnpm test        # teste unitare și API în toate pachetele
corepack pnpm test:e2e    # intrare, configurare, meniu → joc → ieșire pentru fiecare joc (Playwright)
corepack pnpm build       # lint + tipuri + build shell
```

Înainte de primul `test:e2e`, o singură dată: `corepack pnpm --filter @ig/shell exec playwright install chromium`.

În dev, Vite redirecționează `/api/*` spre `http://localhost:3000`. Setările serverului: copiați `platform/server/.env.example` în `platform/server/.env`.

### Baza de date

Creați un proiect Supabase și completați în `.env` `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` și `SESSION_ENCRYPTION_KEY`. Fără ele serverul merge, dar intrarea răspunde 503, iar API-ul jocurilor 401 (fără sesiune).

Migrările platformei (`platform/server/migrations/001–006`) și ale tuturor jocurilor se adună într-un singur script:

```bash
node tools/db-sql.mjs > all.sql
```

Conținutul `all.sql` se rulează în Supabase → SQL Editor. Scriptul e idempotent (`create … if not exists`): după o migrare sau un joc nou poate fi rulat din nou. Fără migrările 004 și 005 nu funcționează abilitățile, abțibildurile, salvările în cloud, confortul, ajutoarele, e-mailurile și planul zilei; fără 006 — schimbarea unică a profilului cu PIN-ul adultului.

### E-mail

E-mailurile (resetarea parolei, cererea copilului pentru timp cu butoanele „Da/Nu”, raportul săptămânal) se trimit prin **Brevo**. În `platform/server/.env` setați `MAIL_FROM_EMAIL` (expeditor confirmat în Brevo → Senders) și una dintre metode: SMTP (`SMTP_USER` de forma `xxxx@smtp-brevo.com` și `SMTP_PASSWORD` — cheia `xsmtpsib-…`) sau HTTP API (`BREVO_API_KEY` — cheia `xkeysib-…`). `APP_URL` — adresa site-ului pentru linkurile din e-mailuri. Cheile stau doar în `.env` și în variabilele de mediu ale găzduirii, nu în git.

Fără e-mail, în dev serverul scrie linkul de resetare în log, iar în producție (`NODE_ENV=production`) răspunde 503. Linkul de resetare e de unică folosință și valabil 30 de minute, butoanele din e-mailul cu cererea — 24 de ore. Raportul săptămânal îl trimite o sarcină de fundal a serverului real (`server.ts`); în teste ea nu pornește.

### Producție

Clientul — Vercel (`shell/vercel.json` trimite `/api` la server), serverul — Render. Variabilele serverului în producție:

- `NODE_ENV=production`, `COOKIE_SECURE=true`, `APP_URL=https://domeniul-tau`.
- `CORS_ORIGIN` — o adresă sau o listă separată prin virgulă (de exemplu, domeniul și previzualizările Vercel).
- `TRUST_PROXY` — câte proxy-uri sunt în fața serverului (implicit 2: Vercel și Render). De el depind IP-urile din limitele de cereri.
- `CRON_SECRET` — activează `POST /api/jobs/hourly` (rapoarte săptămânale) și `/api/jobs/daily` (curățenie) cu antetul `x-cron-secret`. E nevoie de el dacă Render gratuit adoarme serverul: atunci temporizatoarele interne nu pornesc și le trezește un cron extern.
- `VITE_API_URL` nu se setează pe Vercel: cererile merg pe același domeniu prin proxy, altfel cookie-ul sesiunii devine terț.

La pornire serverul scrie în log ce setări lipsesc.

## Structură

```
shell/                       @ig/shell — învelișul: intrare, profiluri, panou, cabinet, pornirea jocurilor
  src/app/App.tsx            rutele site-ului
  src/catalog/               catalogul din games/*/manifest.ts (import.meta.glob), coperți
  src/host/                  GameHost (mount/unmount, pause/resume, căderea jocului), createSdk, coada de progres, cloud
  src/auth/                  intrare, înregistrare, resetarea parolei (insula 3D)
  src/dashboard/             panoul /dashboard: cer, jocuri-portaluri, „Continuă”
  src/family/                planul zilei, ursulețul Teo, sarcina de acasă, decor de sezon, vocea adultului
  src/kid/                   profilul copilului /me, cronometru, „cere mai mult”, modul pentru cei mici, abțibilduri
  src/parent/                cabinetul /parent: ansamblu, copii, cereri, familie, cont
  src/more/                  configurare, album, răspuns din e-mail, ajutor, catalog, „Ce e nou”, 404
  src/i18n/                  textele învelișului în 4 limbi
  e2e/                       Playwright

games/<id>/                  @ig/game-<id> — un joc, complet autonom
  manifest.ts                id, titluri, emoji, 2d/3d, vârstă, abilități, abțibilduri, descriere
  src/index.ts(x)            export default defineGame({ mount(container, sdk) { … } })
  server/index.ts            (opțional) plugin Fastify al jocului; primește opts.db — BD doar la tabelele lui
  server/migrations/*.sql    tabelele jocului ig_game_<id>_*
  assets/cover.webp          copertă 960×640
  tests/

platform/
  sdk/                       @ig/sdk — contractul jocului: GameManifest, GameSdk, defineGame, abilități, validarea manifestului
                             @ig/sdk/server — sesiunea jucătorului pentru serverele jocurilor (childIdOf, requireChild, parentCanView)
  server/                    @ig/server — Fastify
    src/modules/auth/        intrare, înregistrare, resetarea parolei
    src/modules/children/    profilurile copiilor, protecția schimbării profilului
    src/modules/kid/         timp, pulsul jocului, cereri, statistici
    src/modules/progress/    progres, abțibilduri, salvări în cloud, rapoarte de erori
    src/modules/parent/      cabinet: copii, abilități, cereri, ajutoare, e-mailuri, configurare, export
    src/modules/notify/      e-mailuri despre cereri, răspunsuri prin link, raport săptămânal
    migrations/              SQL-ul platformei (tabele ig_*)

tools/
  game-template/, create-game.mjs   joc nou: corepack pnpm new-game <id> "Titlu"
  check-boundaries.mjs              linterul granițelor: importuri și tabele BD
  check-file-size.mjs               maximum 200 de rânduri într-un fișier de cod
  db-sql.mjs                        toate migrările într-un singur script

visual-lab/                  atelier de grafică: coperți, pictograme, galeria studio.html
```

### În interiorul unui joc

| Dosar | Ce conține |
|---|---|
| `app/` | controlerul: ecrane, stare, leagă restul |
| `game/` | reguli și date fără DOM și sunet — acoperite de testele unitare |
| `ui/` | componente DOM sau React ale interfeței |
| `scene/`, `scenes/`, `render/` | scena 3D, scenele jocului 2D sau desenarea pe Canvas |
| `audio/` | sunete și vorbire |
| `api/`, `storage/` | salvare: serverul jocului, cloudul platformei sau browserul |
| `i18n/` | texte și voce în 4 limbi |
| `styles/` | CSS pe părți; `index.css` le include în ordine |

Un fișier — o responsabilitate și maximum 200 de rânduri (verifică `corepack pnpm lint`; README și alte `.md` nu se verifică). Un modul mare devine un dosar cu `index.ts`.

## SDK-ul jocului

Jocul primește de la înveliș doar SDK-ul:

| Câmp | Ce este |
|---|---|
| `manifest`, `profile`, `locale` | manifestul, copilul (sau `null`), limba site-ului |
| `api` | cereri doar spre prefixul propriu `/api/games/<id>` |
| `storage` | localStorage cu cheile jocului și ale copilului, copie în cloudul platformei |
| `cloud` | salvări pe serverul platformei pe copil (pentru jocuri fără server propriu), până la 64 KB pe cheie |
| `audio` | comutatorul comun de sunet |
| `progress` | `level()`, `skill(skill, ok)`, `sticker(id)` — progres pentru album și cabinet |
| `time` | cât a rămas și `onEnding()` cu 2 minute înainte de final |
| `comfort` | volumul muzicii și efectelor, mai puțină mișcare, butoane mari, modul pentru cei mici |
| `exit()` | înapoi la meniu |

## Reguli

1. Un joc nu importă alt joc, `shell` sau `@ig/server`. Legătura cu platforma e doar prin `@ig/sdk`. Verifică `corepack pnpm lint`.
2. Shell-ul și serverul nu cunosc jocurile după nume: catalogul se construiește din manifeste. Ați adăugat un dosar — jocul apare în meniu și API. L-ați șters — dispare, restul merge.
3. `id`-ul din manifest coincide cu numele dosarului. Un manifest stricat nu strică catalogul: jocul e sărit, eroarea ajunge în log. Abilitățile și abțibildurile din manifest sunt verificate.
4. Codul necesar doar unui joc stă în dosarul lui. În `platform/` ajunge doar ce e necesar tuturor.
5. Serverul jocului află ale cui sunt datele doar din sesiune: `childIdOf(req)` / `requireChild` din `@ig/sdk/server`. `profileId` din cerere nu se acceptă.
6. Fiecare joc are tabelele lui `ig_game_<id>_*` (cratimele din id → `_`). Clientul `opts.db` aruncă o eroare la accesarea unui tabel străin, iar lint-ul verifică numele tabelelor. Singura legătură în afară — `child_id → ig_children(id) on delete cascade`.
7. Tabele noi ale platformei — doar printr-o migrare nouă (`007_…`), apoi se reface `all.sql`.

## Joc nou

```bash
corepack pnpm new-game puzzle-animals "Puzzle cu animale"
corepack pnpm install
corepack pnpm dev
```

Șablonul e o pânză fără dependențe. Motorul se adaugă în `package.json` al jocului. Dosarul `server/` inutil poate fi șters. Nu uitați titlurile în 4 limbi, abilitățile, abțibildurile și coperta `assets/cover.webp`.

## API

Platforma (toate căile sub `/api`):

| Metodă | Cale | Ce face |
|---|---|---|
| GET | `/health` | verificare |
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | intrarea părintelui; sesiune — cookie httpOnly |
| POST | `/auth/forgot`, `/auth/reset/check`, `/auth/reset` | resetarea parolei prin e-mail |
| GET | `/auth/me` | părintele, copiii lui și copilul ales |
| POST, PUT | `/children`, `/children/active` | profil nou, alegerea celui care joacă (la limită — doar cu adult) |
| GET | `/games`, `/games/:id` | catalogul jocurilor din manifeste |
| GET, POST | `/kid/status`, `/kid/beat`, `/kid/requests`, `/kid/stats` | timp, pulsul jocului, cereri, statistici |
| POST, GET | `/kid/progress`, `/kid/stickers`, `/kid/stickers/seen` | progres și albumul de abțibilduri |
| GET, PUT | `/kid/cloud/:gameId/:key` | salvările jocului în cloud (`null` șterge cheia) |
| DELETE | `/auth/account` | ștergerea contului: cont deschis și parolă |
| POST | `/jobs/hourly`, `/jobs/daily` | rapoarte săptămânale și curățenie pentru un cron extern, antet `x-cron-secret` |
| POST | `/errors` | raport despre căderea jocului |
| POST | `/answer`, `/helper`, `/helper/answer` | răspuns la cerere prin linkul din e-mail sau de la un ajutor |
| * | `/parent/*` | cabinet: intrare, ansamblu, copii, abilități, cereri, ajutoare, e-mailuri, planul zilei, PIN, cont, `/setup`, `/export` |

Jocurile — fiecare sub prefixul `/api/games/<id>`, datele copilului ales din sesiune (fără el — 401):

| Joc | Căi |
|---|---|
| drawing | GET/POST `/drawings`, GET/DELETE `/drawings/:id`; pentru cabinet `/parent/:childId[/:id]` |
| animal-orchestra | GET/POST `/melodies`, DELETE `/melodies/:id` |
| island-builder | GET/POST/DELETE `/island` |
| letter-eater | GET/POST `/progress` |
| space-gardener | GET/POST `/progress` |
| who-lives-where | GET/POST `/progress` |
| moon-valley | GET/POST/DELETE `/save` |

## Datele din BD

Platforma: părinți și sesiuni, copii și setările lor (timp, confort, planul zilei), timpul de joc, cereri, evenimente de progres (`ig_play_events`), abțibilduri (`ig_stickers`), salvări în cloud (`ig_cloud_saves`), ajutoarele familiei (`ig_helpers`).

| Joc | Tabel | Ce e într-un rând |
|---|---|---|
| drawing | `ig_game_drawing_drawings` | desen: titlu, PNG (data URL) |
| animal-orchestra | `ig_game_animal_orchestra_melodies` | melodie: titlu, note (jsonb); maximum 30 pe copil |
| island-builder | `ig_game_island_builder_islands` | insula copilului (jsonb), una pe copil |
| letter-eater | `ig_game_letter_eater_progress` | stele pe niveluri (smallint[]) |
| space-gardener | `ig_game_space_gardener_levels` | cele mai bune stele pe un nivel |
| who-lives-where | `ig_game_who_lives_where_progress` | nivelul și animalele găsite |
| moon-valley | `ig_game_moon_valley_saves` | starea văii (jsonb), una pe copil |

Toate tabelele sunt închise: RLS pornit, fără politici, drepturile pentru `anon`/`authenticated` retrase. Citește și scrie doar serverul cu cheia secretă. Depozitul jocului lucrează cu BD când platforma a dat `opts.db` și cu memoria procesului fără ea (teste, pornire fără Supabase).

## Ce s-a făcut în ramura 3.11.26/2

- Protecția schimbării profilului și modul pentru cei mici.
- SDK pentru progres, timp, cloud și confort; abilități, abțibilduri, migrarea 004.
- Cabinet: abilități, confort, galeria de desene, cereri, familie și ajutoare, e-mailuri despre cereri și raport săptămânal, exportul datelor.
- Pagini: configurare într-un minut, album de abțibilduri, răspuns din e-mail, ajutor, catalogul jocurilor, „Ce e nou”, „fără internet”, 404.
- Jocul „Teo merge la culcare”; abilități și abțibilduri în jocurile pentru 3–6 ani.
- Nouă jocuri noi: Robotul bucătar, Căsuța emoțiilor, Respiră cu dragonul, Atelierul formelor, Magazinul mic, Fă-ți rucsacul, Trenulețul memoriei, Atelierul de povești, Grădina anotimpurilor.
- Panoul: ursulețul Teo, planul zilei (migrarea 005), sarcina de acasă, decor de sezon, salutul vocal al adultului; sfaturi „Cum să jucați împreună”.
- README în patru limbi.
- Corecturi după audit: proxy și rate limit pe sesiune, schimbare unică de profil (migrarea 006), ștergerea contului cu parolă, PIN de la 7 ani, timp offline, cloud pentru `sdk.storage`, abțibild o singură dată, reușite în toate jocurile, mesajul „mai sunt 2 minute”, curățarea datelor vechi, endpointuri cron.
