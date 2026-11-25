import type { ReportEvent, ReportStatus } from "@/domain/types";
import { iso, type Db } from "../db";

interface Row {
  id: string;
  report_id: string;
  actor_id: string | null;
  from_status: ReportStatus | null;
  to_status: ReportStatus;
  created_at: Date;
}

export async function add(
  db: Db,
  e: { reportId: string; actorId: string | null; from: ReportStatus | null; to: ReportStatus },
): Promise<void> {
  await db.query("INSERT INTO report_events (report_id, actor_id, from_status, to_status) VALUES ($1, $2, $3, $4)", [
    e.reportId,
    e.actorId,
    e.from,
    e.to,
  ]);
}

export async function listByReport(db: Db, reportId: string): Promise<ReportEvent[]> {
  const { rows } = await db.query<Row>("SELECT * FROM report_events WHERE report_id = $1 ORDER BY created_at", [reportId]);
  return rows.map((r) => ({
    id: r.id,
    reportId: r.report_id,
    actorId: r.actor_id,
    fromStatus: r.from_status,
    toStatus: r.to_status,
    createdAt: iso(r.created_at)!,
  }));
}
