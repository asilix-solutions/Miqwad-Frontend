# Probe + Read-Only Inspection — Working Hours Wiring (Workshop & Scrap)

Repo: `Miqwad-Frontend`, branch `Develop`. Date: 2026-08-18. Strictly read-only —
no source edits, no commits. Live probe run against `https://miqwad-test.runasp.net`
using two JWTs supplied by the architect (WorkshopOwner id 32, SalvageSpecialist id 40).

---

## 1. PROBE VERDICT

### 1.1 Format: plain ASCII strings, stored verbatim, no normalization

`PUT /api/profile/working-days` body `{"workingDays":"Sat-Thu","workingHours":"09:00-18:00"}`
→ **200**, echoed and persisted verbatim (confirmed via a follow-up `GET /api/profile`):

```json
{"success":true,"message":"تم تحديث أيام العمل بنجاح.",
 "data":{"workingDays":"Sat-Thu","workingHours":"09:00-18:00","id":32,
 "fullName":"TestWorkshope1","email":"TestWorkshope1@gmail.com",
 "phoneNumber":"598745185","address":null,"city":null,
 "identityNumber":null,"emailConfirmed":true,"isActive":true},"errors":null}
```

Both fields are free-form `string?` (swagger `UpdateWorkingDaysRequestDto`: `workingDays`
and `workingHours`, both `nullable, maxLength 200`, `additionalProperties:false`). No
enum, no day-of-week list, no time-format validation server-side — **any string up to
200 chars is accepted**. The dropdown-only UI constraint from the task brief is a
front-end decision, not something the backend enforces or expects in a particular shape.

### 1.2 🚫 Arabic text is silently corrupted — ASCII/Latin values only

Sending Arabic (`"السبت-الخميس"` / `"٨ ص - ٦ م"`) returned **200** but the value came
back as literal question marks, both in the PUT response and a subsequent GET:

```json
{"workingDays":"?????-??????","workingHours":"? ? - ? ?", ...}
```

This is a backend/DB column encoding issue (non-Unicode column, e.g. `varchar` not
`nvarchar`) — not a client-side rendering artifact, since the corruption is echoed back
and persists across a fresh GET. **Conclusion: the two fields must be sent as ASCII**
(e.g. English day abbreviations `Sat`, `Sun`… and 24h `HH:mm` times). Arabic day/hour
labels shown in the UI must be a **client-side display mapping only** (dropdown value →
ASCII code sent to the API; label → Arabic text rendered from i18n), never sent verbatim
to this endpoint. This is the single most important finding for the Select-option design.

Restored to `"Sat-Thu"` / `"09:00-18:00"` afterward so the test account isn't left with
mangled data.

### 1.3 The PUT is field-focused for the REST of the profile, but NOT a merge for its own two fields

Unlike the dealer `PUT /api/profile` (which requires `fullName` and — per the task
brief — risked clobbering other fields), `/working-days` does **not** touch
`fullName`/`email`/`phoneNumber`/`address`/`city`/`identityNumber` — confirmed by diffing
GET before/after (all unchanged across every PUT in this probe).

However, **omitting one of the two target fields sets it to `null`**, it does not
preserve the previous value:

```
PUT {"workingDays":"Fri-Wed"}   (workingHours omitted)
→ 200, data.workingHours: null   (previously "09:00-18:00")
```

**So the frontend must always send BOTH `workingDays` and `workingHours` together** on
every save — there is no partial-update semantics for this pair, even though the rest
of the profile is untouched. This matters for the unified-range UI: the mutation payload
must always be `{ workingDays, workingHours }` as a pair, never one alone.

### 1.4 🔴 CRITICAL: the endpoint is currently WorkshopOwner-only — Scrap is rejected

```
PUT /api/profile/working-days   (SalvageSpecialist token, id 40)
→ 400 {"success":false,"data":null,
       "message":"فقط أصحاب الورش يمكنهم تحديد أيام العمل."}
       ("Only workshop owners can set working days.")
```

This directly contradicts the task's stated goal of wiring **both** Workshop and Scrap
to this endpoint. As it stands today, **Scrap cannot use `PUT /api/profile/working-days`
at all** — the backend has an explicit role check that excludes `SalvageSpecialist`.
This is a backend gap, not a frontend design question, and must be flagged to the
architect/backend team before any Scrap-side wiring is attempted. Wiring Workshop now
and leaving Scrap on its current mock/free-text state (pending a backend fix) is the
only viable near-term path.

### 1.5 GET /api/profile: role-dependent field presence

- **Workshop** GET always includes `workingDays`/`workingHours` keys (currently `null`
  until first set).
- **Scrap** GET does **not** include `workingDays`/`workingHours` keys at all (not even
  as `null`) — consistent with §1.4: the backend appears to genuinely have no such
  concept wired for the Scrap/SalvageSpecialist role yet.

### 1.6 Auth / role notes

- No-token PUT → `401` (empty body).
- Backend role constant for scrap is **`SalvageSpecialist`**, not `ScrapOwner` — matches
  `src/modules/auth/register/providerRole.ts:6` (`Dealer=2, WorkshopOwner=3,
  SalvageSpecialist=4`) and `auth.adapter.ts` role maps. No naming mismatch on the
  frontend side, just confirming the live JWT `role` claim agrees with existing code.
