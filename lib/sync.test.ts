import { describe, expect, it } from "vitest";
import type { Invoice, Party } from "@/types";
import { invoiceFromRows, invoiceToRows, newer, partyFromRow, partyToRow } from "./sync";

const inv: Invoice = {
  id: "i1",
  number: "BLY/26-27/001",
  financialYear: "26-27",
  status: "pending",
  invoiceDate: "2026-10-31",
  paymentTerms: "net_15",
  dueDate: "2026-11-15",
  deliveryDate: "",
  billToId: "p1",
  viaAgency: false,
  endBrandName: "",
  campaignName: "Diwali",
  items: [
    { id: "a", description: "Instagram Reel", unitLabel: "Reel", quantity: 2, rate: 2500000 },
    { id: "b", description: "Story set", unitLabel: "", quantity: 1, rate: 850000 },
  ],
  gstMode: "inter",
  gstRate: 18,
  sacCode: "",
  showTds: true,
  tdsRate: 10,
  notes: "",
  includeBank: true,
  includeUpiQr: true,
  includeSignature: false,
  template: null,
  fromSnapshot: null,
  billToSnapshot: null,
  paymentSnapshot: null,
  sentAt: "2026-10-31T10:00:00.000Z",
  paidDate: null,
  createdAt: "2026-10-31T09:00:00.000Z",
  updatedAt: "2026-10-31T10:00:00.000Z",
  deletedAt: null,
};

describe("invoice mapping", () => {
  it("maps to schema rows with rupees and NULL for blanks", () => {
    const { invoice, items } = invoiceToRows(inv, "u1");
    expect(invoice.user_id).toBe("u1");
    expect(invoice.subtotal).toBe(58500);
    expect(invoice.igst_amount).toBe(10530);
    expect(invoice.total).toBe(69030);
    expect(invoice.tds_amount).toBe(5850);
    expect(invoice.is_tax_invoice).toBe(true);
    expect(invoice.delivery_date).toBeNull();
    expect(invoice.sac_code).toBeNull();
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ invoice_id: "i1", position: 0, rate: 25000, quantity: 2, unit_label: "Reel" });
    expect(items[1]!.unit_label).toBeNull();
  });

  it("round-trips back to the same invoice", () => {
    const { invoice, items } = invoiceToRows(inv, "u1");
    expect(invoiceFromRows(invoice, [...items].reverse())).toEqual(inv);
  });
});

describe("template mapping", () => {
  it("round-trips a chosen template and treats unknown values as unset", () => {
    const { invoice, items } = invoiceToRows({ ...inv, template: "studio" }, "u1");
    expect(invoice.template).toBe("studio");
    expect(invoiceFromRows(invoice, items).template).toBe("studio");
    expect(invoiceFromRows({ ...invoice, template: "bogus" }, items).template).toBeNull();
  });
});

describe("party mapping", () => {
  const party: Party = {
    id: "p1",
    type: "agency",
    name: "Pepper Talent",
    gstin: "",
    address: { line1: "12 Residency Road", line2: "", city: "Bengaluru", stateCode: "29", pin: "560025" },
    contactPerson: "",
    email: "",
    phone: "",
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    deletedAt: null,
  };
  it("flattens the address and nulls blanks", () => {
    const row = partyToRow(party, "u1");
    expect(row).toMatchObject({ address_line1: "12 Residency Road", address_line2: null, state_code: "29", gstin: null });
    expect(partyFromRow(row)).toEqual(party);
  });
});

describe("newer", () => {
  it("keeps the most recently updated copy", () => {
    const a = { id: 1, updatedAt: "2026-10-01" };
    const b = { id: 2, updatedAt: "2026-10-02" };
    expect(newer(a, b)).toBe(b);
    expect(newer(b, a)).toBe(b);
    expect(newer(undefined, a)).toBe(a);
  });
});

import { paymentFromRow, paymentToRow, presetFromRow, presetToRow, profileFromRow, profileToRow } from "./sync";
import { defaultPayment, defaultProfile } from "@/db/schema";

describe("profile, payment and preset mapping", () => {
  it("round-trips a profile", () => {
    const p = { ...defaultProfile(), fullName: "Priya", instagram: "priya.creates", gstRegistered: false, defaultTdsRate: 10, updatedAt: "2026-11-01T00:00:00.000Z" };
    const row = profileToRow(p, "u1");
    expect(row.id).toBe("u1");
    expect(row.pan).toBeNull();
    const back = profileFromRow(row, { photo: null, logo: null, signature: null });
    expect(back).toMatchObject({ fullName: "Priya", instagram: "priya.creates", defaultTdsRate: 10, id: "me" });
  });
  it("round-trips payment details", () => {
    const p = { ...defaultPayment(), upiId: "priya@okaxis", updatedAt: "2026-11-01T00:00:00.000Z" };
    const back = paymentFromRow(paymentToRow(p, "u1"), null);
    expect(back.upiId).toBe("priya@okaxis");
    expect(back.accountNumber).toBe("");
  });
  it("round-trips a preset with its rate in paise", () => {
    const p = { id: "x", label: "Reel", description: "Instagram Reel", unitLabel: "Reel", defaultRate: 2500000, sortOrder: 1, createdAt: "t", updatedAt: "t", deletedAt: null };
    expect(presetFromRow(presetToRow(p, "u1"))).toEqual(p);
  });
});
