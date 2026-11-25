import { AppError } from "@/domain/errors";
import { assertCan, can } from "@/domain/policies";
import { computePrice, splitPayment } from "@/domain/pricing";
import { assertTransition } from "@/domain/transitions";
import type { Claim, Contact, Payment, PaymentMethod, Report, ReportDetail, User } from "@/domain/types";
import { validateCreateReport, validateText, validateVolume, validateWasteType } from "@/domain/validators";
import { db, withTx } from "@/data/db";
import * as claimsRepo from "@/data/repos/claims";
import * as eventsRepo from "@/data/repos/events";
import * as paymentsRepo from "@/data/repos/payments";
import * as photosRepo from "@/data/repos/photos";
import * as reportsRepo from "@/data/repos/reports";
import * as settingsRepo from "@/data/repos/settings";
import * as usersRepo from "@/data/repos/users";
import { saveFile } from "@/data/storage/files";
import { getAdapter } from "../payments";
import type { UploadedPhoto } from "../upload";

async function loadReport(id: string): Promise<Report> {
  const report = await reportsRepo.findById(db(), id);
  if (!report) throw new AppError("NOT_FOUND", "Signalement introuvable.");
  return report;
}

/** Le prix vient TOUJOURS du serveur, jamais du client. */
export async function quote(raw: Record<string, unknown>): Promise<{ price: number }> {
  const cfg = await settingsRepo.loadPricingConfig(db());
  return { price: computePrice({ wasteType: validateWasteType(raw.type), volume: validateVolume(raw.volume) }, cfg) };
}

export async function createReport(actor: User, raw: Record<string, unknown>, photo: UploadedPhoto | null): Promise<Report> {
  assertCan(actor, "report:create");
  const input = validateCreateReport(raw);
  if (!photo) throw new AppError("VALIDATION", "Ajoutez une photo du dépôt.");

  const cfg = await settingsRepo.loadPricingConfig(db());
  const price = computePrice({ wasteType: input.wasteType, volume: input.volume }, cfg);
  const storageKey = await saveFile(photo.buffer, photo.ext);

  return withTx(async (tx) => {
    const report = await reportsRepo.insert(tx, { ...input, clientId: actor.id, zoneId: actor.zoneId!, price });
    await photosRepo.add(tx, { reportId: report.id, kind: "initial", storageKey, uploadedBy: actor.id });
    await eventsRepo.add(tx, { reportId: report.id, actorId: actor.id, from: null, to: "pending" });
    return report;
  });
}

export async function listReports(actor: User): Promise<{ mine: Report[]; nearby: Report[] }> {
  if (actor.role === "client") return { mine: await reportsRepo.listByClient(db(), actor.id), nearby: [] };
  if (actor.role === "collector") {
    const mine = await reportsRepo.listByCollector(db(), actor.id);
    const nearby = actor.validated && actor.zoneId ? await reportsRepo.listPendingInZone(db(), actor.zoneId) : [];
    return { mine, nearby };
  }
  return { mine: await reportsRepo.listRecent(db()), nearby: [] };
}

export async function getReport(actor: User, id: string): Promise<ReportDetail> {
  const report = await loadReport(id);
  assertCan(actor, "report:view", report);

  const [photos, events, payment, claims] = await Promise.all([
    photosRepo.listByReport(db(), id),
    eventsRepo.listByReport(db(), id),
    paymentsRepo.findByReport(db(), id),
    claimsRepo.listByReport(db(), id),
  ]);

  // Les coordonnées ne sont partagées qu'une fois la mission acceptée.
  const assigned = report.collectorId !== null;
  const contact = async (userId: string | null): Promise<Contact | null> => {
    if (!userId || !assigned) return null;
    const u = await usersRepo.findById(db(), userId);
    return u ? { name: u.name, phone: u.phone } : null;
  };
  const showClient = actor.role === "admin" || actor.id === report.collectorId;
  const showCollector = actor.role === "admin" || actor.id === report.clientId;

  return {
    report,
    photos: photos.map((p) => ({ id: p.id, kind: p.kind, createdAt: p.createdAt })),
    events,
    payment,
    claims,
    client: showClient ? await contact(report.clientId) : null,
    collector: showCollector ? await contact(report.collectorId) : null,
  };
}

