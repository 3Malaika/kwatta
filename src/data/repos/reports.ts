import type { Report, ReportStatus, Volume, WasteType } from "@/domain/types";
import { iso, type Db } from "../db";

interface Row {
  id: string;
  client_id: string;
  collector_id: string | null;
  zone_id: string;
  waste_type: WasteType;
  volume: number;
  price: number;
  address_hint: string;
  lat: string | null;
  lng: string | null;
  status: ReportStatus;
  created_at: Date;
  accepted_at: Date | null;
  collected_at: Date | null;
  paid_at: Date | null;
}

const toReport = (r: Row): Report => ({
  id: r.id,
  clientId: r.client_id,
  collectorId: r.collector_id,
  zoneId: r.zone_id,
  wasteType: r.waste_type,
  volume: r.volume as Volume,
  price: r.price,
  addressHint: r.address_hint,
  lat: r.lat === null ? null : Number(r.lat),
  lng: r.lng === null ? null : Number(r.lng),
  status: r.status,
  createdAt: iso(r.created_at)!,
  acceptedAt: iso(r.accepted_at),
  collectedAt: iso(r.collected_at),
  paidAt: iso(r.paid_at),
});

export async function insert(
  db: Db,
  r: { clientId: string; zoneId: string; wasteType: WasteType; volume: Volume; price: number; addressHint: string; lat: number | null; lng: number | null },
): Promise<Report> {
  const { rows } = await db.query<Row>(
    `INSERT INTO reports (client_id, zone_id, waste_type, volume, price, address_hint, lat, lng)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [r.clientId, r.zoneId, r.wasteType, r.volume, r.price, r.addressHint, r.lat, r.lng],
  );
  return toReport(rows[0]);
}

export async function findById(db: Db, id: string): Promise<Report | null> {
  const { rows } = await db.query<Row>("SELECT * FROM reports WHERE id = $1", [id]);
  return rows[0] ? toReport(rows[0]) : null;
}

export async function listByClient(db: Db, clientId: string): Promise<Report[]> {
  const { rows } = await db.query<Row>("SELECT * FROM reports WHERE client_id = $1 ORDER BY created_at DESC LIMIT 100", [clientId]);
  return rows.map(toReport);
}

export async function listByCollector(db: Db, collectorId: string): Promise<Report[]> {
  const { rows } = await db.query<Row>("SELECT * FROM reports WHERE collector_id = $1 ORDER BY created_at DESC LIMIT 100", [collectorId]);
  return rows.map(toReport);
}

export async function listPendingInZone(db: Db, zoneId: string): Promise<Report[]> {
  const { rows } = await db.query<Row>(
    "SELECT * FROM reports WHERE zone_id = $1 AND status = 'pending' ORDER BY created_at ASC LIMIT 50",
    [zoneId],
  );
  return rows.map(toReport);
}

export async function listRecent(db: Db, limit = 50): Promise<Report[]> {
  const { rows } = await db.query<Row>("SELECT * FROM reports ORDER BY created_at DESC LIMIT $1", [limit]);
  return rows.map(toReport);
}

/**
 * Écriture conditionnelle : ne change le statut que si le signalement est
 * ENCORE dans `from`. Retourne null si quelqu'un est arrivé avant (→ CONFLIT).
 * C'est ce qui garantit « le premier arrivé gagne ».
 */
export async function transitionIf(
  db: Db,
  id: string,
  from: ReportStatus,
  to: ReportStatus,
  collectorId: string | null = null,
): Promise<Report | null> {
  const { rows } = await db.query<Row>(
    `UPDATE reports SET
       status = $3::text,
       collector_id = COALESCE($4::uuid, collector_id),
       accepted_at = CASE WHEN $3::text = 'accepted' THEN now() ELSE accepted_at END,
       collected_at = CASE WHEN $3::text = 'collected' THEN now() ELSE collected_at END,
       paid_at = CASE WHEN $3::text = 'paid' THEN now() ELSE paid_at END
     WHERE id = $1 AND status = $2::text
     RETURNING *`,
    [id, from, to, collectorId],
  );
  return rows[0] ? toReport(rows[0]) : null;
}
