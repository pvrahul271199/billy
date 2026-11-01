"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Tab = "invoice" | "history" | "profile";

/** Screens pushed on top of the tabs. */
export type Route =
  | { name: "editor"; id?: string }
  | { name: "preview"; id: string }
  | { name: "creator" }
  | { name: "images" }
  | { name: "tax" }
  | { name: "bank" }
  | { name: "brands" }
  | { name: "brand-edit"; id?: string }
  | { name: "presets" }
  | { name: "notes" }
  | { name: "prefix" }
  | { name: "backup" }
  | { name: "about" };

export interface StackEntry {
  key: number;
  route: Route;
}

interface NavApi {
  tab: Tab;
  setTab: (t: Tab) => void;
  stack: StackEntry[];
  /** Push a screen. Adds a history entry so the phone's back button pops it. */
  push: (r: Route) => void;
  /** Pop the top screen (same as the system back gesture). */
  pop: () => void;
  /** Swap the top screen without adding history. */
  replace: (r: Route) => void;
  /** Close every pushed screen, optionally switching tab. */
  reset: (tab?: Tab) => void;
}

const NavContext = createContext<NavApi | null>(null);

export function useNav(): NavApi {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside <NavProvider>");
  return ctx;
}

const TAB_KEY = "billy.tab";

/**
 * Keep Next.js's own history markers on every entry. The App Router reloads
 * the page on popstate if an entry is missing them, which would wipe the stack.
 */
function withDepth(depth: number) {
  return { ...(history.state ?? {}), billy: depth };
}

/**
 * State-driven navigation, like a native app: tabs switch instantly with no
 * routing, and pushed screens stack on top. Browser history mirrors the stack
 * depth so Android back and the iOS swipe-back still work.
 */
export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTabState] = useState<Tab>("invoice");
  const [stack, setStack] = useState<StackEntry[]>([]);
  const nextKey = useRef(1);
  const depth = useRef(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(TAB_KEY) as Tab | null;
      if (saved === "invoice" || saved === "history" || saved === "profile") setTabState(saved);
    } catch {
      // ignore
    }
    history.replaceState(withDepth(0), "");
    const onPop = (e: PopStateEvent) => {
      const d = typeof e.state?.billy === "number" ? e.state.billy : 0;
      depth.current = d;
      setStack((s) => s.slice(0, d));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    try {
      sessionStorage.setItem(TAB_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  const push = useCallback((route: Route) => {
    depth.current += 1;
    history.pushState(withDepth(depth.current), "");
    setStack((s) => [...s, { key: nextKey.current++, route }]);
  }, []);

  const pop = useCallback(() => {
    if (depth.current > 0) history.back();
    else setStack((s) => s.slice(0, -1));
  }, []);

  const replace = useCallback((route: Route) => {
    setStack((s) => [...s.slice(0, -1), { key: nextKey.current++, route }]);
  }, []);

  const reset = useCallback(
    (t?: Tab) => {
      if (t) setTab(t);
      if (depth.current > 0) history.go(-depth.current);
      else setStack([]);
    },
    [setTab],
  );

  const api = useMemo(() => ({ tab, setTab, stack, push, pop, replace, reset }), [tab, setTab, stack, push, pop, replace, reset]);
  return <NavContext.Provider value={api}>{children}</NavContext.Provider>;
}
