export const ROLES = ["client", "collector", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const REPORT_STATUSES = ["pending", "accepted", "en_route", "collected", "paid", "cancelled"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const WASTE_TYPES = ["menagers", "organiques", "plastiques", "cartons", "encombrants"] as const;
export type WasteType = (typeof WASTE_TYPES)[number];

export const PAYMENT_METHODS = ["cash", "mtn_momo", "orange_money"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Volume = 1 | 2 | 3;
export const VOLUMES: readonly Volume[] = [1, 2, 3];

export interface User {
  id: string;
  phone: string;
  name: string;
  role: Role;
  zoneId: string | null;
  validated: boolean;
  createdAt: string;
}

export interface Zone {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  clientId: string;
  collectorId: string | null;
  zoneId: string;
  wasteType: WasteType;
  volume: Volume;
  /** Prix figé à la création, calculé par le serveur (FCFA). */
  price: number;
  addressHint: string;
  lat: number | null;
  lng: number | null;
  status: ReportStatus;
  createdAt: string;
  acceptedAt: string | null;
  collectedAt: string | null;
  paidAt: string | null;
}

export interface ReportEvent {
  id: string;
  reportId: string;
  actorId: string | null;
  fromStatus: ReportStatus | null;
  toStatus: ReportStatus;
  createdAt: string;
}

export interface Photo {
  id: string;
  reportId: string;
  kind: "initial" | "final";
  storageKey: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  reportId: string;
  method: PaymentMethod;
  amount: number;
  commission: number;
  collectorAmount: number;
  createdAt: string;
}

export interface Claim {
  id: string;
  reportId: string;
  authorId: string;
  reason: string;
  status: "open" | "resolved";
  resolution: string | null;
  createdAt: string;
}

export interface Contact {
  name: string;
  phone: string;
}

/** Contrat de GET /api/reports/:id, partagé par le back et le front. */
export interface ReportDetail {
  report: Report;
  photos: Pick<Photo, "id" | "kind" | "createdAt">[];
  events: ReportEvent[];
  payment: Payment | null;
  claims: Claim[];
  client: Contact | null;
  collector: Contact | null;
}
