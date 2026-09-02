# HANDOVER — Chat feature (SignalR + REST)

> Read this before resuming chat work. Summarizes what shipped, why, what was
> live-discovered, and where we stopped.

---

## What shipped

Full chat module (`src/modules/chat/`) for **WorkshopOwner** and
**SalvageSpecialist** only at the UI level (backend allows any role; Dealer
is intentionally out for now).

Files:
- `lib/chatHub.ts` — SignalR connection singleton (app/auth-scoped lifetime)
- `lib/chatErrors.ts` — error classification (SignalR-shaped regexes; REST
  mapping still pending, see below)
- `lib/currentUser.ts` — derives numeric user id from JWT
- `api/chatApi.ts` — REST client (9 `/api/Conversations` endpoints)
- `store/chatSlice.ts` — Redux slice, messages keyed by peerId
- `hooks/useChatHub.ts`, `hooks/useChatHistory.ts`
- `components/ChatScreen.tsx`, `ChatWindow.tsx`, `ChatConnectionBanner.tsx`,
  `ConversationList.tsx`, `MessageBubble.tsx`, `MessageComposer.tsx`,
  `DaySeparator.tsx`, `ConnectionStatusDot.tsx` (retained, unused — see below)
- `types.ts`

Wired into `WorkshopConversationsPage.tsx` and `ScrapConversationsPage.tsx`
(both render `<ChatScreen>`). Chat teardown added to `useLogout.ts`. Chat
i18n namespace added to `src/app/i18n.ts` (ar + en). Chat slice registered
in `src/app/store.ts`. `@microsoft/signalr` added as a dependency.

## Architecture (and WHY)

- **REST-first send.** Sending goes via `POST /api/Conversations[/{id}/messages]`,
  which returns the real message id and read state. SignalR is
  **receive-only** (`ReceiveMessage` → Redux). Rationale: SignalR send
  returned no id, so de-dup against the REST history was fragile; REST gives
  us ids + read state to reconcile against.
- **Connection lifetime is app/auth-scoped**, not screen-scoped: connect on
  screen mount, **never disconnect on unmount** — disconnect only happens in
  `useLogout`. This fixes React StrictMode's mount→unmount→mount teardown
  race that was killing the connection on first render in dev.
- **Isolation switches:** `CHAT_SOURCE` (`"fixture" | "live"`, live is
  effective) and `CHAT_HUB_URL`, so the module can fall back to fixtures if
  the backend is down.

## Live-discovered facts (from live probing, not docs)

- Hub: `wss://miqwad-test.runasp.net/hubs/chat`. **`skipNegotiation` MUST be
  `false`** on this host (`SKIP_NEGOTIATION=false`) —
  `skipNegotiation: true` fails behind the runasp proxy ("connection ID not
  present"). Normal negotiate works.
- **CORS:** backend had to add `AllowCredentials` + a specific origin (not
  `*`) for the browser to connect. Flutter worked earlier only because
  mobile ignores CORS.
- **Auth:** same REST JWT via `accessTokenFactory` (`?access_token=`). User
  id is numeric (`long`), read from the JWT `nameidentifier` claim.
- **SignalR `ChatMessage` payload:** `{ senderId, senderName, receiverId,
  content, sentAt }` — **no `id`, no `isRead`**.
- **REST `Conversation` row:** `{ conversationId, receiverId, receiverName,
  phoneNumber, lastMessage, date, unreadCount }`. **REST `Message`:**
  `{ id, senderId, receiverId, message(!=content), isRead, isSent, date }` —
  field is `message`, mapped to `content` app-side.
- `POST /api/Conversations` is **create-or-return** (reopens an existing
  conversation, never duplicates). Its response contains **only the new
  message**, never full history — history is always fetched via
  `GET /{id}`.
- The unread-count endpoint returns a **global total only**; per-conversation
  unread lives on each row of the conversations list.
- Lists/history are **not paginated** — `PageNumber`/`PageSize` are accepted
  but silently ignored.
- Redux stores messages keyed by `peerId` (each conversation is 1:1 with a
  peer); every message also carries `conversationId`.

## Connection status dot

The green/red dot next to the peer name was **removed** — it reflected
*our* connection state, not the peer's (proven by messaging a
non-existent user id: it showed green anyway). Self-connection status now
lives only in `ChatConnectionBanner`. `ConnectionStatusDot.tsx` is retained
but unused, ready to wire to real peer presence once available.

## Pending on backend (blocking full polish — each has a `// TODO: wire to backend`)

1. Peer **presence API** (`UserOnline`/`UserOffline` hub event, or
   `IsUserOnline(userId)`, or `GET /api/users/{id}/presence`) — needed for a
   real per-peer online dot. (Ask already sent to backend.)
2. Pagination on the conversations list and message history.
3. REST error-shape mapping in `chatErrors.ts` — REST failures currently
   fall into the generic bucket; the existing regexes were written for
   SignalR hub exception text.
4. A real "start chat" source (order/offer counterparty, or user search) to
   replace manual numeric `receiverId` entry.
5. Stale checked-in `swagger.json` at repo root is missing the chat paths —
   re-fetch live `/swagger/v1/swagger.json` before relying on it. (Left
   untracked/unstaged this session — not part of the chat commit.)
6. (Env) local `.env` is missing — breaks dev phone-login independently of
   chat; unrelated but blocks full manual testing in a clean checkout.

## Verification this session

- `npx tsc -b --noEmit` — clean, no output.
- `npx eslint .` — 138 pre-existing errors / 22 warnings, **none** in
  `src/modules/chat/**` or any file touched by this feature; all pre-date
  this branch (unrelated modules: mocks handlers, RoleGuard, provider
  layouts, etc.).
- `git status --porcelain` scope confirmed chat-only before staging. Two
  unrelated leftovers were found and deliberately left untracked (not
  committed): `HANDOVER_Maqwad_session_orders_addresses_scrap.md` (prior
  session's hand-over doc) and `swagger.json` (raw fetched dump, UTF-16,
  never previously tracked, doesn't include chat paths anyway — see pending
  item 5).
- `CHAT_REST_PROBE_REPORT.md` moved to `docs/CHAT_REST_PROBE_REPORT.md` and
  included in the commit (useful live-probe reference, matches the existing
  `docs/probe-*.md` pattern in this repo).

## Where we stopped / next steps

- Committed on branch `feat/chat-signalr-rest` (hash: `f6e34b8`). **Not
  pushed, not merged, no PR opened.**
- Next: open a PR → `Develop` → `main` after review; then wire peer
  presence when the backend delivers it (see pending item 1).
