import { AppError } from "@/domain/errors";
import type { User } from "@/domain/types";
import { normalizePhone, validatePin, validateRegister } from "@/domain/validators";
import { db } from "@/data/db";
import * as usersRepo from "@/data/repos/users";
import * as settingsRepo from "@/data/repos/settings";
import { hashPin, verifyPin } from "../security";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function register(raw: Record<string, unknown>): Promise<User> {
  const input = validateRegister(raw);
  const zone = await settingsRepo.firstActiveZone(db());
  if (!zone) throw new AppError("INTERNAL", "Aucune zone active. Lancez `npm run db:seed`.");

  const existing = await usersRepo.findCredentialsByPhone(db(), input.phone);
  if (existing) throw new AppError("CONFLICT", "Ce numéro est déjà inscrit. Connectez-vous.");

  return usersRepo.insert(db(), {
    phone: input.phone,
    name: input.name,
    role: input.role,
    pinHash: await hashPin(input.pin),
    zoneId: zone.id,
    // Un collecteur doit être validé par l'admin avant de voir des demandes.
    validated: input.role === "client",
  });
}

export async function login(raw: Record<string, unknown>): Promise<User> {
  const phone = normalizePhone(raw.phone);
  const pin = validatePin(raw.pin);
  const bad = new AppError("UNAUTHORIZED", "Téléphone ou code incorrect.");

  const creds = await usersRepo.findCredentialsByPhone(db(), phone);
  if (!creds) throw bad;
  if (creds.lockedUntil && creds.lockedUntil.getTime() > Date.now()) {
    throw new AppError("FORBIDDEN", `Trop d'essais. Réessayez dans ${LOCK_MINUTES} minutes.`);
  }
  if (!(await verifyPin(pin, creds.pinHash))) {
    await usersRepo.recordFailure(db(), creds.user.id, MAX_ATTEMPTS, LOCK_MINUTES);
    throw bad;
  }
  if (creds.failedAttempts > 0) await usersRepo.resetFailures(db(), creds.user.id);
  return creds.user;
}
