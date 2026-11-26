import { AppError } from "@/domain/errors";
import { assertCan } from "@/domain/policies";
import type { Claim, User } from "@/domain/types";
import { validateText } from "@/domain/validators";
import { db } from "@/data/db";
import * as claimsRepo from "@/data/repos/claims";
import * as usersRepo from "@/data/repos/users";

/** Tous les collecteurs, les « à valider » en premier. */
export async function listCollectors(actor: User): Promise<User[]> {
  assertCan(actor, "collector:validate");
  return usersRepo.listCollectors(db());
}

export async function suspendCollector(actor: User, id: string): Promise<User> {
  assertCan(actor, "collector:validate");
  const user = await usersRepo.setValidated(db(), id, false);
  if (!user) throw new AppError("NOT_FOUND", "Collecteur introuvable.");
  return user;
}

export async function validateCollector(actor: User, id: string): Promise<User> {
  assertCan(actor, "collector:validate");
  const user = await usersRepo.setValidated(db(), id, true);
  if (!user) throw new AppError("NOT_FOUND", "Collecteur introuvable.");
  return user;
}

export async function listOpenClaims(actor: User): Promise<Claim[]> {
  assertCan(actor, "claim:resolve");
  return claimsRepo.listOpen(db());
}

export async function resolveClaim(actor: User, id: string, raw: Record<string, unknown>): Promise<Claim> {
  assertCan(actor, "claim:resolve");
  const claim = await claimsRepo.resolve(db(), id, validateText(raw.resolution, "Décision", 3, 500));
  if (!claim) throw new AppError("NOT_FOUND", "Réclamation introuvable ou déjà traitée.");
  return claim;
}
