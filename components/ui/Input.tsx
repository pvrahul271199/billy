"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBase, describedBy } from "./Field";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label: string;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
  /** Fixed text before the value, e.g. "+91", "@", "₹". */
  prefix?: string;
  suffix?: string;
  /** Right-align and use tabular numbers (amounts). */
  numeric?: boolean;
  /** Design-page only. */
  forceState?: "focus";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, optional, prefix, suffix, numeric, forceState, id, className, disabled, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field id={inputId} label={label} helper={helper} error={error} optional={optional}>
      <div
        className={cn(controlBase, "flex h-13 items-center gap-2 px-4")}
        data-invalid={!!error}
        data-disabled={!!disabled}
        data-force={forceState}
      >
        {prefix ? (
          <span className="shrink-0 text-faint" aria-hidden="true">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(inputId, helper, error)}
          className={cn(
            "h-full min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed",
            numeric && "text-right tabular",
            className,
          )}
          {...rest}
        />
        {suffix ? (
          <span className="shrink-0 text-faint" aria-hidden="true">
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
});
