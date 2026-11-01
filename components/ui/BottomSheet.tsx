"use client";

import { useId, type ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Overlay } from "./Dialog";
import { IconButton } from "./Button";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Optional footer, e.g. a primary action, kept in the thumb zone. */
  footer?: ReactNode;
}

/** Frosted sheet that slides up inside the phone frame. Tap outside or Esc to close. */
export function BottomSheet({ open, onClose, title, children, footer }: BottomSheetProps) {
  const titleId = useId();
  return (
    <Overlay open={open} onClose={onClose} labelledBy={titleId} variant="sheet">
      <div className="flex max-h-[min(88dvh,720px)] flex-col rounded-t-sheet bg-white/95 pb-[var(--safe-bottom)] shadow-float backdrop-blur-md">
        <div className="flex justify-center pt-2.5" aria-hidden="true">
          <span className="h-1 w-9 rounded-full bg-line" />
        </div>
        <div className="flex items-center justify-between gap-2 py-1 pr-2 pl-5">
          <h2 id={titleId} className="text-[17px] font-semibold text-ink">
            {title}
          </h2>
          <IconButton icon={X} label="Close" onClick={onClose} />
        </div>
        <div className="screen-scroll min-h-0 flex-1 px-5 pb-5">{children}</div>
        {footer ? <div className="border-t border-line px-5 pt-3 pb-4">{footer}</div> : null}
      </div>
    </Overlay>
  );
}
