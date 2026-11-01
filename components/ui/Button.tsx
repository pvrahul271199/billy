"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { tap } from "@/lib/haptics";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "tint" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
/** Design-page only: render a static hover / pressed / focus state. */
export type ForcedState = "hover" | "pressed" | "focus";

type InternalVariant = ButtonVariant | "destructive";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: Icon;
  loading?: boolean;
  /** Short vibration on tap. On by default for primary buttons. */
  haptic?: boolean;
  forceState?: ForcedState;
}

const base =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold " +
  "transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] " +
  "disabled:cursor-not-allowed disabled:active:scale-100 " +
  "data-[force=pressed]:scale-[0.98] " +
  "data-[force=focus]:outline-2 data-[force=focus]:outline-offset-2 data-[force=focus]:outline-ink";

const variants: Record<InternalVariant, string> = {
  primary:
    "bg-ink text-white hover:bg-ink-hover active:bg-ink-press " +
    "data-[force=hover]:bg-ink-hover data-[force=pressed]:bg-ink-press " +
    "disabled:bg-line disabled:text-soft",
  secondary:
    "border border-line bg-white text-ink hover:bg-tint active:bg-line " +
    "data-[force=hover]:bg-tint data-[force=pressed]:bg-line " +
    "disabled:bg-white disabled:text-faint",
  tint:
    "bg-tint text-ink hover:bg-line active:bg-line " +
    "data-[force=hover]:bg-line data-[force=pressed]:bg-line " +
    "disabled:bg-tint disabled:text-faint",
  ghost:
    "bg-transparent text-ink hover:bg-tint active:bg-line " +
    "data-[force=hover]:bg-tint data-[force=pressed]:bg-line " +
    "disabled:text-faint disabled:bg-transparent",
  destructive:
    "border border-line bg-white text-warm hover:bg-warm-bg active:bg-warm-bg " +
    "data-[force=hover]:bg-warm-bg data-[force=pressed]:bg-warm-bg " +
    "disabled:text-faint disabled:bg-white",
};

// sm is visually 36px but keeps a 44px touch target via the ::after hit area.
const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-key px-3.5 text-[13px] after:absolute after:inset-x-0 after:-inset-y-1 after:content-['']",
  md: "h-12 rounded-btn px-4 text-[15px]",
  lg: "h-14 rounded-btn px-5 text-base",
};

export const BaseButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant"> & { variant?: InternalVariant }>(
  function BaseButton(
    { variant = "primary", size = "md", fullWidth, icon: IconCmp, loading, haptic, forceState, disabled, className, children, onClick, type = "button", ...rest },
    ref,
  ) {
    const iconSize = size === "sm" ? 16 : 20;
    const vibrate = haptic ?? variant === "primary";
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        data-force={forceState}
        onClick={(e) => {
          if (vibrate) tap();
          onClick?.(e);
        }}
        className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
        {...rest}
      >
        {loading ? <Spinner size={iconSize} /> : IconCmp ? <IconCmp size={iconSize} weight={variant === "primary" ? "bold" : "regular"} aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);

/**
 * Primary, secondary, tint or ghost button. Use only ONE primary per screen.
 * For destructive actions use <DestructiveButton>, which always confirms.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  return <BaseButton ref={ref} {...props} />;
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: Icon;
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  forceState?: ForcedState;
  weight?: "regular" | "bold";
}

/** 44×44 icon-only button. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon: IconCmp, label, className, forceState, weight = "regular", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      data-force={forceState}
      className={cn(base, variants.ghost, "h-11 w-11 shrink-0 rounded-full", className)}
      {...rest}
    >
      <IconCmp size={22} weight={weight} aria-hidden="true" />
    </button>
  );
});
