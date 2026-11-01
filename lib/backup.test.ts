import { describe, expect, it } from "vitest";
import { backupSummary, parseBackup } from "./backup";

const valid = {
  app: "billy",
  version: 1,
  exportedAt: "2026-11-01T00:00:00.000Z",
  profile: { id: "me", fullName: "Riya Sharma" },
  payment: null,
  parties: [{ id: "p1", deletedAt: null }],
  presets: [{ id: "s1", deletedAt: null }, { id: "s2", deletedAt: "2026-10-01" }],
  invoices: [{ id: "i1", number: "BLY/26-27/001", items: [], deletedAt: null }],
};

describe("parseBackup", () => {
  it("accepts a valid backup", () => {
    const r = parseBackup(JSON.stringify(valid));
    expect(r.ok).toBe(true);
    if (r.ok) expect(backupSummary(r.data)).toEqual({ invoices: 1, parties: 1, presets: 1, name: "Riya Sharma" });
  });
  it("rejects invalid JSON", () => {
    expect(parseBackup("{nope")).toEqual({ ok: false, error: expect.stringMatching(/valid JSON/) });
  });
  it("rejects other apps' files", () => {
    expect(parseBackup(JSON.stringify({ ...valid, app: "other" }))).toEqual({ ok: false, error: expect.stringMatching(/isn't a Billy backup/) });
  });
  it("rejects newer versions", () => {
    expect(parseBackup(JSON.stringify({ ...valid, version: 99 }))).toEqual({ ok: false, error: expect.stringMatching(/newer version/) });
  });
  it("rejects damaged lists", () => {
    expect(parseBackup(JSON.stringify({ ...valid, invoices: [{ id: "x" }] })).ok).toBe(false);
    expect(parseBackup(JSON.stringify({ ...valid, parties: "nope" })).ok).toBe(false);
  });
});
