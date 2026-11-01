"use client";

import { useMemo } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { InvoiceSheet } from "@/components/invoice/InvoiceSheet";
import { demoInvoiceView } from "@/lib/demo-invoice";
import { TEMPLATES } from "@/lib/invoice-templates";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import type { InvoiceTemplateId } from "@/types";

/** Two-column grid of live template thumbnails drawn from a sample invoice. */
export function TemplatePicker({ value, onChange }: { value: InvoiceTemplateId; onChange: (id: InvoiceTemplateId) => void }) {
  const sample = useMemo(() => ({ ...demoInvoiceView(), upi: null }), []);

  return (
    <div role="radiogroup" aria-label="Invoice template" className="grid grid-cols-2 gap-3">
      {TEMPLATES.map((t) => {
        const selected = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => {
              tap();
              onChange(t.id);
            }}
            className="flex flex-col gap-2 text-left transition-transform active:scale-[0.98]"
          >
            <span
              className={cn(
                "relative block aspect-[4/5] w-full overflow-hidden rounded-note border bg-white",
                selected ? "border-ink ring-1 ring-ink" : "border-line",
              )}
            >
              <span aria-hidden="true" className="pointer-events-none block">
                <InvoiceSheet view={{ ...sample, template: t.id }} />
              </span>
              {selected ? <CheckCircle size={22} weight="fill" aria-hidden="true" className="absolute top-2 right-2 text-ink" /> : null}
            </span>
            <span className="px-0.5">
              <span className="block text-[15px] font-medium text-ink">{t.name}</span>
              <span className="block text-[13px] text-soft">{t.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
