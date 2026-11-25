import { NextResponse } from "next/server";
import { AppError, type ErrorCode } from "@/domain/errors";
import type { Role, User } from "@/domain/types";
import { db } from "@/data/db";
import * as usersRepo from "@/data/repos/users";
import { readCookie, SESSION_COOKIE, verifySession } from "./security";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
  INTERNAL: 500,
};

export interface RouteArgs {
  req: Request;
  params: Record<string, string>;
  /** null uniquement si la route est publique (auth: false). */
  user: User;
}

export interface PublicRouteArgs {
  req: Request;
  params: Record<string, string>;
  user: User | null;
}

type RouteContext = { params: Promise<Record<string, string>> };

export function errorResponse(e: unknown): Response {
  if (e instanceof AppError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: STATUS[e.code] });
  }
  console.error(e);
  return NextResponse.json({ error: { code: "INTERNAL", message: "Erreur serveur." } }, { status: 500 });
}

/**
 * Auth, erreurs, enveloppe { data } : une seule fois, pour toutes les routes.
 *  route(fn)            → utilisateur connecté, tout rôle
 *  route(fn, ["admin"]) → rôles autorisés
 *  route(fn, { auth: false }) → route publique
 */
export function route(
  fn: (args: RouteArgs) => Promise<unknown>,
  roles?: Role[],
): (req: Request, ctx: RouteContext) => Promise<Response>;
export function route(
  fn: (args: PublicRouteArgs) => Promise<unknown>,
  options: { auth: false },
): (req: Request, ctx: RouteContext) => Promise<Response>;
export function route(
  fn: (args: never) => Promise<unknown>,
  options: Role[] | { auth: false } = [],
): (req: Request, ctx: RouteContext) => Promise<Response> {
  const isPublic = !Array.isArray(options);
  const roles = Array.isArray(options) ? options : [];

  return async (req, ctx) => {
    try {
      const params = (await ctx?.params) ?? {};
      let user: User | null = null;

      const userId = verifySession(readCookie(req.headers.get("cookie"), SESSION_COOKIE));
      if (userId) user = await usersRepo.findById(db(), userId);

      if (!isPublic) {
        if (!user) throw new AppError("UNAUTHORIZED", "Connexion requise.");
        if (roles.length > 0 && !roles.includes(user.role)) throw new AppError("FORBIDDEN", "Accès refusé.");
      }

      const result = await (fn as (a: PublicRouteArgs) => Promise<unknown>)({ req, params, user });
      if (result instanceof Response) return result;
      return NextResponse.json({ data: result ?? null });
    } catch (e) {
      return errorResponse(e);
    }
  };
}
