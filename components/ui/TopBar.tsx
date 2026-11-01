"use client";

import type { ReactNode } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

export interface TopBarProps {
  title: string;
  onBack?: () => void;
  /** Right-aligned actions (icon buttons). */
  actions?: ReactNode;
  /** Design page: no safe-area padding. */
  preview?: boolean;
}

/** Compact bar for pushed screens: back, centred title, actions. Sits below the notch. */
export function TopBar({ title, onBack, actions, preview }: TopBarProps) {
  return (
    <header className={cn("shrink-0 border-b border-line bg-white/90 backdrop-blur-md", !preview && "pt-[var(--safe-top)]")}>
      <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-1.5">
        <div className="flex">{onBack ? <IconButton icon={CaretLeft} weight="bold" label="Back" onClick={onBack} /> : null}</div>
        <h1 className="max-w-[220px] truncate text-center text-[16px] font-semibold text-ink">{title}</h1>
        <div className="flex justify-end">{actions}</div>
      </div>
    </header>
  );
}

/** Large-title header for tab screens. */
export function ScreenHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-[calc(var(--safe-top)+20px)] pb-3">
      <div className="min-w-0">
        {subtitle ? <p className="text-[13px] font-medium text-soft">{subtitle}</p> : null}
        <h1 className="truncate text-[28px] leading-tight font-semibold tracking-[-0.01em] text-ink">{title}</h1>
      </div>
      {action}
    </header>
  );
}
