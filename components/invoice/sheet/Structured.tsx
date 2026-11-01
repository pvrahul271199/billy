"use client";

import { BankRows, Hairline, Lines, Notes, QrBlock, SignatureBlock, SumRow, TdsBlock, ItemsTable, type SheetProps } from "./parts";

/** Large uppercase title, ruled sections, totals boxed between two rules, details in two columns at the foot. */
export function StructuredSheet({ view, qrImage }: SheetProps) {
  const [first, ...rest] = view.meta;
  return (
    <>
      <p className="text-[34px] leading-none font-medium tracking-[-0.5px] uppercase">{view.title}</p>
      <p className="mt-2 text-[11px] tabular">INVOICE NO: {view.number}</p>
      {first ? <p className="text-[11px] uppercase tabular">{first.value}</p> : null}
      <Hairline ink className="my-4" />

      <div className="flex justify-between gap-6">
        <div className="flex-1">
          {rest.map((m) => (
            <div key={m.label} className="mb-1.5">
              <p className="font-medium">{m.label}:</p>
              <p className="tabular">{m.value}</p>
            </div>
          ))}
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[11px] font-medium uppercase">Invoice to</p>
          {view.billTo ? (
            <>
              <p className="font-medium">{view.billTo.name}</p>
              <Lines lines={view.billTo.lines} />
            </>
          ) : (
            <p className="text-print-soft">No brand selected</p>
          )}
          {view.campaignFor ? <p className="mt-1">Campaign for: {view.campaignFor}</p> : null}
          {view.campaignName ? <p className="mt-1">Campaign: {view.campaignName}</p> : null}
        </div>
      </div>
      <Hairline ink className="my-4" />

      <ItemsTable view={view} head="bottom" rowLines={false} labels={["Item", "Quantity", "Price", "Total"]} rowPad={9} />
      <Hairline ink className="mt-2" />

      <div className="mt-3 ml-auto w-[250px]">
        {view.summaryLines.map((l, i) => (
          <SumRow key={l.label} label={i === 0 ? "Sub total" : l.label} value={l.value} />
        ))}
        <div className="mt-2 flex justify-between py-2 font-medium" style={{ borderTop: "0.75px solid var(--print)", borderBottom: "0.75px solid var(--print)" }}>
          <span className="text-[10.5px]">{view.totalLabel} amount</span>
          <span className="text-[13px] tabular">{view.totalValue}</span>
        </div>
        <p className="mt-2 text-[8.5px] text-print-soft">{view.amountInWords}</p>
        <TdsBlock view={view} />
      </div>

      <div className="mt-10 flex gap-6">
        <div className="flex-1">
          {view.bank || qrImage ? (
            <>
              <p className="mb-1 text-[11px] font-medium">Payment information</p>
              <BankRows view={view} />
              <QrBlock view={view} qrImage={qrImage} />
            </>
          ) : null}
        </div>
        <div className="flex-1">
          <p className="mb-1 text-[11px] font-medium">{view.from.name}</p>
          {view.from.instagram ? <p>{view.from.instagram}</p> : null}
          <Lines lines={view.from.lines} className="" />
        </div>
      </div>
      <Notes view={view} className="mt-6" />
      <div className="mt-6">
        <SignatureBlock view={view} />
      </div>
    </>
  );
}
