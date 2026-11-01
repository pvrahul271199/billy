import type { InvoiceTemplateId } from "@/types";

/**
 * Invoice templates. Each is a layout in components/invoice/sheet (preview) and
 * components/invoice/pdf (PDF); the two mirror each other. All are black on
 * white with thin rules and no filled areas, so they print cleanly on a home
 * or shop printer and photocopy well.
 */
export interface TemplateSpec {
  id: InvoiceTemplateId;
  name: string;
  description: string;
}

export const DEFAULT_TEMPLATE: InvoiceTemplateId = "classic";

export const TEMPLATES: TemplateSpec[] = [
  { id: "classic", name: "Classic", description: "Title on the right, ruled table" },
  { id: "statement", name: "Statement", description: "Bold title, services band, summary" },
  { id: "signature", name: "Signature", description: "Centred name, airy, signed at the foot" },
  { id: "structured", name: "Structured", description: "Large title, ruled sections" },
  { id: "studio", name: "Studio", description: "Wide-spaced name, contact footer" },
];

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);

export function isTemplateId(v: unknown): v is InvoiceTemplateId {
  return typeof v === "string" && (TEMPLATE_IDS as string[]).includes(v);
}

/** Spec for an id; unknown or missing ids fall back to Classic. */
export function templateSpec(id: unknown): TemplateSpec {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0]!;
}

/** The template an invoice uses: its own choice, else the creator's default. */
export function resolveTemplate(invoiceTemplate: unknown, profileTemplate: unknown): InvoiceTemplateId {
  if (isTemplateId(invoiceTemplate)) return invoiceTemplate;
  if (isTemplateId(profileTemplate)) return profileTemplate;
  return DEFAULT_TEMPLATE;
}
