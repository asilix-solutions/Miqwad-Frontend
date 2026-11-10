/**
 * Read-only supporting attachments for the order workspace.
 * Operational warnings, unclassified notes, finance and action owners stay outside this sheet.
 */
import { useTranslation } from "react-i18next";
import { ArrowUpRight, FileText, Paperclip, X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { TowTruckOrder } from "../lib/towTruckModel";
import "./towTruckSupportSheet.css";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckSupportingInformationSheet({ order }: Props) {
  const { t } = useTranslation();
  const attachments = order.attachments;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="tow-p4-support-trigger"
          aria-label={t("towTruck.attachments")}
        >
          <span className="flex items-center gap-2">
            <Paperclip size={16} aria-hidden="true" />
            {t("towTruck.attachments")}
          </span>
          {attachments.length > 0 && (
            <span className="tow-p4-support-count" aria-hidden="true">
              {attachments.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="end"
        showCloseButton={false}
        className="tow-p4-support-sheet"
      >
        <SheetHeader className="pe-10">
          <SheetTitle>{t("towTruck.attachments")}</SheetTitle>
          <SheetDescription>
            {t("towTruck.p4SupportingInformation")}
          </SheetDescription>
        </SheetHeader>
        <SheetClose
          className="tow-p4-support-close"
          aria-label={t("towTruck.p4CloseAttachments")}
        >
          <X size={18} aria-hidden="true" />
        </SheetClose>

        <div className="tow-p4-support-scroll">
          {attachments.length > 0 ? (
            <ul className="m-0 list-none space-y-3 p-0">
              {attachments.map((attachment, index) => (
                <li
                  key={attachment.key}
                  className="rounded-xl border border-ink-200 bg-white p-3"
                >
                  <div className="flex min-w-0 items-center gap-2 text-sm text-ink-900">
                    <FileText size={16} className="shrink-0 text-brand-blue" aria-hidden="true" />
                    <span className="min-w-0 break-words font-semibold">
                      {attachment.name ?? t("towTruck.attachment", { number: index + 1 })}
                    </span>
                  </div>
                  {attachment.url ? (
                    <a
                      className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 text-sm font-semibold text-brand-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${attachment.name ?? t("towTruck.attachment", { number: index + 1 })} — ${t("towTruck.openAttachment")}`}
                    >
                      {t("towTruck.openAttachment")}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-ink-500">
                      {t("towTruck.unavailableLink")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-600">
              {t(
                order.attachmentsKnown
                  ? "towTruck.noAttachments"
                  : "towTruck.attachmentsUnknown",
              )}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
