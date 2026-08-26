/**
 * @file chatErrors.ts
 *
 * Maps a thrown SendMessage invoke error (a generic Error from SignalR
 * carrying the hub's exception message) to one of the confirmed hub error
 * codes, then to the matching chat.errors.* i18n key. Pure helper — no i18n
 * lookup itself, callers pass the key to `t()`.
 */

import type { ChatHubErrorCode } from "../types";

const CODE_PATTERNS: ReadonlyArray<readonly [RegExp, ChatHubErrorCode]> = [
  [/InvalidReceiverId/i, "InvalidReceiverId"],
  [/CannotSendToSelf/i, "CannotSendToSelf"],
  [/MessageTooLong/i, "MessageTooLong"],
  [/MessageEmpty/i, "MessageEmpty"],
  [/NotAuthenticated|Unauthorized/i, "NotAuthenticated"],
];

export function resolveChatHubErrorCode(error: unknown): ChatHubErrorCode {
  const message = error instanceof Error ? error.message : String(error);
  for (const [pattern, code] of CODE_PATTERNS) {
    if (pattern.test(message)) return code;
  }
  return "Generic";
}

const I18N_KEY_BY_CODE: Record<ChatHubErrorCode, string> = {
  InvalidReceiverId: "chat.errors.invalidReceiver",
  CannotSendToSelf: "chat.errors.cannotSendToSelf",
  MessageEmpty: "chat.errors.empty",
  MessageTooLong: "chat.errors.tooLong",
  NotAuthenticated: "chat.errors.notAuthenticated",
  Generic: "chat.errors.generic",
};

export function chatHubErrorI18nKey(error: unknown): string {
  return I18N_KEY_BY_CODE[resolveChatHubErrorCode(error)];
}
