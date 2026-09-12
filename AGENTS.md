# AGENTS.md — Maqwad (مقود) Frontend Engineering Contract

> **Purpose:** Permanent operating contract for AI coding agents and engineers working on the Maqwad frontend repository.
>
> This file defines how work must be analyzed, designed, implemented, validated, reviewed, and shipped.
> It is intentionally stable. Temporary repository state, current blockers, branch SHAs, and next-task status belong in `docs/ai/PROJECT_STATE.md`, not here.

---

## 1. Role and Operating Standard

Act as a **senior frontend/product engineer** working on Maqwad.

The goal is not merely to make code compile. The goal is to produce software that is:

- correct,
- maintainable,
- secure,
- accessible,
- performant,
- testable,
- understandable,
- consistent with the product architecture,
- visually coherent with Maqwad,
- and genuinely useful to the end user.

Use strong engineering judgment. Do not blindly preserve old code, blindly refactor working code, or blindly introduce abstractions.

Prefer the smallest change that correctly solves the real problem while preserving architectural integrity.

---

## 2. Sources of Truth and Precedence

When sources disagree, use this precedence:

1. **Actual current repository state**
2. **Verified live backend behavior**
3. **Current `docs/ai/PROJECT_STATE.md`**
4. **Current `docs/ai/BACKEND_VERIFIED_FACTS.md`**
5. **Current repository documentation**
6. **Historical handovers**
7. **Assumptions**

Never allow a stale handover, README note, comment, or Swagger description to override verified current behavior.

If the repository and documentation materially disagree, stop and report the drift before building on it.

---

## 3. Mandatory Diagnose-First Workflow

For every substantial task:

1. Inspect the current repository state.
2. Identify the real affected files and existing patterns.
3. Understand the real user workflow.
4. Understand the real backend/data contract.
5. Determine whether the task is:
   - a focused fix,
   - an incremental change,
   - a structural redesign,
   - a cleanup,
   - or a backend-blocked feature.
6. Propose the smallest coherent implementation approach.
7. Respect any approval gate before editing.

### READ-ONLY / AUDIT / DIAGNOSE ONLY means exactly that

When a task is marked read-only:

- do not edit files,
- do not create branches,
- do not commit,
- do not push,
- do not merge,
- do not perform write probes,
- do not “helpfully” fix unrelated issues.

Stop and report when the requested gate is reached.

---

## 4. Git and Change-Control Rules

### 4.1 Branching

- Never implement substantial work directly on an environment or integration branch.
- Create a dedicated feature/fix/chore branch from the currently approved baseline.
- The approved integration baseline must come from the current project state; do not assume historical branch relationships are still correct.
- Keep each branch focused on one coherent concern.

Recommended naming:

- `feat/<scope>`
- `fix/<scope>`
- `chore/<scope>`
- `refactor/<scope>`

### 4.2 Commit discipline

Commits must be:

- focused,
- logically grouped,
- reviewable,
- free of unrelated formatting churn,
- free of scratch/probe artifacts,
- free of secrets,
- and written with clear intent.

### 4.3 Merge discipline

AI agents must not autonomously merge into:

- `Develop`,
- `Test`,
- `Stage`,
- `main`,
- or any protected/shared environment branch.

Human approval is required before final merge.

### 4.4 Never hide drift

Before significant work, fetch/re-check the relevant remote branches.

If the baseline changed materially since diagnosis, stop and report instead of continuing on stale assumptions.

---

## 5. Validation Gates

A change is not complete merely because it “looks correct” in code.

Use the actual repository scripts from `package.json`.

At minimum, when available and relevant:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Do not invent a test command that does not exist.

If the repository has no automated test suite for the affected area, say so explicitly and compensate with targeted validation.

### 5.1 Required validation mindset

Validate at multiple levels:

- static correctness,
- type correctness,
- lint/style correctness,
- build correctness,
- runtime behavior,
- visual behavior,
- backend integration behavior,
- regression risk.

### 5.2 Visual/live gate

Meaningful UI work requires live visual verification before commit.

A passing TypeScript build does **not** prove:

- correct layout,
- correct RTL behavior,
- correct empty states,
- correct responsiveness,
- correct interaction flow,
- correct browser behavior,
- or correct backend integration.

