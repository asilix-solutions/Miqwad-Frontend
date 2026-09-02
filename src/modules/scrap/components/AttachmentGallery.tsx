/**
 * @file AttachmentGallery.tsx
 *
 * Null-safe gallery for live attachment DTOs ({ filePath, originalFileName,
 * contentType }). Images render as thumbnails; anything else renders as a
 * file chip. Each opens its `filePath` in a new tab. Renders nothing when
 * there are no usable attachments.
 *
 * Architecture: src/modules/scrap/components/
 */

import { useState } from "react";
import { FileText, ImageOff } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GalleryAttachment {
  id: string;
  originalFileName: string;
  filePath: string;
  contentType: string;
}

export interface AttachmentGalleryProps {
  attachments: GalleryAttachment[] | null | undefined;
}

// ── Thumbnail with safe fallback ──────────────────────────────────────────────

function Thumb({ att }: { att: GalleryAttachment }) {
  const [failed, setFailed] = useState(false);
  const isImage =
    att.contentType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(att.filePath);

  return (
    <a
      href={att.filePath}
      target="_blank"
      rel="noreferrer"
      title={att.originalFileName || att.filePath}
      className="group flex flex-col gap-1 focus-visible:outline-none"
    >
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface-2)] ring-1 ring-[var(--color-divider)] transition-shadow group-hover:ring-[var(--color-brand-orange)]/50 group-focus-visible:ring-2 group-focus-visible:ring-[var(--color-brand-orange)]/40">
        {isImage && !failed ? (
          <img
            src={att.filePath}
            alt={att.originalFileName || ""}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : isImage ? (
          <ImageOff className="h-6 w-6 text-[var(--color-muted)]" aria-hidden />
        ) : (
          <FileText className="h-6 w-6 text-[var(--color-muted)]" aria-hidden />
        )}
      </div>
      {att.originalFileName && (
        <span className="max-w-20 truncate text-[10px] text-[var(--color-muted)]">
          {att.originalFileName}
        </span>
      )}
    </a>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/** Null-safe attachment thumbnails/links from real `filePath`s. */
export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const usable = (attachments ?? []).filter((a) => a && a.filePath);
  if (usable.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {usable.map((att) => (
        <Thumb key={att.id || att.filePath} att={att} />
      ))}
    </div>
  );
}
