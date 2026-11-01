"use client";

import { ClockCounterClockwise, Receipt, User, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import type { Tab } from "@/lib/nav";

const TABS: Array<{ id: Tab; label: string; icon: Icon }> = [
  { id: "invoice", label: "Invoice", icon: Receipt },
  { id: "history", label: "History", icon: ClockCounterClockwise },
  { id: "profile", label: "Profile", icon: User },
];

export function tabPanelId(tab: Tab) {
  return `tabpanel-${tab}`;
}

/**
 * State-driven tab bar. Icon and label always visible; the active tab gets a
 * tint pill behind a bold icon. Floats above the home indicator.
 */
export function TabBar({ active, onChange, preview }: { active: Tab; onChange: (t: Tab) => void; preview?: boolean }) {
  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = TABS[(i + d + TABS.length) % TABS.length]!;
    onChange(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  }

  return (
    <nav
      aria-label="Main"
      className={cn("shrink-0 border-t border-line bg-white/95 backdrop-blur-md", !preview && "pb-[var(--safe-bottom)]")}
    >
      <div role="tablist" aria-label="Sections" className="grid h-[var(--tabbar-height)] grid-cols-3 px-3">
        {TABS.map(({ id, label, icon: IconCmp }, i) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              id={preview ? undefined : `tab-${id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={preview ? undefined : tabPanelId(id)}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => onKeyDown(e, i)}
              onClick={() => {
                if (!isActive) tap(6);
                onChange(id);
              }}
              className="group flex flex-col items-center justify-center gap-1 rounded-key focus-visible:-outline-offset-4"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-150",
                  isActive ? "bg-tint text-ink" : "text-soft group-hover:text-ink",
                )}
              >
                <IconCmp size={22} weight={isActive ? "bold" : "regular"} aria-hidden="true" />
              </span>
              <span className={cn("text-[11px] leading-none", isActive ? "font-semibold text-ink" : "font-medium text-soft")}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
