import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Send, Paperclip, Music, X, LoaderCircle } from "lucide-react";
import { ProviderTextarea } from "@shared/provider-ui";
import type { ChatDraft } from "../hooks/useChatDrafts";
import { isAudio } from "../lib/mediaPolicy";
import type { ConnectionStatus } from "../types";

interface Props {
  status: ConnectionStatus;
  draft: ChatDraft;
  onText: (value: string) => void;
  onFiles: (files: File[]) => void;
  onRemove: (id: string) => void;
  onSend: () => Promise<void>;
  onCheck: () => void;
  onDiscard: () => void;
}
export function MessageComposer({
  status,
  draft,
  onText,
  onFiles,
  onRemove,
  onSend,
  onCheck,
  onDiscard,
}: Props) {
  const { t } = useTranslation();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const images = useRef<HTMLInputElement>(null);
  const audio = useRef<HTMLInputElement>(null);
  const locked = draft.busy || draft.uncertain;
  const hasAudio = draft.attachments.some((a) => isAudio(a.file.type));
  const disabled =
    locked || (!draft.text.trim() && !draft.attachments.length) || draft.text.length > 2000;
  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!disabled) void onSend();
    }
  };
  const buttonClass =
    "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-divider)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-orange)] disabled:opacity-40";
  return (
    <div className="min-w-0 space-y-2 border-t border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
      {draft.attachments.length > 0 && (
        <ul
          className="flex max-h-44 gap-2 overflow-x-auto py-1"
          aria-label={t("chat.media.attachments")}
        >
          {draft.attachments.map((a) => (
            <li
              key={a.id}
              className="w-36 shrink-0 rounded-lg border border-[var(--color-divider)] p-2"
            >
              <div className="flex items-center justify-between gap-1">
                <bdi className="truncate text-xs" title={a.file.name}>
                  {a.file.name}
                </bdi>
                <button
                  type="button"
                  className="flex size-9 shrink-0 items-center justify-center"
                  aria-label={t("chat.media.remove", { name: a.file.name })}
                  onClick={() => onRemove(a.id)}
                  disabled={locked}
                >
                  <X size={16} />
                </button>
              </div>
              {isAudio(a.file.type) ? (
                <audio
                  controls
                  preload="metadata"
                  src={a.previewUrl}
                  aria-label={a.file.name}
                  className="h-10 w-full min-w-0"
                />
              ) : (
                <img
                  src={a.previewUrl}
                  alt={t("chat.media.preview")}
                  className="h-16 w-full rounded object-contain"
                />
              )}
              <p className="mt-1 text-xs" role="status">
                {t(`chat.media.${a.status}`)}
              </p>
              {a.status === "uploading" && (
                <progress
                  value={a.progress}
                  max={100}
                  aria-label={t("chat.media.uploading")}
                  className="w-full"
                />
              )}
            </li>
          ))}
        </ul>
      )}
      <ProviderTextarea
        value={draft.text}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={keyDown}
        disabled={locked || hasAudio}
        aria-label={t("chat.composerPlaceholder")}
        placeholder={hasAudio ? t("chat.media.audioSeparate") : t("chat.composerPlaceholder")}
        rows={2}
        className="max-h-36 min-h-0 resize-y"
      />
      <div className="flex items-center gap-2">
        <input
          ref={images}
          className="hidden"
          type="file"
          accept="image/png"
          multiple
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          disabled={locked}
        />
        <input
          ref={audio}
          className="hidden"
          type="file"
          accept="audio/wav"
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
          disabled={locked}
        />
        <button
          type="button"
          className={buttonClass}
          disabled={locked || hasAudio}
          title={t("chat.media.addImages")}
          aria-label={t("chat.media.addImages")}
          onClick={() => images.current?.click()}
        >
          <Paperclip size={18} />
        </button>
        <button
          type="button"
          className={buttonClass}
          disabled={locked || draft.attachments.length > 0 || !!draft.text.trim()}
          title={t("chat.media.addAudio")}
          aria-label={t("chat.media.addAudio")}
          onClick={() => audio.current?.click()}
        >
          <Music size={18} />
        </button>
        <span className="min-w-0 flex-1 text-xs text-[var(--color-muted)]">
          {draft.text.length > 1800
            ? t("chat.composer.charCounter", { count: draft.text.length, max: 2000 })
            : t("chat.media.formats")}
        </span>
        <button
          type="button"
          className={`${buttonClass} bg-[var(--color-brand-orange)] text-white`}
          disabled={disabled}
          aria-label={t(draft.busy ? "chat.media.sending" : "chat.send")}
          onClick={() => void onSend()}
        >
          {draft.busy ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
      {draft.text.length > 2000 && (
        <p role="alert" className="text-xs text-[var(--color-danger-500)]">
          {t("chat.composer.tooLong")}
        </p>
      )}
      {draft.error && (
        <p role="alert" className="text-xs text-[var(--color-danger-500)]">
          {t(draft.error)}
        </p>
      )}
      {draft.uncertain && (
        <button type="button" className="text-sm underline" onClick={onCheck}>
          {t("chat.media.checkDelivery")}
        </button>
      )}
      {draft.uncertain &&
        (!confirmDiscard ? (
          <button
            type="button"
            className="min-h-11 text-sm underline"
            onClick={() => setConfirmDiscard(true)}
          >
            {t("chat.media.discardDraft")}
          </button>
        ) : (
          <div
            className="space-y-2 rounded border p-2"
            role="group"
            aria-label={t("chat.media.discardDraft")}
          >
            <p className="text-xs">{t("chat.media.discardWarning")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-11 rounded border px-3"
                onClick={() => setConfirmDiscard(false)}
              >
                {t("chat.media.cancel")}
              </button>
              <button
                type="button"
                className="min-h-11 rounded border px-3"
                onClick={() => {
                  onDiscard();
                  setConfirmDiscard(false);
                }}
              >
                {t("chat.media.confirmDiscard")}
              </button>
            </div>
          </div>
        ))}
      {draft.attachments.some((a) => a.server) && !draft.busy && (
        <p className="text-xs text-[var(--color-muted)]">{t("chat.media.uploadRetained")}</p>
      )}
      {status !== "connected" && (
        <p className="text-xs text-[var(--color-muted)]">{t("chat.composerReceiveDegradedHint")}</p>
      )}
    </div>
  );
}