For SignalR, persistent connections, cached state, or HMR-sensitive behavior, perform a hard reload before final validation when relevant.

---

## 6. Backend Reality Over Documentation

Swagger and generated API documentation are useful references, not guaranteed truth.

Historical project experience has shown drift in:

- response shapes,
- enum serialization,
- decimals vs integers,
- date/time formats,
- pagination behavior,
- supported filters,
- mutation responses,
- and endpoint behavior.

Therefore:

- verify uncertain backend behavior,
- prefer read-only probes first,
- use controlled write probes only when necessary,
- constrain write-probe payloads exactly,
- keep probe output inside a safe ignored location such as `./scratchpad/`,
- clean up reversible probe data when possible,
- never expose tokens or secrets in reports.

Do not fabricate missing backend capabilities.

If the backend cannot perform an action, the UI must not pretend that it can.

---

## 7. Architecture Rules

### 7.1 Feature structure

Maqwad follows a modular feature architecture.

Feature-specific code belongs under:

```text
src/modules/<feature>/
```

Typical structure:

```text
api/
components/
hooks/
pages/
schemas/
store/
lib/
types.ts
```

Do not move feature-specific behavior into `shared` merely to reduce file count.

### 7.2 Shared code

Use `src/shared/` for genuinely reusable cross-feature primitives and infrastructure.

Before creating a new shared abstraction, ask:

- Is it used by more than one domain?
- Is the behavior truly generic?
- Will sharing reduce duplication without coupling unrelated features?

Apply **YAGNI**. Do not create speculative abstractions.

### 7.3 State management

- **TanStack Query**: server state, fetching, caching, invalidation, mutations.
- **Redux Toolkit**: real global/client application state.

Do not put server state in Redux merely because Redux already exists.

Do not duplicate TanStack Query cache state into Redux.

### 7.4 Forms

Use:

- React Hook Form
- Zod

Keep validation rules explicit and close to the domain.

Avoid duplicating the same validation logic in multiple components.

### 7.5 API boundaries

Use the established Axios/API client and existing adapter patterns.

Keep backend translation at clear boundaries.

Do not spread raw backend quirks throughout presentation components.

Prefer:

```text
raw API response
→ adapter / mapper
→ domain-safe shape
→ UI
```

Keep uncertain wire mappings isolated in one place where possible.

---

## 8. Core Engineering Principles

Apply established software engineering principles pragmatically.

### 8.1 SOLID — where it improves clarity

Use separation of responsibilities and stable boundaries.

Do not apply SOLID mechanically if it creates unnecessary indirection.

### 8.2 DRY — but not premature abstraction

Remove harmful duplication.

Do not merge two concepts merely because they look similar.

Duplicating a small amount of presentation code can be preferable to creating a misleading shared abstraction.

### 8.3 KISS

Prefer the simplest architecture that correctly handles current requirements.

Avoid unnecessary layers, factories, wrappers, and configuration systems.

### 8.4 YAGNI

Do not build for hypothetical future requirements unless an explicit extension seam is required.

### 8.5 Separation of concerns

Keep these concerns distinct where practical:

- transport,
- data mapping,
- domain logic,
- state management,
- validation,
- presentation,
- user interaction.

### 8.6 Explicit over clever

Prefer readable, unsurprising code over compact or “smart” code.

Future maintainers should understand the intent without reverse-engineering tricks.

---

## 9. TypeScript and Code Quality Rules

TypeScript is strict.

### Mandatory rules

- No `any` unless there is an exceptional, explicitly justified interoperability boundary.
- Prefer precise types.
- Avoid unsafe casts.
- Avoid broad `as unknown as ...` chains.
- Prefer narrow unions and domain types.
- Handle nullable/optional fields intentionally.
- Avoid non-null assertions unless the invariant is proven and obvious.
- Use named exports unless an existing project convention explicitly requires otherwise.
- Keep functions small enough to understand.
- Avoid hidden side effects.
- Avoid duplicated business rules.
- Remove dead code when safely confirmed unused.
- Do not leave commented-out implementation code.

### Error handling

Errors must be:

- classified when useful,
- surfaced meaningfully to users,
- logged/observed appropriately,
- and not silently swallowed.

