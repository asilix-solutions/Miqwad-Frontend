import { useEffect, useRef, type HTMLAttributes } from "react";

/** Touch shortcut only. Native selection, controls and scrolling always take priority. */
export function useMessageLongPress(
  enabled: boolean,
  onOpen: () => void,
): HTMLAttributes<HTMLDivElement> {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClickUntil = useRef(0);
  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };

  useEffect(() => {
    if (!enabled) return;
    const onSelection = () => {
      if (window.getSelection()?.toString()) cancel();
    };
    document.addEventListener("scroll", cancel, true);
    document.addEventListener("selectionchange", onSelection);
    window.addEventListener("blur", cancel);
    return () => {
      cancel();
      document.removeEventListener("scroll", cancel, true);
      document.removeEventListener("selectionchange", onSelection);
      window.removeEventListener("blur", cancel);
    };
  }, [enabled]);

  return {
    onPointerDown: (event) => {
      cancel();
      suppressClickUntil.current = 0;
      if (!enabled || !event.isPrimary || event.pointerType !== "touch") return;
      if (
        event.target instanceof Element &&
        event.target.closest("button, a, input, textarea, audio, video, [contenteditable]")
      )
        return;
      if (window.getSelection()?.toString()) return;
      origin.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      timer.current = setTimeout(() => {
        cancel();
        if (window.getSelection()?.toString()) return;
        suppressClickUntil.current = Date.now() + 1000;
        onOpen();
      }, 600);
    },
    onPointerMove: (event) => {
      const start = origin.current;
      if (
        start &&
        (event.pointerId !== start.id ||
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10)
      )
        cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    onContextMenu: (event) => {
      // Only suppress the native menu after our shortcut actually opened.
      if (Date.now() < suppressClickUntil.current) event.preventDefault();
    },
    onClickCapture: (event) => {
      if (Date.now() < suppressClickUntil.current) {
        suppressClickUntil.current = 0;
        event.preventDefault();
        event.stopPropagation();
      }
    },
  };
}
