import { describe, expect, it } from "vitest";
import {
  formatPhone,
  gstinStateCode,
  phoneDigits,
  phoneFromDigits,
  validateAccountNumber,
  validateEmail,
  validateGstin,
  validateIfsc,
  validateInstagram,
  validatePan,
  validatePhoneDigits,
  validatePin,
  validateSac,
  validateUpi,
} from "./validators";

describe("PAN", () => {
  it("accepts AAAAA9999A", () => expect(validatePan("ABCDE1234F")).toBeNull());
  it("allows empty", () => expect(validatePan("")).toBeNull());
  it("checks length", () => expect(validatePan("ABCDE123")).toMatch(/10 characters/));
  it("checks pattern", () => expect(validatePan("ABCD12345F")).toMatch(/ABCDE1234F/));
});

describe("GSTIN", () => {
  it("accepts a valid GSTIN", () => expect(validateGstin("27ABCDE1234F1Z5")).toBeNull());
  it("checks length", () => expect(validateGstin("27ABCDE1234F1Z")).toMatch(/15 characters/));
  it("checks format", () => expect(validateGstin("27ABCDE1234F1X5")).toMatch(/format/));
  it("requires characters 3–12 to match the PAN", () => {
    expect(validateGstin("27ABCDE1234F1Z5", "ABCDE1234F")).toBeNull();
    expect(validateGstin("27ABCDE1234F1Z5", "ZZZZZ9999Z")).toMatch(/match your PAN/);
  });
  it("skips the PAN check when the PAN is invalid or missing", () => {
    expect(validateGstin("27ABCDE1234F1Z5", "bad")).toBeNull();
  });
  it("reads the state code", () => {
    expect(gstinStateCode("29AABCP1234K1Z2")).toBe("29");
    expect(gstinStateCode("nope")).toBe("");
  });
});

describe("IFSC", () => {
  it("accepts HDFC0001234", () => expect(validateIfsc("HDFC0001234")).toBeNull());
  it("needs 11 characters", () => expect(validateIfsc("HDFC00012")).toBe("IFSC needs 11 characters"));
  it("needs a zero in position 5", () => expect(validateIfsc("HDFC1001234")).toMatch(/zero/));
});

describe("other fields", () => {
  it("PIN", () => {
    expect(validatePin("400050")).toBeNull();
    expect(validatePin("040005")).toMatch(/6 digits/);
    expect(validatePin("40005")).toMatch(/6 digits/);
  });
  it("phone", () => {
    expect(validatePhoneDigits("9876543210")).toBeNull();
    expect(validatePhoneDigits("987654321")).toMatch(/10 digits/);
    expect(validatePhoneDigits("1876543210")).toMatch(/start with/);
  });
  it("UPI", () => {
    expect(validateUpi("riya@okhdfcbank")).toBeNull();
    expect(validateUpi("riya.k-01@ybl")).toBeNull();
    expect(validateUpi("riya")).toMatch(/name@bank/);
    expect(validateUpi("riya@")).toMatch(/name@bank/);
  });
  it("email", () => {
    expect(validateEmail("riya@studio.in")).toBeNull();
    expect(validateEmail("riya@studio")).toMatch(/example/);
  });
  it("Instagram", () => {
    expect(validateInstagram("riya.creates_01")).toBeNull();
    expect(validateInstagram("riya creates")).toMatch(/letters/);
  });
  it("account number", () => {
    expect(validateAccountNumber("50100123456789")).toBeNull();
    expect(validateAccountNumber("1234")).toMatch(/9 to 18/);
  });
  it("SAC", () => {
    expect(validateSac("998361")).toBeNull();
    expect(validateSac("99")).toMatch(/4 to 8/);
  });
});

describe("phone helpers", () => {
  it("round-trips +91 numbers", () => {
    expect(phoneFromDigits("9876543210")).toBe("+919876543210");
    expect(phoneDigits("+919876543210")).toBe("9876543210");
    expect(phoneFromDigits("")).toBe("");
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });
});
