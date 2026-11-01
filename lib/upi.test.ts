import { describe, expect, it } from "vitest";
import { buildUpiLink } from "./upi";

describe("buildUpiLink", () => {
  it("builds the UPI deep link with the exact amount", () => {
    expect(buildUpiLink({ upiId: "riya@okhdfcbank", name: "Riya Sharma", amount: 8083000, note: "BLY/26-27/004" })).toBe(
      "upi://pay?pa=riya%40okhdfcbank&pn=Riya%20Sharma&am=80830.00&cu=INR&tn=BLY%2F26-27%2F004",
    );
  });
  it("formats paise with two decimals", () => {
    expect(buildUpiLink({ upiId: "a@b", name: "A", amount: 105, note: "X" })).toContain("am=1.05");
  });
});
