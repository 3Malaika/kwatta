import { NextResponse } from "next/server";
import { db } from "@/data/db";

/**
 * Route de diagnostic pour vérifier la configuration du serveur.
 * GET /api/health
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; message: string }> = {};

  // 1. Vérifier SESSION_SECRET
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    checks.sessionSecret = { status: "error", message: "SESSION_SECRET manquant dans les variables d'environnement" };
  } else if (secret.length < 16) {
    checks.sessionSecret = { status: "error", message: `SESSION_SECRET trop court (${secret.length} caractères, minimum 16)` };
  } else {
    checks.sessionSecret = { status: "ok", message: `Configuré (${secret.length} caractères)` };
  }

  // 2. Vérifier DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    checks.database = { status: "error", message: "DATABASE_URL manquant" };
  } else {
    checks.database = { status: "ok", message: "URL configurée" };
  }

  // 3. Tester la connexion à la base
  try {
    await db().query("SELECT 1");
    checks.databaseConnection = { status: "ok", message: "Connexion réussie" };
  } catch (err: any) {
    checks.databaseConnection = { status: "error", message: `Erreur de connexion : ${err.message}` };
  }

  // 4. Vérifier que les tables existent
  try {
    const result = await db().query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'zones', 'reports', 'photos', 'report_events', 'claims', 'payments', 'settings', 'tariffs')
    `);
    const count = parseInt(result.rows[0].count);
    if (count === 9) {
      checks.tables = { status: "ok", message: "Toutes les tables existent (9/9)" };
    } else {
      checks.tables = { status: "error", message: `Tables manquantes (${count}/9). Ouvrez /api/admin/migrate?secret=…` };
    }
  } catch (err: any) {
    checks.tables = { status: "error", message: `Impossible de vérifier les tables : ${err.message}` };
  }

  // 5. Vérifier qu'il y a au moins une zone active
  try {
    const result = await db().query("SELECT COUNT(*) as count FROM zones WHERE active = true");
    const count = parseInt(result.rows[0].count);
    if (count > 0) {
      checks.zones = { status: "ok", message: `${count} zone(s) active(s)` };
    } else {
      checks.zones = { status: "error", message: "Aucune zone active. Lancez: npm run db:seed" };
    }
  } catch (err: any) {
    checks.zones = { status: "error", message: `Erreur : ${err.message}` };
  }

  // 6. Vérifier ADMIN_PHONE et ADMIN_PIN
  const adminPhone = process.env.ADMIN_PHONE;
  const adminPin = process.env.ADMIN_PIN;
  if (!adminPhone || !adminPin) {
    checks.admin = { status: "error", message: "ADMIN_PHONE ou ADMIN_PIN manquant" };
  } else {
    checks.admin = { status: "ok", message: "Variables admin configurées" };
  }

  // Calculer le statut global
  const hasError = Object.values(checks).some(c => c.status === "error");
  const globalStatus = hasError ? "unhealthy" : "healthy";

  return NextResponse.json({
    status: globalStatus,
    timestamp: new Date().toISOString(),
    checks,
  }, {
    status: hasError ? 500 : 200
  });
}
