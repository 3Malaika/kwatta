import type { Role, User } from "@/domain/types";
import { iso, type Db } from "../db";

interface Row {
  id: string;
  phone: string;
  name: string;
  role: Role;
  zone_id: string | null;
  validated: boolean;
  created_at: Date;
  pin_hash?: string;
  failed_attempts?: number;
  locked_until?: Date | null;
}

const toUser = (r: Row): User => ({
  id: r.id,
  phone: r.phone,
  name: r.name,
  role: r.role,
  zoneId: r.zone_id,
  validated: r.validated,
  createdAt: iso(r.created_at)!,
});

const COLS = "id, phone, name, role, zone_id, validated, created_at";

export async function findById(db: Db, id: string): Promise<User | null> {
  const { rows } = await db.query<Row>(`SELECT ${COLS} FROM users WHERE id = $1`, [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export interface Credentials {
  user: User;
  pinHash: string;
  failedAttempts: number;
  lockedUntil: Date | null;
}

export async function findCredentialsByPhone(db: Db, phone: string): Promise<Credentials | null> {
  const { rows } = await db.query<Row>(
    `SELECT ${COLS}, pin_hash, failed_attempts, locked_until FROM users WHERE phone = $1`,
    [phone],
  );
  const r = rows[0];
  return r ? { user: toUser(r), pinHash: r.pin_hash!, failedAttempts: r.failed_attempts ?? 0, lockedUntil: r.locked_until ?? null } : null;
}

export async function insert(
  db: Db,
  u: { phone: string; name: string; role: Role; pinHash: string; zoneId: string | null; validated: boolean },
): Promise<User> {
  const { rows } = await db.query<Row>(
    `INSERT INTO users (phone, name, role, pin_hash, zone_id, validated)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLS}`,
    [u.phone, u.name, u.role, u.pinHash, u.zoneId, u.validated],
  );
  return toUser(rows[0]);
}

export async function recordFailure(db: Db, id: string, maxAttempts: number, lockMinutes: number): Promise<void> {
  await db.query(
    `UPDATE users
     SET failed_attempts = failed_attempts + 1,
         locked_until = CASE WHEN failed_attempts + 1 >= $2 THEN now() + ($3 || ' minutes')::interval ELSE locked_until END
     WHERE id = $1`,
    [id, maxAttempts, String(lockMinutes)],
  );
}

export async function resetFailures(db: Db, id: string): Promise<void> {
  await db.query("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = $1", [id]);
}

export async function listPendingCollectors(db: Db): Promise<User[]> {
  const { rows } = await db.query<Row>(
    `SELECT ${COLS} FROM users WHERE role = 'collector' AND validated = false ORDER BY created_at`,
  );
  return rows.map(toUser);
}

export async function setValidated(db: Db, id: string, validated: boolean): Promise<User | null> {
  const { rows } = await db.query<Row>(
    `UPDATE users SET validated = $2 WHERE id = $1 AND role = 'collector' RETURNING ${COLS}`,
    [id, validated],
  );
  return rows[0] ? toUser(rows[0]) : null;
}

export async function listCollectors(db: Db): Promise<User[]> {
  const { rows } = await db.query<Row>(
    `SELECT ${COLS} FROM users WHERE role = 'collector' ORDER BY validated ASC, created_at DESC LIMIT 200`,
  );
  return rows.map(toUser);
}

export type AdminOutcome = "created" | "promoted" | "repaired" | "updated";

/**
 * Crée ou répare le compte admin, en une seule fois et sans doublon :
 *  - le compte existe déjà avec le bon numéro (ex. inscrit comme client) → promu admin ;
 *  - un ancien compte admin a été enregistré avec un numéro « brut » → numéro corrigé ;
 *  - sinon → créé.
 * Le PIN est toujours (re)défini depuis ADMIN_PIN.
 */
export async function upsertAdmin(
  db: Db,
  a: { phone: string; legacyPhone: string; name: string; pinHash: string },
): Promise<AdminOutcome> {
  const current = await db.query<{ id: string; role: Role }>("SELECT id, role FROM users WHERE phone = $1", [a.phone]);
  let outcome: AdminOutcome;

  if (current.rows[0]) {
    outcome = current.rows[0].role === "admin" ? "updated" : "promoted";
    await db.query("UPDATE users SET role = 'admin', validated = true, pin_hash = $2 WHERE id = $1", [current.rows[0].id, a.pinHash]);
    // Supprime l'ancien compte admin au numéro mal formé, s'il existe et n'est lié à rien.
    if (a.legacyPhone !== a.phone) {
      await db.query("DELETE FROM users WHERE phone = $1 AND role = 'admin'", [a.legacyPhone]).catch(() => undefined);
    }
    return outcome;
  }

  const legacy = a.legacyPhone !== a.phone ? await db.query<{ id: string }>("SELECT id FROM users WHERE phone = $1", [a.legacyPhone]) : null;
  if (legacy?.rows[0]) {
    await db.query("UPDATE users SET phone = $2, role = 'admin', validated = true, pin_hash = $3 WHERE id = $1", [legacy.rows[0].id, a.phone, a.pinHash]);
    return "repaired";
  }

  await db.query(
    "INSERT INTO users (phone, name, role, pin_hash, validated) VALUES ($1, $2, 'admin', $3, true)",
    [a.phone, a.name, a.pinHash],
  );
  return "created";
}
