import { describe, expect, it } from "vitest";
import { computeTotals, formatRate, gstModeFor, lineAmount } from "./tax";

const items = [
  { quantity: 2, rate: 2500000 }, // 2 × ₹25,000
  { quantity: 1, rate: 850000 }, // ₹8,500
];

describe("gstModeFor", () => {
  it("is none when not registered", () => {
    expect(gstModeFor(false, "27", "29")).toBe("none");
  });
  it("splits CGST + SGST within the same state", () => {
    expect(gstModeFor(true, "27", "27")).toBe("intra");
  });
  it("uses IGST across states", () => {
    expect(gstModeFor(true, "27", "29")).toBe("inter");
  });
  it("assumes intra-state when a state is unknown", () => {
    expect(gstModeFor(true, "27", "")).toBe("intra");
    expect(gstModeFor(true, "", "29")).toBe("intra");
  });
});

describe("computeTotals", () => {
  it("adds nothing without GST", () => {
    const t = computeTotals(items, { gstMode: "none", gstRate: 0, showTds: false, tdsRate: null });
    expect(t).toEqual({ subtotal: 5850000, cgst: 0, sgst: 0, igst: 0, total: 5850000, tds: 0, netReceivable: 5850000 });
  });
  it("splits 18% into 9% + 9% intra-state", () => {
    const t = computeTotals(items, { gstMode: "intra", gstRate: 18, showTds: false, tdsRate: null });
    expect(t.cgst).toBe(526500);
    expect(t.sgst).toBe(526500);
    expect(t.igst).toBe(0);
    expect(t.total).toBe(6903000);
  });
  it("charges IGST inter-state", () => {
    const t = computeTotals(items, { gstMode: "inter", gstRate: 18, showTds: false, tdsRate: null });
    expect(t.igst).toBe(1053000);
    expect(t.cgst + t.sgst).toBe(0);
    expect(t.total).toBe(6903000);
  });
  it("honours an edited rate", () => {
    const t = computeTotals([{ quantity: 1, rate: 10000 }], { gstMode: "intra", gstRate: 5, showTds: false, tdsRate: null });
    expect(t.cgst).toBe(250);
    expect(t.total).toBe(10500);
  });
  it("keeps TDS informational: calculated on subtotal, total unchanged", () => {
    const t = computeTotals(items, { gstMode: "inter", gstRate: 18, showTds: true, tdsRate: 10 });
    expect(t.tds).toBe(585000);
    expect(t.total).toBe(6903000);
    expect(t.netReceivable).toBe(6903000 - 585000);
  });
  it("ignores the TDS rate when TDS is hidden", () => {
    const t = computeTotals(items, { gstMode: "none", gstRate: 0, showTds: false, tdsRate: 10 });
    expect(t.tds).toBe(0);
    expect(t.netReceivable).toBe(t.total);
  });
  it("rounds to the nearest paisa", () => {
    expect(lineAmount({ quantity: 1.5, rate: 33333 })).toBe(50000);
    const t = computeTotals([{ quantity: 1, rate: 333 }], { gstMode: "intra", gstRate: 18, showTds: false, tdsRate: null });
    expect(t.cgst).toBe(30);
    expect(t.total).toBe(393);
  });
});

describe("formatRate", () => {
  it("drops trailing zeros", () => {
    expect(formatRate(9)).toBe("9");
    expect(formatRate(7.5)).toBe("7.5");
    expect(formatRate(18 / 2)).toBe("9");
  });
});