- Only one candidate format needed testing beyond the first (Arabic) — the comma-list
  alternative was not needed since the first candidate was accepted verbatim and the
  Scrap block was hit first at the role-check layer, before format even mattered.

---

## 2. Current working-hours UI (mock only, not wired to any endpoint)

### Workshop — 7-day structured grid, `WorkshopProfilePage.tsx`
- Types: `src/modules/workshop/types.ts:19-29` — `DayOfWeek` = `sat|sun|mon|tue|wed|thu|fri`,
  `DayHours { isClosed, open?, close? }` (`"HH:mm"` strings), `WeeklyHours = Record<DayOfWeek, DayHours>`.
- Default/mock data: `WorkshopProfilePage.tsx:67,88-96` (also duplicated in
  `src/shared/mocks/handlers/workshop.handlers.ts:125-130`).
- Form: react-hook-form + zod, field path `workingHours.${day}.{isClosed|open|close}`.
- Edit-mode render: `WorkshopProfilePage.tsx:698-790` — per-day pill toggle for
  `isClosed` + two native `<input type="time">` per day (NOT a Select — plain HTML time
  input), plus an "apply to all" button (`:227-239`) that copies the first open day's
  times to the rest.
- View-mode render: `:793-813`.
- API wiring: `useWorkshopProfileQuery` / `useUpdateWorkshopProfileMutation`
  (`src/modules/workshop/hooks/useWorkshopQueries.ts:17-28`) → `workshopApi.getProfile`/
  `updateProfile` → `GET/PUT /workshop/profile` (`src/modules/workshop/api/workshopApi.ts:17-25`).
  **This is a `workshop/*`-prefixed path**, which per `src/shared/mocks/server.ts:36-58,158`
  is in the **always-mocked** list — it never reaches the live backend regardless of
  `VITE_USE_MOCKS`.

### Scrap — single free-text field, NOT a range, `ScrapProfilePage.tsx`
- Type: `src/modules/scrap/types.ts:45` — `workingHoursLabel?: string | null` (one plain
  string, no structured open/close).
- Render: `ScrapProfilePage.tsx:579-599` — a single `ProviderInput` bound to
  `workingHoursLabel` in edit mode; plain text display otherwise. File header comment at
  line 13 confirms: "Working Hours — single free-text label (no 7-day schedule)".
- API wiring: analogous `scrap/*`-prefixed endpoint, **also always-mocked**
  (`server.ts:36-58`) — never reaches the live backend today.

### Shared vs separate
**Nothing is shared today.** Workshop and Scrap each have independent types, independent
mock data, independent render code, and neither currently calls the real
`/api/profile/working-days` endpoint — both `workshop/profile` and `scrap/profile` are
separate always-mocked routes untouched by this new endpoint. Given the task's target
model (unified day-range + hours-range, "like the scrap screenshot"), a shared
`WorkingHoursRangeEditor` component (day-range Select + hours-range Select, emitting
`{ workingDays, workingHours }` strings) is a natural fit for `@shared/provider-ui/` and
could be reused wholesale by Workshop (replacing its 7-day grid with the unified model
per the task brief) and Scrap (replacing its free-text input) — see §6.

---

## 3. Where new hook/API/type additions go (additive)

- **Types**: extend `AccountProfile` in `src/modules/profile/types.ts:13-20` with
  `workingDays: string | null` and `workingHours: string | null` — additive, matches the
  live GET shape confirmed in §1.5 for Workshop (Scrap omits the keys entirely, so the
  adapter must default to `null` there too, which `?? null` already does safely).
- **API**: add `updateWorkingDays(payload: { workingDays: string | null; workingHours: string | null }): Promise<AccountProfile>`
  to `profileApi` in `src/modules/profile/api/profileApi.ts:51-73`, calling
  `apiClient.put("/profile/working-days", payload)` and running the result through the
  existing `adaptProfile` (extended per above). This sits naturally next to
  `updateProfile` since it's the same `/profile` surface, real backend, not mocked.
- **Adapter**: extend `RawAccountProfile` (`profileApi.ts:22-31`) with optional
  `workingDays?`/`workingHours?` and `adaptProfile` (`:39-49`) with `data.workingDays ?? null`
  / `data.workingHours ?? null`.
- **Hook**: add `useUpdateWorkingDaysMutation` in
  `src/modules/profile/hooks/useProfileQueries.ts`, mirroring
  `useUpdateAccountProfileMutation` (`:24-33`) — same `profileKeys.detail()` invalidation
  on success, no toast (toasts stay in the UI components per project convention).
- Given §1.4, **only the Workshop page can safely wire this today**. The Scrap page
  should NOT be pointed at `/api/profile/working-days` until the backend removes/extends
  the `WorkshopOwner`-only role check — attempting it will 400 for every Scrap user.

---

## 4. Reusable Select primitive + time-option convention

