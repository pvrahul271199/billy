import type { BillToSnapshot, FromSnapshot, Party, PaymentDetails, PaymentSnapshot, Profile } from "@/types";

/** Pure helpers that freeze profile, brand and bank details onto an invoice. */
export function snapshotFrom(p: Profile): FromSnapshot {
  return {
    fullName: p.fullName,
    instagram: p.instagram,
    email: p.email,
    phone: p.phone,
    pan: p.pan,
    gstin: p.gstRegistered ? p.gstin : "",
    address: { ...p.address },
    logo: p.logo,
    signature: p.signature,
  };
}

export function snapshotBillTo(p: Party): BillToSnapshot {
  return {
    type: p.type,
    name: p.name,
    gstin: p.gstin,
    address: { ...p.address },
    contactPerson: p.contactPerson,
    email: p.email,
    phone: p.phone,
  };
}

export function snapshotPayment(p: PaymentDetails): PaymentSnapshot {
  const { id: _id, updatedAt: _u, ...rest } = p;
  return rest;
}
