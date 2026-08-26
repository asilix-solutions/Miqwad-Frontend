# Chat REST endpoints — live probe report

Probed live against `https://miqwad-test.runasp.net` using a real JWT
(`TestDealer2@gmail.com` / userId 33, role `Dealer`, obtained via
`POST /api/auth/login`). Token redacted below as `<TOKEN>`. All 9 endpoints
are live and usable — none returned the 400/403 "not wired" errors we saw
on the old Orders bug. **No UI was wired; this is report-only per the task.**

Test conversation created against `TestScrap1` (userId 40, role
`SalvageSpecialist`) → `conversationId: 3`. Two of the three probe messages
sent during testing were deleted via the DELETE endpoint as part of the
probe; message `id 13` was left in place as a live example record.

---

## 1. GET /api/Conversations

No query params required. `PageNumber`/`PageSize` are accepted silently but
**do nothing** — response is a bare array, not `PaginatedResponse<T>` (no
`totalCount`/`totalPages`/`pageNumber`). This is a contract mismatch vs.
every other list endpoint in the app (Addresses, Orders, etc.), which use
the real paging envelope.

Request: `GET /api/Conversations` (also tried with `?PageNumber=1&PageSize=5` — same shape, unpaginated)

Response `200`:
```json
{
  "success": true,
  "message": "Conversations retrieved successfully.",
  "data": [
    {
      "conversationId": 3,
      "receiverId": 40,
      "receiverName": "TestScrap",
      "phoneNumber": "594161416",
      "lastMessage": "Third message EDITED",
      "date": "2026-08-25T09:16:18.1752487",
      "unreadCount": 0
    }
  ],
  "errors": null
}
```

No auth (`Authorization` header omitted): `401`, empty body.

---

## 2. POST /api/Conversations — create conversation

Body: `{ receiverId: number, message: string (1–2000 chars) }`. This IS the
"start new chat" endpoint — sending the first message creates the
conversation in one call, no separate empty-conversation step.

Request:
```json
POST /api/Conversations
{ "receiverId": 40, "message": "Hello from probe test - part availability?" }
```

Response `201`:
```json
{
  "success": true,
  "message": "Message sent successfully.",
  "data": {
    "conversationId": 3,
    "receiverId": 40,
    "receiverName": "TestScrap",
    "phoneNumber": "594161416",
    "messages": [
      {
        "id": 13,
        "senderId": 33,
        "receiverId": 40,
        "message": "Hello from probe test - part availability?",
        "isRead": false,
        "isSent": true,
        "date": "2026-08-25T09:16:00.32582Z"
      }
    ]
  },
  "errors": null
}
```

Note: full `Conversation`-shaped object returned (with the seed message
inside `messages[]`), not just a bare id.

---

## 3. GET /api/Conversations/{id} — single conversation

Returns the same shape as the POST response, `messages[]` in **ascending**
(oldest → newest) order — confirmed after 3 messages:
`[13, 14, 15]` came back in send order, not reversed.

Response `200` (after 3 messages sent):
```json
{
  "success": true,
  "message": "Conversation retrieved successfully.",
  "data": {
    "conversationId": 3,
    "receiverId": 40,
    "receiverName": "TestScrap",
    "phoneNumber": "594161416",
    "messages": [
      { "id": 13, "senderId": 33, "receiverId": 40, "message": "Hello from probe test - part availability?", "isRead": false, "isSent": true, "date": "2026-08-25T09:16:00.32582" },
      { "id": 14, "senderId": 33, "receiverId": 40, "message": "Second message - checking ordering", "isRead": false, "isSent": true, "date": "2026-08-25T09:16:08.9965306" },
      { "id": 15, "senderId": 33, "receiverId": 40, "message": "Third message - checking response shape", "isRead": false, "isSent": true, "date": "2026-08-25T09:16:18.1752487" }
    ]
  },
  "errors": null
}
```

Unknown id → `404`:
```json
{ "success": false, "message": "Conversation was not found.", "data": null, "errors": null }
```

No pagination on messages either — full history comes back in one shot.
Fine for now; revisit if a conversation grows large.

---

## 4. GET /api/Conversations/unread-count

Flat shape, single number, no per-conversation breakdown.

Response `200`:
```json
{ "success": true, "message": "Unread count retrieved successfully.", "data": { "unreadCount": 0 }, "errors": null }
```

(Stayed `0` throughout — expected, since every message in the test
conversation was sent BY the authenticated dealer, not received. Could not
verify the non-zero / incrementing case without a second live account's
credentials — `TestScrap1`'s password isn't documented in the handover.
Recommend a follow-up probe once that's available, sending from the scrap
side and checking unread-count increments and `PUT .../read` decrements it
back to 0 for the receiver.)

---

## 5. POST /api/Conversations/{conversationId}/messages — send message

Body: `{ message: string (1–2000 chars) }` — no `receiverId` needed, it's
implied by the conversation. Returns a **flat `Message`**, not wrapped in
the conversation like the create-conversation endpoint does.