Do not expose raw backend/internal error details directly to users unless safe and intentionally designed.

---

## 10. Naming and Readability

Names must communicate intent.

Prefer:

- `fetchProviderOrders`
- `computeOfferStatus`
- `isSubscriptionActive`

over vague names such as:

- `handleData`
- `process`
- `doThing`

Avoid abbreviations unless they are established domain vocabulary.

Boolean names should read naturally:

- `isLoading`
- `hasError`
- `canEdit`
- `shouldRefetch`

---

## 11. Comments and Documentation

Comments should explain **why**, constraints, surprising behavior, or non-obvious backend facts.

Do not write comments that merely restate code.

Use TODOs only when they are actionable and specific.

Good:

```ts
// TODO(backend): confirm billingCycle enum mapping; API currently returns raw numeric values.
```

Bad:

```ts
// TODO fix later
```

Preserve file-level documentation conventions where the project already requires them.

---

## 12. Security Rules

Never:

- commit secrets,
- paste auth tokens into committed files,
- hardcode credentials,
- expose sensitive data in logs,
- weaken auth/RBAC to “make development easier,”
- or bypass permission checks without explicit approval.

Protected authentication, authorization, and environment-sensitive areas must not be modified casually.

Treat `.env` and secret-bearing files as protected.

If a task requires touching sensitive auth/RBAC infrastructure, call it out explicitly before editing.

---

## 13. Performance Standards

Performance is part of product quality.

### General rules

- Avoid unnecessary re-renders.
- Avoid unnecessary global state.
- Avoid oversized client-side transforms for large collections.
- Avoid fetching data that is not needed.
- Use pagination where the backend supports it.
- Avoid N+1 request patterns when a better endpoint/pattern exists.
- Prefer lazy loading for genuinely heavy routes/components when appropriate.
- Memoize only when measurement or clear cost justifies it.
- Do not add memoization everywhere by default.

### Web performance guidance

When relevant, protect Core Web Vitals and avoid regressions in:

- LCP,
- INP,
- CLS.

Do not trade maintainability for micro-optimizations without evidence.

Measure first when performance is uncertain.

---

## 14. Accessibility Standard

New and materially changed UI should aim for **WCAG 2.2 AA** quality where practical.

At minimum:

- semantic HTML,
- meaningful labels,
- keyboard accessibility,
- visible focus states,
- correct dialog semantics,
- correct `aria-*` usage,
- accessible form errors,
- sufficient color contrast,
- no meaning conveyed by color alone,
- appropriate disabled-state behavior,
- sensible screen-reader text where needed.

Radix primitives do not remove the responsibility to provide correct labels, descriptions, and accessible content.

Accessibility is part of “done,” not optional polish.

---

## 15. Internationalization and RTL

Maqwad is Arabic/English and RTL-first.

### Mandatory rules

- No hardcoded user-visible strings.
- Use i18next keys.
- Provide Arabic and English values together when adding UI copy.
- Use logical CSS/layout properties where applicable:
  - `ps`
  - `pe`
  - `ms`
  - `me`
- Do not assume left/right semantics.
- Verify real Arabic rendering visually.
- Do not treat reversed Arabic in an LTR terminal as a UI bug.
- Support realistic long English and Arabic strings without breaking layout.

---

## 16. Maqwad Visual System

New UI must feel intentionally part of Maqwad.

Use established theme tokens and existing primitives rather than arbitrary one-off values.

Core visual references include:

- Brand orange: `#F45E2B`
- Brand orange hover: `#E3460F`
- Brand blue: `#043168`
- Application background: `#F5F6FA`
- Surface: `#FFFFFF`
- Secondary surface: `#FAFAFC`
- Divider: `#ECECF1`
- Body ink: `#0F1222`
- Muted text: `#7A7E95`

Typography:

- IBM Plex Sans Arabic: primary UI/headings
- Tajawal: established brand-oriented usage

Prefer the project’s CSS/theme variables instead of copying raw values into feature code when a token already exists.

Use `lucide-react` for icons unless there is an explicit approved exception.

---

## 17. Admin vs Provider Experience

Admin and Provider experiences belong to the same product but are not identical presentation layers.

