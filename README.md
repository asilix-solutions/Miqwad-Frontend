# Maqwad (مقود) — Frontend

> Saudi car-services platform — Arabic-first, RTL, multi-role provider dashboards.  
> منصة مقود لخدمات السيارات — واجهة ويب عربية أولى، متعددة الأدوار.

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss)

---

## Overview

**Maqwad** is a Saudi-market marketplace that connects vehicle owners with car-service providers — workshops (ورشة), parts dealers (تاجر), and scrap yards (تشليح). The frontend is a fully client-side SPA built in React 19 + TypeScript, served behind a mock API today and designed for seamless swap to a .NET REST backend.

The project ships three distinct dashboard surfaces under one codebase:

- **Super-Admin panel** — platform operators review and approve providers, manage subscriptions, revenue, ads, notifications, complaints, and audit logs.
- **Service Provider dashboards** — separate, polished dashboards for each provider type (Dealer, Workshop, Scrap) sharing a common `provider-ui` library.
- **Provider onboarding** — multi-step registration flow (account → documents → review → approval gate).

End-user / customer routes (`/app/*`) are currently frozen and will be re-enabled in a future sprint.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React | ^19.2.6 |
| Language | TypeScript (strict) | ~6.0.2 |
| Build tool | Vite | ^8.0.12 |
| Routing | React Router DOM | ^7.15.1 |
| Global state | Redux Toolkit + react-redux | ^2.12.0 / ^9.3.0 |
| Server state | TanStack React Query | ^5.100.11 |
| HTTP | Axios | ^1.16.1 |
| Forms | React Hook Form + @hookform/resolvers | ^7.78.0 / ^5.4.0 |
| Validation | Zod | ^4.4.3 |
| UI primitives | Radix UI (Dialog, Toast, Avatar, Dropdown, Label, Slot) | ^1.x |
| Component variants | Class Variance Authority (CVA) + clsx + tailwind-merge | ^0.7.1 / ^2.1.1 / ^3.6.0 |
| Styling | Tailwind CSS v4 + `@theme` CSS tokens | ^4.3.0 |
| i18n | i18next + react-i18next | ^26.2.0 / ^17.0.8 |
| Icons | lucide-react | ^1.16.0 |
| Charts | Recharts | ^3.8.1 |
| Maps | Leaflet + react-leaflet | ^1.9.4 / ^5.0.0 |
| Toast notifications | Sonner | ^2.0.7 |
| Linting | ESLint 10 + typescript-eslint | ^10.3.0 / ^8.59.2 |
| Formatting | Prettier + prettier-plugin-tailwindcss | ^3.8.3 / ^0.8.0 |

---

## Architecture

### Modular feature layout

Each domain concern is self-contained under `src/modules/<feature>/`:

```
src/
├── app/                        # Bootstrap: store, router, providers, i18n
│   ├── i18n.ts                 # ar + en trees (edit by hand only)
│   ├── router.tsx              # Full route tree with lazy-loaded pages
│   ├── store.ts                # Redux root (auth, vehicles, providers, discovery)
│   └── providers.tsx           # Provider stack: Redux → QueryClient → i18n → Toast → Router
│
├── modules/
│   ├── admin/                  # Super-admin panel (P0/P1 — complete)
│   ├── ads/                    # Admin ads & campaign management
│   ├── audit/                  # Admin audit log
│   ├── auth/                   # Login, OTP, register, complete-profile, profile
│   ├── complaints/             # Admin complaints hub
│   ├── dealer/                 # Dealer (تاجر) provider dashboard — products, orders, shipments, dues
│   ├── discovery/              # Nearby services & provider public profiles (frozen)
│   ├── notifications/          # Admin notifications hub
│   ├── providers/              # Provider registration + onboarding flow
│   ├── scrap/                  # Scrap (تشليح) provider dashboard — part-requests, offers, conversations
│   ├── services/               # Service categories (read-only, end-user — frozen)
│   ├── settings/               # Admin settings hub
│   ├── subscriptions/          # Admin subscriptions & plans hub
│   ├── vehicles/               # Vehicle CRUD (end-user — frozen)
│   └── workshop/               # Workshop (ورشة) provider dashboard — conversations, subscription, profile
│
├── shared/
│   ├── auth/                   # PermissionGuard
│   ├── components/             # Shared UI: layout shells, feedback states, ui primitives
│   ├── guards/                 # ProtectedRoute, GuestRoute
│   ├── hooks/                  # Cross-module hooks
│   ├── lib/                    # axios instance, queryClient, storage, utils
│   ├── mocks/                  # Mock API server (13 handler files)
│   ├── provider-ui/            # Shared provider dashboard components (reused by dealer/workshop/scrap)
│   └── types/                  # PaginatedResponse<T>, ApiResponse, AppError, etc.
│
└── styles/globals.css          # Tailwind v4 @theme tokens (colors, radius, shadows, typography)
```

