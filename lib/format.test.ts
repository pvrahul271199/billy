import { describe, expect, it } from "vitest";
import { formatINR, formatInstagram, initials } from "./format";

describe("formatINR", () => {
  it("uses Indian digit grouping", () => {
    expect(formatINR(12345600)).toBe("₹1,23,456.00");
    expect(formatINR(1234567890)).toBe("₹1,23,45,678.90");
  });
  it("formats zero and small amounts", () => {
    expect(formatINR(0)).toBe("₹0.00");
    expect(formatINR(5)).toBe("₹0.05");
  });
});

describe("formatInstagram", () => {
  it("adds a single @", () => {
    expect(formatInstagram("riya.creates")).toBe("@riya.creates");
    expect(formatInstagram("@@riya")).toBe("@riya");
    expect(formatInstagram("  ")).toBe("");
  });
});

describe("initials", () => {
  it("uses first and last word", () => {
    expect(initials("Riya Sharma")).toBe("RS");
    expect(initials("riya")).toBe("R");
    expect(initials("Riya K Sharma")).toBe("RS");
    expect(initials("")).toBe("");
  });
});
