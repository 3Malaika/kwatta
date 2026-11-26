import { NextResponse } from "next/server";
import { route } from "../handler";
import { applyMigrations, applySeed, ensureAdmin } from "../services/setup";

function authorized(req: Request): boolean {
  const expected = process.env.MIGRATION_SECRET || process.env.SESSION_SECRET;
  const given = new URL(req.url).searchParams.get("secret");
  return !!expected && expected.length >= 16 && given === expected;
}

async function run(req: Request, steps: (() => Promise<string[]>)[]): Promise<Response> {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results: string[] = [];
  try {
    for (const step of steps) results.push(...(await step()));
    results.push("🎉 Terminé");
    return NextResponse.json({ success: true, results });
  } catch (e) {
    results.push(`❌ Erreur : ${(e as Error).message}`);
    return NextResponse.json({ success: false, results }, { status: 500 });
  }
}

/** GET /api/admin/migrate?secret=… : tables + réglages + compte admin. */
export const migrateRoute = route(({ req }) => run(req, [applyMigrations, applySeed, ensureAdmin]), { auth: false });

/** GET /api/admin/seed?secret=… : réglages + compte admin (répare aussi un admin cassé). */
export const seedRoute = route(({ req }) => run(req, [applySeed, ensureAdmin]), { auth: false });
