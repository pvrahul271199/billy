"use client";

import { BankRows, Caps, Hairline, Identity, ItemsTable, Lines, Notes, QrBlock, SignatureBlock, TdsBlock, type SheetProps } from "./parts";

/** Centred, light letter-spaced name; spaced capitals; table with one rule; signature at the foot. */
export function SignatureSheet({ view, qrImage }: SheetProps) {
  const extra = view.summaryLines.slice(1);
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <Identity view={view} className="text-[24px] leading-tight tracking-[1px]" />
        {view.from.instagram ? <p className="mt-2 text-[8.5px] tracking-[3px] text-print-soft uppercase">{view.from.instagram}</p> : null}
      </div>

      <div className="mt-12 flex justify-between gap-6">
        <div className="flex-1">
          <Caps className="mb-1.5 font-semibold">Issued to:</Caps>
          {view.billTo ? (
            <>
              <p className="text-[10px]">{view.billTo.name}</p>
              <Lines lines={view.billTo.lines} />
            </>
          ) : (
            <p className="text-print-soft">No brand selected</p>
          )}
          {view.campaignFor ? <p className="mt-1">Campaign for: {view.campaignFor}</p> : null}
          {view.campaignName ? <p className="mt-1">Campaign: {view.campaignName}</p> : null}
        </div>
        <div className="w-[190px]">
          <div className="mb-1 flex justify-between">
            <Caps className="font-semibold">Invoice no:</Caps>
            <span className="tabular">{view.number}</span>
          </div>
          {view.meta.map((m) => (
            <div key={m.label} className="mb-1 flex justify-between">
              <Caps className="font-semibold">{m.label}:</Caps>
              <span className="tabular">{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <ItemsTable view={view} head="bottom" rowLines={false} caps labels={["Description", "Qty", "Unit price", "Total"]} rowPad={6} />
      </div>
      <Hairline ink className="mt-1" />

      <div className="mt-2 ml-auto w-[250px]">
        <div className="flex justify-between py-1">
          <Caps className="font-semibold">Subtotal</Caps>
          <span className="font-medium tabular">{view.summaryLines[0]?.value}</span>
        </div>
        {extra.map((l) => (
          <div key={l.label} className="flex justify-between py-[2px] text-print-soft">
            <span>{l.label}</span>
            <span className="tabular">{l.value}</span>
          </div>
        ))}
        <div className="mt-2 flex items-end justify-between">
          <Caps className="font-semibold">{view.totalLabel}</Caps>
          <span className="text-[16px] leading-none font-medium tabular">{view.totalValue}</span>
        </div>
        <p className="mt-2 text-[8.5px] text-print-soft">{view.amountInWords}</p>
        <TdsBlock view={view} />
      </div>

      <div className="mt-10 flex items-end justify-between gap-6">
        <div className="flex-1">
          {view.bank || qrImage ? (
            <>
              <Caps className="mb-1.5 font-semibold">Pay to:</Caps>
              <BankRows view={view} />
              <QrBlock view={view} qrImage={qrImage} />
            </>
          ) : null}
        </div>
        <SignatureBlock view={view} />
      </div>
      <Notes view={view} className="mt-6" />
    </>
  );
}
