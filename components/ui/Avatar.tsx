import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-14 w-14 text-lg" } as const;

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
}

/** Round photo, or initials on tint when there is no photo. */
export function Avatar({ name, src, size = "md" }: AvatarProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-line bg-tint font-semibold text-ink",
        sizes[size],
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data URLs
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span role="img" aria-label={name}>
          {initials(name) || "?"}
        </span>
      )}
    </span>
  );
}
