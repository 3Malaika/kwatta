import { AppError } from "./errors";
import { ROLES, VOLUMES, WASTE_TYPES, type Role, type Volume, type WasteType } from "./types";

const fail = (msg: string): never => {
  throw new AppError("VALIDATION", msg);
};

/** Accepte 6XXXXXXXX, +2376XXXXXXXX, 2376XXXXXXXX (espaces tolérés). Retourne +2376XXXXXXXX. */
export function normalizePhone(raw: unknown): string {
  if (typeof raw !== "string") return fail("Numéro de téléphone requis.");
  let digits = raw.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("237")) digits = digits.slice(3);
  if (!/^6\d{8}$/.test(digits)) return fail("Numéro invalide. Exemple : 6 71 23 45 67.");
  return `+237${digits}`;
}

export function validatePin(raw: unknown): string {
  if (typeof raw !== "string" || !/^\d{4,6}$/.test(raw)) return fail("Le code doit contenir 4 à 6 chiffres.");
  return raw;
}

export function validateName(raw: unknown): string {
  if (typeof raw !== "string") return fail("Nom requis.");
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 60) return fail("Le nom doit contenir 2 à 60 caractères.");
  return name;
}

export function validateWasteType(raw: unknown): WasteType {
  if (typeof raw !== "string" || !(WASTE_TYPES as readonly string[]).includes(raw)) return fail("Type de déchet invalide.");
  return raw as WasteType;
}

export function validateVolume(raw: unknown): Volume {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (typeof n !== "number" || !(VOLUMES as readonly number[]).includes(n)) return fail("Volume invalide (1, 2 ou 3).");
  return n as Volume;
}

export interface RegisterInput {
  phone: string;
  name: string;
  pin: string;
  role: Extract<Role, "client" | "collector">;
}

export function validateRegister(raw: Record<string, unknown>): RegisterInput {
  const role = raw.role;
  if (role !== "client" && role !== "collector") return fail("Rôle invalide.");
  return { phone: normalizePhone(raw.phone), name: validateName(raw.name), pin: validatePin(raw.pin), role };
}

export interface CreateReportInput {
  wasteType: WasteType;
  volume: Volume;
  addressHint: string;
  lat: number | null;
  lng: number | null;
}

function optionalCoord(raw: unknown, min: number, max: number, label: string): number | null {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) return fail(`${label} invalide.`);
  return n;
}

export function validateCreateReport(raw: Record<string, unknown>): CreateReportInput {
  const hint = typeof raw.addressHint === "string" ? raw.addressHint.trim() : "";
  if (hint.length < 5) return fail("Décrivez un repère visuel (5 caractères minimum).");
  if (hint.length > 300) return fail("Repère trop long (300 caractères maximum).");
  return {
    wasteType: validateWasteType(raw.wasteType),
    volume: validateVolume(raw.volume),
    addressHint: hint,
    lat: optionalCoord(raw.lat, -90, 90, "Latitude"),
    lng: optionalCoord(raw.lng, -180, 180, "Longitude"),
  };
}

export function validateRole(raw: unknown): Role {
  if (typeof raw !== "string" || !(ROLES as readonly string[]).includes(raw)) return fail("Rôle invalide.");
  return raw as Role;
}

export function validateText(raw: unknown, label: string, min = 3, max = 500): string {
  if (typeof raw !== "string") return fail(`${label} requis.`);
  const t = raw.trim();
  if (t.length < min || t.length > max) return fail(`${label} : ${min} à ${max} caractères.`);
  return t;
}

/** 7500 → « 7 500 FCFA » */
export function formatFcfa(amount: number): string {
  return `${Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA`;
}
