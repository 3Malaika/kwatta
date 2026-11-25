import type { Claim } from "@/domain/types";
import { iso, type Db } from "../db";

interface Row {
  id: string;
  report_id: string;
  author_id: string;
  reason: string;
  status: "open" | "resolved";
  resolution: string | null;
  created_at: Date;
}

const toClaim = (r: Row): Claim => ({
  id: r.id,
  reportId: r.report_id,
  authorId: r.author_id,
  reason: r.reason,
  status: r.status,
  resolution: r.resolution,
  createdAt: iso(r.created_at)!,
});

export async function insert(db: Db, c: { reportId: string; authorId: string; reason: string }): Promise<Claim> {
  const { rows } = await db.query<Row>(
    "INSERT INTO claims (report_id, author_id, reason) VALUES ($1, $2, $3) RETURNING *",
    [c.reportId, c.authorId, c.reason],
  );
  return toClaim(rows[0]);
}

export async function listOpen(db: Db): Promise<Claim[]> {
  const { rows } = await db.query<Row>("SELECT * FROM claims WHERE status = 'open' ORDER BY created_at");
  return rows.map(toClaim);
}

export async function listByReport(db: Db, reportId: string): Promise<Claim[]> {
  const { rows } = await db.query<Row>("SELECT * FROM claims WHERE report_id = $1 ORDER BY created_at", [reportId]);
  return rows.map(toClaim);
}

export async function resolve(db: Db, id: string, resolution: string): Promise<Claim | null> {
  const { rows } = await db.query<Row>(
    "UPDATE claims SET status = 'resolved', resolution = $2 WHERE id = $1 AND status = 'open' RETURNING *",
    [id, resolution],
  );
  return rows[0] ? toClaim(rows[0]) : null;
}
