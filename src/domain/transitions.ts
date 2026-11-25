import { AppError } from "./errors";
import type { ReportStatus, Role } from "./types";

export type TransitionAction = "accept" | "depart" | "collect" | "pay" | "cancel";

export interface Transition {
  from: ReportStatus;
  to: ReportStatus;
  roles: Role[];
  action: TransitionAction;
  label: string;
  /** Condition métier vérifiée par le service avant d'appliquer la transition. */
  requires?: "finalPhoto" | "payment";
}

/**
 * LA table des statuts. Elle décide des boutons côté front et des changements
 * acceptés côté back. Une ligne de plus = une transition de plus.
 */
export const TRANSITIONS: readonly Transition[] = [
  { from: "pending", to: "accepted", roles: ["collector"], action: "accept", label: "Accepter" },
  { from: "accepted", to: "en_route", roles: ["collector"], action: "depart", label: "Je pars" },
  { from: "accepted", to: "collected", roles: ["collector"], action: "collect", label: "Confirmer la collecte", requires: "finalPhoto" },
  { from: "en_route", to: "collected", roles: ["collector"], action: "collect", label: "Confirmer la collecte", requires: "finalPhoto" },
  { from: "collected", to: "paid", roles: ["collector"], action: "pay", label: "J'ai encaissé", requires: "payment" },
  { from: "pending", to: "cancelled", roles: ["client", "admin"], action: "cancel", label: "Annuler" },
  { from: "accepted", to: "cancelled", roles: ["client", "admin"], action: "cancel", label: "Annuler" },
];

/** MVP réduit : le statut « En route » est désactivé (4 statuts au lieu de 5). */
export const MVP_DISABLED_STATUSES: readonly ReportStatus[] = ["en_route"];

export function activeTransitions(disabled: readonly ReportStatus[] = MVP_DISABLED_STATUSES): Transition[] {
  return TRANSITIONS.filter((t) => !disabled.includes(t.from) && !disabled.includes(t.to));
}

export function findTransition(
  from: ReportStatus,
  action: TransitionAction,
  disabled: readonly ReportStatus[] = MVP_DISABLED_STATUSES,
): Transition | undefined {
  return activeTransitions(disabled).find((t) => t.from === from && t.action === action);
}

export function availableActions(
  status: ReportStatus,
  role: Role,
  disabled: readonly ReportStatus[] = MVP_DISABLED_STATUSES,
): Transition[] {
  return activeTransitions(disabled).filter((t) => t.from === status && t.roles.includes(role));
}

/** Retourne la transition autorisée ou lève CONFLICT / FORBIDDEN. */
export function assertTransition(
  from: ReportStatus,
  action: TransitionAction,
  role: Role,
  disabled: readonly ReportStatus[] = MVP_DISABLED_STATUSES,
): Transition {
  const t = findTransition(from, action, disabled);
  if (!t) throw new AppError("CONFLICT", `Action impossible depuis le statut « ${from} ».`);
  if (!t.roles.includes(role)) throw new AppError("FORBIDDEN", "Vous ne pouvez pas effectuer cette action.");
  return t;
}
