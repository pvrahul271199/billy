import { describe, expect, it } from "vitest";
import {
  financialYear,
  financialYearEnd,
  financialYearStart,
  invoiceNumberError,
  nextInvoiceNumber,
  sanitizePrefix,
} from "./numbering";

describe("financialYear", () => {
  it("runs April to March", () => {
    expect(financialYear("2026-04-01")).toBe("26-27");
    expect(financialYear("2026-10-31")).toBe("26-27");
    expect(financialYear("2027-03-31")).toBe("26-27");
    expect(financialYear("2027-04-01")).toBe("27-28");
    expect(financialYear("2026-03-31")).toBe("25-26");
  });
  it("handles the century boundary", () => {
    expect(financialYear("2099-12-01")).toBe("99-00");
    expect(financialYear("2100-01-15")).toBe("99-00");
  });
  it("gives start and end dates", () => {
    expect(financialYearStart("2027-02-01")).toBe("2026-04-01");
    expect(financialYearEnd("2026-05-01")).toBe("2027-03-31");
  });
});

describe("nextInvoiceNumber", () => {
  it("starts at 001", () => {
    expect(nextInvoiceNumber("BLY", "2026-10-31", [])).toBe("BLY/26-27/001");
  });
  it("continues from the highest number in the same year", () => {
    const existing = ["BLY/26-27/001", "BLY/26-27/007", "BLY/26-27/003"];
    expect(nextInvoiceNumber("BLY", "2026-10-31", existing)).toBe("BLY/26-27/008");
  });
  it("restarts each financial year", () => {
    expect(nextInvoiceNumber("BLY", "2027-04-02", ["BLY/26-27/045"])).toBe("BLY/27-28/001");
  });
  it("ignores other prefixes and custom numbers", () => {
    expect(nextInvoiceNumber("RS", "2026-10-31", ["BLY/26-27/009", "custom-1", "RS/26-27/x"])).toBe("RS/26-27/001");
  });
  it("grows past 999", () => {
    expect(nextInvoiceNumber("BLY", "2026-10-31", ["BLY/26-27/999"])).toBe("BLY/26-27/1000");
  });
  it("falls back to the default prefix and fits 16 characters", () => {
    const n = nextInvoiceNumber("", "2026-10-31", []);
    expect(n).toBe("BLY/26-27/001");
    expect(nextInvoiceNumber("ABCDEF", "2026-10-31", []).length).toBeLessThanOrEqual(16);
  });
});

describe("sanitizePrefix", () => {
  it("uppercases, strips symbols and caps at 6", () => {
    expect(sanitizePrefix("riya k/")).toBe("RIYAK");
    expect(sanitizePrefix("abcdefgh")).toBe("ABCDEF");
    expect(sanitizePrefix("rs-01")).toBe("RS-01");
  });
});

describe("invoiceNumberError", () => {
  it("accepts a valid unique number", () => {
    expect(invoiceNumberError("BLY/26-27/001", ["BLY/26-27/002"])).toBeNull();
  });
  it("requires a value", () => {
    expect(invoiceNumberError("  ", [])).toMatch(/Add an invoice number/);
  });
  it("caps length at 16", () => {
    expect(invoiceNumberError("ABCDEFGHIJKLMNOPQ", [])).toMatch(/16/);
    expect(invoiceNumberError("ABCDEFGHIJKLMNOP", [])).toBeNull();
  });
  it("rejects duplicates case-insensitively", () => {
    expect(invoiceNumberError("bly/26-27/001", ["BLY/26-27/001"])).toMatch(/already used/);
  });
  it("rejects odd characters", () => {
    expect(invoiceNumberError("INV#1", [])).toMatch(/letters, numbers/);
  });
});