Request:
```json
POST /api/Conversations/3/messages
{ "message": "Third message - checking response shape" }
```

Response: `200` (not `201` as the swagger doc's example claims):
```json
{
  "success": true,
  "message": "Message sent successfully.",
  "data": {
    "id": 15,
    "senderId": 33,
    "receiverId": 40,
    "message": "Third message - checking response shape",
    "isRead": false,
    "isSent": true,
    "date": "2026-08-25T09:16:18.1752487Z"
  },
  "errors": null
}
```

---

## 6. PUT /api/Conversations/{conversationId}/read — mark conversation read

No body. Returns `data: null` — no info on how many messages were marked.

Response `200`:
```json
{ "success": true, "message": "Messages marked as read successfully.", "data": null, "errors": null }
```

---

## 7. GET /api/Conversations/messages/{messageId} — single message

Flat `Message` shape (same fields as #5's `data`).

Response `200`:
```json
{
  "success": true,
  "message": "Conversation retrieved successfully.",
  "data": { "id": 13, "senderId": 33, "receiverId": 40, "message": "Hello from probe test - part availability?", "isRead": false, "isSent": true, "date": "2026-08-25T09:16:00.32582" },
  "errors": null
}
```
(Note the `message` field in the envelope says "Conversation retrieved
successfully" even for a single-message fetch — looks like a copy-paste in
the backend's response messages, not meaningful to the frontend.)

Unknown id → `404`: `{ "success": false, "message": "Message was not found.", "data": null, "errors": null }`

---

## 8. PUT /api/Conversations/messages/{messageId} — edit message

Body: `{ message: string (1–2000 chars) }`. Returns the updated flat
`Message`.

Request: `PUT /api/Conversations/messages/15`, body `{ "message": "Third message EDITED" }`

Response `200`:
```json
{
  "success": true,
  "message": "Message updated successfully.",
  "data": { "id": 15, "senderId": 33, "receiverId": 40, "message": "Third message EDITED", "isRead": false, "isSent": true, "date": "2026-08-25T09:16:18.1752487" },
  "errors": null
}
```
`date` stayed the original send time — editing does not bump/add an
"edited at" timestamp; there's no `editedAt`/`isEdited` field at all. If the
UI wants an "edited" indicator, there's nowhere in the DTO to source it
from — would need a change request to the backend, or just not show one.

---

## 9. DELETE /api/Conversations/messages/{messageId}

Response `200`, `data: null` (the swagger doc's own "example" for this
endpoint is a giant garbage dump of a serialized .NET `Exception` object —
that's an artifact of Swashbuckle reflecting a bad example generator, not
a real response; ignore it, the live response is clean):

```json
{ "success": true, "message": "Message deleted successfully.", "data": null, "errors": null }
```

Deleting an already-deleted / unknown id → `404`:
`{ "success": false, "message": "Message was not found.", "data": null, "errors": null }`

---

## Key questions answered

**Does a Conversation have an id, and how does it relate to the SignalR
peer model?**
Yes — `conversationId` (int64), separate from `receiverId`/`senderId`
(peer's user id, same numeric space as SignalR). A conversation is
1:1 between the authenticated user and one peer — `POST /api/Conversations`
with the same `receiverId` a second time would need testing to see if it
returns the existing conversation or errors (not tested — didn't want to
spam more test messages). **Recommend testing this specifically before
wiring "new chat" — it determines whether the UI needs a
"find-or-create" step or can just always POST.**

**Does the Message DTO include id/isRead that SignalR omits?**
Yes. REST `Message`: `{ id, senderId, receiverId, message, isRead, isSent,
date }`. Two things to note against our current `ChatMessage` type
(`src/modules/chat/types.ts`):
- field is `message`, not `content` (SignalR's `ChatMessageDto` uses
  `content`).
- no `senderName` in the REST shape (SignalR's does carry `senderName`) —
  the REST conversation object carries `receiverName` at the
  conversation level instead, so the composer/list would need to source
  the peer's display name from the conversation record, not the message.

**How is a conversation created?**
`POST /api/Conversations` with `{ receiverId, message }` — it's really
"send first message," which creates-or-returns the conversation and
returns it fully hydrated with that message inside. This becomes the real
"start new chat" flow; no separate "create empty conversation" call
exists.

**unread-count shape?**
`{ unreadCount: number }` — global total only, no per-conversation
breakdown in that endpoint (per-conversation `unreadCount` lives on each
item from `GET /api/Conversations` instead).

---

## Proposed type/mapping changes (`src/modules/chat/types.ts`)

Current `ChatMessage` (SignalR-only, no id, no isRead) needs to become two
things, since SignalR and REST now disagree on shape:

```ts
// REST — full fidelity, this is what history/list uses
export interface RestMessage {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;       // REST field name — NOT "content"
  isRead: boolean;
  isSent: boolean;
  sentAt: string;         // rename from REST's "date" for clarity
}

export interface Conversation {
  conversationId: number;   // NEW — was `peerId`-only before
  peerId: number;            // = receiverId from REST
  peerName: string;          // = receiverName from REST
  peerPhone?: string;        // NEW — REST carries phoneNumber, we don't use it yet
  lastMessage?: string;
  lastAt?: string;
  unreadCount: number;
}
```

`ChatHubErrorCode`/SignalR's `ChatMessage` (`senderId, senderName,
receiverId, content, sentAt`) stays as-is for the live-append path — it's
a genuinely different, thinner shape (no id, no isRead, has senderName).
Reconciliation is a mapping function at the boundary, not a unified type:
a message arriving live via `ReceiveMessage` gets appended to UI state as
a *local, unconfirmed* item; once REST is the source of truth for
history, de-dup on reconnect/refresh keys off `(senderId, receiverId,
content===message, sentAt truncated to the second)` since SignalR has no
id to match against REST's `id`. This is the one real mismatch to design
around before wiring: **SignalR never gives you the REST `id`**, so a
message that arrived live and was later reconciled against a REST refetch
has to be matched by content+timestamp, not id — accept up to ~1s clock
skew between the two paths given `date` precision differs (SignalR uses
its own clock event; REST timestamps are server-generated at insert time,
consistent so far in testing).

## Migration plan

- **CHAT_SOURCE (list + history)** → flip to `live`. Both
  `chatApi.listConversations()` (→ `GET /api/Conversations`) and
  `chatApi.listMessages(conversationId)` (→
  `GET /api/Conversations/{id}`, note: **conversationId now, not
  peerId** — this is a breaking param change for `listMessages`'s
  signature) are fully usable today.
- **New-chat manual id entry → `POST /api/Conversations`.** Replace the
  numeric-id text field with receiverId + first message; the create call
  *is* the send. Still open: confirm find-or-create behavior (see above)
  before finalizing the UI flow (does re-opening an existing peer from
  "new chat" error, or return the same conversation?).
- **Unread badges → `GET .../unread-count` for the global badge,
  per-item `unreadCount` from `GET /api/Conversations` for the
  conversation list rows; `PUT .../{conversationId}/read` on
  conversation-open.**
- **Edit/delete message** → both usable now (`PUT`/`DELETE
  /api/Conversations/messages/{id}`); not asked for in the current UI
  but the data layer can support it going forward.
- **SignalR stays for real-time append only** (`ReceiveMessage` on an
  open conversation), REST becomes the source of truth for
  list/history/read-state/ids. On send, two options:
  1. Send via SignalR `SendMessage(receiverId, content)` for the
     "instant" UI feel, then let the eventual `GET` refetch (or a
     background reconciliation) attach the real REST `id`.
  2. Send via REST (`POST .../messages`) directly, which already returns
     the real `id` immediately, and drop SignalR send entirely, using the
     hub purely for receive.
  **Recommend option 2** — it's simpler (REST becomes the single write
  path with immediate ids, no reconciliation needed on the sender's own
  messages) and avoids the SignalR→REST id-less race entirely. SignalR's
  `SendMessage` invoke would only stay relevant if there's a reason to
  keep the hub round-trip lower-latency than REST, which wasn't part of
  this probe.

## Flagged mismatches / open items

1. **Field name**: SignalR `content` vs REST `message` — needs an
   explicit mapping function, not a shared type.
2. **No pagination** on `GET /api/Conversations` or conversation messages
   — contract inconsistency vs. the rest of the app's
   `PaginatedResponse<T>` convention. Not blocking today (test data is
   small) but will need backend follow-up before a provider with a large
   inbox uses this in production.
3. **No `editedAt`/`isEdited`** on the message DTO — if edit is wired
   into UI later, there's no way to show "(edited)" from data alone.
4. **Find-or-create semantics of `POST /api/Conversations` untested** —
   verify before wiring "start new chat" so the UI knows whether to guard
   against duplicate conversations client-side.
5. **SignalR/REST id reconciliation** — SignalR messages carry no `id`;
   recommend switching message-send to REST-only (see migration plan)
   to sidestep this rather than building content+timestamp de-dup.
6. The repo's checked-in `swagger.json` is **stale** — it has none of
   these 6 `/api/Conversations*` paths. The live swagger
   (`https://miqwad-test.runasp.net/swagger/v1/swagger.json`) is current;
   worth re-fetching that file into the repo so future diagnosis doesn't
   start from a stale contract.
7. **`.env` is missing locally** (only `.env.example`/`.env.production`
   exist) — the dev server's login is currently broken because of this
   independent of chat: `apiClient` falls back to the vite-proxied
   `/api`, but auth's phone-login call path
   (`/phone/login`, in `src/modules/auth/api/authApi.ts`) is stale too —
   swagger confirms the real path is `/api/auth/phone/login`. Unrelated
   to chat, but blocked the login flow during this probe (worked around
   it by calling `/api/auth/login` — the email/password path — directly).
   Flagging since it'll block anyone else trying to click through the app
   locally until either `.env` is added or that auth path is fixed.
