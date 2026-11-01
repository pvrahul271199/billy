import type { ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

export interface FieldProps {
  id: string;
  label: string;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}

/** Ids for aria-describedby wiring between a control and its helper / error text. */
export function describedBy(id: string, helper?: unknown, error?: unknown): string | undefined {
  const ids = [error ? `${id}-error` : null, helper ? `${id}-helper` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

/** Errors always pair the amber tone with an icon and text, never colour alone. */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-[13px] font-medium text-warm">
      <WarningCircle size={16} weight="bold" aria-hidden="true" className="mt-px shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Label above, control, then error and helper text below. */
export function Field({ id, label, helper, error, optional, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-soft">
        {label}
        {optional ? <span className="font-normal"> · optional</span> : null}
      </label>
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : null}
      {helper ? (
        <p id={`${id}-helper`} className="text-[13px] text-soft">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/** Shared style for every text-like control: hairline border that darkens on focus. */
export const controlBase =
  "w-full rounded-key border border-line bg-white text-[16px] text-ink " +
  "transition-colors duration-150 outline-none " +
  "focus-within:border-ink data-[force=focus]:border-ink " +
  "data-[invalid=true]:border-warm data-[invalid=true]:focus-within:border-warm " +
  "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-tint data-[disabled=true]:text-soft";
