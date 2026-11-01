"use client";

import { useId } from "react";
import { Overlay } from "./Dialog";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  /** Label for the primary button, naming the action: "Delete invoice". */
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel, cancelLabel = "Cancel", loading }: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  return (
    <Overlay
      open={open}
      onClose={loading ? () => {} : onClose}
      labelledBy={titleId}
      describedBy={description ? descId : undefined}
      variant="dialog"
    >
      <div className="rounded-[24px] bg-white/95 p-6 shadow-float backdrop-blur-md">
        <h2 id={titleId} className="text-[18px] font-semibold text-ink">
          {title}
        </h2>
        {description ? (
          <p id={descId} className="mt-2 text-[14px] leading-relaxed text-soft">
            {description}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="primary" fullWidth onClick={() => void onConfirm()} loading={loading}>
            {confirmLabel}
          </Button>
          <Button variant="ghost" fullWidth onClick={onClose} disabled={loading} data-autofocus>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
