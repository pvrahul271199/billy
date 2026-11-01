"use client";

import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBase, describedBy } from "./Field";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  helper?: ReactNode;
  error?: string;
  optional?: boolean;
  forceState?: "focus";
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helper, error, optional, forceState, id, className, disabled, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <Field id={inputId} label={label} helper={helper} error={error} optional={optional}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy(inputId, helper, error)}
        data-invalid={!!error}
        data-disabled={!!disabled}
        data-force={forceState}
        className={cn(controlBase, "min-h-24 resize-y px-4 py-3 leading-relaxed", className)}
        {...rest}
      />
    </Field>
  );
});
