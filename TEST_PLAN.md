# Sprint 0 + Sprint 1 — Adversarial Test Plan

**Target:** https://dist-eujshabe.devinapps.com/
**Scope:** Sprint 1 end-to-end auth flow + Sprint 0 plumbing assertions
**Method:** Browser GUI testing with recording

## What changed (user-visible)

Brand-new `maqwad-frontend` Vite/React/TS app. Sprint 1 introduces the
unauthenticated → authenticated journey on the web portal:

1. `/login` — Saudi phone entry with `+966` prefix
2. `/verify-otp` — 6-digit OTP with resend timer (mock accepts `123456`)
3. `/complete-profile` — Full name + optional email + role picker
4. `/app/dashboard` + `/app/profile` — authenticated shell with sidebar,
   profile edit, language toggle (AR↔EN with RTL flip), and logout

Behind the scenes: Redux Toolkit, Axios with refresh-token interceptor,
TanStack Query, React Hook Form + Zod, Tailwind v4 + custom design
tokens, i18next. Mock adapter handles `/auth/*` and `/users/me` until
the .NET backend ships them.

---

## Primary flow (must pass)

### T1 — Invalid phone is rejected client-side (no network call)
**Why:** A broken Zod wiring would let an invalid phone proceed to the
mock, returning a server error instead of an inline message.

Steps:
1. Open https://dist-eujshabe.devinapps.com/login (fresh localStorage)
2. Type `12345` into the phone field
3. Click **متابعة**

Pass criteria (must satisfy ALL):
- Inline red text under the phone input reads **"رقم الجوال غير صحيح"**
- Route stays at `/login` (URL bar still ends with `/login`)
- No toast appears (validation is inline only)

### T2 — Wrong OTP is rejected by mock, error surfaces to user
**Why:** A broken mock or a broken error handler would silently
navigate forward.

Steps:
1. From `/login`, enter `512345678`, click **متابعة**
2. URL must navigate to `/verify-otp`
3. Header must read `+966 512345678`
4. Enter OTP `999999`

Pass criteria:
- Red text inside the OTP card reads **"الرمز غير صحيح"** (the mock’s
  Arabic 400 INVALID_OTP message)
- URL stays at `/verify-otp`
- OTP boxes show a red border (`invalid` styling)

### T3 — Correct OTP routes through Complete-Profile to Dashboard
**Why:** The end-to-end happy path. A broken router, broken slice
persistence, or broken `isProfileComplete` guard would derail here.

Steps:
1. Continuing from T2: clear all OTP boxes, then type `123456`
2. The page auto-submits on the 6th digit (`onComplete` hook)
3. Expect redirect to `/complete-profile`
4. Type `Ahmed Test User` into the Full Name field
5. Click the **عميل** (Customer) tile so it shows the orange selected
   state (border-brand-500 ring)
6. Click **حفظ ومتابعة**

Pass criteria:
- After step 3, URL must be `/complete-profile`
- After step 6, URL must be `/app/dashboard`
- Sidebar shows brand-colored avatar with initial `A`, name
  `Ahmed Test User`, phone `512345678`
- A green toast at the bottom-left reads **"تم حفظ التغييرات بنجاح"**
- Direct navigation back to `/login` MUST redirect to `/app/dashboard`
  (proves `GuestRoute` recognizes authentication)

### T4 — Protected route bounces unauthenticated user
**Why:** A broken `ProtectedRoute` would expose private screens.

Steps:
1. Open DevTools console, run `localStorage.clear()`, then refresh
2. Manually navigate to `/app/profile`

Pass criteria:
- URL must redirect to `/login` (not `/app/profile` or 404)
- Dashboard sidebar/nav must NOT be visible

### T5 — Language toggle flips dir/lang and translates strings
**Why:** A broken `i18n.on("languageChanged", …)` listener would leave
`<html dir>` stuck at `rtl` or fail to update copy.

Steps:
1. Log in again (use the same flow from T1–T3; localStorage will have
   the mock user persisted, so phone `512345678` + OTP `123456` will
   re-enter the app)
2. From `/app/dashboard`, click the **EN** button at the bottom-left
   of the sidebar

Pass criteria (must satisfy ALL):
- Sidebar nav label changes from **الملف الشخصي** → **Profile**
- Dashboard heading changes from `أهلاً بك في مقود، ...` → contains
  "Welcome" / English copy
- DevTools: `document.documentElement.dir === "ltr"` and
  `document.documentElement.lang === "en"` (verify in console)
- Layout visually mirrors (sidebar moves to left side, text aligns
  left)
- Toggle button now reads **ع**

### T6 — Logout clears state and bounces back to /login
**Why:** A broken logout would leave tokens behind, letting back-button
navigation re-enter the app.

Steps:
1. While authenticated on `/app/dashboard`, click **تسجيل الخروج**
   (or **Sign out** if still in English from T5)

Pass criteria:
- URL becomes `/login` immediately
- Browser back button does NOT re-enter `/app/dashboard` (it should
  remain on `/login` because of `Navigate replace`)
- DevTools: `localStorage.getItem("maqwad.user")` is `null`
- The login screen renders an empty phone field

---

## Out of scope for this run
- Avatar upload (Sprint 2 will replace mock with real backend; visual
  presence already verified during ad-hoc smoke test)
- OTP resend timer countdown beyond 1 minute (covered by inspection
  of `useResendTimer.ts`)
- Mobile drawer behavior (visual only; web breakpoint is the focus)

## Evidence to capture
- One continuous screen recording covering T1 → T6
- Per-test annotations via `annotate_recording`
- Final screenshots for the test report (login error, OTP error,
  dashboard, EN/LTR state)
