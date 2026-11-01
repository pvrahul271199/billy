/**
 * Field validators. Each returns an error message (one sentence: what happened
 * and what to do) or null when the value is valid. Empty values are valid unless
 * the field is required; use `required()` for that.
 */

export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const PIN_RE = /^[1-9][0-9]{5}$/;
export const UPI_RE = /^[A-Za-z0-9._-]{2,256}@[A-Za-z][A-Za-z0-9.-]{1,63}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const INSTAGRAM_RE = /^[A-Za-z0-9._]{1,30}$/;
export const SAC_RE = /^[0-9]{4,8}$/;

export function required(value: string, message: string): string | null {
  return value.trim() ? null : message;
}

export function validatePan(v: string): string | null {
  if (!v) return null;
  if (v.length !== 10) return "PAN needs 10 characters, like ABCDE1234F";
  return PAN_RE.test(v) ? null : "PAN should look like ABCDE1234F: 5 letters, 4 digits, 1 letter";
}

/** GSTIN format, plus characters 3–12 must match the PAN when a PAN is given. */
export function validateGstin(v: string, pan?: string): string | null {
  if (!v) return null;
  if (v.length !== 15) return "GSTIN needs 15 characters";
  if (!GSTIN_RE.test(v)) return "GSTIN format doesn't look right. Check it against your GST certificate";
  if (pan && PAN_RE.test(pan) && v.slice(2, 12) !== pan) return "GSTIN doesn't match your PAN. Characters 3 to 12 should be your PAN";
  return null;
}

/** First two digits of a GSTIN are the state code. */
export function gstinStateCode(gstin: string): string {
  return GSTIN_RE.test(gstin) ? gstin.slice(0, 2) : "";
}

export function validateIfsc(v: string): string | null {
  if (!v) return null;
  if (v.length !== 11) return "IFSC needs 11 characters";
  return IFSC_RE.test(v) ? null : "IFSC should look like HDFC0001234: 4 letters, a zero, then 6 characters";
}

export function validatePin(v: string): string | null {
  if (!v) return null;
  return PIN_RE.test(v) ? null : "PIN code needs 6 digits";
}

/** Phone as typed, without +91: 10 digits starting 6–9. */
export function validatePhoneDigits(digits: string): string | null {
  if (!digits) return null;
  if (!/^\d+$/.test(digits)) return "Use digits only for the phone number";
  if (digits.length !== 10) return "Phone number needs 10 digits";
  return /^[6-9]/.test(digits) ? null : "Indian mobile numbers start with 6, 7, 8 or 9";
}

export function validateUpi(v: string): string | null {
  if (!v) return null;
  return UPI_RE.test(v) ? null : "UPI ID should look like name@bank";
}

export function validateEmail(v: string): string | null {
  if (!v) return null;
  return EMAIL_RE.test(v) ? null : "Email should look like name@example.com";
}

export function validateInstagram(v: string): string | null {
  if (!v) return null;
  return INSTAGRAM_RE.test(v) ? null : "Use letters, numbers, dots and underscores only, up to 30";
}

export function validateAccountNumber(v: string): string | null {
  if (!v) return null;
  return /^\d{9,18}$/.test(v) ? null : "Account number needs 9 to 18 digits";
}

export function validateSac(v: string): string | null {
  if (!v) return null;
  return SAC_RE.test(v) ? null : "SAC code needs 4 to 8 digits";
}

/** Normalisers applied as the user types. */
export const normalise = {
  upper: (v: string) => v.toUpperCase().replace(/\s/g, ""),
  digits: (v: string) => v.replace(/\D/g, ""),
  instagram: (v: string) => v.trim().replace(/^@+/, ""),
};

/** "+919876543210" → "9876543210" */
export function phoneDigits(phone: string): string {
  return phone.replace(/^\+91/, "").replace(/\D/g, "");
}

/** "9876543210" → "+919876543210", empty stays empty. */
export function phoneFromDigits(digits: string): string {
  return digits ? `+91${digits}` : "";
}

/** "+919876543210" → "+91 98765 43210" */
export function formatPhone(phone: string): string {
  const d = phoneDigits(phone);
  if (d.length !== 10) return phone;
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}
