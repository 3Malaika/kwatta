import fs from "node:fs/promises";
import path from "node:path";
import { normalizePhone, validatePin } from "@/domain/validators";
import { db } from "@/data/db";
import * as usersRepo from "@/data/repos/users";
import { hashPin } from "../security";

const sql = (...parts: string[]) => fs.readFile(path.join(process.cwd(), "db", ...parts), "utf-8");

/** Crée les tables si elles n'existent pas encore (sans erreur si déjà faites). */
export async function applyMigrations(): Promise<string[]> {
  const { rows } = await db().query<{ t: string | null }>("SELECT to_regclass('public.users') AS t");
  if (rows[0]?.t) return ["ℹ️  Tables déjà créées, migration ignorée"];
  await db().query(await sql("migrations", "001_init.sql"));
  return ["✅ Migration 001_init.sql appliquée"];
}

/** Zone, tarifs et réglages (le fichier est idempotent). */
export async function applySeed(): Promise<string[]> {
  await db().query(await sql("seed.sql"));
  return ["✅ Zone, tarifs et réglages à jour"];
}

/**
 * Compte admin : utilise la MÊME normalisation du téléphone (+237…) et le MÊME hachage
 * que la connexion, sinon le compte créé ne peut jamais se connecter.
 */
export async function ensureAdmin(): Promise<string[]> {
  const rawPhone = process.env.ADMIN_PHONE;
  const rawPin = process.env.ADMIN_PIN;
  if (!rawPhone || !rawPin) return ["⚠️  ADMIN_PHONE ou ADMIN_PIN manquant dans les variables d'environnement"];

  const phone = normalizePhone(rawPhone);
  const outcome = await usersRepo.upsertAdmin(db(), {
    phone,
    legacyPhone: rawPhone.trim(),
    name: process.env.ADMIN_NAME ?? "Admin Kwatta",
    pinHash: await hashPin(validatePin(rawPin)),
  });
  const label = {
    created: "créé",
    promoted: "promu administrateur (le compte existait comme client/collecteur)",
    repaired: "réparé (ancien numéro mal formé corrigé)",
    updated: "mis à jour",
  }[outcome];
  return [`✅ Compte admin ${phone} ${label}`];
}
