export type KeypadKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "back";

/**
 * Apply a key to an amount string: max 2 decimals, max 9 rupee digits,
 * no leading zeros. Pure, so it is unit tested.
 */
export function applyKey(value: string, key: KeypadKey): string {
  if (key === "back") return value.slice(0, -1);
  if (key === ".") {
    if (value.includes(".")) return value;
    return value === "" ? "0." : `${value}.`;
  }
  const [whole = "", frac] = value.split(".");
  if (frac !== undefined) return frac.length >= 2 ? value : value + key;
  if (whole === "0") return key;
  if (whole.length >= 9) return value;
  return value + key;
}