### State strategy

- **Redux Toolkit** — global session/UI state: auth tokens, filter preferences, multi-step form drafts.
- **TanStack Query** — all server data: lists, details, mutations with cache invalidation. Never mix the two.

### Path aliases

| Alias | Resolves to |
|---|---|
| `@/*` | `src/*` |
| `@app/*` | `src/app/*` |
| `@modules/*` | `src/modules/*` |
| `@shared/*` | `src/shared/*` |
| `@styles/*` | `src/styles/*` |

### Route-level code splitting

All page components are loaded via `React.lazy()` generating per-page Vite chunks. Suspense boundaries sit at the layout shell level so only the content area shows a spinner on navigation — the sidebar and header stay mounted.

---

## Roles & Routing

| Role | Guard | Root path | Key pages |
|---|---|---|---|
| `super_admin` / `admin` | `RoleGuard + PermissionGuard` | `/admin` | dashboard, providers, users, subscriptions, revenues, ads, notifications, complaints, audit, settings |
| `provider` (Dealer) | `RoleGuard + DealerGuard` | `/provider/dealer` | dashboard, products, orders, orders/:id, shipments, dues |
| `provider` (Workshop) | `RoleGuard + WorkshopGuard` | `/provider/workshop` | dashboard, conversations, subscription, profile |
| `provider` (Scrap) | `RoleGuard + ScrapGuard` | `/provider/scrap` | dashboard, part-requests, part-requests/:id, my-offers, conversations, subscription, profile |
| Any authenticated | `ProtectedRoute` | `/provider/onboarding` | account → documents → review |
| Guest | `GuestRoute` | — | `/login`, `/verify-otp`, `/register` |

The root `/` performs a role-aware redirect to the correct home. An unmatched path redirects to `/login`.

---

## Design System

### Brand tokens (`src/styles/globals.css` — Tailwind v4 `@theme`)

| Token | Value | Usage |
|---|---|---|
| `--color-brand-orange` | `#F45E2B` | Primary CTA buttons, active accents |
| `--color-brand-orange-hover` | `#E3460F` | Pressed / hover state |
| `--color-brand-blue` | `#043168` | Auth panel background, secondary brand |
| `--color-app-bg` | `#F5F6FA` | Page background |
| `--color-surface` | `#FFFFFF` | Cards, panels |
| `--color-surface-2` | `#FAFAFC` | Subtle inner surfaces |
| `--color-divider` | `#ECECF1` | Separators |
| `--color-ink-body` | `#0F1222` | Primary text |
| `--color-muted` | `#7A7E95` | Secondary / placeholder text |
| `--color-success-500` | `#1F9D55` | Success states |
| `--color-warning-500` | `#E88C1C` | Warning states |
| `--color-danger-500` | `#D92D20` | Error / destructive states |
| `--color-info-500` | `#2E7CD6` | Informational states |

### Radius scale

| Token | Value |
|---|---|
| `--radius-xs` | 8px |
| `--radius-sm` | 12px |
| `--radius-md` | 16px |
| `--radius-lg` | 20px |
| `--radius-xl` | 24px |
| `--radius-2xl` | 28px |
| `--radius-pill` | 999px |

### Typography & sizing

- **Display font:** IBM Plex Sans Arabic (headings)
- **Body font:** Tajawal
- **Input height:** `--size-input-h: 3rem` (48px)
- **Shadow tiers:** `--shadow-1` → `--shadow-3` + `--shadow-brand` (orange glow for CTA buttons)

### Provider UI identity

Provider dashboards are intentionally distinct from the dense admin tables: airy whitespace, generous radii, orange as an action accent (not large backgrounds), hybrid table/card layout (table on desktop, cards on mobile), tasteful CSS motion (150–250ms, respects `prefers-reduced-motion`).

---

## Internationalization & RTL

- **ar + en** via `i18next` with parallel key trees in `src/app/i18n.ts`.
- `i18n.ts` is edited **by hand only** — never by scripts or sed. Both `ar` and `en` objects must be kept in sync for every key.
- The document root is `dir="rtl"` by default; LTR is applied per-locale on language switch.
- **RTL rule:** use only Tailwind logical properties — `ps`/`pe`/`ms`/`me`/`start`/`end`. Never `pl`/`pr`/`ml`/`mr`.
- Validation messages are bilingual (ar + en) defined in Zod schemas.

