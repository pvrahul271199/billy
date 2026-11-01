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

/** Splash shown while IndexedDB opens (a few milliseconds). */
export function Splash() {
  return <div className="h-full bg-bg" role="status" aria-label="Loading" />;
}
