"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { closeOverlay, openOverlay, useOverlayStack } from "@/lib/overlay-stack";
import { cn } from "@/lib/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  /** "sheet" slides up from the bottom; "dialog" pops in centred. */
  variant: "sheet" | "dialog";
  className?: string;
  children: ReactNode;
}

/**
 * Modal layer rendered inside the phone chassis (#app-overlays), so sheets
 * never escape the device frame on desktop. Handles focus trap, Esc,
 * click-outside, focus restore, and makes everything underneath inert.
 */
export function Overlay({ open, onClose, labelledBy, describedBy, variant, className, children }: OverlayProps) {
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const stack = useOverlayStack();
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.getElementById("app-overlays") ?? document.body);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    openOverlay(id);
    // Focus the first [autofocus] or focusable element, else the panel itself.
    const t = requestAnimationFrame(() => {
      const el = panel.current;
      if (!el) return;
      const target = el.querySelector<HTMLElement>("[autofocus], [data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE) ?? el;
      target.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(t);
      closeOverlay(id);
      previous?.focus?.({ preventScroll: true });
    };
  }, [open, id]);

  if (!open || !host) return null;
  const isTop = stack[stack.length - 1] === id;

  function onKeyDown(e: React.KeyboardEvent) {
    if (!isTop) return;
    if (e.key === "Escape") {
      e.stopPropagation();
      onCloseRef.current();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0]!;
    const last = items[items.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return createPortal(
    <div
      className="pointer-events-auto absolute inset-0 z-50 flex"
      inert={!isTop}
      onKeyDown={onKeyDown}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-scrim backdrop-blur-[2px]"
        onClick={() => onCloseRef.current()}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={cn(
          "relative outline-none",
          variant === "sheet" ? "mt-auto w-full animate-sheet-in" : "m-auto w-[calc(100%-40px)] max-w-[340px] animate-pop-in",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    host,
  );
}
