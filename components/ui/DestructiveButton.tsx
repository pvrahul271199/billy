"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { BaseButton, type ButtonSize, type ForcedState } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

export interface DestructiveButtonProps {
  /** Button label, e.g. "Delete". */
  children: string;
  /** Dialog title, e.g. "Delete this invoice?" */
  confirmTitle: string;
  confirmDescription?: string;
  /** Primary confirm label naming the action, e.g. "Delete invoice". */
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  forceState?: ForcedState;
  className?: string;
}

/** Destructive action. Always asks for confirmation before running onConfirm. */
export function DestructiveButton({
  children,
  confirmTitle,
  confirmDescription,
  confirmLabel,
  onConfirm,
  size,
  fullWidth,
  disabled,
  forceState,
  className,
}: DestructiveButtonProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <BaseButton
        variant="destructive"
        icon={Trash}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled}
        forceState={forceState}
        className={className}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        {children}
      </BaseButton>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel={confirmLabel}
        loading={busy}
      />
    </>
  );
}