---

## Getting Started

### Prerequisites

- Node.js (recommend LTS ≥ 20)
- npm (lockfile: `package-lock.json`)

### Install & run

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start dev server (http://localhost:5173)
npm run dev
```

### All scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then Vite production build |
| `npm run build:nocheck` | Vite build without type-check (CI fast path) |
| `npm run typecheck` | `tsc -b --noEmit` — zero-output means clean |
| `npm run lint` | ESLint across the whole project |
| `npm run format` | Prettier write (all files) |
| `npm run format:check` | Prettier check (CI) |
| `npm run preview` | Serve the production bundle locally |

> **Before every push:** run `npm run typecheck` and confirm zero errors.

---

## Mock Backend & Test Accounts

The app runs entirely against an in-process mock API (13 Axios-interceptor handler files under `src/shared/mocks/`). This is the de-facto API contract for the planned .NET backend — UI and hooks stay unchanged when the real backend ships; only the `api/` layer switches.

### Enabling / disabling mocks

```env
# .env
VITE_USE_MOCKS=true          # use in-process mock handlers (default for local dev)
VITE_API_BASE_URL=https://…  # only needed when VITE_USE_MOCKS=false
```

### Test login accounts

All accounts use OTP `123456` (or the last 6 digits of the phone number).

| Role | Phone | Provider type | Notes |
|---|---|---|---|
| Super Admin | `500000000` | — | Full admin access |
| Provider | `501110007` | Dealer (تاجر) | Pre-approved, seeded with products & orders |
| Provider | `501110008` | Workshop (ورشة) | Pre-approved, seeded with profile & subscription |
| Provider | `501110010` | Scrap (تشليح) | Pre-approved, seeded with part-requests & offers |
| Customer | any 9-digit phone starting with `5` | — | New account created on first OTP verify |

> **Stale data?** Clear `maqwad.*` keys from `localStorage` in the browser console and reload — the seed self-heals on version bump.

---

## Conventions

### TypeScript

- **No `any`** — strict mode enforced; `noUnusedLocals`, `noUnusedParameters` are on.
- **Named exports only** — no default exports anywhere.
- **File-level JSDoc comment** at the top of every new file.

### API contracts (.NET-ready)

- `camelCase` fields
- String enums (no numeric enums)
- ISO-8601 date strings
- `id: string` on the frontend
- SAR amounts as plain `number`
- List endpoints return `PaginatedResponse<T>` (defined in `src/shared/types/`)

### Component patterns

- **Radix Select:** never use `value=""` — use `"all"` as the default filter sentinel.
- **Defer-mount dialogs:** `{open && <Dialog />}` — unmount on close, don't just hide.
- **Query hooks are silent** — no toasts inside hooks; toasts live in UI components.
- **Mutations invalidate** the matching query-key factory after success.
- **Loading / Error / Empty states** are mandatory on every data-fetching surface.

### Branches & commits

- Feature branch per task → PR to `main`.
- Conventional commits: `feat(dealer): …`, `fix(auth): …`, `chore: …`.
- **Never auto-commit** — run `npm run typecheck`, show output, then stop for visual review before committing.

---

## Status & Roadmap

### Complete

| Area | Status |
|---|---|
| Super-Admin panel (P0/P1) | Done & merged |
| Auth flows (login, OTP, register, complete-profile) | Done |
| Provider onboarding (multi-step) | Done |
| Dealer dashboard (products, orders, shipments, dues) | Done |
| Workshop dashboard (profile, subscription, conversations) | Done |
| Scrap dashboard (part-requests, offers, conversations, subscription, profile) | Done |
| Design system tokens & provider-ui shared library | Done |
| Route-level code splitting (20+ lazy pages) | Done |

### Pending

| Area | Notes |
|---|---|
| Real .NET backend integration | Change `api/` layer only — UI/hooks isolated |
| End-user / customer routes (`/app/*`) | Frozen; re-enable when customer web app is needed |
| External chat / conversations wiring | Conversations UI exists; external service integration pending |
| Production mock-tree shaking | Remove mock handlers from production bundle |
| Automated tests | No test suite yet; highest long-term risk |

---

## License

Proprietary / internal — Asilix Solutions. No open-source license. Do not distribute.
