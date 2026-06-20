# CLAUDE.md — Maqwad (مقود) Frontend

Project rules and context for Claude Code. Read this fully before any task.

## What this project is
Maqwad (مقود): a Saudi car-services platform, **Arabic-first, RTL**. We are building
responsive web dashboards. Super Admin panel is done. Current focus: **Service Provider
dashboards**, starting with the **Dealer (تاجر / new-parts e-commerce vendor)**.
Workshop (ورشة) and Scrap (تشليح) providers come later and will REUSE provider UI.

## Working model (important)
- The human relays prompts written by an external architect (Claude Opus). You (Claude
  Code / Sonnet) execute precisely within the architect's decisions.
- **Golden rule: DIAGNOSE BEFORE BUILD.** Bigger tasks start read-only, then build.
- **Never auto-commit.** After a build: run tsc, show output, list files, then STOP for
  human visual review. The human gives the commit message.
- Visual review is mandatory because `tsc` does NOT catch: raw i18n keys, Radix
  `value=""`, recharts dataKey mismatches, runtime param bugs, RTL breaks.

## Tech stack
React 19 + TypeScript (strict) + Vite + React Router v7 + Redux Toolkit (global state
only) + TanStack Query v5 (server state) — never mix. react-hook-form + zod (schemas in
`schemas/`). Radix + CVA + clsx + tailwind-merge. lucide-react icons only. i18next.
MSW-style mocks under `src/shared/mocks/` (de-facto API contract for a future .NET backend).
Tailwind CSS v4 with `@theme` tokens in `src/styles/globals.css`.

## Architecture
- Modular: `src/modules/<feature>/{api,components,hooks,pages,schemas,store,types.ts}`.
- Shared/reusable: `src/shared/`. Provider-shared UI lives in `src/shared/provider-ui/`
  (reused by dealer/workshop/scrap) — NOT inside any single module.
- Never put feature-specific code in shared; never duplicate shared utilities in modules.
- Aliases: `@/`→src, `@modules/`, `@shared/`, `@app/`.
- Register routes in `src/app/router.tsx`; Redux slices in `src/app/store.ts`.

## Hard rules
- **Named exports only.** No default exports.
- **File-level JSDoc** comment atop every new file.
- **No `any`.** Strict, well-typed TS. Reuse existing types (PaginatedResponse, etc.).
- **RTL: logical props only** — ps/pe/ms/me/start/end. NEVER pl/pr/ml/mr.
- **All strings via i18n** (no hardcoded text). Validation messages bilingual (ar+en).
- **i18n.ts (`src/app/i18n.ts`) edited BY HAND ONLY** — never scripts/sed/regex/node -e.
  It has parallel `ar` and `en` trees; keep keys in BOTH, in the correct namespace.
- **Radix Select:** never `value=""` — use `"all"` as default filter value.
- **Defer-mount dialogs:** `{open && <Dialog/>}`.
- **Query hooks are silent;** toasts live in UI components, not hooks.
- **Mutations invalidate** the right query keys (follow existing key-factory patterns).
- For large files, **rewrite the whole file** in one edit — no fuzzy multi-replace.
- After any build task: run `npx tsc -b --noEmit` and **show the real output**.

## Contract conventions (.NET-ready)
camelCase fields, string enums (no numeric), ISO-8601 date strings, `id: string` in
frontend, SAR money as plain number. List endpoints return `PaginatedResponse<T>`.
Backend integration later = change the api layer only (UI/hooks isolated).

## PROTECTED ZONES — never modify
In `AuthLayout.tsx`: the `MaqwadLogo` SVG, the left-panel radial-gradient overlay, and
`style={{ backgroundColor: "#043168" }}` on the aside.
Guard/routing files (DealerGuard, RoleGuard, router.tsx) — do not change when only
re-skinning UI.

## Design tokens (source: globals.css @theme)
Brand orange `--color-brand-orange` #F45E2B (hover #E3460F). Brand blue `--color-brand-blue`
#043168. App-bg #F5F6FA, surface #FFFFFF, surface-2, divider #ECECF1, ink-body #0F1222,
muted #7A7E95. Semantic: success/warning/danger/info. Radius: xs8/sm12/md16/lg20/xl24.
`--size-input-h` 48px. Fonts: IBM Plex Sans Arabic (main), Tajawal (brand). Currency SAR (ر.س).

## Provider UI identity (distinct from Admin)
Admin = dense, administrative, packed tables. **Provider = airy, warm, polished, modern.**
Soft shadows, generous whitespace, larger radii, orange as ACTION/accent (not big
backgrounds), hybrid display (tables on desktop, cards on mobile), friendly empty states,
tasteful light motion (150–250ms, respect `prefers-reduced-motion`). Pure CSS animation.

## Test logins (mock)
Super admin: phone 500000000, OTP 123456. Dealer: phone 501110007, OTP 123456 (approved).
Mock self-heals via seed-version keys; if data looks stale, clear `maqwad.*` from
localStorage in the browser console and reload.

## Done / in progress
P0/P1 admin: done & merged. Dealer (branch `dealer-products`): logic layer (types/api/
mock/hooks), dealer area (type-aware routing, DealerLayout/Guard, approval gate),
products page (list + CRUD + filters + status badges). NEXT: a distinct Provider design
system, then re-skin dealer pages, then orders/shipments/dues.