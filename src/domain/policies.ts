import { AppError } from "./errors";
import type { ReportStatus, Role } from "./types";

export type Action =
  | "report:create"
  | "report:view"
  | "report:accept"
  | "report:collect"
  | "report:pay"
  | "report:cancel"
  | "claim:create"
  | "claim:resolve"
  | "collector:validate";

export interface PolicyActor {
  id: string;
  role: Role;
  zoneId: string | null;
  validated: boolean;
}

export interface PolicyReport {
  clientId: string;
  collectorId: string | null;
  zoneId: string;
  status: ReportStatus;
}

interface Rule {
  roles: Role[];
  check?: (actor: PolicyActor, report?: PolicyReport) => boolean;
}

const isOwner = (a: PolicyActor, r?: PolicyReport) => !!r && r.clientId === a.id;
const isAssigned = (a: PolicyActor, r?: PolicyReport) => !!r && r.collectorId === a.id;

/** Qui peut quoi : des données, pas de logique dispersée. */
export const RULES: Record<Action, Rule> = {
  "report:create": { roles: ["client"], check: (a) => a.zoneId !== null },
  "report:view": {
    roles: ["client", "collector", "admin"],
    check: (a, r) => {
      if (!r) return false;
      if (a.role === "admin") return true;
      if (a.role === "client") return isOwner(a, r);
      return isAssigned(a, r) || (a.validated && r.status === "pending" && r.zoneId === a.zoneId);
    },
  },
  "report:accept": { roles: ["collector"], check: (a, r) => a.validated && !!r && r.zoneId === a.zoneId },
  "report:collect": { roles: ["collector"], check: isAssigned },
  "report:pay": { roles: ["collector"], check: isAssigned },
  "report:cancel": { roles: ["client", "admin"], check: (a, r) => a.role === "admin" || isOwner(a, r) },
  "claim:create": { roles: ["client"], check: isOwner },
  "claim:resolve": { roles: ["admin"] },
  "collector:validate": { roles: ["admin"] },
};

export function can(actor: PolicyActor, action: Action, report?: PolicyReport): boolean {
  const rule = RULES[action];
  if (!rule.roles.includes(actor.role)) return false;
  return rule.check ? rule.check(actor, report) : true;
}

export function assertCan(actor: PolicyActor, action: Action, report?: PolicyReport): void {
  if (!can(actor, action, report)) throw new AppError("FORBIDDEN", "Action non autorisée.");
}
