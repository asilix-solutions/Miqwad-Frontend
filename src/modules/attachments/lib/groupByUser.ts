/**
 * @file groupByUser.ts
 * @description Client-side grouping of an already-fetched attachments list
 * by owner (`userName`). `userName` is confirmed unique per backend, so it
 * is safe to use directly as the group key. Legacy attachments with a
 * null/empty `userName` are bucketed under a single "unknown" group.
 */
import type { Attachment } from "../types";

export interface UserAttachmentGroup {
  userName: string | null;
  displayName: string;
  count: number;
  items: Attachment[];
}

/**
 * Groups attachments by `userName`, sorted by count desc then display name.
 * Never throws — an empty/undefined list yields an empty array.
 */
export function groupByUser(
  attachments: Attachment[] | undefined,
  unknownLabel: string,
): UserAttachmentGroup[] {
  const groups = new Map<string, UserAttachmentGroup>();

  for (const attachment of attachments ?? []) {
    const key = attachment.userName ?? "__unknown__";
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(attachment);
      existing.count += 1;
      continue;
    }
    groups.set(key, {
      userName: attachment.userName,
      displayName: attachment.userName ?? unknownLabel,
      count: 1,
      items: [attachment],
    });
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.displayName.localeCompare(b.displayName);
  });
}