/** Le premier arrivé gagne : écriture conditionnelle sur « pending ». */
export async function acceptReport(actor: User, id: string): Promise<Report> {
  const report = await loadReport(id);
  assertCan(actor, "report:accept", report);
  assertTransition(report.status, "accept", actor.role);

  return withTx(async (tx) => {
    const updated = await reportsRepo.transitionIf(tx, id, "pending", "accepted", actor.id);
    if (!updated) throw new AppError("CONFLICT", "Cette demande vient d'être prise par un autre collecteur.");
    await eventsRepo.add(tx, { reportId: id, actorId: actor.id, from: "pending", to: "accepted" });
    return updated;
  });
}

/** Photo finale obligatoire. */
export async function collectReport(actor: User, id: string, photo: UploadedPhoto | null): Promise<Report> {
  const report = await loadReport(id);
  assertCan(actor, "report:collect", report);
  const t = assertTransition(report.status, "collect", actor.role);
  if (t.requires === "finalPhoto" && !photo) throw new AppError("VALIDATION", "La photo après collecte est obligatoire.");

  const storageKey = await saveFile(photo!.buffer, photo!.ext);
  return withTx(async (tx) => {
    const updated = await reportsRepo.transitionIf(tx, id, report.status, "collected");
    if (!updated) throw new AppError("CONFLICT", "Le statut a changé, rechargez la page.");
    await photosRepo.add(tx, { reportId: id, kind: "final", storageKey, uploadedBy: actor.id });
    await eventsRepo.add(tx, { reportId: id, actorId: actor.id, from: report.status, to: "collected" });
    return updated;
  });
}

/** Idempotent : rejouer « encaissé » (file hors ligne) ne crée pas de doublon. */
export async function payReport(actor: User, id: string, method: PaymentMethod = "cash"): Promise<Payment> {
  const report = await loadReport(id);
  assertCan(actor, "report:pay", report);

  if (report.status === "paid") {
    const existing = await paymentsRepo.findByReport(db(), id);
    if (existing) return existing;
  }
  assertTransition(report.status, "pay", actor.role);

  const adapter = getAdapter(method);
  const result = await adapter.charge({ reportId: id, amount: report.price });
  if (result.status !== "confirmed") throw new AppError("CONFLICT", "Paiement en attente de confirmation.");

  const cfg = await settingsRepo.loadPricingConfig(db());
  const split = splitPayment(report.price, cfg.commissionRate);

  return withTx(async (tx) => {
    const updated = await reportsRepo.transitionIf(tx, id, "collected", "paid");
    if (!updated) throw new AppError("CONFLICT", "Le statut a changé, rechargez la page.");
    const payment = await paymentsRepo.insert(tx, { reportId: id, method, amount: report.price, ...split });
    await eventsRepo.add(tx, { reportId: id, actorId: actor.id, from: "collected", to: "paid" });
    return payment;
  });
}

export async function cancelReport(actor: User, id: string): Promise<Report> {
  const report = await loadReport(id);
  assertCan(actor, "report:cancel", report);
  assertTransition(report.status, "cancel", actor.role);

  return withTx(async (tx) => {
    const updated = await reportsRepo.transitionIf(tx, id, report.status, "cancelled");
    if (!updated) throw new AppError("CONFLICT", "Le statut a changé, rechargez la page.");
    await eventsRepo.add(tx, { reportId: id, actorId: actor.id, from: report.status, to: "cancelled" });
    return updated;
  });
}

export async function createClaim(actor: User, reportId: string, raw: Record<string, unknown>): Promise<Claim> {
  const report = await loadReport(reportId);
  assertCan(actor, "claim:create", report);
  if (report.status !== "collected" && report.status !== "paid") {
    throw new AppError("CONFLICT", "Une réclamation n'est possible qu'après la collecte.");
  }
  return claimsRepo.insert(db(), { reportId, authorId: actor.id, reason: validateText(raw.reason, "Motif", 5, 500) });
}

export async function canViewReport(actor: User, reportId: string): Promise<boolean> {
  const report = await reportsRepo.findById(db(), reportId);
  return !!report && can(actor, "report:view", report);
}
