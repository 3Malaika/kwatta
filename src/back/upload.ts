import { AppError } from "@/domain/errors";

export interface UploadedPhoto {
  buffer: Buffer;
  ext: "jpg" | "png" | "webp";
}

const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, UploadedPhoto["ext"]> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function readPhoto(form: FormData, field = "photo"): Promise<UploadedPhoto | null> {
  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = EXT[file.type];
  if (!ext) throw new AppError("VALIDATION", "Photo : formats acceptés JPEG, PNG ou WebP.");
  if (file.size > MAX_BYTES) throw new AppError("VALIDATION", "Photo trop lourde (5 Mo maximum).");
  return { buffer: Buffer.from(await file.arrayBuffer()), ext };
}

export const formToObject = (form: FormData): Record<string, unknown> =>
  Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
