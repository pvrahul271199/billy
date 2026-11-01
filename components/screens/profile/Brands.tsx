"use client";

import { useState } from "react";
import { Buildings, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { Button, EmptyState, Input, ListGroup, ListRow } from "@/components/ui";
import { useNav } from "@/lib/nav";
import { PushedScreen } from "@/components/screens/Screen";

import { useParties } from "@/db/queries";
import { stateName } from "@/lib/states";

export function BrandsScreen() {
  const parties = useParties();
  const nav = useNav();
  const [q, setQ] = useState("");
  if (!parties) return null;

  const query = q.trim().toLowerCase();
  const shown = query ? parties.filter((p) => p.name.toLowerCase().includes(query)) : parties;

  return (
    <PushedScreen title="Brands and agencies">
      {parties.length === 0 ? (
        <EmptyState
          icon={Buildings}
          title="Save the brands you work with"
          description="Add a brand or agency once and pick it on every invoice."
          action={
            <Button icon={Plus} onClick={() => nav.push({ name: "brand-edit" })}>
              Add brand
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <Button variant="tint" icon={Plus} fullWidth onClick={() => nav.push({ name: "brand-edit" })}>
            Add brand or agency
          </Button>
          {parties.length > 5 ? (
            <Input label="Search" placeholder="Mamaearth" value={q} onChange={(e) => setQ(e.target.value)} type="search" />
          ) : null}
          {shown.length ? (
            <ListGroup>
              {shown.map((p) => (
                <ListRow
                  key={p.id}
                  title={p.name}
                  description={[p.type === "agency" ? "Agency" : "Brand", stateName(p.address.stateCode)].filter(Boolean).join(" · ")}
                  onClick={() => nav.push({ name: "brand-edit", id: p.id })}
                />
              ))}
            </ListGroup>
          ) : (
            <EmptyState icon={MagnifyingGlass} title="No matches" description={`Nothing saved matches "${q}".`} />
          )}
        </div>
      )}
    </PushedScreen>
  );
}
