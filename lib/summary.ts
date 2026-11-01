import type { LineItem } from "@/types";

function pluralise(word: string, n: number): string {
  if (n === 1) return word;
  if (/s$/i.test(word)) return word;
  if (/[^aeiou]y$/i.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

function formatQty(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** Short description of an invoice's items: "2 Reels", "2 Reels, 1 Story set", "2 Reels + 3 more". */
export function itemSummary(items: Array<Pick<LineItem, "description" | "unitLabel" | "quantity">>): string {
  const parts = items
    .filter((i) => i.description.trim() || i.unitLabel.trim())
    .map((i) => {
      const unit = i.unitLabel.trim();
      if (unit) return `${formatQty(i.quantity)} ${pluralise(unit, i.quantity)}`;
      return i.quantity === 1 ? i.description.trim() : `${formatQty(i.quantity)} × ${i.description.trim()}`;
    });
  if (parts.length === 0) return "No items";
  if (parts.length <= 2) return parts.join(", ");
  return `${parts.slice(0, 1).join(", ")} + ${parts.length - 1} more`;
}