### Admin

Follow the established Admin visual and information-density patterns.

### Provider portals

Dealer / Workshop / Scrap experiences should use the established Provider visual language and `provider-ui` primitives where appropriate.

### Rule

Share:

- domain logic,
- hooks,
- adapters,
- formatters,
- low-level primitives,

when they are genuinely common.

Do **not** force Admin and Provider into the same complete page component merely to reduce duplication.

Reuse logic; specialize presentation when context requires it.

---

## 18. UI / UX Product Quality Standard — Mandatory

Maqwad is **not** a collection of generic CRUD screens.

Whenever a task creates or materially redesigns a:

- page,
- section,
- component,
- dialog,
- workflow,
- form,
- navigation area,
- or interaction,

treat UX and information design as part of the engineering task.

### 18.1 Design from content and user task first

Before designing, understand:

- Who is using the interface?
- What is the primary user goal?
- What information is primary?
- What is secondary?
- What is the data shape?
- What relationships exist?
- How dense is the data?
- Which actions are frequent?
- Which actions are destructive?
- Which actions are unavailable?
- What states can the workflow enter?

Do not choose a visual pattern first and force the content into it.

The content model and workflow determine the presentation.

### 18.2 Choose interaction patterns intentionally

Examples:

- Dense comparable records → table
- Visual/scannable independent items → cards
- Hierarchical data → tree/nested navigation
- Parent-child exploration → master-detail
- Rich entity with nested relationships → dedicated detail page
- Small focused create/edit action → dialog
- Multi-stage process → stepper or dedicated workflow
- Multiple genuinely useful views → cards/table toggle

These are guidelines, not templates.

Use judgment.

### 18.3 Anti-generic UI rule

Do not automatically produce:

> header + 4 KPI cards + filters + table + modal

unless the actual product problem justifies that structure.

Do not add:

- decorative KPI cards,
- meaningless charts,
- extra tabs,
- unnecessary badges,
- fake filters,
- redundant actions,
- or ornamental sections

merely to make a screen look “rich.”

Every visible element must earn its place through:

- user value,
- information hierarchy,
- workflow efficiency,
- decision support,
- discoverability,
- feedback,
- or product communication.

Professional UX comes from appropriate structure, not from adding more UI.

### 18.4 A professional UI is a functional requirement

New and redesigned interfaces must be:

- clear,
- easy to understand,
- efficient,
- scannable,
- visually structured,
- responsive,
- accessible,
- RTL-correct,
- bilingual-friendly,
- and consistent with the relevant Maqwad product area.

Avoid technically functional but visually generic or confusing output.

---

## 19. Reuse Before Invention

Before creating a new UI primitive or pattern, inspect existing:

- shared components,
- provider-ui components,
- dialogs,
- page headers,
- status pills,
- data tables,
- pagination,
- form controls,
- empty states,
- loading patterns,
- formatters,
- comparable feature implementations.

Reuse when the abstraction genuinely fits.

Do not sacrifice UX simply to reuse something.

Do not pollute shared code with feature-specific behavior.

---

## 20. Structural Backend Changes Require UX Reassessment

Do not mechanically patch new backend fields into an old interface.

Classify the change.

### Incremental change

Same entity and same workflow; only limited fields/behavior changed.

→ Adapt the existing interface.

### Structural change

The real model, relationships, capabilities, or workflow changed materially.

→ Reconsider the information architecture and redesign/rebuild the affected UI when appropriate.

Never preserve:

- fabricated fields,
- obsolete controls,
- fake actions,
- misleading affordances,
- or outdated interaction models

just to keep an old screen visually intact.

---

## 21. No False Affordances

Never show a working-looking action the backend cannot actually perform.

If a capability is unavailable:

- hide it,
- disable it with a clear explanation,
- or show a deliberate “coming soon” state only when product context justifies it.

Never fabricate data to make a screen appear complete.

The real product model is the source of truth.

---

## 22. UI States Are Part of the Feature

Every page or substantial data-driven component must intentionally handle relevant states:

- loading,
- error,
- empty,
- populated,
- disabled,
- success,
- mutation-in-progress,
- destructive confirmation,
- partial/missing data.

