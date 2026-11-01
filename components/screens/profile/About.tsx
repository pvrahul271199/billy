"use client";

import { DeviceMobile, Export, PlusSquare } from "@phosphor-icons/react";
import { Button, Card, ListGroup, ListRow, useToast } from "@/components/ui";
import { PushedScreen } from "@/components/screens/Screen";
import { promptInstall, useInstallState } from "@/lib/pwa";
import { useNav } from "@/lib/nav";

const VERSION = "1.0.0";

export function AboutScreen() {
  const state = useInstallState();
  const toast = useToast();
  const nav = useNav();

  return (
    <PushedScreen title="App info">
      <div className="flex flex-col gap-6">
        <Card>
          <p className="text-[17px] font-medium">Billy</p>
          <p className="mt-1 text-sm text-soft">Invoices for Instagram creators. Version {VERSION}</p>
          <p className="mt-3 text-sm leading-relaxed text-soft">
            Works offline. Everything you enter is stored only on this device. Billy is a billing tool, not tax advice:
            confirm GST and TDS treatment with your CA.
          </p>
        </Card>

        <section aria-labelledby="install-title" className="flex flex-col gap-3">
          <h2 id="install-title" className="text-[15px] font-medium">
            Install app
          </h2>
          {state === "installed" ? (
            <p className="text-sm text-soft">Billy is installed on this device.</p>
          ) : null}
          {state === "available" ? (
            <>
              <p className="text-sm text-soft">Add Billy to your home screen to open it like any other app, even offline.</p>
              <Button
                icon={DeviceMobile}
                size="lg"
                fullWidth
                onClick={async () => {
                  if (await promptInstall()) toast.show("Billy installed");
                }}
              >
                Install app
              </Button>
            </>
          ) : null}
          {state === "ios" ? (
            <Card>
              <p className="text-sm text-soft">To install on iPhone or iPad, open Billy in Safari, then:</p>
              <ol className="mt-3 flex flex-col gap-3 text-[15px]">
                <li className="flex items-center gap-3">
                  <Export size={20} aria-hidden="true" className="shrink-0" />
                  <span>1. Tap the Share button</span>
                </li>
                <li className="flex items-center gap-3">
                  <PlusSquare size={20} aria-hidden="true" className="shrink-0" />
                  <span>2. Choose Add to Home Screen</span>
                </li>
              </ol>
            </Card>
          ) : null}
          {state === "unsupported" ? (
            <p className="text-sm text-soft">
              Open Billy in Chrome on Android, or Safari on iPhone, to add it to your home screen.
            </p>
          ) : null}
        </section>

        <ListGroup label="More">
          <ListRow title="Design system" description="Every colour and component" onClick={() => window.open("/design/", "_blank", "noopener")} />
        </ListGroup>
        <p className="text-center text-sm text-soft">
          <button type="button" onClick={() => nav.push({ name: "backup" })} className="font-semibold text-ink underline underline-offset-2">
            Back up your data
          </button>{" "}
          before clearing browser storage.
        </p>
      </div>
    </PushedScreen>
  );
}
