"use client";

import { BankRows, Hairline, Identity, Lines, Notes, QrBlock, SignatureBlock, SumRow, TdsBlock, ItemsTable, type SheetProps } from "./parts";

/** Big title top left, a ruled "Services" band, a plain summary list and two columns below. */
export function StatementSheet({ view, qrImage }: SheetProps) {
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[30px] leading-none font-medium tracking-[-0.5px]">{view.title}</p>
          <p className="mt-2 text-[11px] font-medium tabular">{view.number}</p>
        </div>
        <div className="flex flex-col items-end text-right">
          <Identity view={view} className="text-[12px] font-medium" />
          {view.from.instagram ? <p className="text-print-soft">{view.from.instagram}</p> : null}
        </div>
      </div>
      <Hairline className="my-4" />

      <div className="flex justify-between gap-6">
        <div className="flex-1">
          <p className="mb-0.5 font-medium">Bill to</p>
          {view.billTo ? (
            <>
              <p className="text-[10.5px] font-medium">{view.billTo.name}</p>
              <Lines lines={view.billTo.lines} />
            </>
          ) : (
            <p className="text-print-soft">No brand selected</p>
          )}
          {view.campaignFor ? <p className="mt-1">Campaign for: {view.campaignFor}</p> : null}
        </div>
        <div className="w-[200px]">
          {view.meta.map((m) => (
            <p key={m.label} className="mb-1">
              <span className="font-medium">{m.label}:</span> <span className="tabular">{m.value}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <p className="mb-0.5 font-medium">From</p>
        <p className="text-[10.5px] font-medium">{view.from.name}</p>
        <Lines lines={view.from.lines} />
      </div>
      {view.campaignName ? <p className="mt-3">Campaign: {view.campaignName}</p> : null}

      <div className="mt-5 py-1.5 text-center text-[8.5px] font-medium tracking-[2px] uppercase" style={{ borderTop: "0.75px solid var(--print)", borderBottom: "0.75px solid var(--print)" }}>
        Services provided
      </div>
      <ItemsTable view={view} head="bottom" rowLines />

      <div className="mt-6 w-[260px]">
        <p className="mb-1.5 text-[14px] font-medium">Summary</p>
        {view.summaryLines.map((l) => (
          <SumRow key={l.label} label={l.label} value={l.value} />
        ))}
        <SumRow label={view.totalLabel} value={view.totalValue} strong />
        <p className="mt-1.5 text-[8.5px] text-print-soft">{view.amountInWords}</p>
        <TdsBlock view={view} />
      </div>

      <Hairline ink className="mt-6" />
      <div className="mt-3 flex gap-6">
        <div className="flex-1">
          {view.bank || qrImage ? (
            <>
              <p className="mb-1 font-medium">Payment information</p>
              <BankRows view={view} />
              <QrBlock view={view} qrImage={qrImage} />
            </>
          ) : null}
        </div>
        <div className="flex-1">
          <Notes view={view} />
          <div className="mt-4">
            <SignatureBlock view={view} align="start" />
          </div>
        </div>
      </div>
    </>
  );
}