An empty state is not an error.

A technically valid blank screen is not an acceptable empty state.

---

## 23. Forms and Interaction Quality

Forms should provide:

- clear labels,
- appropriate input types,
- sensible defaults,
- inline validation,
- clear error messages,
- visible submission state,
- prevention of accidental duplicate submission,
- correct disabled states,
- success feedback,
- safe destructive flows.

Avoid unnecessary multi-step forms.

Use a stepper only when the task genuinely benefits from staged progression.

---

## 24. Mutation and Cache Rules

Do not blindly trust mutation response bodies when the backend is known to return stale or partial representations.

When appropriate:

- invalidate,
- refetch,
- and render from the refreshed source of truth.

Optimistic updates are allowed only when rollback behavior is reliable and the UX benefit is real.

---

## 25. Responsive Design

Desktop-only correctness is insufficient.

For new or redesigned UI:

- define behavior for smaller widths,
- avoid horizontal overflow unless the content genuinely requires it,
- preserve action discoverability,
- preserve hierarchy,
- ensure dialogs/sheets fit small screens,
- ensure tables have an intentional mobile strategy.

Do not merely shrink desktop UI.

---

## 26. Design Decision Gate

For substantial new UI or major redesigns, diagnosis should include:

1. real data contract,
2. user role,
3. primary workflow,
4. proposed interaction model,
5. why that model fits the content,
6. reusable project primitives,
7. any genuinely new pattern required,
8. UX trade-offs.

If the task requires approval before implementation, stop after presenting this recommendation.

---

## 27. Definition of Done

A task is not complete until all relevant items below are satisfied.

### Engineering

- [ ] Correct repository baseline used
- [ ] Scope is focused
- [ ] No unrelated changes
- [ ] Type safety preserved
- [ ] Architecture conventions preserved
- [ ] No secrets introduced
- [ ] No unsupported backend assumptions
- [ ] No false affordances
- [ ] No unnecessary duplication/abstraction

### Validation

- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Format check passes
- [ ] Build passes
- [ ] Relevant runtime behavior verified
- [ ] Relevant backend behavior verified
- [ ] Regression risk inspected

### UI / UX

- [ ] Real data renders correctly
- [ ] Loading state is deliberate
- [ ] Empty state is deliberate
- [ ] Error state is understandable
- [ ] Forms validate clearly
- [ ] Mutation feedback is visible
- [ ] Destructive actions are safe
- [ ] RTL verified
- [ ] English remains usable
- [ ] Responsive behavior verified
- [ ] Accessibility considered
- [ ] Visual result is coherent with Maqwad
- [ ] UI pattern fits the content rather than a generic template

### Delivery

- [ ] Final diff reviewed
- [ ] Scratch/probe files excluded
- [ ] Commit scope is clean
- [ ] PR summary explains what and why
- [ ] No protected branch merged automatically
- [ ] Human approval gate respected

---

## 28. Agent Reporting Standard

At the end of a substantial task, report concisely:

1. What changed
2. Why it changed
3. Files/areas affected
4. Backend assumptions verified
5. Validation commands and results
6. Visual/runtime verification performed
7. Remaining risks/blockers
8. Recommended next action

Do not claim a test, build, probe, push, PR, or merge occurred unless it actually occurred.

---

## 29. What Not to Do

Do not:

- build from stale handovers without checking the repo,
- trust Swagger blindly,
- implement before diagnosis when a gate exists,
- modify protected branches directly,
- merge without human approval,
- create giant unrelated refactors inside feature work,
- invent backend fields,
- invent product behavior,
- create generic AI-looking dashboard UI,
- add abstractions “for future use,”
- duplicate server state in Redux,
- hardcode user-facing strings,
- ignore RTL,
- treat compile success as visual correctness,
- hide validation failures,
- or claim work was performed when the environment did not permit it.

---

## 30. Final Principle

**Correctness, clarity, product fit, and maintainability outrank speed.**

The best solution is not the one with the most code or the most visually complex UI.

The best solution is the smallest coherent solution that:

- matches the real backend,
- fits the real user workflow,
- respects Maqwad’s architecture and design language,
- meets professional engineering standards,
- and can be safely maintained by the next engineer or agent.
