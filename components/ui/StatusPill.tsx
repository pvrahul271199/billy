import { CheckCircle, Clock, PencilSimple, WarningCircle, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import type { DisplayStatus } from "@/types";

const config: Record<DisplayStatus, { label: string; icon: Icon; className: string }> = {
  draft: { label: "Draft", icon: PencilSimple, className: "border border-line bg-tint text-soft" },
  pending: { label: "Pending", icon: Clock, className: "border border-ink2 bg-white text-ink" },
  overdue: { label: "Overdue", icon: WarningCircle, className: "border border-transparent bg-warm-bg text-warm" },
  paid: { label: "Paid", icon: CheckCircle, className: "border border-transparent bg-good-bg text-good" },
};

/** Invoice status: calm tones, always with an icon and a word, never colour alone. */
export function StatusPill({ status }: { status: DisplayStatus }) {
  const { label, icon: IconCmp, className } = config[status];
  return (
    <span
      className={cn(
        "inline-flex h-[26px] shrink-0 items-center gap-1 rounded-full pr-2.5 pl-2 text-[12px] font-semibold whitespace-nowrap",
        className,
      )}
    >
      <IconCmp size={14} weight="bold" aria-hidden="true" />
      {label}
    </span>
  );
}
