# Sakura Snack — CLAUDE.md

## Project overview

A browser-based catching mini-game with a Japanese cherry-blossom aesthetic. Players tap falling petals and snacks on a fixed 400×700 canvas during a 60-second round, then submit their email to enter the leaderboard. Built as a Next.js 14 App Router app deployable to Vercel.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS with custom `sakura-*` colour palette |
| Animation | Framer Motion (screen transitions) |
| State | Zustand (`src/store/gameStore.ts`) |
| Game loop | Native Canvas 2D + `requestAnimationFrame` (`src/game/`) |
| Backend | Next.js Route Handlers (`src/app/api/`) |
| Database | Supabase (Postgres + RLS) |
| Rate limiting | Upstash Redis |
| Anti-cheat | HMAC session tokens + server-side score validation |
| Unit tests | Vitest |
| E2E tests | Playwright |

## Repository layout

```
src/
  app/
    api/
      session/start/    – mint HMAC token for a new game session
      score/submit/     – validate and persist final score
      email/submit/     – collect email + consent
      leaderboard/      – public top-scores read
      admin/export/     – CSV export (service-role only)
    admin/              – admin dashboard page
    page.tsx            – root; renders screen router
  components/screens/   – one component per game screen
  game/
    GameEngine.ts       – RAF loop, canvas draw, entity management
    entities/           – Petal.ts, Snack.ts
    systems/            – Spawner.ts, Input.ts (tap detection)
  lib/
    hmac.ts             – session token signing/verification
    rateLimit.ts        – Upstash Redis helpers
    supabase/           – client.ts (browser), server.ts (service role)
  schemas/              – Zod schemas for all API request/response bodies
  store/gameStore.ts    – Zustand store (screen, score, session token)
supabase/migrations/    – SQL migration files (run via Supabase CLI)
tests/
  unit/                 – Vitest unit tests
  e2e/                  – Playwright end-to-end tests
```

## Development commands

```bash
npm run dev        # start Next.js dev server (localhost:3000)
npm run build      # production build
npm run lint       # ESLint
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright e2e tests
```

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
HMAC_SECRET=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ADMIN_API_KEY=
```

## Database

Run migrations against your Supabase project:

```bash
supabase db push   # or apply supabase/migrations/001_initial.sql manually
```

All tables (`sessions`, `scores`, `emails`) have RLS enabled. The anon role can only read `scores`; everything else requires the service role key.

## Game canvas

The logical canvas is fixed at **400 × 700 px** — do not change these constants without updating `GameEngine.ts`, the phone-frame wrapper in `page.tsx`, and any entity spawn/boundary logic.

## Anti-cheat

Every game session is backed by a server-minted HMAC token. Score submission verifies the token signature and rejects scores with impossible timing or event counts. Do not weaken or bypass these checks.

## Key conventions

- All API request/response shapes are defined as Zod schemas in `src/schemas/` — add a schema before adding a new route.
- Screens are driven by the `screen` field in Zustand; use `useGameStore` to transition between them.
- Tailwind custom colours (`sakura-50` through `sakura-600`) are defined in `tailwind.config.ts`.
