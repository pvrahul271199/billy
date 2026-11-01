"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks open overlays (sheets, dialogs) so only the top one is interactive
 * and the screens underneath become inert.
 */
let stack: string[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openOverlay(id: string) {
  stack = [...stack.filter((x) => x !== id), id];
  emit();
}

export function closeOverlay(id: string) {
  stack = stack.filter((x) => x !== id);
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useOverlayStack(): string[] {
  return useSyncExternalStore(subscribe, () => stack, () => stack);
}
