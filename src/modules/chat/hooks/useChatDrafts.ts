import { useEffect, useRef, useState } from "react";
import { AppError } from "@shared/types/api";
import { chatApi } from "../api/chatApi";
import { isAudio, supportedFile } from "../lib/mediaPolicy";
import type { ChatAttachment, MessageInput } from "../types";

export interface DraftAttachment {
  id: string;
  file: File;
  previewUrl: string;
  status: "selected" | "uploading" | "uploaded" | "failed";
  progress: number;
  server?: ChatAttachment;
  recordingDuration?: number;
}
export interface ChatDraft {
  text: string;
  attachments: DraftAttachment[];
  busy: boolean;
  error?: string;
  uncertain: boolean;
}
const emptyDraft = (): ChatDraft => ({ text: "", attachments: [], busy: false, uncertain: false });
export function mutationUncertain(error: unknown): boolean {
  return (
    !(error instanceof AppError) || !error.status || error.status === 408 || error.status >= 500
  );
}
export function useChatDrafts() {
  const [drafts, setDrafts] = useState<Record<string, ChatDraft>>({});
  const current = useRef(drafts);
  const alive = useRef(true);
  const urls = useRef(new Set<string>());
  useEffect(() => {
    alive.current = true;
    const ownedUrls = urls.current;
    return () => {
      alive.current = false;
      ownedUrls.forEach(URL.revokeObjectURL);
      ownedUrls.clear();
    };
  }, []);
  const update = (key: string, fn: (draft: ChatDraft) => ChatDraft) => {
    if (!alive.current) return;
    const next = { ...current.current, [key]: fn(current.current[key] ?? emptyDraft()) };
    current.current = next;
    setDrafts(next);
  };
  const revoke = (url: string) => {
    URL.revokeObjectURL(url);
    urls.current.delete(url);
  };
  const changeText = (key: string, text: string) =>
    update(key, (d) => (d.busy || d.uncertain ? d : { ...d, text, error: undefined }));
  const add = (key: string, files: File[], recordingDuration?: number) => {
    const d = current.current[key] ?? emptyDraft();
    if (!files.length || d.busy || d.uncertain) return;
    if (files.some((f) => !supportedFile(f))) {
      update(key, (d) => ({ ...d, error: "chat.media.unsupported" }));
      return;
    }
    // This composer sends voice files separately; it is not a claim about server attachment-count limits.
    const combined = [...d.attachments.map((a) => a.file), ...files];
    if (combined.some((f) => isAudio(f.type)) && combined.length > 1) {
      update(key, (d) => ({ ...d, error: "chat.media.audioSeparate" }));
      return;
    }
    const selected = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      urls.current.add(previewUrl);
      return {
        id: crypto.randomUUID(),
        file,
        previewUrl,
        status: "selected" as const,
        progress: 0,
        recordingDuration,
      };
    });
    update(key, (d) => ({ ...d, attachments: [...d.attachments, ...selected], error: undefined }));
  };
  const remove = (key: string, id: string) => {
    const d = current.current[key];
    if (!d || d.busy || d.uncertain) return;
    const item = d.attachments.find((a) => a.id === id);
    if (!item) return;
    // Server deletion is not silently implied by removing a local draft reference.
    revoke(item.previewUrl);
    update(key, (d) => ({
      ...d,
      attachments: d.attachments.filter((a) => a.id !== id),
      error: undefined,
    }));
  };
  const send = async (key: string, onSend: (input: MessageInput) => Promise<string | void>) => {
    const draft = current.current[key] ?? emptyDraft();
    const audioOnly = draft.attachments.some((a) => isAudio(a.file.type));
    if (
      draft.busy ||
      draft.uncertain ||
      (!draft.text.trim() && !draft.attachments.length) ||
      (!audioOnly && draft.text.length > 2000)
    )
      return;
    if (audioOnly && draft.attachments.length !== 1) {
      update(key, (d) => ({ ...d, error: "chat.media.audioSeparate" }));
      return;
    }
    update(key, (d) => ({ ...d, busy: true, error: undefined }));
    let phase: "upload" | "send" = "upload";
    try {
      const ids: number[] = [];
      for (const item of draft.attachments) {
        if (!alive.current) return;
        if (item.server) {
          ids.push(item.server.id);
          continue;
        }
        const patch = (values: Partial<DraftAttachment>) =>
          update(key, (d) => ({
            ...d,
            attachments: d.attachments.map((a) => (a.id === item.id ? { ...a, ...values } : a)),
          }));
        patch({ status: "uploading", progress: 0 });
        try {
          const server = await chatApi.uploadMedia(item.file, (progress) => patch({ progress }));
          patch({ status: "uploaded", server, progress: 100 });
          ids.push(server.id);
        } catch (error) {
          patch({ status: "failed" });
          throw error;
        }
      }
      if (!alive.current) return;
      phase = "send";
      const destination = await onSend({
        message: audioOnly ? null : draft.text.trim() || null,
        attachmentIds: ids,
      });
      if (!alive.current) return;
      draft.attachments.forEach((a) => revoke(a.previewUrl));
      const latestText = current.current[key]?.text ?? draft.text;
      // Another newly created conversation can resolve to this ID while a send is in flight.
      // Remove only the submitted text, preserving any text carried here in the meantime.
      const text = audioOnly
        ? latestText
        : latestText === draft.text
          ? ""
          : latestText.startsWith(`${draft.text}\n`)
            ? latestText.slice(draft.text.length + 1)
            : latestText;
      // Creating a conversation replaces new:<peer> with conversation:<id>.
      // Carry the unsent text to that key without overwriting another local draft.
      if (destination && destination !== key && text) {
        update(destination, (d) => ({ ...d, text: d.text ? `${d.text}\n${text}` : text }));
        update(key, () => emptyDraft());
      } else {
        update(key, () => ({ ...emptyDraft(), text }));
      }
    } catch (error) {
      const uncertain = mutationUncertain(error);
      update(key, (d) => ({
        ...d,
        busy: false,
        uncertain,
        error: uncertain
          ? "chat.media.uncertain"
          : phase === "upload"
            ? "chat.media.uploadFailed"
            : "chat.media.sendFailed",
      }));
    }
  };
  const discard = (key: string) => {
    const draft = current.current[key];
    if (!draft || draft.busy) return;
    draft.attachments.forEach((item) => revoke(item.previewUrl));
    update(key, () => ({
      ...emptyDraft(),
      text: draft.attachments.some((a) => isAudio(a.file.type)) ? draft.text : "",
    }));
  };
  return { drafts, changeText, add, remove, send, discard };
}
