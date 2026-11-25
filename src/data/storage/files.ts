import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Stockage de fichiers local. Pour la production, remplacez ces deux fonctions
 * par un client S3 / Cloudflare R2 / Supabase Storage : le reste ne change pas.
 * 
 * Note: Sur Vercel, utilisez /tmp pour le stockage temporaire (non persistant)
 */
const dir = () => {
  // Vercel: utilise /tmp (temporaire, non persistant entre déploiements)
  if (process.env.VERCEL) {
    return "/tmp/storage";
  }
  // Local: utilise ./storage
  return path.resolve(process.env.STORAGE_DIR ?? "./storage");
};

const KEY_RE = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

export async function saveFile(buffer: Buffer, ext: "jpg" | "png" | "webp"): Promise<string> {
  const key = `${randomUUID()}.${ext}`;
  await fs.mkdir(dir(), { recursive: true });
  await fs.writeFile(path.join(dir(), key), buffer);
  return key;
}

export async function readFile(key: string): Promise<Buffer> {
  if (!KEY_RE.test(key)) throw new Error("Clé de fichier invalide");
  return fs.readFile(path.join(dir(), key));
}

export const contentTypeOf = (key: string): string =>
  key.endsWith(".png") ? "image/png" : key.endsWith(".webp") ? "image/webp" : "image/jpeg";
