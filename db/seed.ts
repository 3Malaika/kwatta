import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { hashPin } from "../src/back/security";
import { normalizePhone, validatePin } from "../src/domain/validators";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant (copiez .env.example en .env)");
  const pool = new Pool({ connectionString: url, ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined });

  await pool.query(fs.readFileSync(path.join(__dirname, "seed.sql"), "utf8"));
  console.log("✔ zones, tarifs et réglages");

  const { ADMIN_PHONE, ADMIN_PIN, ADMIN_NAME } = process.env;
  if (ADMIN_PHONE && ADMIN_PIN) {
    const phone = normalizePhone(ADMIN_PHONE);
    const pinHash = await hashPin(validatePin(ADMIN_PIN));
    await pool.query(
      `INSERT INTO users (phone, name, role, pin_hash, validated)
       VALUES ($1, $2, 'admin', $3, true)
       ON CONFLICT (phone) DO NOTHING`,
      [phone, ADMIN_NAME ?? "Admin Kwatta", pinHash],
    );
    console.log(`✔ admin ${phone}`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
