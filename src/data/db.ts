import { Pool } from "pg";

export interface Db {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query<R = any>(text: string, params?: unknown[]): Promise<{ rows: R[]; rowCount: number | null }>;
}

const g = globalThis as unknown as { __kwPool?: Pool };

function pool(): Pool {
  if (!g.__kwPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquant");
    g.__kwPool = new Pool({
      connectionString: url,
      max: 10,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    });
  }
  return g.__kwPool;
}

export const db = (): Db => pool() as unknown as Db;

/** Statut, paiement et historique réussissent ensemble, ou pas du tout. */
export async function withTx<T>(fn: (tx: Db) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client as unknown as Db);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

export const iso = (d: Date | string | null): string | null => (d === null ? null : new Date(d).toISOString());
