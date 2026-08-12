/**
 * @file AttachmentUserListPanel.tsx
 * @description Master list for the "By User" tab — users derived client-side
 * from the attachments list (users who have at least one attachment), sorted
 * by attachment count desc then name. Drives the detail panel via `onSelect`.
 */
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@shared/lib/utils";
import type { UserAttachmentGroup } from "../lib/groupByUser";

interface Props {
  groups: UserAttachmentGroup[];
  selectedKey: string | null;
  onSelect: (group: UserAttachmentGroup) => void;
}

export function AttachmentUserListPanel({ groups, selectedKey, onSelect }: Props) {
  const { t } = useTranslation();

  if (groups.length === 0) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-8 text-center shadow-sm">
        <p className="text-sm text-[var(--color-muted)]">{t("attachments.byUser.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm">
      <ul role="list" className="divide-y divide-[var(--color-divider)]">
        {groups.map((group) => {
          const key = group.userName ?? "__unknown__";
          const isSelected = key === selectedKey;
          return (
            <li key={key}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => onSelect(group)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(group);
                  }
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150",
                  isSelected ? "bg-[var(--color-brand-orange)]/10" : "hover:bg-[var(--color-surface-2)]",
                )}
              >
                <Avatar size="sm">
                  <AvatarFallback>{group.displayName.trim().charAt(0)}</AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    isSelected ? "font-semibold text-[var(--color-brand-orange)]" : "font-medium text-[var(--color-ink-body)]",
                  )}
                >
                  {group.displayName}
                </span>
                <Badge tone="brand" size="sm" className="shrink-0">
                  {t("attachments.byUser.count", { count: group.count })}
                </Badge>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
