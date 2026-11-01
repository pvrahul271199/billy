import { describe, expect, it } from "vitest";
import { displayStatus } from "./status";
import { itemSummary } from "./summary";
import { parsePercent, parseQuantity, parseRupees, paiseToInput } from "./money";

describe("displayStatus", () => {
  const today = "2026-11-01";
  it("marks pending invoices past due as overdue", () => {
    expect(displayStatus({ status: "pending", dueDate: "2026-10-31" }, today)).toBe("overdue");
  });
  it("is still pending on the due date", () => {
    expect(displayStatus({ status: "pending", dueDate: "2026-11-01" }, today)).toBe("pending");
  });
  it("never makes drafts or paid invoices overdue", () => {
    expect(displayStatus({ status: "draft", dueDate: "2026-01-01" }, today)).toBe("draft");
    expect(displayStatus({ status: "paid", dueDate: "2026-01-01" }, today)).toBe("paid");
  });
});

describe("itemSummary", () => {
  it("summarises by unit", () => {
    expect(itemSummary([{ description: "Reel", unitLabel: "Reel", quantity: 2 }])).toBe("2 Reels");
    expect(itemSummary([{ description: "x", unitLabel: "Story set", quantity: 1 }])).toBe("1 Story set");
    expect(
      itemSummary([
        { description: "", unitLabel: "Reel", quantity: 2 },
        { description: "", unitLabel: "Story set", quantity: 3 },
      ]),
    ).toBe("2 Reels, 3 Story sets");
  });
  it("falls back to the description and collapses long lists", () => {
    expect(itemSummary([{ description: "Usage rights", unitLabel: "", quantity: 1 }])).toBe("Usage rights");
    expect(
      itemSummary([
        { description: "", unitLabel: "Reel", quantity: 1 },
        { description: "", unitLabel: "Carousel", quantity: 1 },
        { description: "Usage rights", unitLabel: "", quantity: 1 },
      ]),
    ).toBe("1 Reel + 2 more");
    expect(itemSummary([])).toBe("No items");
  });
});

describe("money parsing", () => {
  it("parses rupees into paise", () => {
    expect(parseRupees("25,000")).toBe(2500000);
    expect(parseRupees("₹ 1250.5")).toBe(125050);
    expect(parseRupees("")).toBeNull();
    expect(parseRupees("12.345")).toBeNull();
    expect(parseRupees("abc")).toBeNull();
  });
  it("round-trips to input text", () => {
    expect(paiseToInput(2500000)).toBe("25000");
    expect(paiseToInput(125050)).toBe("1250.50");
    expect(paiseToInput(null)).toBe("");
  });
  it("parses percentages and quantities", () => {
    expect(parsePercent("18")).toBe(18);
    expect(parsePercent("7.5%")).toBe(7.5);
    expect(parsePercent("101")).toBeNull();
    expect(parseQuantity("2")).toBe(2);
    expect(parseQuantity("0")).toBeNull();
  });
});
