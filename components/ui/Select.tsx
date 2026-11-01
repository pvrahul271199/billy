"use client";

import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { Field, controlBase, describedBy } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  /** Shown as the first, empty choice. */
  placeholder?: string;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
  forceState?: "focus";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, helper, error, optional, forceState, id, className, disabled, value, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const isEmpty = value === "" || value === undefined;
  return (
    <Field id={inputId} label={label} helper={helper} error={error} optional={optional}>
      <div
        className={cn(controlBase, "relative h-13")}
        data-invalid={!!error}
        data-disabled={!!disabled}
        data-force={forceState}
      >
        <select
          ref={ref}
          id={inputId}
          disabled={disabled}
          value={value}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(inputId, helper, error)}
          className={cn(
            "h-full w-full appearance-none bg-transparent pr-10 pl-4 outline-none disabled:cursor-not-allowed",
            isEmpty && placeholder ? "text-faint" : "text-inherit",
            className,
          )}
          {...rest}
        >
          {placeholder !== undefined ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-ink">
              {o.label}
            </option>
          ))}
        </select>
        <CaretDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-soft"
        />
      </div>
    </Field>
  );
});
