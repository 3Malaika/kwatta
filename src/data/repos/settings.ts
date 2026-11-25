import type { PricingConfig } from "@/domain/pricing";
import { WASTE_TYPES, type WasteType, type Zone } from "@/domain/types";
import type { Db } from "../db";

export async function listZones(db: Db): Promise<Zone[]> {
  const { rows } = await db.query<Zone>("SELECT id, name FROM zones WHERE active = true ORDER BY name");
  return rows;
}

export async function findZone(db: Db, id: string): Promise<Zone | null> {
  const { rows } = await db.query<Zone>("SELECT id, name FROM zones WHERE id = $1", [id]);
  return rows[0] ?? null;
}

/** Pilote : un seul quartier actif, utilisé par défaut à l'inscription. */
export async function firstActiveZone(db: Db): Promise<Zone | null> {
  const { rows } = await db.query<Zone>("SELECT id, name FROM zones WHERE active = true ORDER BY name LIMIT 1");
  return rows[0] ?? null;
}

export async function loadPricingConfig(db: Db): Promise<PricingConfig> {
  const [tariffs, settings] = await Promise.all([
    db.query<{ waste_type: WasteType; base_price: number }>("SELECT waste_type, base_price FROM tariffs WHERE active = true"),
    db.query<{ key: string; value: string }>("SELECT key, value FROM settings"),
  ]);
  const base = Object.fromEntries(WASTE_TYPES.map((t) => [t, undefined])) as unknown as Record<WasteType, number>;
  for (const r of tariffs.rows) base[r.waste_type] = r.base_price;
  const s = Object.fromEntries(settings.rows.map((r) => [r.key, Number(r.value)]));

  return {
    base,
    fixedFee: s.fixed_fee ?? 0,
    commissionRate: s.commission_rate ?? 0.1,
    roundingStep: s.rounding_step ?? 50,
    gps:
      (s.gps_per_km ?? 0) > 0
        ? { perKm: s.gps_per_km, freeKm: s.gps_free_km ?? 0, minPrice: s.min_price ?? 0, surcharge: s.surcharge ?? 0 }
        : undefined,
  };
}
