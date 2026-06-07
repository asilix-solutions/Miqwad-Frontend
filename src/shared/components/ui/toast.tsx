import * as ToastPrimitive from "@radix-ui/react-toast";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { cn } from "@shared/lib/utils";
import {
  ToastContext,
  type ToastContextValue,
  type ToastItem,
} from "./toastContext";

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((t: Omit<ToastItem, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, description) => push({ type: "success", title, description }),
      error: (title, description) => push({ type: "error", title, description }),
      info: (title, description) => push({ type: "info", title, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="left">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={4500}
            onOpenChange={(open) => {
              if (!open) setToasts((prev) => prev.filter((x) => x.id !== t.id));
            }}
            className={cn(
              "flex w-[340px] items-start gap-3 rounded-[var(--radius-md)] border bg-white p-4 shadow-[var(--shadow-3)]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80",
              t.type === "success" && "border-success-500/20",
              t.type === "error" && "border-danger-500/20",
              t.type === "info" && "border-info-500/20",
            )}
          >
            {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-success-500 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="h-5 w-5 text-danger-500 mt-0.5" />}
            {t.type === "info" && <Info className="h-5 w-5 text-info-500 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <ToastPrimitive.Title className="font-display text-sm font-semibold text-ink-900">
                {t.title}
              </ToastPrimitive.Title>
              {t.description && (
                <ToastPrimitive.Description className="text-xs text-ink-500 mt-0.5">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="text-ink-400 hover:text-ink-700">
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 start-4 z-[100] flex max-h-screen w-[360px] flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
