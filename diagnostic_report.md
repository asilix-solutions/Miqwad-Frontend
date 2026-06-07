# Onboarding Flow — Diagnostic Report

> **DIAGNOSTIC ONLY** — No files were modified.

---

## 1. ROUTER STRUCTURE

**File:** [router.tsx](file:///d:/maqwad-frontend-project/src/app/router.tsx)

### Provider Onboarding branch (lines 289–325)

```tsx
// L289-325
// Provider onboarding — full-width layout, no AppLayout chrome
{
  path: "/provider/onboarding",
  async lazy() {
    const { OnboardingLayout } = await import(
      "@modules/providers/onboarding/components/OnboardingLayout"
    );
    return { Component: OnboardingLayout };
  },
  children: [
    {
      element: <SuspenseOutlet />,
      children: [
        {
          index: true,                                    // ← index route
          element: <OnboardingLoadingPage />,
          handle: { onboardingStep: "loading" },          // ← step = "loading"
        },
        {
          path: "account",
          element: <OnboardingAccountPage />,
          handle: { onboardingStep: "account" },
        },
        {
          path: "documents",
          element: <OnboardingDocumentsPage />,
          handle: { onboardingStep: "documents" },
        },
        {
          path: "review",
          element: <OnboardingReviewPage />,
          handle: { onboardingStep: "review" },
        },
      ],
    },
  ],
},
```

- **Index route:** Yes — the `index: true` route renders `<OnboardingLoadingPage />`. No `<Navigate>` redirect; it renders the loading page directly at `/provider/onboarding`.
- **handle values:** `"loading"` (index), `"account"`, `"documents"`, `"review"`.

### Provider area branch (lines 327–355) — separate from onboarding

```tsx
// L329-355
{
  path: "/provider",
  element: <AppLayout />,          // ← wrapped in AppLayout, not OnboardingLayout
  children: [
    {
      element: <SuspenseOutlet />,
      children: [
        { index: true, element: <Navigate to="services" replace /> },
        { path: "register", element: <ProviderRegisterPage /> },
        {
          element: <RoleGuard allow={["provider"]} />,   // ← RoleGuard for provider role
          children: [
            { path: "pending", element: <ProviderPendingPage /> },
            { path: "services", element: <ProviderServicesPage /> },
            ...
          ],
        },
      ],
    },
  ],
},
```

### Guard wrapping `/provider/onboarding`

> [!IMPORTANT]
> **No `RoleGuard` wraps `/provider/onboarding`.** It is only wrapped by `<ProtectedRoute />` (line 241). Any authenticated user — regardless of role — can access the onboarding flow. The `RoleGuard allow={["provider"]}` only wraps the `/provider/services` sub-tree (line 340), **not** the onboarding branch.

### Is `OnboardingLayout` the parent?

Yes — it is the `lazy()` element of the `/provider/onboarding` route (line 292–297). All four onboarding children render inside it via `<Outlet />`.

---

## 2. STEPPER LOGIC

### STEP_INDEX_MAP

**File:** [OnboardingLayout.tsx](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/components/OnboardingLayout.tsx)

```tsx
// L51-56
const STEP_INDEX_MAP: Record<OnboardingStepKey, OnboardingStep> = {
  account: 1,
  documents: 2,
  review: 3,
  loading: 4,    // ← "loading" maps to step 4 (the HIGHEST index!)
};
```

> [!CAUTION]
> **`"loading"` is mapped to step index `4`**, which is the last/highest step. This means when the loading page is active, the stepper thinks the user is on step 4.

### How `OnboardingLayout` derives `currentStep`

```tsx
// L62-68
export function OnboardingLayout() {
  ...
  const matches = useMatches();
  const currentStep = deriveCurrentStep(matches);
  ...
}

// L139-150
function deriveCurrentStep(
  matches: ReturnType<typeof useMatches>,
): OnboardingStep {
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    if (isOnboardingHandle(match.handle)) {
      return STEP_INDEX_MAP[match.handle.onboardingStep];
    }
  }
  // Fallback — child not yet loaded or no handle defined.
  return 1;
}
```

It walks `useMatches()` bottom-up, finds the deepest route with `handle.onboardingStep`, and looks it up in `STEP_INDEX_MAP`. For the loading page, this returns **`4`**.

### How `OnboardingStepper` decides "completed" vs "dashed"

**File:** [OnboardingStepper.tsx](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/components/OnboardingStepper.tsx)

```tsx
// L59
const nodes = [4, 3, 2, 1] as const;

// L68-71
{nodes.map((stepNum, idx) => {
  const isCompleted = stepNum < activeIndex;   // ← completed if stepNum < activeIndex
  const isActive = stepNum === activeIndex;    // ← active if equal

  // L80-81
  state={isCompleted ? "completed" : isActive ? "active" : "upcoming"}
```

When `activeIndex = 4` (loading page):
- Steps 1, 2, 3 → `isCompleted = true` (solid orange with check)
- Step 4 → `isActive = true` (orange ring)
- **Result:** ALL steps appear completed/active. This is BUG 2.

### Does the layout render `<OnboardingStepper>` unconditionally?

```tsx
// L74-88 (OnboardingLayout)
return (
  <div className="flex min-h-screen flex-col" ...>
    {/* ── Top stepper bar ─── */}
    <OnboardingStepper currentStep={currentStep} />    // ← ALWAYS rendered

    {/* ── Page content ─── */}
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
    ...
  </div>
);
```

**Yes — unconditionally rendered for ALL children, including the loading page.** There is no `if (currentStep !== 'loading')` guard.

---

## 3. LAYOUT HEIGHT

**File:** [OnboardingLayout.tsx](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/components/OnboardingLayout.tsx#L74-L88)

```tsx
// L74-88
<div
  className="flex min-h-screen flex-col"           // ← root wrapper: flex column, min-h-screen
  style={{
    backgroundColor: "var(--color-app-bg)",
    fontFamily: "var(--font-main)",
  }}
>
  <OnboardingStepper currentStep={currentStep} />  // ← stepper occupies some height

  <main className="flex-1 overflow-y-auto">        // ← Outlet wrapper: flex-1, overflow-y-auto
    <Outlet />
  </main>
  ...
</div>
```

The `<main>` wrapper has `flex-1` which should expand to fill remaining space. The root div has `min-h-screen` and `flex-col`.

---

## 4. LOADING PAGE

**File:** [OnboardingLoadingPage.tsx](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/pages/OnboardingLoadingPage.tsx#L73-L102)

```tsx
// L73-102
<div
  role="status"
  aria-live="polite"
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100%",            // ← minHeight: "100%" — NOT min-h-screen
  }}
>
```

> [!WARNING]
> The loading page uses `minHeight: "100%"` which resolves to 100% of the parent's **content height** — but the parent `<main>` gets its height from `flex-1`. The issue is that `flex-1` sets `flex: 1 1 0%` which gives the `<main>` a **flex-basis of 0**, not an explicit height. So `minHeight: "100%"` on the child resolves to `0%` of nothing — the div collapses to its content's intrinsic height, pushing the loader to the top.
>
> The loading page does **NOT** use `min-h-screen`, `h-full`, or any class-based sizing — only inline `style={{ minHeight: "100%" }}`.

---

## 5. FORK POINT — CompleteProfilePage

**File:** [CompleteProfilePage.tsx](file:///d:/maqwad-frontend-project/src/modules/auth/pages/CompleteProfilePage.tsx)

### Submit handler & navigation

```tsx
// L34-49
const onSubmit = form.handleSubmit(async (values) => {
  try {
    await mutation.mutateAsync({
      fullName: values.fullName,
      email: values.email || undefined,
      role: values.role,
    });
    toast.success(t("profile.saved"));
    const destination =
      values.role === "provider"
        ? "/provider/onboarding"              // ← navigates to onboarding for provider
        : "/app/dashboard";
    navigate(destination, { replace: true });  // ← replace navigation
  } catch (err) {
    toast.error(t("profile.saveFailed"), ...);
  }
});
```

### Account type field

```tsx
// L29
defaultValues: { fullName: "", email: "", role: "customer" },

// L32
const selectedRole = form.watch("role");

// L100
onClick={() => form.setValue("role", "customer")}

// L106
onClick={() => form.setValue("role", "provider")}
```

Field name: `role`, possible values: `"customer" | "provider"` (UI only offers these two).

### Reference to `/provider/onboarding`?

**Yes** — line 44: `? "/provider/onboarding"`.

### The critical issue — mock `updateProfile` and `isProfileComplete`

**File:** [auth.handlers.ts](file:///d:/maqwad-frontend-project/src/shared/mocks/handlers/auth.handlers.ts#L229-L243)

```tsx
// L229-243 (PUT /users/me mock)
const updated: MockUser = {
  ...me,
  fullName: body.fullName ?? me.fullName,
  email: body.email ?? me.email ?? null,
  role:
    body.role === "admin" && me.role !== "admin"
      ? me.role
      : ((body.role as MockUser["role"]) ?? me.role),
  isProfileComplete: Boolean(body.fullName && (body.role ?? me.role)),  // ← sets true
};
```

The mock **does** set `isProfileComplete: true`, and the mutation dispatches `setUser(updated)` into Redux (line 59 of [useAuthMutations.ts](file:///d:/maqwad-frontend-project/src/modules/auth/hooks/useAuthMutations.ts#L58-L60)).

**File:** [ProtectedRoute.tsx](file:///d:/maqwad-frontend-project/src/shared/guards/ProtectedRoute.tsx#L12-L25)

```tsx
// L20-22
if (user && !user.isProfileComplete && location.pathname !== "/complete-profile") {
  return <Navigate to="/complete-profile" replace />;
}
```

> [!IMPORTANT]
> After the `mutateAsync` call updates Redux state, `ProtectedRoute` re-evaluates. Because `isProfileComplete` is now `true`, the guard should **not** block. The `navigate("/provider/onboarding", { replace: true })` in the submit handler should work. However — there's a subtle **race condition**: `navigate()` is called *imperatively* inside the `try` block. If React re-renders `ProtectedRoute` synchronously after `dispatch(setUser(...))` but before `navigate()` fires, `ProtectedRoute` sees `isProfileComplete = true` and `location.pathname = "/complete-profile"` — which passes through. But if the user's role was just changed to `"provider"` and there are no guards on `/provider/onboarding`, the navigation should succeed.
>
> **The real suspect for BUG 3:** The user needs to clear localStorage mock data. If the mock user already has `isProfileComplete: true` from a previous session, `ProtectedRoute` never shows `/complete-profile` in the first place, and the submit handler may not be exercised. Alternatively, the mutation may be failing silently. Further runtime debugging is needed.

---

## 6. ROLE SOURCE

### Where `role` lives

**File:** [auth/types.ts](file:///d:/maqwad-frontend-project/src/modules/auth/types.ts#L6-L20)

```tsx
// L6
export type UserRole = "customer" | "provider" | "driver" | "admin";

// L15-28
export interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  email: string | null;
  role: UserRole;                // ← role field
  avatarUrl: string | null;
  isProfileComplete: boolean;
  providerId?: number | null;
  providerStatus?: ProviderStatus | null;
  providerRejectionReason?: string | null;
}
```

**File:** [authSlice.ts](file:///d:/maqwad-frontend-project/src/modules/auth/store/authSlice.ts#L5-L6)

```tsx
// L5-6
interface AuthState {
  user: User | null;       // ← role accessed via s.auth.user.role
```

### How `RoleGuard` reads the role

**File:** [RoleGuard.tsx](file:///d:/maqwad-frontend-project/src/shared/guards/RoleGuard.tsx#L38-L52)

```tsx
// L38-52
export function RoleGuard({ allow }: RoleGuardProps) {
  const user = useAppSelector((s) => s.auth.user);
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const location = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allow.includes(user.role)) {       // ← checks role in allow array
    return <Outlet />;
  }

  return <Navigate to={defaultHomeFor(user.role)} replace />;  // ← mismatch redirect
}
```

On mismatch, redirects to `defaultHomeFor(user.role)`:
- `"admin"` → `/admin/providers`
- `"provider"` → `/provider/services`
- `"customer"` / `"driver"` → `/app/dashboard`

---

## ROOT-CAUSE CONCLUSIONS

### BUG 1 — Loader squeezed to top, not vertically centered

The loading page's root `<div>` uses `style={{ minHeight: "100%" }}`, but its parent `<main className="flex-1">` has no explicit `height` property. `flex-1` translates to `flex: 1 1 0%` — the element *grows* to fill space but its resolved height isn't set as an explicit CSS `height`, so the child's `min-height: 100%` percentage reference resolves to **zero**. The div collapses to its content's intrinsic height, and the loader appears pinned to the top.

### BUG 2 — Stepper shows advanced state (step 3 completed) on loading screen

`STEP_INDEX_MAP` in [OnboardingLayout.tsx:L55](file:///d:/maqwad-frontend-project/src/modules/providers/onboarding/components/OnboardingLayout.tsx#L55) maps `"loading"` → `4`. When the loading page is active, `currentStep = 4`, so the stepper marks steps 1–3 as **completed** (solid orange checks) and step 4 as **active**. Additionally, the stepper is rendered **unconditionally** — there's no logic to hide it during the loading step.

### BUG 3 — Choosing "مزود خدمة" then saving doesn't navigate to onboarding

The `navigate("/provider/onboarding", { replace: true })` call at [CompleteProfilePage.tsx:L46](file:///d:/maqwad-frontend-project/src/modules/auth/pages/CompleteProfilePage.tsx#L46) *does* target the correct route and the mock *does* set `isProfileComplete: true`. The most likely cause is that the `updateProfile` mutation updates the user's `role` to `"provider"` in the mock, and after `setUser()` triggers a React re-render, `ProtectedRoute` passes — but the imperative `navigate()` may race with the state update. However, the more probable scenario is a **runtime error in the mutation** (e.g., the mock handler failing) that is caught silently, or **stale localStorage** causing `ProtectedRoute` to redirect before the submit handler runs. Runtime investigation with DevTools (Network/Console tab) is needed to confirm.
