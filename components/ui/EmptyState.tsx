import type { ReactNode } from "react";
import type { Icon } from "@phosphor-icons/react";

export interface EmptyStateProps {
  icon: Icon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ icon: IconCmp, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-tint text-soft">
        <IconCmp size={26} aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-[17px] font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1.5 max-w-xs text-[14px] leading-relaxed text-soft">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
