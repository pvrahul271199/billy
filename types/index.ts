/** Money is always held in integer paise (₹1 = 100). */
export type Paise = number;

/** ISO calendar date, yyyy-mm-dd, in the user's local time zone. */
export type ISODate = string;

/** Status stored on an invoice. */
export type InvoiceStatus = "draft" | "pending" | "paid";

/** Status shown in the UI. "overdue" is computed: pending + due date passed. */
export type DisplayStatus = InvoiceStatus | "overdue";

export type PartyType = "brand" | "agency";

export type PaymentTerms = "due_on_receipt" | "net_7" | "net_15" | "net_30" | "custom";

/** none: not GST registered. intra: CGST + SGST. inter: IGST. */
export type GstMode = "none" | "intra" | "inter";

export interface Address {
  line1: string;
  line2: string;
  city: string;
  /** 2-digit GST state code, e.g. "27" for Maharashtra. Empty when unknown. */
  stateCode: string;
  pin: string;
}

export interface Profile {
  id: "me";
  fullName: string;
  /** Stored without the leading @. */
  instagram: string;
  email: string;
  /** "+91" followed by 10 digits, or empty. */
  phone: string;
  pan: string;
  address: Address;
  photo: string | null;
  logo: string | null;
  signature: string | null;
  gstRegistered: boolean;
  gstin: string;
  defaultSac: string;
  /** Percent, e.g. 10. Null when not set. */
  defaultTdsRate: number | null;
  invoicePrefix: string;
  defaultNotes: string;
  onboardedAt: string | null;
  updatedAt: string;
}

export interface PaymentDetails {
  id: "me";
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  upiId: string;
  /** Optional uploaded static QR image (data URL). */
  staticQr: string | null;
  updatedAt: string;
}

export interface Party {
  id: string;
  type: PartyType;
  name: string;
  gstin: string;
  address: Address;
  contactPerson: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Preset {
  id: string;
  /** Chip text, e.g. "Instagram Reel". */
  label: string;
  /** Default line description. */
  description: string;
  /** Unit used in summaries, e.g. "Reel" → "2 Reels". */
  unitLabel: string;
  defaultRate: Paise | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface LineItem {
  id: string;
  description: string;
  unitLabel: string;
  quantity: number;
  rate: Paise;
}

/** Frozen copy of the creator's details at the time an invoice is sent. */
export interface FromSnapshot {
  fullName: string;
  instagram: string;
  email: string;
  phone: string;
  pan: string;
  gstin: string;
  address: Address;
  logo: string | null;
  signature: string | null;
}

export type BillToSnapshot = Pick<Party, "type" | "name" | "gstin" | "address" | "contactPerson" | "email" | "phone">;

export type PaymentSnapshot = Omit<PaymentDetails, "id" | "updatedAt">;

export interface Invoice {
  id: string;
  number: string;
  /** "26-27" */
  financialYear: string;
  status: InvoiceStatus;
  invoiceDate: ISODate;
  paymentTerms: PaymentTerms;
  dueDate: ISODate;
  deliveryDate: ISODate | "";
  billToId: string | null;
  viaAgency: boolean;
  /** End brand when billing via an agency: "Campaign for: <Brand>". */
  endBrandName: string;
  campaignName: string;
  items: LineItem[];
  gstMode: GstMode;
  /** Total GST percent, e.g. 18. Split in half for CGST/SGST. */
  gstRate: number;
  sacCode: string;
  showTds: boolean;
  tdsRate: number | null;
  notes: string;
  includeBank: boolean;
  includeUpiQr: boolean;
  includeSignature: boolean;
  fromSnapshot: FromSnapshot | null;
  billToSnapshot: BillToSnapshot | null;
  paymentSnapshot: PaymentSnapshot | null;
  sentAt: string | null;
  paidDate: ISODate | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Totals {
  subtotal: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  total: Paise;
  tds: Paise;
  netReceivable: Paise;
}
