import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Send, Paperclip, Music, Image, Mic, Square, X, LoaderCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { ProviderTextarea } from "@shared/provider-ui";
import type { ChatDraft } from "../hooks/useChatDrafts";
import { cn } from "@shared/lib/utils";
import { isAudio } from "../lib/mediaPolicy";
import type { ConnectionStatus } from "../types";

interface Props {
  status: ConnectionStatus;
  isVisible: boolean;
  draft: ChatDraft;
  onText: (value: string) => void;
  onFiles: (files: File[], recordingDuration?: number) => void;
  onRemove: (id: string) => void;
  onSend: () => Promise<void>;
  onCheck: () => void;
  onDiscard: () => void;
}
export function MessageComposer({
  status,
  isVisible,
  draft,
  onText,
  onFiles,
  onRemove,
  onSend,
  onCheck,
  onDiscard,
}: Props) {
  const { t, i18n } = useTranslation();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const images = useRef<HTMLInputElement>(null);
  const audio = useRef<HTMLInputElement>(null);
  const microphone = useRef<HTMLButtonElement>(null);
  const stopRecording = useRef<HTMLButtonElement>(null);
  const cancelRecording = useRef<HTMLButtonElement>(null);
  const previewAudio = useRef<HTMLAudioElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const recorder = useVoiceRecorder(
    ({ file, durationSeconds }) => onFiles([file], durationSeconds),
    isVisible,
  );
  const recordingActive = recorder.phase !== "idle";
  const previousPhase = useRef(recorder.phase);
  const locked = draft.busy || draft.uncertain;
  const hasAudio = draft.attachments.some((a) => isAudio(a.file.type));
  const disabled =
    locked ||
    recordingActive ||
    (!draft.text.trim() && !draft.attachments.length) ||
    (!hasAudio && draft.text.length > 2000);
  useEffect(() => {
    if (!isVisible) {
      previousPhase.current = recorder.phase;
      return;
    }
    if (recorder.phase === "requesting") cancelRecording.current?.focus();
    if (recorder.phase === "recording") stopRecording.current?.focus();
    if (previousPhase.current !== "idle" && recorder.phase === "idle") {
      if (hasAudio) previewAudio.current?.focus();
      else microphone.current?.focus();
    }
    previousPhase.current = recorder.phase;
  }, [recorder.phase, hasAudio, isVisible]);
  const submit = () => {
    recorder.clearError();
    return onSend();
  };
  const keyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!disabled) void submit();
    }
  };
  const buttonClass =
    "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-divider)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-orange)] disabled:opacity-40";
  return (
    <div className="min-w-0 space-y-2 border-t border-[var(--color-divider)] bg-[var(--color-surface)] p-3 [overflow-wrap:anywhere]">
      {recordingActive ? (
        <div className="space-y-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <button
              ref={cancelRecording}
              type="button"
              className={buttonClass}
              onClick={recorder.cancel}
              aria-label={t("chat.voice.cancel")}
            >
              <X size={18} aria-hidden />
            </button>
            <div className="min-w-0 flex-1 text-center text-xs">
              <span className="flex items-center justify-center gap-1" role="status">
                {recorder.phase === "recording" ? (
                  <span
                    className="size-2 shrink-0 rounded-full bg-[var(--color-danger-500)]"
                    aria-hidden
                  />
                ) : (
                  <LoaderCircle size={14} className="shrink-0 animate-spin" aria-hidden />
                )}
                {t(`chat.voice.${recorder.phase}`)}
              </span>
              <span
                role="timer"
                aria-live="off"
                aria-label={t("chat.voice.duration")}
                dir="ltr"
                className="block font-mono text-base tabular-nums"
              >
                {formatDuration(recorder.elapsed)}
              </span>
            </div>
            <button
              ref={stopRecording}
              type="button"
              className={buttonClass}
              disabled={recorder.phase !== "recording"}
              onClick={recorder.stop}
              aria-label={t("chat.voice.stop")}
            >
              <Square size={18} aria-hidden />
            </button>
          </div>
          {draft.text && (
            <p className="text-xs text-[var(--color-muted)]">{t("chat.voice.textRetained")}</p>
          )}
        </div>
      ) : (
        <>
          {draft.attachments.length > 0 && (
            <ul
              className={cn(
                "grid max-h-[min(20dvh,9rem)] min-w-0 grid-cols-[repeat(auto-fill,minmax(min(100%,7rem),1fr))] gap-2 overflow-y-auto overscroll-contain p-1",
                hasAudio && "max-h-none",
              )}
              aria-label={t("chat.media.attachments")}
            >
              {draft.attachments.map((a) => (
                <li
                  key={a.id}
                  className={cn(
                    "relative min-w-0 rounded-lg border border-[var(--color-divider)] p-1.5",
                    isAudio(a.file.type) && "col-span-full",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1">
                    <bdi
                      className="block min-w-0 flex-1 truncate pe-10 text-xs"
                      title={
                        a.recordingDuration !== undefined ? t("chat.voice.title") : a.file.name
                      }
                    >
                      {a.recordingDuration !== undefined ? t("chat.voice.title") : a.file.name}
                    </bdi>
                    <button
                      type="button"
                      className="absolute end-0 top-0 z-10 flex size-11 items-center justify-center rounded-lg bg-[var(--color-surface)]/90 focus-visible:outline-2 focus-visible:outline-[var(--color-brand-orange)] disabled:opacity-40"
                      aria-label={
                        a.recordingDuration !== undefined
                          ? t("chat.voice.discard")
                          : t("chat.media.remove", { name: a.file.name })
                      }
                      onClick={() => {
                        onRemove(a.id);
                        recorder.clearError();
                      }}
                      disabled={locked}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  {isAudio(a.file.type) ? (
                    <>
                      <audio
                        ref={previewAudio}
                        tabIndex={0}
                        controls
                        preload="metadata"
                        src={a.previewUrl}
                        aria-label={
                          a.recordingDuration !== undefined ? t("chat.voice.title") : a.file.name
                        }
                        onError={() => setPreviewError(a.id)}
                        dir="ltr"
                        className="mt-7 block h-10 w-full max-w-full min-w-0"
                      />
                      {a.recordingDuration !== undefined && (
                        <span
                          dir="ltr"
                          className="block text-xs tabular-nums"
                          aria-label={t("chat.voice.duration")}
                        >
                          {formatDuration(a.recordingDuration)}
                        </span>
                      )}
                      {previewError === a.id && (
                        <p role="alert" className="text-xs text-[var(--color-danger-500)]">
                          {t("chat.voice.previewFailed")}
                        </p>
                      )}
                    </>
                  ) : (
                    <img
                      src={a.previewUrl}
                      alt={t("chat.media.preview")}
                      loading="lazy"
                      className="h-12 w-full min-w-0 rounded object-contain"
                    />
                  )}
                  <p className="mt-1 text-[11px]" role="status">
                    {t(`chat.media.${a.status}`)}
                  </p>
                  {a.status === "uploading" && (
                    <progress
                      value={a.progress}
                      max={100}
                      aria-label={t("chat.media.uploading")}
                      className="block h-1 w-full"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {hasAudio ? (
            <p role="status" className="text-xs text-[var(--color-muted)]">
              {t(draft.text ? "chat.voice.textRetained" : "chat.voice.standalone")}
            </p>
          ) : (
            <ProviderTextarea
              value={draft.text}
              onChange={(e) => onText(e.target.value)}
              onKeyDown={keyDown}
              disabled={locked}
              aria-label={t("chat.composerPlaceholder")}
              placeholder={t("chat.composerPlaceholder")}
              rows={1}
              dir="auto"
              className="max-h-24 min-h-11 min-w-0 resize-y"
            />
          )}
          <div className="flex min-w-0 flex-wrap items-center gap-2">
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
            <DropdownMenu dir={i18n.dir()}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={buttonClass}
                  disabled={locked || hasAudio}
                  aria-label={t("chat.voice.attach")}
                >
                  <Paperclip size={18} aria-hidden />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                collisionPadding={8}
                className="max-w-[calc(100vw-1rem)]"
              >
                <DropdownMenuItem className="min-h-11" onSelect={() => images.current?.click()}>
                  <Image aria-hidden />
                  {t("chat.voice.imageOption")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-11"
                  disabled={draft.attachments.length > 0}
                  onSelect={() => audio.current?.click()}
                >
                  <Music aria-hidden />
                  {t("chat.voice.audioOption")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              ref={microphone}
              type="button"
              className={buttonClass}
              disabled={locked || draft.attachments.length > 0 || !isVisible}
              title={t("chat.voice.start")}
              aria-label={t("chat.voice.start")}
              onClick={() => void recorder.start()}
            >
              <Mic size={18} aria-hidden />
            </button>
            <span className="min-w-0 flex-1 text-xs text-[var(--color-muted)]">
              {!hasAudio && draft.text.length > 1800
                ? t("chat.composer.charCounter", { count: draft.text.length, max: 2000 })
                : t("chat.media.formats")}
            </span>
            <button
              type="button"
              className={`${buttonClass} bg-[var(--color-brand-orange)] text-white`}
              disabled={disabled}
              aria-label={t(
                draft.busy ? "chat.media.sending" : hasAudio ? "chat.voice.send" : "chat.send",
              )}
              onClick={() => void submit()}
            >
              {draft.busy ? (
                <LoaderCircle size={18} className="animate-spin" />
              ) : (
                <Send size={18} className="rtl:rotate-180" />
              )}
            </button>
          </div>
        </>
      )}
      {recorder.error && (
        <p role="alert" className="text-xs text-[var(--color-danger-500)]">
          {t(recorder.error)}
        </p>
      )}
      {!hasAudio && !recordingActive && draft.text.length > 2000 && (
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

function formatDuration(seconds: number): string {
  const elapsed = Math.max(0, Math.floor(seconds));
  return `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, "0")}`;
}
