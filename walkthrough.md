# Color System Unification & Button Migration

## Summary

Fixed the dual-color-system conflict in `globals.css` and migrated every CTA button to use the canonical brand orange (`#F45E2B`) via the shared `Button` component.

## TypeScript Verification

```
npx tsc -b --noEmit → 0 errors ✅
```

---

## Files Changed (10 total)

| # | File | What changed |
|---|------|-------------|
| 1 | [globals.css](file:///d:/maqwad-frontend-project/src/styles/globals.css) | Token system unified |
| 2 | [buttonVariants.ts](file:///d:/maqwad-frontend-project/src/shared/components/ui/buttonVariants.ts) | CVA primary/secondary/link variants + size |
| 3 | [LoginPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/LoginPage.tsx) | Raw button → `<Button>`, hex → CSS var |
| 4 | [RegisterPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/RegisterPage.tsx) | Raw button → `<Button>`, hex → CSS var |
| 5 | [OtpPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/OtpPage.tsx) | Raw button → `<Button>`, hex → CSS var |
| 6 | [OtpInput.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/components/OtpInput.tsx) | Focus ring hex → CSS var |
| 7 | [ProviderMapView.tsx](file:///d:/maqwad-frontend-project/src/modules/discovery/components/ProviderMapView.tsx) | Pin `#E84427` → `#F45E2B`, origin `#1A2A5E` → `#043168` |
| 8 | [AdminProvidersPage.tsx](file:///d:/maqwad-frontend-project/src/modules/admin/pages/AdminProvidersPage.tsx) | Removed `default export` (named only) |
| 9 | [server.ts](file:///d:/maqwad-frontend-project/src/shared/mocks/server.ts) | Console log color `#E84427` → `#F45E2B` |
| 10 | (not changed) [AuthLayout.tsx](file:///d:/maqwad-frontend-project/src/shared/components/layout/AuthLayout.tsx) | **PROTECTED** — logo SVG `#F45E2B`, aside `#043168`, radial gradient all left untouched |

---

## globals.css Token Changes

### Brand Orange Ramp (re-pointed to flamingo scale)

| Token | Before (legacy) | After (designer) |
|-------|-----------------|-------------------|
| `--color-brand-50` | `#fff1ed` | `#FFFBFA` |
| `--color-brand-100` | `#ffe2d9` | `#FFD9CF` |
| `--color-brand-200` | `#ffc4b3` | `#FDB8A5` |
| `--color-brand-300` | `#ffa589` | `#FB997B` |
| `--color-brand-400` | `#f97757` | `#F87B53` |
| `--color-brand-500` | `#e84427` ❌ | `#F45E2B` ✅ |
| `--color-brand-600` | `#d03a1e` | `#E3460F` |
| `--color-brand-700` | `#a8301a` | `#B63A0E` |

### Navy Ramp (re-pointed to tory-blue scale)

| Token | Before (legacy) | After (designer) |
|-------|-----------------|-------------------|
| `--color-navy-50` | `#eef1fa` | `#EEF1FA` |
| `--color-navy-100` | `#dce2f2` | `#53A3FF` |
| `--color-navy-200` | `#b4bee0` | `#3391FE` |
| `--color-navy-300` | `#8b9bce` | `#147FFC` |
| `--color-navy-400` | `#4a5ea0` | `#046EEC` |
| `--color-navy-500` | `#1a2a5e` ❌ | `#043168` ✅ |
| `--color-navy-600` | `#142250` | `#032755` |
| `--color-navy-700` | `#0e1838` | `#011D41` |

### Other Token Fixes

| Token | Before | After |
|-------|--------|-------|
| `--shadow-brand` | `rgba(232, 68, 39, 0.25)` | `rgba(244, 94, 43, 0.25)` |
| `--size-input-h` | `2.5rem` /* 56px */ | `3rem` /* 48px */ |
| `:focus-visible` outline | `var(--color-brand-500)` | `var(--color-brand-orange)` |

> [!NOTE]
> All flamingo/tory/semantic/typography/spacing tokens are **preserved**. `--color-brand-orange`, `--color-brand-orange-hover`, and `--color-brand-blue` remain as canonical CTA tokens.

---

## Button Migrations

### Buttons refactored from raw `<button>` to shared `<Button>`

| File | Button role | Before color | After |
|------|------------|-------------|-------|
| [LoginPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/LoginPage.tsx#L96-L106) | Submit CTA | `bg-[#F45E2B] hover:bg-[#E3460F]` | `<Button block>` → `bg-[var(--color-brand-orange)]` |
| [RegisterPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/RegisterPage.tsx#L165-L174) | Submit CTA | `bg-[#F45E2B] hover:bg-[#E3460F]` | `<Button block>` → `bg-[var(--color-brand-orange)]` |
| [OtpPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/OtpPage.tsx#L132-L144) | Verify CTA | `bg-[#F45E2B] hover:bg-[#E3460F]` | `<Button block>` → `bg-[var(--color-brand-orange)]` |

### Buttons already using `<Button>` — now correct via CVA update

| File | Button role | Before CVA color | After CVA color |
|------|------------|-----------------|-----------------|
| [CompleteProfilePage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/CompleteProfilePage.tsx#L109) | Save CTA | `bg-brand-500` (#E84427) | `bg-[var(--color-brand-orange)]` (#F45E2B) |
| [ProfilePage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/ProfilePage.tsx#L165) | Save CTA | `bg-brand-500` (#E84427) | `bg-[var(--color-brand-orange)]` (#F45E2B) |
| [ProviderPublicDetailsPage.tsx](file:///d:/maqwad-frontend-project/src/modules/discovery/pages/ProviderPublicDetailsPage.tsx#L249) | Book Now (disabled) | `bg-brand-500` (#E84427) | `bg-[var(--color-brand-orange)]` (#F45E2B) |
| [NearbyFilters.tsx](file:///d:/maqwad-frontend-project/src/modules/discovery/components/NearbyFilters.tsx#L180) | Apply & Close | `bg-brand-500` (#E84427) | `bg-[var(--color-brand-orange)]` (#F45E2B) |
| [RegisterStepServices.tsx](file:///d:/maqwad-frontend-project/src/modules/providers/components/RegisterStepServices.tsx#L82) | Next | `bg-brand-500` (#E84427) | `bg-[var(--color-brand-orange)]` (#F45E2B) |

### Non-CTA buttons using `bg-brand-*` utilities — now resolve to correct hues via token update

These are decorative/interactive elements (tabs, chips, toggles, badges, stepper) that use `bg-brand-50`, `bg-brand-500`, `text-brand-600` etc. as semantic colors. Since the underlying brand-* tokens are now re-pointed to the flamingo scale, all resolve correctly:

- [Stepper](file:///d:/maqwad-frontend-project/src/shared/components/ui/stepper.tsx) — completed-step fill, connector bar
- [AdminProvidersPage](file:///d:/maqwad-frontend-project/src/modules/admin/pages/AdminProvidersPage.tsx) — active tab pill
- [NearbyServicesPage](file:///d:/maqwad-frontend-project/src/modules/discovery/pages/NearbyServicesPage.tsx) — view mode toggle
- [NearbyFilters](file:///d:/maqwad-frontend-project/src/modules/discovery/components/NearbyFilters.tsx) — choice chips, active filter strip
- [OriginPicker](file:///d:/maqwad-frontend-project/src/modules/discovery/components/OriginPicker.tsx) — selected state
- [FavoriteButton](file:///d:/maqwad-frontend-project/src/modules/discovery/components/FavoriteButton.tsx) — favorited state
- [CompleteProfilePage](file:///d:/maqwad-frontend-project/src/modules/auth/pages/CompleteProfilePage.tsx) — RoleCard selected
- [AppLayout](file:///d:/maqwad-frontend-project/src/shared/components/layout/AppLayout.tsx) — sidebar brand icons, active nav
- [FileUpload](file:///d:/maqwad-frontend-project/src/shared/components/ui/fileUpload.tsx) — file icon, drag-over state
- [Badge](file:///d:/maqwad-frontend-project/src/shared/components/ui/badge.tsx) — brand tone
- [ServiceCategoryCard](file:///d:/maqwad-frontend-project/src/modules/services/components/ServiceCategoryCard.tsx) — orange variant
- [DashboardPlaceholderPage](file:///d:/maqwad-frontend-project/src/modules/auth/pages/DashboardPlaceholderPage.tsx) — icon container

### Hardcoded hex purges

| File | Element | Before | After |
|------|---------|--------|-------|
| [ProviderMapView.tsx](file:///d:/maqwad-frontend-project/src/modules/discovery/components/ProviderMapView.tsx#L36) | Provider pin SVG fill | `#E84427` | `#F45E2B` |
| [ProviderMapView.tsx](file:///d:/maqwad-frontend-project/src/modules/discovery/components/ProviderMapView.tsx#L53) | Origin dot background | `#1A2A5E` | `#043168` |
| [ProviderMapView.tsx](file:///d:/maqwad-frontend-project/src/modules/discovery/components/ProviderMapView.tsx#L93-L94) | Circle overlay color | `#1A2A5E` | `#043168` |
| [OtpInput.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/components/OtpInput.tsx#L88) | Focus ring | `#F45E2B` | `var(--color-brand-orange)` |
| [OtpPage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/OtpPage.tsx#L100) | Phone number text | `#043168` | `var(--color-brand-blue)` |
| [server.ts](file:///d:/maqwad-frontend-project/src/shared/mocks/server.ts#L53) | Console log | `#E84427` | `#F45E2B` |

### Protected elements (NOT touched)

- ✅ AuthLayout `MaqwadLogo` SVG — `fill="#F45E2B"` paths preserved
- ✅ AuthLayout aside — `style={{ backgroundColor: "#043168" }}` preserved  
- ✅ AuthLayout radial-gradient overlay div — preserved
