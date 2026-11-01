"use client";

import { Bank, Buildings, DownloadSimple, FileText, Hash, Image as ImageIcon, Info, ListBullets, Percent, User, UserCircle } from "@phosphor-icons/react";
import { Avatar, ListGroup, ListRow } from "@/components/ui";
import { useParties, usePayment, usePresets, useProfile } from "@/db/queries";
import { formatInstagram } from "@/lib/format";
import { useNav } from "@/lib/nav";
import { useAuth } from "@/lib/auth";
import { isSyncConfigured } from "@/lib/sync";
import { Splash, TabScreen } from "./Screen";

export function ProfileTab() {
  const nav = useNav();
  const auth = useAuth();
  const profile = useProfile();
  const payment = usePayment();
  const parties = useParties();
  const presets = usePresets();
  if (!profile || !payment) return <Splash />;

  const imageCount = [profile.photo, profile.logo, profile.signature].filter(Boolean).length;

  return (
    <TabScreen title="Profile">
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={() => nav.push({ name: "creator" })}
          className="flex items-center gap-4 rounded-note bg-tint p-4 text-left transition-colors hover:bg-line"
        >
          <Avatar name={profile.fullName || "Billy"} src={profile.photo} size="lg" />
          <span className="min-w-0">
            <span className="block truncate text-[17px] font-semibold">{profile.fullName || "Add your name"}</span>
            <span className="block truncate text-[13px] text-soft">{profile.instagram ? formatInstagram(profile.instagram) : "Creator details"}</span>
          </span>
        </button>

        {isSyncConfigured() ? (
          <ListGroup label="Account">
            <ListRow
              icon={UserCircle}
              title={auth.status === "signedIn" ? auth.email : "Sign in"}
              description={auth.status === "signedIn" ? "Your invoices are backed up" : "Keep your invoices safe on any phone"}
              onClick={() => nav.push({ name: "account" })}
            />
          </ListGroup>
        ) : null}

        <ListGroup label="You">
          <ListRow icon={User} title="Creator details" description={profile.email || "Name, contact, PAN, address"} onClick={() => nav.push({ name: "creator" })} />
          <ListRow icon={ImageIcon} title="Images" description="Photo, logo, signature" value={`${imageCount} of 3`} onClick={() => nav.push({ name: "images" })} />
          <ListRow
            icon={Percent}
            title="Tax settings"
            description="GST, SAC, default TDS"
            value={profile.gstRegistered ? "GST" : "No GST"}
            onClick={() => nav.push({ name: "tax" })}
          />
          <ListRow icon={Bank} title="Bank and UPI" description={payment.upiId || payment.bankName || "Where brands pay you"} onClick={() => nav.push({ name: "bank" })} />
        </ListGroup>

        <ListGroup label="Invoicing">
          <ListRow icon={Buildings} title="Brands and agencies" value={parties ? String(parties.length) : ""} onClick={() => nav.push({ name: "brands" })} />
          <ListRow icon={ListBullets} title="Saved line items" value={presets ? String(presets.length) : ""} onClick={() => nav.push({ name: "presets" })} />
          <ListRow icon={FileText} title="Default notes and terms" description={profile.defaultNotes || "Not set"} onClick={() => nav.push({ name: "notes" })} />
          <ListRow icon={Hash} title="Invoice number prefix" value={profile.invoicePrefix} onClick={() => nav.push({ name: "prefix" })} />
        </ListGroup>

        <ListGroup label="App">
          <ListRow icon={DownloadSimple} title="Backup" description="Export or import your data" onClick={() => nav.push({ name: "backup" })} />
          <ListRow icon={Info} title="App info" description="Install, storage, version" onClick={() => nav.push({ name: "about" })} />
        </ListGroup>
      </div>
    </TabScreen>
  );
}
