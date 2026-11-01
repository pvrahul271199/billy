const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format an amount held in paise as ₹1,23,456.00 (Indian digit grouping). */
export function formatINR(paise: number): string {
  return inrFormatter.format(Math.round(paise) / 100);
}

/** Show an Instagram username with a leading @ (stored without it). */
export function formatInstagram(username: string): string {
  const clean = username.trim().replace(/^@+/, "");
  return clean ? `@${clean}` : "";
}

/** Initials for an avatar fallback: "Riya Sharma" → "RS". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
