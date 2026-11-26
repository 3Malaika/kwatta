import { NextResponse } from "next/server";
import { db } from "@/data/db";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Endpoint pour lancer les migrations manuellement
 * GET /api/admin/migrate?secret=YOUR_SECRET
 * 
 * Pour des raisons de sécurité, nécessite un secret dans l'URL
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  
  // Vérification de sécurité
  const expectedSecret = process.env.MIGRATION_SECRET || process.env.SESSION_SECRET;
  if (secret !== expectedSecret) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const results: string[] = [];

  try {
    // 1. Exécuter les migrations
    results.push("🔄 Exécution des migrations...");
    
    const migrationPath = path.join(process.cwd(), "db", "migrations", "001_init.sql");
    const sql = await fs.readFile(migrationPath, "utf-8");
    
    await db().query(sql);
    results.push("✅ Migration 001_init.sql appliquée");

    // 2. Vérifier si les données de base existent
    const zonesCount = await db().query("SELECT COUNT(*) as count FROM zones");
    const hasData = parseInt(zonesCount.rows[0].count) > 0;

    if (!hasData) {
      results.push("🔄 Insertion des données de seed...");
      
      const seedPath = path.join(process.cwd(), "db", "seed.sql");
      const seedSql = await fs.readFile(seedPath, "utf-8");
      
      await db().query(seedSql);
      results.push("✅ Données de seed insérées");
    } else {
      results.push("ℹ️  Données de seed déjà présentes, skip");
    }

    // 3. Vérifier le compte admin
    const adminPhone = process.env.ADMIN_PHONE;
    const adminPin = process.env.ADMIN_PIN;
    
    if (adminPhone && adminPin) {
      const adminExists = await db().query(
        "SELECT id FROM users WHERE phone = $1 AND role = 'admin'",
        [adminPhone]
      );

      if (adminExists.rows.length === 0) {
        results.push("🔄 Création du compte admin...");
        
        // Hasher le PIN (simplifié pour l'instant)
        const crypto = await import("node:crypto");
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.scryptSync(adminPin, salt, 64).toString("hex");
        const pinHash = `${salt}:${hash}`;

        await db().query(
          `INSERT INTO users (phone, name, role, pin_hash, validated) 
           VALUES ($1, $2, $3, $4, $5)`,
          [adminPhone, "Admin", "admin", pinHash, true]
        );
        
        results.push("✅ Compte admin créé");
      } else {
        results.push("ℹ️  Compte admin déjà existant");
      }
    }

    results.push("🎉 Migration terminée avec succès !");

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error: any) {
    results.push(`❌ Erreur : ${error.message}`);
    
    return NextResponse.json({
      success: false,
      results,
      error: error.message
    }, { status: 500 });
  }
}
