import type { Payment, PaymentMethod } from "@/domain/types";
import { iso, type Db } from "../db";

interface Row {
  id: string;
  report_id: string;
  method: PaymentMethod;
  amount: number;
  commission: number;
  collector_amount: number;
  created_at: Date;
}

const toPayment = (r: Row): Payment => ({
  id: r.id,
  reportId: r.report_id,
  method: r.method,
  amount: r.amount,
  commission: r.commission,
  collectorAmount: r.collector_amount,
  createdAt: iso(r.created_at)!,
});

export async function insert(
  db: Db,
  p: { reportId: string; method: PaymentMethod; amount: number; commission: number; collectorAmount: number },
): Promise<Payment> {
  const { rows } = await db.query<Row>(
    `INSERT INTO payments (report_id, method, amount, commission, collector_amount)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [p.reportId, p.method, p.amount, p.commission, p.collectorAmount],
  );
  return toPayment(rows[0]);
}

export async function findByReport(db: Db, reportId: string): Promise<Payment | null> {
  const { rows } = await db.query<Row>("SELECT * FROM payments WHERE report_id = $1", [reportId]);
  return rows[0] ? toPayment(rows[0]) : null;
}
