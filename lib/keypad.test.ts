import { describe, expect, it } from "vitest";
import { applyKey } from "./keypad";

const typeKeys = (keys: string[]) => keys.reduce((v, k) => applyKey(v, k as Parameters<typeof applyKey>[1]), "");

describe("applyKey", () => {
  it("types digits", () => {
    expect(typeKeys(["2", "5", "0", "0", "0"])).toBe("25000");
  });
  it("drops leading zeros", () => {
    expect(typeKeys(["0", "0", "5"])).toBe("5");
  });
  it("allows one decimal point and two decimals", () => {
    expect(typeKeys([".", "5"])).toBe("0.5");
    expect(typeKeys(["1", ".", ".", "2", "5", "9"])).toBe("1.25");
  });
  it("deletes", () => {
    expect(typeKeys(["1", "2", "back"])).toBe("1");
    expect(typeKeys(["back"])).toBe("");
  });
  it("caps at 9 rupee digits", () => {
    expect(typeKeys(Array(12).fill("9"))).toBe("999999999");
  });
});
