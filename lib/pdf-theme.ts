import { print } from "@/theme/tokens";

/**
 * PDF palette, from theme/tokens.ts. Pure black on white with grey secondary
 * text and no filled backgrounds, so invoices look formal and print cleanly.
 */
export const pdfColors = {
  text: print.text,
  secondary: print.secondary,
  hairline: print.hairline,
  white: print.paper,
} as const;
