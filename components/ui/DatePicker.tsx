"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBase, describedBy } from "./Field";

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
  forceState?: "focus";
}

/** Native date input (yyyy-mm-dd value), styled to match the other controls. */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, helper, error, optional, forceState, id, className, disabled, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field id={inputId} label={label} helper={helper} error={error} optional={optional}>
      <div
        className={cn(controlBase, "flex h-13 items-center px-4")}
        data-invalid={!!error}
        data-disabled={!!disabled}
        data-force={forceState}
      >
        <input
          ref={ref}
          id={inputId}
          type="date"
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy(inputId, helper, error)}
          className={cn(
            "h-full w-full min-w-0 appearance-none bg-transparent text-left tabular outline-none disabled:cursor-not-allowed",
            "[&::-webkit-date-and-time-value]:text-left [&::-webkit-calendar-picker-indicator]:opacity-60",
            className,
          )}
          {...rest}
        />
      </div>
    </Field>
  );
});
