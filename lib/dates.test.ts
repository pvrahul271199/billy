import { describe, expect, it } from "vitest";
import { addDays, dueDateFor, formatDate } from "./dates";

describe("dates", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-25", 15)).toBe("2027-01-09");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("formats for display", () => {
    expect(formatDate("2026-10-31")).toBe("31 Oct 2026");
    expect(formatDate("")).toBe("");
  });
  it("derives due dates from payment terms", () => {
    expect(dueDateFor("due_on_receipt", "2026-10-31", "")).toBe("2026-10-31");
    expect(dueDateFor("net_7", "2026-10-31", "")).toBe("2026-11-07");
    expect(dueDateFor("net_15", "2026-10-31", "")).toBe("2026-11-15");
    expect(dueDateFor("net_30", "2026-10-31", "")).toBe("2026-11-30");
    expect(dueDateFor("custom", "2026-10-31", "2026-12-01")).toBe("2026-12-01");
  });
});
