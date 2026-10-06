import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageOff, File, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@shared/lib/utils";
import { safeMediaUrl } from "../lib/chatAdapter";
import type { ChatAttachment } from "../types";

function MediaUnavailable() {
  const { t } = useTranslation();
  return (
    <span className="flex min-w-0 items-center justify-center gap-2 p-3 text-xs [overflow-wrap:anywhere]">
      <ImageOff size={18} className="shrink-0" aria-hidden />
      {t("chat.media.unavailable")}
    </span>
  );
}

function MediaImage({
  attachment,
  expanded = false,
  single = false,
}: {
  attachment: ChatAttachment;
  expanded?: boolean;
  single?: boolean;
}) {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = safeMediaUrl(attachment.filePath);
  if (!url || failed) return <MediaUnavailable />;
  return (
    <>
      {!loaded && (
        <span
          className="absolute inset-0 flex items-center justify-center p-2 text-xs"
          role="status"
        >
          {t("chat.media.loading")}
        </span>
      )}
      <img
        src={url}
        alt={attachment.originalFileName || t("chat.media.attachment")}
        loading={expanded ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "relative block w-full min-w-0",
          expanded
            ? "h-[55dvh] object-contain"
            : single
              ? "h-full object-contain"
              : "h-full object-cover",
        )}
      />
    </>
  );
}

export function MessageMedia({ attachments }: { attachments: ChatAttachment[] }) {
  const { t, i18n } = useTranslation();
  const images = attachments.filter((a) => a.contentType?.startsWith("image/"));
  const other = attachments.filter((a) => !a.contentType?.startsWith("image/"));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const index = images.findIndex((a) => a.id === selectedId);
  const selected = images[index];
  const name = selected?.originalFileName || t("chat.media.attachment");
  const control =
    "flex min-h-11 min-w-11 items-center justify-center rounded border px-3 focus-visible:outline-2 focus-visible:outline-[var(--color-brand-orange)] disabled:opacity-40";

  if (attachments.length === 0) return null;

  return (
    <>
      {images.length > 0 && (
        <div
          className={cn(
            "grid w-72 max-w-full min-w-0 gap-1",
            images.length > 1 && "grid-cols-2",
            images.length === 3 && "aspect-square grid-rows-2",
          )}
        >
          {images.slice(0, 4).map((attachment, tile) => {
            const more = tile === 3 ? images.length - 4 : 0;
            return (
              <button
                key={`${attachment.id}:${attachment.filePath}`}
                type="button"
                className={cn(
                  "relative min-h-0 min-w-0 overflow-hidden rounded-lg bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2",
                  images.length === 1 ? "aspect-[4/3]" : "aspect-square",
                  images.length === 3 && tile === 0 && "row-span-2 aspect-auto",
                )}
                onClick={(event) => {
                  opener.current = event.currentTarget;
                  setSelectedId(attachment.id);
                }}
                aria-label={
                  more > 0
                    ? t("chat.media.moreImages", { count: more })
                    : t("chat.media.expand", {
                        name: attachment.originalFileName || t("chat.media.attachment"),
                      })
                }
              >
                <MediaImage attachment={attachment} single={images.length === 1} />
                {more > 0 && (
                  <span
                    aria-hidden
                    className="absolute inset-0 flex items-center justify-center bg-black/60 text-xl font-semibold text-white"
                  >
                    +{more}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {other.map((attachment) => (
        <FileMedia key={`${attachment.id}:${attachment.filePath}`} attachment={attachment} />
      ))}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          size="lg"
          dir={i18n.dir()}
          className="max-h-[calc(100dvh-2rem)] min-w-0 overflow-y-auto p-3 sm:p-4"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <DialogTitle className="min-w-0 text-sm [overflow-wrap:anywhere]">
            <bdi>{name}</bdi>
          </DialogTitle>
          <DialogDescription className="sr-only">{t("chat.media.preview")}</DialogDescription>
          {selected && (
            <div className="relative flex min-h-20 min-w-0 items-center justify-center">
              <MediaImage
                key={`${selected.id}:${selected.filePath}`}
                attachment={selected}
                expanded
              />
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {images.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={control}
                  aria-label={t("chat.media.previousImage")}
                  disabled={index <= 0}
                  onClick={() => setSelectedId(images[index - 1].id)}
                >
                  <ChevronLeft size={18} className="rtl:rotate-180" aria-hidden />
                </button>
                <span className="text-xs" aria-live="polite">
                  {t("chat.media.imagePosition", { index: index + 1, total: images.length })}
                </span>
                <button
                  type="button"
                  className={control}
                  aria-label={t("chat.media.nextImage")}
                  disabled={index >= images.length - 1}
                  onClick={() => setSelectedId(images[index + 1].id)}
                >
                  <ChevronRight size={18} className="rtl:rotate-180" aria-hidden />
                </button>
              </div>
            )}
            <button type="button" className={control} onClick={() => setSelectedId(null)}>
              {t("chat.media.close")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FileMedia({ attachment }: { attachment: ChatAttachment }) {
  const { t, i18n } = useTranslation();
  const [failed, setFailed] = useState(false);
  const url = safeMediaUrl(attachment.filePath);
  const name = attachment.originalFileName || t("chat.media.attachment");
  if (!url || failed) return <MediaUnavailable />;
  if (attachment.contentType?.startsWith("audio/"))
    return (
      <div className="w-64 max-w-full min-w-0 space-y-1">
        <bdi className="block truncate text-xs" title={name}>
          {name}
        </bdi>
        <audio
          controls
          preload="metadata"
          src={url}
          onError={() => setFailed(true)}
          aria-label={name}
          dir="ltr"
          className="block h-10 w-full max-w-full min-w-0"
        />
      </div>
    );
  // Existing server media remains readable; this does not expand the upload allowlist.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 min-w-0 flex-wrap items-center gap-2 text-sm [overflow-wrap:anywhere] underline"
    >
      <File size={18} className="shrink-0" aria-hidden />
      <bdi className="min-w-0">{name}</bdi>
      <span className="text-xs">
        {new Intl.NumberFormat(i18n.language).format(attachment.fileSize)} B
      </span>
    </a>
  );
}
