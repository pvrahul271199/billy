"use client";

import type { ReactNode } from "react";
import { ScreenHeader, TopBar } from "@/components/ui";
import { useNav } from "@/lib/nav";
import { cn } from "@/lib/cn";

/** Bottom action area kept in the thumb zone, above the home indicator. */
function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="shrink-0 border-t border-line bg-white/95 px-4 pt-3 pb-[calc(var(--safe-bottom)+12px)] backdrop-blur-md">
      {children}
    </div>
  );
}

/** A screen pushed on top of the tabs: compact top bar with back, own scroll, optional footer. */
export function PushedScreen({
  title,
  actions,
  footer,
  children,
  padded = true,
}: {
  title: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  padded?: boolean;
}) {
  const nav = useNav();
  return (
    <div className="flex h-full flex-col bg-bg">
      <TopBar title={title} onBack={nav.pop} actions={actions} />
      <div className={cn("screen-scroll min-h-0 flex-1", padded && "px-4 pt-5 pb-8")}>{children}</div>
      {footer ? <Footer>{footer}</Footer> : null}
    </div>
  );
}

/** A tab root: large title that scrolls with content, optional footer above the tab bar. */
export function TabScreen({
  title,
  subtitle,
  action,
  footer,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="screen-scroll min-h-0 flex-1">
        <ScreenHeader title={title} subtitle={subtitle} action={action} />
        <div className="px-4 pt-2 pb-6">{children}</div>
      </div>
      {footer ? <div className="shrink-0 px-4 pt-2 pb-3">{footer}</div> : null}
    </div>
  );
}

/**
 * Loading screen. Stays blank for the first 350ms so the usual few-millisecond
 * IndexedDB open never flashes; if the wait is longer (first sync after sign-in,
 * slow device), a calm ring around a faint rupee fades in.
 */
export function Splash({ label }: { label?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-bg" role="status" aria-label={label ?? "Loading"}>
      <div className="flex animate-splash-in flex-col items-center gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="absolute inset-0 h-full w-full">
            <circle cx="32" cy="32" r="29" className="stroke-line" strokeWidth="2" />
          </svg>
          <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className="absolute inset-0 h-full w-full animate-splash-orbit">
            <path d="M32 3a29 29 0 0 1 29 29" className="stroke-ink" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="num animate-splash-breathe text-[26px] leading-none text-ink2" aria-hidden="true">
            ₹
          </span>
        </div>
        {label ? <p className="text-[13px] text-soft">{label}</p> : null}
      </div>
    </div>
  );
}
