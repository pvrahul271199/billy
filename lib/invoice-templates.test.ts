import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATE, TEMPLATES, resolveTemplate, templateSpec } from "./invoice-templates";

describe("invoice templates", () => {
  it("has five unique templates", () => {
    expect(TEMPLATES).toHaveLength(5);
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(5);
    expect(new Set(TEMPLATES.map((t) => t.name)).size).toBe(5);
    expect(TEMPLATES[0]!.id).toBe(DEFAULT_TEMPLATE);
  });

  it("resolves the invoice choice, then the profile default, then Classic", () => {
    expect(resolveTemplate("studio", "signature")).toBe("studio");
    expect(resolveTemplate(null, "signature")).toBe("signature");
    expect(resolveTemplate(undefined, undefined)).toBe(DEFAULT_TEMPLATE);
    expect(resolveTemplate("nonsense", "also-bad")).toBe(DEFAULT_TEMPLATE);
  });

  it("falls back to Classic for an unknown id", () => {
    expect(templateSpec("nope").id).toBe("classic");
  });

  it("treats retired template names as unset", () => {
    expect(resolveTemplate("ledger", "minimal")).toBe(DEFAULT_TEMPLATE);
  });
});
