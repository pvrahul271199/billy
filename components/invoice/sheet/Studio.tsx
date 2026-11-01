"use client";

import { BankRows, Caps, Hairline, Identity, ItemsTable, Lines, Notes, QrBlock, SumRow, TdsBlock, type SheetProps } from "./parts";

/** Wide letter-spaced name, hairline rules instead of tinted bands, and a contact footer. */
export function StudioSheet({ view, qrImage }: SheetProps) {
  const [first, ...rest] = view.meta;
  return (
    <>
      <Identity view={view} className="text-[18px] tracking-[4px] uppercase" />
      <Hairline className="mt-5 mb-5" />

      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] tracking-[1px] uppercase">Billed to:</p>
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
        <div className="flex flex-col items-end text-right">
          <p className="text-[11px] tracking-[1px] uppercase tabular">Invoice: {view.number}</p>
          {first ? <p className="mt-1.5 text-print-soft tabular">{first.value}</p> : null}
          {rest.map((m) => (
            <p key={m.label} className="text-print-soft tabular">
              {m.label}: {m.value}
            </p>
          ))}
        </div>
      </div>

      <Hairline className="mt-5" />
      <ItemsTable view={view} head="bottom" rowLines caps labels={["Description", "Qty", "Rate", "Total"]} rowPad={8} />

      <div className="mt-3 ml-auto w-[260px]">
        {view.summaryLines.map((l) => (
          <SumRow key={l.label} label={l.label} value={l.value} />
        ))}
        <div className="mt-1.5 flex justify-between py-2 font-medium" style={{ borderTop: "0.75px solid var(--print-line)" }}>
          <span className="tracking-[1px] uppercase">{view.totalLabel} due</span>
          <span className="text-[12px] tabular">{view.totalValue}</span>
        </div>
        <p className="text-[8.5px] text-print-soft">{view.amountInWords}</p>
        <TdsBlock view={view} />
      </div>

      {view.signature ? (
        <div className="mt-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
          <img src={view.signature.image} alt={`Signature of ${view.signature.name}`} className="mb-1 max-h-12 max-w-40 object-contain" />
          <p className="text-print-soft">{view.signature.name}, authorised signatory</p>
        </div>
      ) : null}

      {view.bank || qrImage ? (
        <div className="mt-6">
          <p className="mb-1.5 text-[10px] tracking-[1px] uppercase">Payment information:</p>
          <BankRows view={view} labelWidth={96} />
          <QrBlock view={view} qrImage={qrImage} />
        </div>
      ) : null}
      <Notes view={view} className="mt-5" />

      <Hairline className="mt-8 mb-3" />
      <div className="flex items-start justify-between gap-6 text-[8.5px]">
        <Caps className="text-[9px] tracking-[2px]">{view.from.name}</Caps>
        <div className="text-right">
          {view.from.instagram ? <p>{view.from.instagram}</p> : null}
          <Lines lines={view.from.lines} className="" />
        </div>
      </div>
    </>
  );
}
