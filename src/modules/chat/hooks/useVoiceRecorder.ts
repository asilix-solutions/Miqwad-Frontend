import { useEffect, useRef, useState } from "react";
import workletUrl from "../lib/voiceCapture.worklet.js?url&no-inline";
import { encodeVoiceWav, type VoiceRecording } from "../lib/wavEncoder";

type Phase = "idle" | "requesting" | "recording" | "stopping";
interface Session {
  context: AudioContext;
  stream?: MediaStream;
  source?: MediaStreamAudioSourceNode;
  node?: AudioWorkletNode;
  chunks: ArrayBuffer[];
  startedAt: number | null;
  finishing: boolean;
  timer?: ReturnType<typeof setInterval>;
  flushTimer?: ReturnType<typeof setTimeout>;
  finish: (notice?: string) => void;
}

function stopInput(session: Session) {
  clearInterval(session.timer);
  session.context.onstatechange = null;
  session.stream?.getTracks().forEach((track) => {
    track.onended = null;
    track.onmute = null;
    track.stop();
  });
  session.stream = undefined;
  session.source?.disconnect();
  session.source = undefined;
}

function release(session: Session) {
  stopInput(session);
  clearTimeout(session.flushTimer);
  if (session.node) {
    session.node.onprocessorerror = null;
    session.node.port.onmessage = null;
    session.node.port.close();
    session.node.disconnect();
  }
  void session.context.close().catch(() => {});
  session.chunks = [];
}

function microphoneError(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "chat.voice.permissionDenied";
  if (name === "NotFoundError") return "chat.voice.noMicrophone";
  if (name === "NotReadableError" || name === "AbortError") return "chat.voice.deviceFailed";
  return "chat.voice.recordingFailed";
}

/** The hook owns capture only. After Stop, the existing per-conversation draft owns the WAV. */
export function useVoiceRecorder(
  onRecorded: (recording: VoiceRecording) => void,
  isVisible: boolean,
) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const active = useRef<Session | null>(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const onHidden = () => {
      if (document.visibilityState !== "visible") active.current?.finish("chat.voice.interrupted");
    };
    const onPageHide = () => active.current?.finish("chat.voice.interrupted");
    const onBlur = () => {
      // A permission prompt can take focus before capture begins; do not cancel that prompt.
      const session = active.current;
      if (session?.startedAt != null) session.finish("chat.voice.interrupted");
    };
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("blur", onBlur);
    return () => {
      alive.current = false;
      const session = active.current;
      active.current = null;
      if (session) release(session);
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) active.current?.finish("chat.voice.interrupted");
  }, [isVisible]);

  const cancel = () => {
    const session = active.current;
    active.current = null;
    if (session) release(session);
    setPhase("idle");
    setElapsed(0);
    setError(null);
  };

  const start = async () => {
    if (active.current || !alive.current || !isVisible) return;
    setError(null);
    setElapsed(0);
    if (
      !window.isSecureContext ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof AudioContext === "undefined" ||
      typeof AudioWorkletNode === "undefined"
    ) {
      setError("chat.voice.unsupported");
      return;
    }
    let context: AudioContext;
    try {
      context = new AudioContext();
    } catch {
      setError("chat.voice.recordingFailed");
      return;
    }
    if (!context.audioWorklet) {
      void context.close().catch(() => {});
      setError("chat.voice.unsupported");
      return;
    }
    const session: Session = {
      context,
      chunks: [],
      startedAt: null,
      finishing: false,
      finish: () => {},
    };
    active.current = session;
    setPhase("requesting");
    const isCurrent = () => alive.current && active.current === session;
    const fail = (key: string) => {
      if (!isCurrent()) return;
      active.current = null;
      release(session);
      setPhase("idle");
      setError(key);
    };
    let finishNotice: string | undefined;
    const finalize = () => {
      if (!isCurrent()) return;
      let recording: VoiceRecording;
      try {
        recording = encodeVoiceWav(session.chunks, context.sampleRate);
      } catch {
        fail(session.chunks.length ? "chat.voice.encodingFailed" : "chat.voice.emptyRecording");
        return;
      }
      active.current = null;
      release(session);
      setElapsed(recording.durationSeconds);
      setPhase("idle");
      setError(finishNotice ?? null);
      onRecorded(recording);
    };
    session.finish = (notice) => {
      if (!isCurrent() || session.finishing) return;
      session.finishing = true;
      finishNotice = notice;
      stopInput(session); // Release the microphone immediately, before encoding or upload.
      if (!session.node || session.startedAt === null) {
        fail(notice ?? "chat.voice.recordingFailed");
        return;
      }
      setPhase("stopping");
      session.node.port.postMessage("stop");
      // A suspended/crashed audio thread might never flush. Preserve received PCM only.
      session.flushTimer = setTimeout(() => {
        finishNotice ??= "chat.voice.interrupted";
        finalize();
      }, 1500);
    };
    // Resume from the explicit click to respect browser audio activation policies.
    const resumed = context.resume().catch(() => {
      fail("chat.voice.recordingFailed");
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!isCurrent()) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      session.stream = stream;
      if (!stream.getAudioTracks().length) {
        fail("chat.voice.noMicrophone");
        return;
      }
      stream.getAudioTracks().forEach((track) => {
        track.onended = () => session.finish("chat.voice.deviceFailed");
        track.onmute = () => session.finish("chat.voice.interrupted");
      });
      await context.audioWorklet.addModule(workletUrl);
      await resumed;
      if (!isCurrent()) return;
      if (
        document.visibilityState !== "visible" ||
        context.state !== "running" ||
        stream.getAudioTracks().some((track) => track.readyState !== "live" || track.muted)
      ) {
        fail("chat.voice.deviceFailed");
        return;
      }
      const node = new AudioWorkletNode(context, "chat-voice-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [1],
        channelCount: 1,
        channelCountMode: "explicit",
      });
      session.node = node;
      node.port.onmessage = ({ data }: MessageEvent<unknown>) => {
        if (!isCurrent() || !data || typeof data !== "object") return;
        if (
          "type" in data &&
          data.type === "chunk" &&
          "pcm" in data &&
          data.pcm instanceof ArrayBuffer
        ) {
          session.chunks.push(data.pcm);
        }
        if ("type" in data && data.type === "stopped" && session.finishing) finalize();
      };
      node.onprocessorerror = () => session.finish("chat.voice.recordingFailed");
      session.source = context.createMediaStreamSource(stream);
      session.source.connect(node);
      node.connect(context.destination); // Processor outputs silence; captured audio is never played back.
      session.startedAt = performance.now();
      node.port.postMessage("start");
      context.onstatechange = () => {
        if (context.state !== "running") session.finish("chat.voice.interrupted");
      };
      setPhase("recording");
      session.timer = setInterval(() => {
        if (isCurrent() && session.startedAt !== null)
          setElapsed((performance.now() - session.startedAt) / 1000);
      }, 250);
    } catch (cause) {
      fail(microphoneError(cause));
    }
  };

  return {
    phase,
    elapsed,
    error,
    start,
    cancel,
    clearError: () => setError(null),
    stop: () => active.current?.finish(),
  };
}
