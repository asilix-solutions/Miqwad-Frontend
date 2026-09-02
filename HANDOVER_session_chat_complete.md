# HANDOVER — Chat session complete, bridge to next session

> Read this before starting the next session. This is a short bridge doc —
> for deep chat architecture, live-discovered facts, and file inventory see
> `HANDOVER_chat_signalr_rest.md` (not duplicated here).

---

## Project state now (post-merge)

- Chat (SignalR + REST) is **merged**: PR #48 → `Develop`, PR #49 → `main`.
  Live-tested end-to-end before merge.
- Branch `feat/chat-signalr-rest` is merged and can be deleted.
- Everything from the prior handover chain still holds: profile, addresses
  (×3 variants), workshop hours, provider routing, Orders→Offers, Sentry
  install. Chat is the newest addition on top of that baseline.
- See `HANDOVER_chat_signalr_rest.md` for what shipped, architecture +
  rationale (REST-first send, SignalR receive-only, app/auth-scoped
  connection lifetime), and live-discovered backend facts.

## Methodology (carry forward verbatim)

- **Diagnose first (READ-ONLY)** before building — never build on assumption.
- **Swagger documents requests only, not responses** — verify real behavior
  with a **live probe using a real token**.
- **Role split:** architect (Opus, external) writes English prompts for the
  agent and makes architecture/visual decisions; operator runs them and
  returns results/screenshots; communication with the operator is in Arabic.
- **Per-task cycle:** new branch → diagnose → build → live test → clean
  commit (clean scope + `tsc -b --noEmit` clean) → PR → `Develop` → `main`.
- **No commit/merge before a successful live test.** Use interactive buttons
  to lock decisions before writing prompts.

## Chat — pending backend items

Each has a `// TODO: wire to backend` marker in code:

1. **Peer presence API** (`UserOnline`/`UserOffline` hub event, or
   `IsUserOnline(userId)`, or `GET /api/users/{id}/presence`) → enables a
   real per-peer online dot. `ConnectionStatusDot.tsx` is retained and
   isolated — swap its data source in one place when backend delivers.
   (Question already drafted to send backend.)
2. Pagination UI for conversations list + message history (envelope meta
   already parsed).
3. REST error-shape mapping in `chatErrors.ts` (REST failures currently fall
   to the generic bucket).
4. Real "start chat" source (order/offer party, or user search) to replace
   manual `receiverId` entry.
5. Re-fetch live `swagger.json` — the checked-in copy is stale and missing
   chat paths.
6. Local `.env` is missing — breaks dev phone-login (unrelated to chat,
   pre-existing gap).

## Live-discovered facts worth remembering

- Hub: `wss://miqwad-test.runasp.net/hubs/chat`. `SKIP_NEGOTIATION` **must
  be `false`** — the runasp proxy breaks `skipNegotiation: true`.
- CORS needs `AllowCredentials` + a specific origin (not `*`); mobile
  ignores CORS so this only bit the web client.
- User id is numeric (`long`), derived from the JWT `nameidentifier` claim.
- SignalR message payload lacks `id`/`isRead`; REST has both — this is why
  send is REST-first and SignalR is receive-only.
- `POST /api/Conversations` = create-or-return. `GET /Conversations` returns
  a paginated envelope on populated accounts but a bare array on empty ones
  — the mapper tolerates both shapes.
- Connection lifetime is app/auth-scoped (disconnect only on logout), which
  makes it StrictMode-safe (survives the dev mount→unmount→mount race).

## Candidate next tasks (for the operator to pick)

- Wire peer presence once backend provides it — fastest win, isolated to
  `ConnectionStatusDot.tsx`.
- Any of the pending items above.
- Or a new feature area entirely.

Start the next session by stating the chosen task; then diagnose first.
