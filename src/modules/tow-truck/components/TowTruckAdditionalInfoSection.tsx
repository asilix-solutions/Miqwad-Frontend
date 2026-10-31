/**
 * @file TowTruckAdditionalInfoSection.tsx
 * @description Notes and Attachments section for Tow Truck Workspace.
 * Preserves existing notes, authentic attachments, and avoids fabricating event timelines.
 */
import { useTranslation } from "react-i18next";
import { ArrowUpRight, FileText } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";

interface Props {
  order: TowTruckOrder;
}

export function TowTruckAdditionalInfoSection({ order }: Props) {
  const { t } = useTranslation();

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 lg:p-6 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-ink-900 uppercase tracking-wider flex items-center gap-2">
        <FileText size={16} className="text-ink-600" aria-hidden="true" />
        <span>{t("towTruck.additionalInfo")}</span>
      </h3>

      {/* Notes */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold text-ink-700 block">
          {t("towTruck.notes")}
        </span>
        <div className="rounded-xl border border-ink-200 bg-ink-50/40 p-3.5 text-xs text-ink-800 leading-relaxed min-h-[60px] whitespace-pre-wrap">
          {order.notes ?? (
            <span className="text-ink-400 italic">{t("towTruck.noNotes")}</span>
          )}
        </div>
      </div>

      {/* Attachments */}
      <div className="space-y-2 pt-2 border-t border-ink-100">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-ink-700">
            {t("towTruck.attachments")}
          </span>
          {order.attachments.length > 0 && (
            <span className="text-[11px] font-semibold text-brand-blue bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
              {order.attachments.length}
            </span>
          )}
        </div>

        {order.attachments.length > 0 ? (
          <ul className="space-y-2 list-none p-0 m-0">
            {order.attachments.map((a, index) => (
              <li
                key={a.key}
                className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-ink-200 bg-white hover:bg-brand-50/40 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="text-brand-blue shrink-0" aria-hidden="true" />
                  <span className="font-medium text-ink-900 truncate">
                    {a.name ?? t("towTruck.attachment", { number: index + 1 })}
                  </span>
                </div>

                {a.url ? (
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-blue hover:text-brand-700 transition-colors shrink-0 px-2 py-1 rounded bg-brand-50 border border-brand-200"
                    aria-label={`${a.name ?? t("towTruck.attachment", { number: index + 1 })} — ${t("towTruck.openAttachment")}`}
                  >
                    <span>{t("towTruck.openAttachment")}</span>
                    <ArrowUpRight size={13} className="rtl:rotate-270" aria-hidden="true" />
                  </a>
                ) : (
                  <span className="text-[11px] text-ink-400 italic shrink-0">
                    {t("towTruck.unavailableLink")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-ink-400 italic">
            {t(
              order.attachmentsKnown
                ? "towTruck.noAttachments"
                : "towTruck.attachmentsUnknown",
            )}
          </p>
        )}
      </div>
    </section>
  );
}