- `src/shared/provider-ui/ProviderSelect.tsx` — Radix `Select` wrapper already used
  project-wide. Props: `value` (never `""` — use `"all"` or a real value),
  `onValueChange`, `options: {value, label, disabled?}[]`, `placeholder?`, `label?`,
  `error?`, `disabled?`, `id?`. No i18n inside the component — callers pass pre-translated
  labels. This is the correct primitive for both the day-range dropdown and the
  hour-range dropdown(s).
- **No existing time-option-list generator** anywhere in the codebase — the only
  precedent for time input is Workshop's native `<input type="time">`
  (`WorkshopProfilePage.tsx:746-778`). A dropdown-based time picker (e.g. 30-minute
  increments "06:00".."23:30" built with `ProviderSelect`) would be a **new pattern**,
  not a reuse of an existing one — worth building once in `provider-ui` given both pages
  need it.
- Given §1.1/§1.2, dropdown *option values* should be ASCII day codes (`Sat`..`Fri`) and
  `HH:mm` 24h strings; dropdown *labels* are the Arabic display text from i18n. The two
  Select values get joined client-side into the two API strings (e.g. day-range
  `${startDay}-${endDay}`, hours-range `${startTime}-${endTime}`) before the PUT.

---

## 5. i18n key gaps

Two independent namespaces exist today, **no shared one**:

- `workshop.profile.*` (ar/en) — has full day names (`days.sat`..`days.fri`),
  `isOpen`/`isClosed`/`openTime`/`closeTime`/`applyToAll`/`workingHoursSection` — built
  for the per-day grid model, not the unified-range model the task wants.
- `scrap.profile.*` (ar/en) — only has `workingHoursSection`/`workingHoursLabel`/
  `workingHoursPlaceholder` (all built around the free-text input) — **no day-name keys
  at all**.

For the new unified-range model, needed additions (additive, both `ar` and `en` trees,
by hand per CLAUDE.md rule):
- A day-range Select needs day-name keys for Scrap (`scrap.profile.days.*`, mirroring
  Workshop's) if Scrap goes ahead, or the day keys should be lifted into a **shared**
  namespace (e.g. `providerUi.days.*`) since Workshop already has them and a shared
  component would want one source of truth rather than duplicating `days.sat` in three
  places.
- New shared strings for the range pickers themselves: something like
  `providerUi.workingHours.fromDay`/`toDay`/`fromTime`/`toTime`/`workingDaysLabel`/
  `workingHoursLabel` — none of these exist under a shared key today.
- A floating `workingHoursPlaceholder` key exists at `i18n.ts:339` (ar) / `:2884` (en)
  outside both provider namespaces — worth checking for staleness/duplication before
  adding new keys nearby, rather than assuming it's available for reuse.

---

## 6. Injection points, blast radius, and safest additive plan

| # | File | Lines | Change | Blast radius |
|---|------|-------|--------|---------------|
| 1 | `src/modules/profile/types.ts` | 13-20 | Add `workingDays`, `workingHours` to `AccountProfile` | None — additive fields, all existing consumers destructure named fields |
| 2 | `src/modules/profile/api/profileApi.ts` | 22-31, 39-49, 51-73 | Extend `RawAccountProfile`, `adaptProfile`, add `updateWorkingDays` | None — new export, existing exports unchanged |
| 3 | `src/modules/profile/hooks/useProfileQueries.ts` | ~24-33 | Add `useUpdateWorkingDaysMutation` | None — new hook |
| 4 | `src/shared/provider-ui/` | new file | New `WorkingHoursRangeEditor` (day-range + hours-range, built on `ProviderSelect`) | None — new shared component, opt-in |
| 5 | `src/app/i18n.ts` | new keys under existing/shared namespace | Add range-picker + (if Scrap proceeds) day-name keys | None if purely additive; **must be hand-edited** per CLAUDE.md |
| 6 | `WorkshopProfilePage.tsx` | replaces 698-813 region (per-day grid) | Swap 7-day grid for unified-range editor + wire to real `useUpdateWorkingDaysMutation` instead of mock `useUpdateWorkshopProfileMutation` | **Moderate** — this page currently persists to the always-mocked `workshop/profile` route; switching its working-hours section to the real `/profile/working-days` endpoint while the rest of the page (address, contact, etc.) may still be mock-backed needs care to avoid a split-brain save (two different mutations on one form) |
| 7 | `ScrapProfilePage.tsx` | 579-599 | **Do not wire yet** — blocked by §1.4 | N/A until backend allows `SalvageSpecialist` on this endpoint |

**Safest sequencing**: (a) land the additive type/api/hook layer (items 1-3) — zero risk,
no UI change; (b) build the shared `WorkingHoursRangeEditor` component in isolation
(item 4) with Storybook-less manual testing against the Workshop page only; (c) re-skin
Workshop's working-hours section to use it and the real mutation (item 6), leaving the
rest of `WorkshopProfilePage`'s save flow untouched; (d) leave Scrap exactly as-is
(mock free-text) until the backend team confirms `/working-days` will accept
`SalvageSpecialist`, then repeat step (c) for Scrap.
