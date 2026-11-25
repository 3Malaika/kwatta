import { route } from "../handler";
import * as admin from "../services/admin";

export const listCollectorsRoute = route(async ({ user }) => admin.listPendingCollectors(user), ["admin"]);
export const validateCollectorRoute = route(async ({ user, params }) => admin.validateCollector(user, params.id), ["admin"]);
export const listClaimsRoute = route(async ({ user }) => admin.listOpenClaims(user), ["admin"]);
export const resolveClaimRoute = route(
  async ({ req, user, params }) => admin.resolveClaim(user, params.id, await req.json().catch(() => ({}))),
  ["admin"],
);
