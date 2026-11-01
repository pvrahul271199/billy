"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ToastItem {
  id: number;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  show: (message: string, action?: ToastItem["action"]) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const DURATION_MS = 3200;

/**
 * One toast at a time, dropping in just below the top bar (clear of the back
 * button and the bottom action bars), announced politely to screen readers.
 * Toasts without an action let taps pass through.
 * `fixed` positions it against the viewport instead of the phone chassis.
 */
export function ToastProvider({ children, fixed }: { children: ReactNode; fixed?: boolean }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextId = useRef(1);

  const show = useCallback<ToastApi["show"]>((message, action) => {
    setToast({ id: nextId.current++, message, action });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.action ? DURATION_MS * 1.6 : DURATION_MS);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none inset-x-0 z-[70] flex justify-center px-4",
          fixed ? "fixed top-4" : "absolute top-[calc(var(--safe-top)+64px)]",
        )}
      >
        {toast ? <Toast key={toast.id} message={toast.message} action={toast.action} onDismiss={() => setToast(null)} /> : null}
      </div>
    </ToastContext.Provider>
  );
}

/** Visual toast. Exported for the design page. */
export function Toast({ message, action, onDismiss }: { message: string; action?: ToastItem["action"]; onDismiss?: () => void }) {
  return (
    <div className={cn("flex w-full max-w-[348px] animate-toast-in", action ? "pointer-events-auto" : "pointer-events-none")}>
      <div className="flex w-full items-center gap-3 rounded-key bg-ink py-2 pr-2 pl-4 text-[14px] font-medium text-white shadow-float">
      <span className="min-h-7 flex-1 py-1">{message}</span>
      {action ? (
        <button
          type="button"
          onClick={() => {
            action.onClick();
            onDismiss?.();
          }}
          className="h-9 shrink-0 rounded-[10px] px-3 font-semibold text-white underline-offset-2 hover:underline focus-visible:outline-white"
        >
          {action.label}
        </button>
      ) : null}
      </div>
    </div>
  );
}
