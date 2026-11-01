import { Card, Divider, Highlight } from "@/components/ui";
import type { InvoiceView } from "@/lib/invoice-view";

/** Totals summary shown at the end of the invoice form. */
export function TotalsCard({ view }: { view: InvoiceView }) {
  return (
    <Card as="section" aria-labelledby="totals-title">
      <h2 id="totals-title" className="sr-only">
        Totals
      </h2>
      <dl className="flex flex-col gap-2 text-[15px]">
        {view.summaryLines.map((l) => (
          <div key={l.label} className="flex justify-between gap-4">
            <dt className="text-soft">{l.label}</dt>
            <dd className="tabular">{l.value}</dd>
          </div>
        ))}
        <Divider className="my-1" />
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-medium">Total</dt>
          <dd className="text-[22px] font-medium">
            <Highlight>{view.totalValue}</Highlight>
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-sm text-soft">{view.amountInWords}</p>
      {view.tds ? (
        <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-3 text-[15px]">
          <div className="flex justify-between gap-4">
            <dt className="text-soft">{view.tds.label}</dt>
            <dd className="tabular">{view.tds.value}</dd>
          </div>
          <div className="flex justify-between gap-4 font-medium">
            <dt>{view.tds.netLabel}</dt>
            <dd className="tabular">{view.tds.netValue}</dd>
          </div>
          <p className="text-sm text-soft">For reference only. It doesn&apos;t change the invoice total.</p>
        </dl>
      ) : null}
    </Card>
  );
}
