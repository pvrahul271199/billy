"use client";

import type { ReactNode } from "react";
import { TabBar, ToastProvider, tabPanelId } from "@/components/ui";
import { NavProvider, useNav, type Route, type Tab } from "@/lib/nav";
import { useOverlayStack } from "@/lib/overlay-stack";
import { useProfile } from "@/db/queries";
import { Splash } from "./screens/Screen";
import { InvoiceTab } from "./screens/InvoiceTab";
import { HistoryTab } from "./screens/HistoryTab";
import { ProfileTab } from "./screens/ProfileTab";
import { EditorScreen } from "./screens/EditorScreen";
import { PreviewScreen } from "./screens/PreviewScreen";
import { OnboardingScreen } from "./screens/OnboardingScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { hasSkippedSignIn, useAuth } from "@/lib/auth";
import { isSyncConfigured } from "@/lib/sync";
import { useSyncInfo } from "@/lib/sync-engine";
import {
  AboutScreen,
  AccountScreen,
  BackupScreen,
  BankScreen,
  BrandEditScreen,
  BrandsScreen,
  CreatorScreen,
  ImagesScreen,
  NotesScreen,
  TemplatesScreen,
  PrefixScreen,
  PresetsScreen,
  TaxScreen,
} from "./screens/profile";

function renderRoute(route: Route): ReactNode {
  switch (route.name) {
    case "editor":
      return <EditorScreen id={route.id} />;
    case "preview":
      return <PreviewScreen id={route.id} />;
    case "creator":
      return <CreatorScreen />;
    case "images":
      return <ImagesScreen />;
    case "tax":
      return <TaxScreen />;
    case "bank":
      return <BankScreen />;
    case "brands":
      return <BrandsScreen />;
    case "brand-edit":
      return <BrandEditScreen id={route.id} />;
    case "presets":
      return <PresetsScreen />;
    case "notes":
      return <NotesScreen />;
    case "templates":
      return <TemplatesScreen />;
    case "prefix":
      return <PrefixScreen />;
    case "backup":
      return <BackupScreen />;
    case "about":
      return <AboutScreen />;
    case "account":
      return <AccountScreen />;
  }
}

const TAB_SCREENS: Record<Tab, () => ReactNode> = {
  invoice: () => <InvoiceTab />,
  history: () => <HistoryTab />,
  profile: () => <ProfileTab />,
};

function Screens() {
  const nav = useNav();
  const overlays = useOverlayStack();
  const blocked = overlays.length > 0;
  const covered = nav.stack.length > 0;

  return (
    <div id="app-screens" className="absolute inset-0" inert={blocked}>
      {/* Tabs: all mounted so scroll positions survive switching; only the active one is shown. */}
      <div className="flex h-full flex-col" inert={covered} aria-hidden={covered || undefined}>
        <main className="relative min-h-0 flex-1">
          {(Object.keys(TAB_SCREENS) as Tab[]).map((t) => (
            <section
              key={t}
              id={tabPanelId(t)}
              role="tabpanel"
              aria-labelledby={`tab-${t}`}
              hidden={nav.tab !== t}
              className="absolute inset-0"
            >
              {TAB_SCREENS[t]()}
            </section>
          ))}
        </main>
        <TabBar active={nav.tab} onChange={nav.setTab} />
      </div>

      {/* Pushed screens slide in on top. Only the top one is interactive. */}
      {nav.stack.map((entry, i) => {
        const top = i === nav.stack.length - 1;
        return (
          <div
            key={entry.key}
            className="absolute inset-0 z-10 animate-screen-in bg-bg"
            inert={!top}
            aria-hidden={!top || undefined}
          >
            {renderRoute(entry.route)}
          </div>
        );
      })}
    </div>
  );
}

function Gate() {
  const profile = useProfile();
  const auth = useAuth();
  const sync = useSyncInfo();
  if (!profile || auth.status === "loading") return <Splash />;
  if (!profile.onboardedAt) {
    // First visit on this device: ask for sign-in before setup.
    if (isSyncConfigured() && auth.status === "signedOut" && !hasSkippedSignIn()) return <SignInScreen />;
    // Just signed in: wait for the first sync so an existing account skips setup.
    if (auth.status === "signedIn" && !sync.lastSyncedAt && sync.status !== "error" && sync.status !== "offline") return <Splash label="Getting your invoices" />;
    return <OnboardingScreen />;
  }
  return <Screens />;
}

/**
 * The phone chassis. Locked to the viewport (100dvh, no page scroll); each
 * screen scrolls itself. On desktop it renders inside a 380×780 device frame.
 */
export function AppShell() {
  return (
    <div className="app-stage">
      <div className="app-root">
        <NavProvider>
          <ToastProvider>
            <Gate />
            <div id="app-overlays" className="pointer-events-none absolute inset-0 z-50" />
          </ToastProvider>
        </NavProvider>
      </div>
    </div>
  );
}
