import type { Photo } from "@/domain/types";
import { iso, type Db } from "../db";

interface Row {
  id: string;
  report_id: string;
  kind: "initial" | "final";
  storage_key: string;
  uploaded_by: string;
  created_at: Date;
}

const toPhoto = (r: Row): Photo => ({
  id: r.id,
  reportId: r.report_id,
  kind: r.kind,
  storageKey: r.storage_key,
  uploadedBy: r.uploaded_by,
  createdAt: iso(r.created_at)!,
});

export async function add(
  db: Db,
  p: { reportId: string; kind: "initial" | "final"; storageKey: string; uploadedBy: string },
): Promise<Photo> {
  const { rows } = await db.query<Row>(
    "INSERT INTO photos (report_id, kind, storage_key, uploaded_by) VALUES ($1, $2, $3, $4) RETURNING *",
    [p.reportId, p.kind, p.storageKey, p.uploadedBy],
  );
  return toPhoto(rows[0]);
}

export async function listByReport(db: Db, reportId: string): Promise<Photo[]> {
  const { rows } = await db.query<Row>("SELECT * FROM photos WHERE report_id = $1 ORDER BY created_at", [reportId]);
  return rows.map(toPhoto);
}

export async function findById(db: Db, id: string): Promise<Photo | null> {
  const { rows } = await db.query<Row>("SELECT * FROM photos WHERE id = $1", [id]);
  return rows[0] ? toPhoto(rows[0]) : null;
}

export async function hasKind(db: Db, reportId: string, kind: "initial" | "final"): Promise<boolean> {
  const { rows } = await db.query("SELECT 1 FROM photos WHERE report_id = $1 AND kind = $2 LIMIT 1", [reportId, kind]);
  return rows.length > 0;
}
