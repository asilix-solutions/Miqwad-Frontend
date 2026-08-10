/**
 * @file AttachmentUserDetailPanel.tsx
 * @description Detail panel for the selected user's attachments in the "By
 * User" tab. Renders two ways depending on viewport, mirroring
 * `CategoryServicesPanel`:
 *  - `variant="panel"`: persistent side-by-side panel (desktop).
 *  - `variant="sheet"`: bottom sheet that opens on row tap (narrow/mobile).
 * Reuses `AttachmentCard` for the items grid — no duplication.
 */
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AttachmentCard } from "./AttachmentCard";
import type { UserAttachmentGroup } from "../lib/groupByUser";
import type { Attachment } from "../types";

interface DetailProps {
  group: UserAttachmentGroup | null;
  onPreview: (attachment: Attachment) => void;
  onReplace: (attachment: Attachment) => void;
  onDelete: (attachment: Attachment) => void;
}

type Props =
  | (DetailProps & { variant: "panel" })
  | (DetailProps & { variant: "sheet"; open: boolean; onOpenChange: (open: boolean) => void });

export function AttachmentUserDetailPanel(props: Props) {
  const { group, variant, onPreview, onReplace, onDelete } = props;

  if (variant === "panel") {
    return (
      <div className="min-h-[240px] rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-sm">
        <AttachmentUserDetailContent group={group} onPreview={onPreview} onReplace={onReplace} onDelete={onDelete} />
      </div>
    );
  }

  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="bottom">
        {group && (
          <>
            <SheetHeader>
              <SheetTitle>{group.displayName}</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto">
              <AttachmentUserDetailContent group={group} onPreview={onPreview} onReplace={onReplace} onDelete={onDelete} bare />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function AttachmentUserDetailContent({
  group,
  onPreview,
  onReplace,
  onDelete,
  bare = false,
}: DetailProps & { bare?: boolean }) {
  const { t } = useTranslation();

  if (!group) {
    return (
      <div className="space-y-2 p-10 text-center">
        <Users className="mx-auto h-8 w-8 text-[var(--color-muted)]" />
        <p className="text-sm text-[var(--color-muted)]">{t("attachments.byUser.selectPrompt")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {!bare && (
        <div className="border-b border-[var(--color-divider)] p-4">
          <h3 className="truncate text-sm font-semibold text-[var(--color-ink-body)]">{group.displayName}</h3>
        </div>
      )}

      <div className={bare ? "" : "px-4 pb-4"}>
        {group.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">{t("attachments.byUser.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {group.items.map((attachment) => (
              <AttachmentCard
                key={attachment.id}
                attachment={attachment}
                variant="grid"
                compact
                onPreview={onPreview}
                onReplace={onReplace}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
