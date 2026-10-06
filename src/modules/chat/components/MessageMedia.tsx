import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ImageOff, File } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { safeMediaUrl } from "../lib/chatAdapter";
import type { ChatAttachment } from "../types";

export function MessageMedia({ attachment }: { attachment: ChatAttachment }) {
  const { t, i18n } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const url = safeMediaUrl(attachment.filePath);
  const name = attachment.originalFileName || t("chat.media.attachment");
  const unavailable = !url || failed;
  if (unavailable)
    return (
      <div className="flex items-center gap-2 rounded border p-3 text-xs">
        <ImageOff size={18} aria-hidden />
        {t("chat.media.unavailable")}
      </div>
    );
  if (attachment.contentType?.startsWith("image/"))
    return (
      <>
        <button
          type="button"
          className="block w-full rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => setOpen(true)}
          aria-label={t("chat.media.expand", { name })}
        >
          {!loaded && (
            <span className="block p-3 text-xs" role="status">
              {t("chat.media.loading")}
            </span>
          )}
          <img
            src={url}
            alt={name}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className="max-h-72 w-full rounded-lg object-contain"
          />
        </button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent showCloseButton={false} size="lg" dir={i18n.dir()}>
            <DialogTitle className="text-sm break-all">
              <bdi>{name}</bdi>
            </DialogTitle>
            <DialogDescription className="sr-only">{t("chat.media.preview")}</DialogDescription>
            <img
              src={url}
              alt={name}
              className="max-h-[70svh] w-full object-contain"
              onError={() => setFailed(true)}
            />
            <button
              type="button"
              className="min-h-11 rounded border px-3"
              onClick={() => setOpen(false)}
            >
              {t("chat.media.close")}
            </button>
          </DialogContent>
        </Dialog>
      </>
    );
  if (attachment.contentType?.startsWith("audio/"))
    return (
      <div className="min-w-0 space-y-1">
        <bdi className="block truncate text-xs">{name}</bdi>
        <audio
          controls
          preload="metadata"
          src={url}
          onError={() => setFailed(true)}
          aria-label={name}
          className="h-12 w-full max-w-full min-w-0"
        />
      </div>
    );
  // Existing server media can be opened safely, but unverified upload formats are not offered.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 items-center gap-2 text-sm break-all underline"
    >
      <File size={18} className="shrink-0" />
      <bdi>{name}</bdi>
      <span className="shrink-0 text-xs">
        {new Intl.NumberFormat(i18n.language).format(attachment.fileSize)} B
      </span>
    </a>
  );
}
