import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
  it("is 1 for identical colours", () => {
    expect(contrastRatio("#3f5f3f", "#3f5f3f")).toBe(1);
  });
  it("accepts shorthand hex", () => {
    expect(contrastRatio("#fff", "#000")).toBeCloseTo(21, 1);
  });
});
