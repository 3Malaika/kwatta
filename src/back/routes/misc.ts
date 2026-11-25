import { AppError } from "@/domain/errors";
import { db } from "@/data/db";
import * as photosRepo from "@/data/repos/photos";
import { contentTypeOf, readFile } from "@/data/storage/files";
import { route } from "../handler";
import * as reports from "../services/reports";

/** GET /api/pricing/quote?type=menagers&volume=2 : prix calculé par le serveur. */
export const quoteRoute = route(async ({ req }) => reports.quote(Object.fromEntries(new URL(req.url).searchParams)));

/** GET /api/photos/:id : servie seulement à ceux qui peuvent voir le signalement. */
export const photoRoute = route(async ({ user, params }) => {
  const photo = await photosRepo.findById(db(), params.id);
  if (!photo || !(await reports.canViewReport(user, photo.reportId))) throw new AppError("NOT_FOUND", "Photo introuvable.");
  const file = await readFile(photo.storageKey).catch(() => {
    throw new AppError("NOT_FOUND", "Fichier introuvable.");
  });
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": contentTypeOf(photo.storageKey), "Cache-Control": "private, max-age=86400" },
  });
});
